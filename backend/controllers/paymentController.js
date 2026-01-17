const supabase = require('../config/supabase');

exports.recordPayment = async (req, res) => {
  try {
    const { tender_id, supplier_id, amount, payment_date } = req.body;

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        tender_id,
        supplier_id,
        amount,
        payment_date,
        status: 'COMPLETED'
      }])
      .select();

    if (error) throw error;

    // Audit Log for the financial transaction
    await supabase.from('audit_logs').insert([{
      user_id: req.user.id,
      action: 'PAYMENT_RECORDED',
      entity_type: 'PAYMENT',
      entity_id: data[0].id,
      ip_address: req.ip
    }]);

    res.status(201).json({ success: true, message: "Payment recorded successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};