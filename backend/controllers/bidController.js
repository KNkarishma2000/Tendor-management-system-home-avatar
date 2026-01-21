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

    await supabase.storage.from('technical-bids').upload(techPath, files.technical_bid[0].buffer, { upsert: true });
    await supabase.storage.from('financial-bids').upload(finPath, files.financial_bid[0].buffer, { upsert: true });
    await supabase.storage.from('supplier-docs').upload(emdPath, files.emd_proof[0].buffer, { upsert: true });

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
exports.getMyBidStatus = async (req, res) => {
  try {
    const { tender_id } = req.params;
    const user_id = req.user.id;

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (!supplier) return res.status(200).json({ success: true, bid: null });

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
    if (!bid) return res.status(200).json({ success: true, bid: null });

    const getSignedUrl = async (bucket, path) => {
      if (!path) return null;
      // Using the exact bucket names visible in your Supabase screenshot
      const { data, error: storageError } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (storageError) {
          console.error(`Error generating URL for ${bucket}:`, storageError.message);
          return null;
      }
      return data?.signedUrl;
    };

    const fileUrls = {
      technical: await getSignedUrl('technical-bids', bid.bid_technical_documents?.[0]?.file_path),
      // Fix: Ensure bucket name is 'financial-bids'
      financial: await getSignedUrl('financial-bids', bid.bid_financials?.[0]?.encrypted_file_path),
      // Fix: Your screenshot shows 'supplier-docs', but your code uses 'bid-documents'. 
      // Ensure this matches where you actually uploaded.
      emd: await getSignedUrl('supplier-docs', bid.bid_common_documents?.[0]?.emd_proof_file)
    };

    res.status(200).json({ 
      success: true, 
      bid: bid,
      downloadUrls: fileUrls 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};