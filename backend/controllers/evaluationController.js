const supabase = require('../config/supabase');

// 1. Generate a temporary link for the Admin to view the Technical PDF
exports.viewTechnicalBid = async (req, res) => {
  try {
    const { bid_id } = req.params;

    const { data: doc, error: dbError } = await supabase
      .from('bid_technical_documents')
      .select('file_path')
      .eq('bid_id', bid_id)
      .single();

    if (dbError) throw dbError;

    // Create a Signed URL valid for 30 minutes (1800 seconds)
    const { data, error: storageError } = await supabase.storage
      .from('technical-bids')
      .createSignedUrl(doc.file_path, 1800);

    if (storageError) throw storageError;

    res.status(200).json({ success: true, view_url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Submit the Technical Score
exports.submitTechnicalScore = async (req, res) => {
  try {
    const { bid_id, score, remarks } = req.body;

    const { error } = await supabase
      .from('technical_evaluations')
      .insert([{ bid_id, score, remarks }]);

    if (error) throw error;

    // Update the main bid status based on the score
    const status = score >= 70 ? 'TECH_QUALIFIED' : 'TECH_REJECTED';
    
    await supabase
      .from('bids')
      .update({ status: status })
      .eq('id', bid_id);

    res.status(200).json({ success: true, message: `Evaluation complete. Status: ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 3. Unlock and View Financial Bid (The Second Envelope)
exports.viewFinancialBid = async (req, res) => {
  try {
    const { bid_id } = req.params;

    // First, verify if the bid is TECH_QUALIFIED
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('status')
      .eq('id', bid_id)
      .single();

    if (bidError || !bid) throw new Error("Bid not found");

    // BLOCK access if the technical evaluation isn't passed
    if (bid.status !== 'TECH_QUALIFIED') {
      return res.status(403).json({ 
        success: false, 
        message: "Financial envelope is LOCKED. Supplier must pass Technical Evaluation first." 
      });
    }

    // If qualified, get the financial file path
    const { data: finDoc, error: dbError } = await supabase
      .from('bid_financials')
      .select('encrypted_file_path, total_amount')
      .eq('bid_id', bid_id)
      .single();

    if (dbError) throw dbError;

    // Generate Signed URL for the private 'financial-bids' bucket
    const { data: urlData, error: storageError } = await supabase.storage
      .from('financial-bids')
      .createSignedUrl(finDoc.encrypted_file_path, 1800);

    if (storageError) throw storageError;

    res.status(200).json({ 
      success: true, 
      total_quoted_amount: finDoc.total_amount,
      view_url: urlData.signedUrl 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};