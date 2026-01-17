// backend/controllers/tenderController.js
const supabase = require('../config/supabase');

exports.createTender = async (req, res) => {
  try {
    const {
      // Main Tender Fields
      title, description, scope_of_work, quantity,
      delivery_timeline, budget_estimate, price_weightage,
      technical_weightage, emd_amount, bid_validity_days,
      penalty_clauses, created_by,
      
      // Timeline Table Fields
      submission_deadline, opening_date, clarification_deadline,

      // Eligibility Table Fields (The missing data)
      min_experience_years, min_turnover, required_certifications 
    } = req.body;

    // 1. Insert into 'tenders'
    const { data: tenderData, error: tenderError } = await supabase
      .from('tenders')
      .insert([{
          title, description, scope_of_work, quantity,
          delivery_timeline, budget_estimate, 
          price_weightage, technical_weightage, 
          emd_amount, bid_validity_days, penalty_clauses,
          created_by,
          status: 'DRAFT' 
      }])
      .select();

    if (tenderError) throw tenderError;
    const tenderId = tenderData[0].id;

    // 2. Insert into 'tender_timeline'
    const { error: timelineError } = await supabase
      .from('tender_timeline')
      .insert([{
          tender_id: tenderId,
          submission_deadline,
          opening_date,
          clarification_deadline
      }]);

    if (timelineError) throw timelineError;

    // 3. NEW: Insert into 'tender_eligibility_criteria' (Fills the empty table)
    const { error: eligibilityError } = await supabase
      .from('tender_eligibility_criteria')
      .insert([{
          tender_id: tenderId,
          min_experience_years,
          min_turnover,
          required_certifications // Usually a string or JSONB
      }]);

    if (eligibilityError) throw eligibilityError;

    // 4. Audit Log
    await supabase.from('audit_logs').insert([{
      user_id: created_by,
      action: 'TENDER_CREATED_WITH_ELIGIBILITY',
      entity_type: 'TENDER',
      entity_id: tenderId,
      ip_address: req.ip
    }]);

    res.status(201).json({
      success: true,
      message: 'Tender, Timeline, and Eligibility created successfully!',
      tender_id: tenderId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.uploadTenderDocuments = async (req, res) => {
  try {
    const { tender_id } = req.params;
    const { document_type } = req.body; // 'BOQ', 'DRAWING', 'NIT', etc.
    const file = req.file;

    if (!file) return res.status(400).send("No file uploaded.");

    // 1. Upload to Supabase Storage
    const filePath = `tenders/${tender_id}/${document_type}_${Date.now()}.pdf`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('tender-assets')
      .upload(filePath, file.buffer);

    if (storageError) throw storageError;

    // 2. Save Path to 'tender_documents' table
    const { error: dbError } = await supabase
      .from('tender_documents')
      .insert([{
        tender_id,
        document_type,
        file_path: filePath
      }]);

    if (dbError) throw dbError;

    res.status(200).json({ success: true, message: "Document attached to tender." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 2. Get All Tenders (ADD THIS BACK)
exports.getAllTenders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};