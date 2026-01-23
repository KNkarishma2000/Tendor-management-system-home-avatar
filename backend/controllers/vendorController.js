const supabase = require('../config/supabase'); // Only one import needed

exports.rateVendor = async (req, res) => {
  try {
    const { supplier_id, tender_id, rating, feedback } = req.body;

    // 1. Insert rating
    const { error } = await supabase
      .from('vendor_ratings')
      .insert([{
        supplier_id,
        tender_id,
        rating: Number(rating), 
        feedback
      }]);

    if (error) throw error;

    // 2. Audit Log (req.user comes from your 'protect' middleware)
    await supabase.from('audit_logs').insert([{
      user_id: req.user.id,
      action: 'VENDOR_RATED',
      entity_type: 'SUPPLIER',
      entity_id: supplier_id
    }]);

    res.status(201).json({ success: true, message: "Rating submitted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};