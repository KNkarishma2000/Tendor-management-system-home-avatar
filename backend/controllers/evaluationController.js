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

    // Create a Signed URL valid for 30 minutes
    const { data, error: storageError } = await supabase.storage
      .from('technical-bids')
      .createSignedUrl(doc.file_path, 1800);

    if (storageError) throw storageError;

    res.status(200).json({ success: true, view_url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Submit the Technical Score (Admin acting as Evaluator)
exports.submitTechnicalScore = async (req, res) => {
  try {
    const { bid_id, score, remarks } = req.body;
    
    // Identity: req.user is populated by your 'protect' middleware
    const adminUserId = req.user.id; 

    // Step A: Ensure Admin exists in 'evaluators' table to satisfy FK constraint
    let { data: evaluator, error: evalError } = await supabase
      .from('evaluators')
      .select('id')
      .eq('user_id', adminUserId)
      .single();

    if (!evaluator) {
      // Auto-register Admin as an evaluator if missing
      const { data: newEval, error: createError } = await supabase
        .from('evaluators')
        .insert([{ user_id: adminUserId, specialization: 'ADMIN_CHIEF_EVALUATOR' }])
        .select()
        .single();
      
      if (createError) throw createError;
      evaluator = newEval;
    }

    // Step B: Insert into technical_evaluations table
    const { error: insertError } = await supabase
      .from('technical_evaluations')
      .insert([{ 
        bid_id, 
        evaluator_id: evaluator.id, 
        score, 
        remarks 
      }]);

    if (insertError) throw insertError;

    // Step C: Update bid status (Qualify if score >= 70)
    const status = score >= 70 ? 'TECH_QUALIFIED' : 'TECH_REJECTED';
    
    await supabase
      .from('bids')
      .update({ status: status })
      .eq('id', bid_id);

    res.status(200).json({ 
      success: true, 
      message: `Evaluation completed by Admin. Status: ${status}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Unlock and View Financial Bid (The Second Envelope)
exports.viewFinancialBid = async (req, res) => {
  try {
    const { bid_id } = req.params;

    // Verify if the bid is TECH_QUALIFIED
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('status')
      .eq('id', bid_id)
      .single();

    if (bidError || !bid) throw new Error("Bid not found");

    if (bid.status !== 'TECH_QUALIFIED') {
      return res.status(403).json({ 
        success: false, 
        message: "Financial envelope is LOCKED. Bid must pass Technical Evaluation first." 
      });
    }

    // Get financial path and amount
    const { data: finDoc, error: dbError } = await supabase
      .from('bid_financials')
      .select('encrypted_file_path, total_amount')
      .eq('bid_id', bid_id)
      .single();

    if (dbError) throw dbError;

    // Generate Signed URL for the private bucket
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

// 1. Download Technical PDF
exports.downloadTechnicalBid = async (req, res) => {
  try {
    const { bid_id } = req.params;
    const { data: doc, error: dbError } = await supabase
      .from('bid_technical_documents')
      .select('file_path')
      .eq('bid_id', bid_id)
      .single();

    if (dbError) throw dbError;

    // The { download: true } option tells Supabase to set Content-Disposition: attachment
    const { data, error: storageError } = await supabase.storage
      .from('technical-bids')
      .createSignedUrl(doc.file_path, 300, { download: true });

    if (storageError) throw storageError;
    res.status(200).json({ success: true, download_url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Download Financial PDF (Only if TECH_QUALIFIED)
exports.downloadFinancialBid = async (req, res) => {
  try {
    const { bid_id } = req.params;

    // Check status first
    const { data: bid } = await supabase.from('bids').select('status').eq('id', bid_id).single();
    if (bid?.status !== 'TECH_QUALIFIED' && bid?.status !== 'WON') {
      return res.status(403).json({ success: false, message: "Financial docs are locked." });
    }

    const { data: fin, error: dbError } = await supabase
      .from('bid_financials')
      .select('encrypted_file_path')
      .eq('bid_id', bid_id)
      .single();

    if (dbError) throw dbError;

    const { data, error: storageError } = await supabase.storage
      .from('financial-bids')
      .createSignedUrl(fin.encrypted_file_path, 300, { download: true });

    if (storageError) throw storageError;
    res.status(200).json({ success: true, download_url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};