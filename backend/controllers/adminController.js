const supabase = require('../config/supabase');

// backend/controllers/adminController.js
exports.approveSupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;
    // Get admin_id from body instead of req.user for now
    const { status, remarks, admin_id } = req.body; 

    if (!admin_id) {
        return res.status(400).json({ success: false, message: "admin_id is required" });
    }

    // 1. Update Supplier
    const { data, error } = await supabase.from('suppliers').update({ status }).eq('id', supplier_id).select();
    if (error) throw error;

    // 2. Supplier Verification Log
    await supabase.from('supplier_verification_logs').insert([{
        supplier_id,
        admin_id, // Now this has a value
        action: status,
        remarks,
        action_date: new Date()
    }]);

    // 3. Audit Trail
    await supabase.from('audit_logs').insert([{
      user_id: admin_id,
      action: `SUPPLIER_${status}`,
      entity_type: 'SUPPLIER',
      entity_id: supplier_id,
      ip_address: req.ip
    }]);

    res.status(200).json({ success: true, message: `Supplier ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAllSuppliers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        id, 
        company_name, 
        status, 
        contact_person_name, 
        contact_phone, 
        created_at,
        users (email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get full details of a specific supplier (Financials + Documents)
exports.getSupplierDetails = async (req, res) => {
  try {
    const { supplier_id } = req.params;

    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        users (email),
        supplier_financials (*),
        supplier_documents (*),
        supplier_categories (category_name)
      `)
      .eq('id', supplier_id)
      .single();

    if (error) throw error;

    // Generate temporary "Signed URLs" for private documents in storage
    // This allows the admin to view/download files even if the bucket is private
    if (data.supplier_documents && data.supplier_documents.length > 0) {
      for (let doc of data.supplier_documents) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from('supplier-docs')
          .createSignedUrl(doc.file_path, 3600); // URL valid for 1 hour

        if (!urlError) {
          doc.download_url = urlData.signedUrl;
        }
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};