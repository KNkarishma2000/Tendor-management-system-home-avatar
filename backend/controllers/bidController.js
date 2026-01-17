const supabase = require('../config/supabase');

exports.submitBid = async (req, res) => {
  try {
    const { tender_id, supplier_id, total_amount } = req.body;
    const files = req.files;

    if (!files || !files.technical_bid || !files.financial_bid) {
      return res.status(400).json({ success: false, message: "Both envelopes are required." });
    }

    // 1. Upload Technical Bid
    const techFile = files.technical_bid[0];
    const techPath = `tender_${tender_id}/sup_${supplier_id}_tech.pdf`;
    const { data: techUpload, error: techError } = await supabase.storage
      .from('technical-bids')
      .upload(techPath, techFile.buffer, { contentType: 'application/pdf', upsert: true });

    if (techError) throw techError;

    // 2. Upload Financial Bid (This goes to the private bucket)
    const finFile = files.financial_bid[0];
    const finPath = `tender_${tender_id}/sup_${supplier_id}_fin.pdf`;
    const { data: finUpload, error: finError } = await supabase.storage
      .from('financial-bids')
      .upload(finPath, finFile.buffer, { contentType: 'application/pdf', upsert: true });

    if (finError) throw finError;

    // 3. Save Bid record to Database
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .insert([{ 
          tender_id, 
          supplier_id, 
          status: 'SUBMITTED' 
      }])
      .select();

    if (bidError) throw bidError;

    const bidId = bidData[0].id;

    // 4. Link Documents in DB
    await supabase.from('bid_technical_documents').insert([{
      bid_id: bidId,
      file_path: techUpload.path,
      document_type: 'TECHNICAL_PROPOSAL'
    }]);

    await supabase.from('bid_financials').insert([{
      bid_id: bidId,
      encrypted_file_path: finUpload.path, // Path is saved, but file is in private bucket
      total_amount
    }]);
    

    res.status(201).json({
      success: true,
      message: "Two-Envelope bid submitted successfully!",
      bid_id: bidId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};