// backend/controllers/tenderController.js
const supabase = require('../config/supabase');

exports.createTender = async (req, res) => {
  try {
    const {
      title, description, scope_of_work, quantity,
      delivery_timeline, budget_estimate, price_weightage,
      technical_weightage, emd_amount, bid_validity_days,
      penalty_clauses, created_by,
      submission_deadline, opening_date, clarification_deadline,
      min_experience_years, min_turnover, required_certifications 
    } = req.body;

    const files = req.files;

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

    await supabase.from('tender_timeline').insert([{
      tender_id: tenderId, submission_deadline, opening_date, clarification_deadline
    }]);

    await supabase.from('tender_eligibility_criteria').insert([{
      tender_id: tenderId, min_experience_years, min_turnover, required_certifications
    }]);

    // --- UPDATED FILE UPLOAD LOGIC ---
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `tenders/${tenderId}/${Date.now()}_${file.originalname}`;
        
        const { error: storageError } = await supabase.storage
          .from('tender-assets')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype, // CRITICAL: Sets the file type correctly
            upsert: true
          });

        if (storageError) throw storageError;

        await supabase.from('tender_documents').insert([{
          tender_id: tenderId,
          file_path: filePath,
          document_type: req.body.tender_doc_type || 'NIT'
        }]);
      }
    }

    res.status(201).json({ success: true, tender_id: tenderId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/tenderController.js

exports.uploadTenderDocuments = async (req, res) => {
  try {
    const { tender_id } = req.params;
    const { document_type } = req.body; 
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file received" });

    const filePath = `tenders/${tender_id}/${document_type}_${Date.now()}.pdf`;
    
    const { error: storageError } = await supabase.storage
      .from('tender-assets')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'application/pdf', 
        upsert: true
      });

    if (storageError) throw storageError;

    await supabase.from('tender_documents').insert([{
      tender_id,
      file_path: filePath,
      document_type
    }]);

    res.status(200).json({ success: true });
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
// backend/controllers/tenderController.js

// backend/controllers/tenderController.js

exports.getTenderFileUrl = async (req, res) => {
  try {
    const { path, fileName } = req.query; 
    if (!path) return res.status(400).json({ message: "Path is required" });

    // 1. Clean the path (remove bucket name if it was accidentally prepended)
    const cleanPath = path.replace('tender-assets/', '').replace(/^\/+/, '');

    // 2. Get the Public URL
    const { data } = supabase.storage
      .from('tender-assets')
      .getPublicUrl(cleanPath);

    if (!data.publicUrl) {
        return res.status(404).json({ success: false, message: "File not found" });
    }

    // 3. For public buckets, we return the public link. 
    // If you still want "forced download" behavior with a custom name, 
    // keep createSignedUrl, otherwise publicUrl is sufficient.
    res.status(200).json({ 
      success: true, 
      url: data.publicUrl 
    });
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