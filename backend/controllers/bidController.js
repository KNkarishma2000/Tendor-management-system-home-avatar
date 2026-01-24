const supabase = require('../config/supabase');

exports.submitBid = async (req, res) => {
  try {
    const { 
      tender_id, 
      supplier_id, 
      total_amount, 
      no_deviation, 
      terms_accepted, 
      warranty_details 
    } = req.body;
    
    // 1. CHECK DEADLINE BEFORE PROCESSING
    const { data: timeline, error: timelineFetchError } = await supabase
      .from('tender_timeline')
      .select('submission_deadline')
      .eq('tender_id', tender_id)
      .single();

    if (timelineFetchError || !timeline) {
      return res.status(404).json({ 
        success: false, 
        message: "Tender timeline not found. Cannot validate deadline." 
      });
    }

    const now = new Date();
    const deadline = new Date(timeline.submission_deadline);

    // If current time is greater than deadline, block the submission
    if (now > deadline) {
      return res.status(403).json({ 
        success: false, 
        message: "Tender has been closed. The submission deadline has passed." 
      });
    }

    // 2. CHECK FOR REQUIRED FILES
    const files = req.files;
    if (!files || !files.technical_bid || !files.financial_bid || !files.emd_proof) {
      return res.status(400).json({ 
        success: false, 
        message: "Technical bid, Financial bid, and EMD proof are required." 
      });
    }

    // 3. PROCEED WITH UPLOADS (Since deadline is valid)
    const techPath = `tender_${tender_id}/sup_${supplier_id}_tech.pdf`;
    const finPath = `tender_${tender_id}/sup_${supplier_id}_fin.pdf`;
    const emdPath = `tender_${tender_id}/sup_${supplier_id}_emd.pdf`;

 await supabase.storage.from('technical-bids').upload(techPath, files.technical_bid[0].buffer, { 
        upsert: true, 
        contentType: 'application/pdf' 
    });
    await supabase.storage.from('financial-bids').upload(finPath, files.financial_bid[0].buffer, { 
        upsert: true, 
        contentType: 'application/pdf' 
    });
    await supabase.storage.from('supplier-docs').upload(emdPath, files.emd_proof[0].buffer, { 
        upsert: true, 
        contentType: 'application/pdf' 
    });
    // 4. CREATE MAIN BID RECORD
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .insert([{ tender_id, supplier_id, status: 'SUBMITTED' }])
      .select();

    if (bidError) throw bidError;
    const bidId = bidData[0].id;

    // 5. SAVE REMAINING DETAILS (Declarations, Financials, etc.)
    await supabase.from('bid_declarations').insert([{
      bid_id: bidId,
      no_deviation: no_deviation === 'true' || no_deviation === true,
      terms_accepted: terms_accepted === 'true' || terms_accepted === true
    }]);

    await supabase.from('bid_common_documents').insert([{
      bid_id: bidId,
      emd_proof_file: emdPath,
      nit_signed_file: techPath,
      warranty_details: warranty_details
    }]);

    await supabase.from('bid_technical_documents').insert([{ 
      bid_id: bidId, 
      file_path: techPath, 
      document_type: 'TECHNICAL_PROPOSAL' 
    }]);

    await supabase.from('bid_financials').insert([{ 
      bid_id: bidId, 
      encrypted_file_path: finPath, 
      total_amount 
    }]);

    res.status(201).json({ 
      success: true, 
      message: "Complete bid package submitted successfully!", 
      bid_id: bidId 
    });

  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/bidController.js

// backend/controllers/bidController.js

// backend/controllers/bidController.js

exports.getMyBidStatus = async (req, res) => {
  try {
    const { tender_id } = req.params;
    const user_id = req.user.id;

    // 1. Fetch the deadline info first (so we always have it)
    const { data: timeline } = await supabase
      .from('tender_timeline')
      .select('submission_deadline')
      .eq('tender_id', tender_id)
      .single();

    // 2. Find the Supplier ID
    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .select('id, company_name')
      .eq('user_id', user_id)
      .single();

    // If no supplier or no bid exists yet, we still return the deadline
    if (supErr || !supplier) {
      return res.status(200).json({ 
        success: true, 
        bid: null, 
        deadline: timeline?.submission_deadline 
      });
    }

    // 3. Fetch Bid details
    const { data: bid, error } = await supabase
      .from('bids')
      .select(`
        *,
        bid_financials(total_amount, encrypted_file_path),
        bid_technical_documents(file_path),
        bid_common_documents(warranty_details, emd_proof_file)
      `)
      .eq('tender_id', tender_id)
      .eq('supplier_id', supplier.id)
      .maybeSingle();

    if (error) throw error;

    // Prepare signed URLs if bid exists (same logic as before...)
    let fileUrls = null;
    if (bid) {
      const companyName = supplier.company_name.replace(/\s+/g, '_');
      const getSignedUrl = async (bucket, path, suffix) => {
        if (!path) return null;
        const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600, {
          download: `${companyName}_${suffix}.pdf`
        });
        return data?.signedUrl;
      };

      fileUrls = {
        technical: await getSignedUrl('technical-bids', bid.bid_technical_documents?.[0]?.file_path, 'Technical_Proposal'),
        financial: await getSignedUrl('financial-bids', bid.bid_financials?.[0]?.encrypted_file_path, 'Financial_Quote'),
        emd: await getSignedUrl('supplier-docs', bid.bid_common_documents?.[0]?.emd_proof_file, 'EMD_Proof')
      };
    }

    res.status(200).json({ 
      success: true, 
      bid: bid,
      downloadUrls: fileUrls,
      deadline: timeline?.submission_deadline // <--- ADDED THIS
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAllMyBids = async (req, res) => {
  try {
    const user_id = req.user.id;

    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (supErr || !supplier) return res.status(200).json({ success: true, data: [] });

    const { data, error } = await supabase
      .from('bids')
      .select(`
        id,
        status,
        tenders:tender_id ( 
          title,
          budget_estimate
        ),
        bid_financials (
          total_amount
        )
      `) // Removed created_at to stop the 500 error
      .eq('supplier_id', supplier.id);

    if (error) throw error;

    const formattedBids = data.map(b => ({
      id: b.id,
      title: b.tenders?.title || "Unknown Tender",
      status: b.status,
      price: b.bid_financials?.[0]?.total_amount || 0,
    }));

    res.status(200).json({ success: true, data: formattedBids });
  } catch (error) {
    console.error("GET_MY_BIDS_ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};