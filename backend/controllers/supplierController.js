const supabase = require('../config/supabase');

exports.registerSupplierProfile = async (req, res) => {
  try {
    const { 
      user_id, 
      company_name, 
      registered_address, 
      pan, 
      gstin, 
      cin,
      contact_person_name, 
      contact_phone,
      // Financial details from your schema
      bank_account_no,
      ifsc_code,
      bank_name 
    } = req.body;

    // 1. Insert into 'suppliers' table
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert([
        { 
          user_id, 
          company_name, 
          registered_address, 
          pan, 
          gstin, 
          cin,
          contact_person_name, 
          contact_phone,
          status: 'PENDING' 
        }
      ])
      .select();

    if (supplierError) throw supplierError;
    const supplierId = supplierData[0].id;

    // 2. Insert into 'supplier_financials' table (Table 2 in your schema)
    // This is crucial for the "Post-Award Payment" module later
    const { error: finError } = await supabase
      .from('supplier_financials')
      .insert([
        {
          supplier_id: supplierId,
          bank_account_no,
          ifsc_code,
          // note: cancelled_cheque_file would be handled via req.file if uploading
        }
      ]);

    if (finError) throw finError;

    // 3. Record the Registration in 'audit_logs' (Table 9 in your schema)
    await supabase.from('audit_logs').insert([
      {
        user_id: user_id,
        action: 'SUPPLIER_PROFILE_CREATED',
        entity_type: 'SUPPLIER',
        entity_id: supplierId,
        ip_address: req.ip
      }
    ]);

    res.status(201).json({
      success: true,
      message: "Supplier profile and financial records submitted for approval!",
      supplier_id: supplierId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};