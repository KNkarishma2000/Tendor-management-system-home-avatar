const supabase = require('../config/supabase');

// 1. Get all qualified bids to identify L1 (Lowest Bidder)
exports.getQualifiedBids = async (req, res) => {
  try {
    const { tender_id } = req.params;

    const { data, error } = await supabase
      .from('bids')
      .select(`
        id, 
        status, 
        supplier_id,
        suppliers (company_name),
        bid_financials (total_amount)
      `)
      .eq('tender_id', tender_id)
      .eq('status', 'TECH_QUALIFIED')
      .order('total_amount', { foreignTable: 'bid_financials', ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, qualified_bids: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Award the Tender to the Winner
// backend/controllers/awardController.js
exports.awardTender = async (req, res) => {
  try {
    const { tender_id, winning_bid_id } = req.body;
    const admin_id = req.user.id;

    // 1. Fetch winning supplier_id first
    const { data: winBid } = await supabase.from('bids').select('supplier_id').eq('id', winning_bid_id).single();

    // 2. Perform Bulk Status Updates
    await supabase.from('bids').update({ status: 'WON' }).eq('id', winning_bid_id);
    await supabase.from('bids').update({ status: 'LOST' }).eq('tender_id', tender_id).neq('id', winning_bid_id);
    await supabase.from('tenders').update({ status: 'AWARDED' }).eq('id', tender_id);

    // 3. Create the Award Record (Table: tender_awards)
    const { data: awardData, error: awardError } = await supabase.from('tender_awards').insert([{
      tender_id,
      bid_id: winning_bid_id,
      supplier_id: winBid.supplier_id,
      award_date: new Date(),
      // loi_file and contract_file will be updated later in the Post-Award phase
    }]).select();

    if (awardError) throw awardError;

    // 4. Audit Log (Table: audit_logs)
    await supabase.from('audit_logs').insert([{
      user_id: admin_id,
      action: 'TENDER_AWARDED',
      entity_type: 'TENDER',
      entity_id: tender_id,
      ip_address: req.ip
    }]);

    res.status(200).json({ success: true, message: "Tender awarded and award record created." });
  } catch (error) {
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


