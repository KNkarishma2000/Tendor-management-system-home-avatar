const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

exports.registerSupplierProfile = async (req, res) => {
  try {
    // 1. Extract ALL fields including email and password
    const { 
      email, 
      password, 
      company_name, 
      registered_address, 
      pan, 
      gstin, 
      cin,
      contact_person_name, 
      contact_phone, 
      bank_account_no, 
      ifsc_code, 
      bank_name, 
      categories 
    } = req.body;

    const files = req.files; 

    // --- STEP 1: CREATE THE USER ACCOUNT ---
    // We hash the password for security as per industry standards
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password_hash, 
        role: 'SUPPLIER', 
        is_active: true, 
        is_verified: false 
      }])
      .select();

    if (userError) throw new Error(`User Creation Error: ${userError.message}`);
    const userId = userData[0].id;

    // --- STEP 2: INSERT INTO 'SUPPLIERS' TABLE ---
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert([{ 
        user_id: userId, // Link to the user we just created
        company_name, 
        registered_address, 
        pan, 
        gstin, 
        cin, 
        contact_person_name, 
        contact_phone, 
        status: 'PENDING' 
      }])
      .select();

    if (supplierError) throw new Error(`Supplier Error: ${supplierError.message}`);
    const supplierId = supplierData[0].id;

    // --- STEP 3: HANDLE FILE UPLOADS TO STORAGE ---
    let cancelledChequePath = null;
    
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `${supplierId}/${Date.now()}_${file.originalname}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-docs') 
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Capture the path specifically for the financials table
        if (file.fieldname === 'cancelled_cheque') {
          cancelledChequePath = uploadData.path;
        }

        // Insert into 'supplier_documents' table (Table 2 in your schema)
        await supabase.from('supplier_documents').insert([{
          supplier_id: supplierId,
          document_type: file.fieldname.toUpperCase(), 
          file_path: uploadData.path,
          verified: false
        }]);
      }
    }

    // --- STEP 4: INSERT INTO 'SUPPLIER_FINANCIALS' ---
    const { error: finError } = await supabase
      .from('supplier_financials')
      .insert([{
        supplier_id: supplierId,
        bank_account_no,
        ifsc_code,
        bank_name,
        cancelled_cheque_file: cancelledChequePath
      }]);
    if (finError) throw finError;

    // --- STEP 5: INSERT INTO 'SUPPLIER_CATEGORIES' ---
    if (categories) {
      // Allows frontend to send a single string or an array
      const categoryArray = Array.isArray(categories) ? categories : [categories];
      const categoryInserts = categoryArray.map(cat => ({
        supplier_id: supplierId,
        category_name: cat
      }));
      
      const { error: catError } = await supabase
        .from('supplier_categories')
        .insert(categoryInserts);
      if (catError) throw catError;
    }

    // --- STEP 6: AUDIT LOG (Table 9) ---
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action: 'SUPPLIER_FULL_REGISTRATION',
      entity_type: 'SUPPLIER',
      entity_id: supplierId,
      ip_address: req.ip
    }]);

    res.status(201).json({
      success: true,
      message: "Supplier account created and profile submitted for approval!",
      supplier_id: supplierId,
      user_id: userId
    });

  } catch (error) {
    console.error("Full Registration Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};