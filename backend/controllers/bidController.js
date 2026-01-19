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
    
    const files = req.files;

    // Check for required files as per Section 5 of schema
    if (!files || !files.technical_bid || !files.financial_bid || !files.emd_proof) {
      return res.status(400).json({ 
        success: false, 
        message: "Technical bid, Financial bid, and EMD proof are required." 
      });
    }

    // 1. Upload Files to respective buckets
    const techPath = `tender_${tender_id}/sup_${supplier_id}_tech.pdf`;
    const finPath = `tender_${tender_id}/sup_${supplier_id}_fin.pdf`;
    const emdPath = `tender_${tender_id}/sup_${supplier_id}_emd.pdf`;

    // Uploading to specific storage buckets
    await supabase.storage.from('technical-bids').upload(techPath, files.technical_bid[0].buffer, { upsert: true });
    await supabase.storage.from('financial-bids').upload(finPath, files.financial_bid[0].buffer, { upsert: true });
    await supabase.storage.from('bid-documents').upload(emdPath, files.emd_proof[0].buffer, { upsert: true });

    // 2. Create Main Bid Record (Table 5: bids)
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .insert([{ tender_id, supplier_id, status: 'SUBMITTED' }])
      .select();

    if (bidError) throw bidError;
    const bidId = bidData[0].id;

    // 3. Save Bid Declarations (Table 5: bid_declarations)
    const { error: declError } = await supabase
      .from('bid_declarations')
      .insert([{
        bid_id: bidId,
        no_deviation: no_deviation === 'true' || no_deviation === true,
        terms_accepted: terms_accepted === 'true' || terms_accepted === true
      }]);
    if (declError) throw declError;

    // 4. Save Common Documents (Table 5: bid_common_documents)
    const { error: commonError } = await supabase
      .from('bid_common_documents')
      .insert([{
        bid_id: bidId,
        emd_proof_file: emdPath,
        nit_signed_file: techPath, // Often the signed NIT is part of the tech bid
        warranty_details: warranty_details
      }]);
    if (commonError) throw commonError;

    // 5. Link Technical & Financial paths (Table 5: bid_technical_documents & bid_financials)
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
      message: "Complete bid package (Technical, Financial, and EMD) submitted successfully!", 
      bid_id: bidId 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};