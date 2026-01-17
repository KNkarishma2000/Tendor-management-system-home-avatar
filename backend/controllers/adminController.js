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