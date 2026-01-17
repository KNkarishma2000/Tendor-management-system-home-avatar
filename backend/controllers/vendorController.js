const supabase = require('../config/supabase');

exports.rateVendor = async (req, res) => {
  try {
    const { supplier_id, tender_id, rating, feedback } = req.body;

    // 1. Insert rating (Table: vendor_ratings)
    const { data, error } = await supabase
      .from('vendor_ratings')
      .insert([{
        supplier_id,
        tender_id,
        rating, // 1 to 5
        feedback
      }])
      .select();

    if (error) throw error;

    // 2. Audit Log
    await supabase.from('audit_logs').insert([{
      user_id: req.user.id,
      action: 'VENDOR_RATED',
      entity_type: 'SUPPLIER',
      entity_id: supplier_id,
      ip_address: req.ip
    }]);

    res.status(201).json({ success: true, message: "Vendor performance rated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};