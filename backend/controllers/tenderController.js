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

      // Eligibility Table Fields
      min_experience_years, min_turnover, required_certifications 
    } = req.body;

    const files = req.files; // Array of files from multer

    // 1. Insert into 'tenders'
    const { data: tenderData, error: tenderError } = await supabase
      .from('tenders')
      .insert([{
          title, description, scope_of_work, quantity,
          delivery_timeline, budget_estimate, 
          price_weightage, technical_weightage, 
          emd_amount, bid_validity_days, penalty_clauses,
          created_by,
          status: 'PUBLISHED'
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

    // 3. Insert into 'tender_eligibility_criteria'
    const { error: eligibilityError } = await supabase
      .from('tender_eligibility_criteria')
      .insert([{
          tender_id: tenderId,
          min_experience_years,
          min_turnover,
          required_certifications
      }]);

    if (eligibilityError) throw eligibilityError;

    // 4. NEW: Handle Simultaneous File Uploads
    if (files && files.length > 0) {
      for (const file of files) {
        // Create a unique path
        const filePath = `tenders/${tenderId}/${Date.now()}_${file.originalname}`;
        
        // A. Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('tender-assets')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (storageError) throw storageError;

        // B. Record file in 'tender_documents' table to link it to the tender
        const { error: docTableError } = await supabase
          .from('tender_documents')
          .insert([{
            tender_id: tenderId,
            file_path: filePath,
           document_type: req.body.tender_doc_type || 'NIT' // Default type or extract from req.body if provided
          }]);
          
        if (docTableError) throw docTableError;
      }
    }

    // 5. Audit Log
    await supabase.from('audit_logs').insert([{
      user_id: created_by,
      action: 'TENDER_CREATED_WITH_DOCUMENTS',
      entity_type: 'TENDER',
      entity_id: tenderId,
      ip_address: req.ip
    }]);

    res.status(201).json({
      success: true,
      message: 'Tender created with all records and documents successfully!',
      tender_id: tenderId
    });

  } catch (error) {
    console.error("Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/tenderController.js

exports.uploadTenderDocuments = async (req, res) => {
  try {
    const { tender_id } = req.params;
    const { document_type } = req.body; 
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file received by server" });

    const filePath = `tenders/${tender_id}/${document_type}_${Date.now()}.pdf`;
    
    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('tender-assets')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf', // Tell Supabase this is a PDF
        upsert: true
      });

    if (storageError) throw storageError;

    // ... rest of your code to save to DB
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 2. Get All Tenders (ADD THIS BACK)
// 2. Get All Tenders (UPDATED TO INCLUDE DOCUMENTS)
exports.getAllTenders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tenders')
      .select(`
        *,
        tender_documents (
          id,
          document_type,
          file_path
        ),
        tender_timeline (
          submission_deadline,
          opening_date,
          clarification_deadline
        ),
        tender_eligibility_criteria (
          min_experience_years,
          min_turnover,
          required_certifications
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      count: data.length, 
      data 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getTenderFileUrl = async (req, res) => {
  try {
    const { path } = req.query; 

    if (!path) return res.status(400).json({ message: "Path is required" });

    // This cleaning logic ensures the path works with the signed URL
    const cleanPath = path.replace('tender-assets/', '').replace(/^\/+/, '');

    const { data, error } = await supabase.storage
      .from('tender-assets')
      .createSignedUrl(cleanPath, 60, {
        download: true // CORRECT: Forces direct download
      });

    if (error) throw error;

    res.status(200).json({ success: true, url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/tenderController.js

// DELETE TENDER
exports.deleteTender = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get file paths first to delete from Storage
    const { data: files } = await supabase
      .from('tender_documents')
      .select('file_path')
      .eq('tender_id', id);

    if (files && files.length > 0) {
      const pathsToDelete = files.map(f => f.file_path);
      await supabase.storage.from('tender-assets').remove(pathsToDelete);
    }

    // 2. Delete from Database (Cascading should handle timeline/eligibility if set up in SQL)
    // If not cascading, delete from child tables first.
    const { error } = await supabase.from('tenders').delete().eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true, message: "Tender and associated assets deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE TENDER (Edit)
// backend/controllers/tenderController.js

// backend/controllers/tenderController.js

exports.updateTender = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      submission_deadline, opening_date, clarification_deadline, // Timeline
      min_experience_years, min_turnover, required_certifications, // Eligibility
      ...mainTenderData 
    } = req.body;

    // 1. Update Main Tender Table
    const { error: tenderError } = await supabase
      .from('tenders')
      .update(mainTenderData)
      .eq('id', id);
    if (tenderError) throw tenderError;

    // 2. Handle Timeline (Manual Upsert)
    const { data: existingTimeline } = await supabase
      .from('tender_timeline')
      .select('id')
      .eq('tender_id', id)
      .single();

    if (existingTimeline) {
      // Update existing
      await supabase.from('tender_timeline')
        .update({ submission_deadline, opening_date, clarification_deadline })
        .eq('tender_id', id);
    } else {
      // Insert if empty
      await supabase.from('tender_timeline')
        .insert([{ tender_id: id, submission_deadline, opening_date, clarification_deadline }]);
    }

    // 3. Handle Eligibility (Manual Upsert)
    const { data: existingEligibility } = await supabase
      .from('tender_eligibility_criteria')
      .select('id')
      .eq('tender_id', id)
      .single();

    if (existingEligibility) {
      // Update existing
      await supabase.from('tender_eligibility_criteria')
        .update({ min_experience_years, min_turnover, required_certifications })
        .eq('tender_id', id);
    } else {
      // Insert if empty
      await supabase.from('tender_eligibility_criteria')
        .insert([{ tender_id: id, min_experience_years, min_turnover, required_certifications }]);
    }

    res.status(200).json({ success: true, message: "Tender updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/tenderController.js

exports.getTenderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tenders')
      .select(`
        *,
        tender_documents (
          id,
          document_type,
          file_path
        ),
        tender_timeline (
          submission_deadline,
          opening_date,
          clarification_deadline
        ),
        tender_eligibility_criteria (
          min_experience_years,
          min_turnover,
          required_certifications
        )
      `)
      .eq('id', id)
      .single(); // We expect only one record

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Tender not found" });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};