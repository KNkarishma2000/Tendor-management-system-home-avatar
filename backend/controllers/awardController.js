const supabase = require('../config/supabase');

// 1. Get all qualified bids to identify L1 (Lowest Bidder)
// backend/controllers/awardController.js

exports.getComparison = async (req, res) => {
  try {
    const { tender_id } = req.params;

    const { data, error } = await supabase
      .from('bids')
      .select(`
        id, 
        status, 
        submitted_at, 
        supplier_id,
        suppliers (
          company_name,
          users (
            email
          )
        ),
        bid_financials (
          total_amount
        ),
        technical_evaluations (
          score,
          remarks
        )
      `)
      .eq('tender_id', tender_id)
      .order('submitted_at', { ascending: false }); // Changed from created_at

    if (error) {
      console.error("Supabase Query Error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(200).json({ 
      success: true, 
      qualified_bids: data || [] 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 2. Award the Tender to the Winner
// backend/controllers/awardController.js
// backend/controllers/awardController.js
exports.awardTender = async (req, res) => {
  try {
    const { tender_id, winning_bid_id } = req.body;

    // 1. PREVENT DUPLICATES: Check if tender is already awarded
    const { data: existingAward, error: checkError } = await supabase
      .from('tender_awards')
      .select('id')
      .eq('tender_id', tender_id)
      .maybeSingle();

    if (existingAward) {
      return res.status(400).json({ 
        success: false, 
        message: "Action Blocked: This tender has already been awarded." 
      });
    }

    // 2. Fetch winning supplier_id
    const { data: winBid } = await supabase
      .from('bids')
      .select('supplier_id')
      .eq('id', winning_bid_id)
      .single();

    if (!winBid) throw new Error("Bid not found");

    // 3. Update Bids Status (Atomic-like sequence)
    // Update the winner
    await supabase.from('bids').update({ status: 'WON' }).eq('id', winning_bid_id);
    // Update the losers
    await supabase.from('bids').update({ status: 'LOST' }).eq('tender_id', tender_id).neq('id', winning_bid_id);
    // Update the Tender itself
    await supabase.from('tenders').update({ status: 'AWARDED' }).eq('id', tender_id);

    // 4. Create Award Record (This table should have a UNIQUE constraint on tender_id)
    const { error: awardError } = await supabase.from('tender_awards').insert([{
      tender_id,
      bid_id: winning_bid_id,
      supplier_id: winBid.supplier_id,
      award_date: new Date(),
    }]);

    if (awardError) {
      // If DB unique constraint fails, this prevents duplicates
      if (awardError.code === '23505') throw new Error("Award already exists in database.");
      throw awardError;
    }

    res.status(200).json({ success: true, message: "Tender awarded successfully." });
  } catch (error) {
    console.error("Award Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/awardController.js

exports.finalizeAward = async (req, res) => {
  try {
    const { award_id } = req.params;
    const { admin_id } = req.body;
    
    // Check if files were uploaded via Multer
    if (!req.files || !req.files['loi_file'] || !req.files['contract_file']) {
      return res.status(400).json({ success: false, message: "Please upload both LOI and Contract files." });
    }

    const loiFile = req.files['loi_file'][0];
    const contractFile = req.files['contract_file'][0];

    // 1. Upload to Supabase Storage (contracts bucket)
    const loiPath = `awards/${award_id}/loi_${Date.now()}.pdf`;
    const contractPath = `awards/${award_id}/contract_${Date.now()}.pdf`;

    await supabase.storage.from('contracts').upload(loiPath, loiFile.buffer);
    await supabase.storage.from('contracts').upload(contractPath, contractFile.buffer);

    // 2. Update tender_awards record (Table 7 in your schema)
    const { data, error } = await supabase
      .from('tender_awards')
      .update({ 
        loi_file: loiPath, 
        contract_file: contractPath 
      })
      .eq('id', award_id)
      .select();

    if (error) throw error;

    // 3. Audit Log for transparency
    await supabase.from('audit_logs').insert([{
      user_id: admin_id || req.user.id,
      action: 'AWARD_DOCUMENTS_UPLOADED',
      entity_type: 'TENDER_AWARD',
      entity_id: award_id,
      ip_address: req.ip
    }]);

    res.status(200).json({ 
      success: true, 
      message: "LOI and Contract uploaded. Award finalized.",
      data: data[0] 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


