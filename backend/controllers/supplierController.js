const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
exports.registerSupplierProfile = async (req, res) => {
  try {
    // 1. Extract data from the request body (sent from your React form)
    const { 
      email, password, company_name, registered_address, 
      pan, gstin, cin, contact_person_name, contact_phone, 
      bank_account_no, ifsc_code, bank_name, categories 
    } = req.body;

    const files = req.files; 

    // --- STEP 1: CREATE USER ---
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ email, password_hash, role: 'SUPPLIER', is_active: true, is_verified: false }])
      .select();

    if (userError) throw new Error(`User Table Error: ${userError.message}`);
    const userId = userData[0].id;

    // --- STEP 2: CREATE SUPPLIER ---
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert([{ 
        user_id: userId, 
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

    if (supplierError) throw new Error(`Supplier Table Error: ${supplierError.message}`);
    const supplierId = supplierData[0].id;

    // --- STEP 3: UPLOAD FILES & CAPTURE PATHS ---
    let cancelledChequePath = null;
    
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = `${supplierId}/${Date.now()}_${file.fieldname}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-docs') 
          .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        // KEY FIX: Catch the path specifically for the bank table
        if (file.fieldname === 'cancelled_cheque') {
          cancelledChequePath = uploadData.path;
        }

        // Standard Document Log
        await supabase.from('supplier_documents').insert([{
          supplier_id: supplierId,
          document_type: file.fieldname.toUpperCase(), 
          file_path: uploadData.path,
          verified: false
        }]);
      }
    }

    // --- STEP 4: INSERT INTO 'SUPPLIER_FINANCIALS' ---
    // This matches your DB columns exactly
    const { error: finError } = await supabase
      .from('supplier_financials')
      .insert([{
        supplier_id: supplierId,
        bank_account_no: bank_account_no || null, 
        ifsc_code: ifsc_code || null,
        bank_name: bank_name || null,
        cancelled_cheque_file: cancelledChequePath || null
      }]);

    if (finError) throw new Error(`Financials Table Error: ${finError.message}`);

    // --- STEP 5: CATEGORIES ---
    if (categories) {
      const categoryArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
      const categoryInserts = (Array.isArray(categoryArray) ? categoryArray : [categoryArray]).map(cat => ({
        supplier_id: supplierId,
        category_name: cat
      }));
      await supabase.from('supplier_categories').insert(categoryInserts);
    }

    // Success response
    res.status(201).json({
      success: true,
      message: "Supplier profile submitted successfully!"
    });

  } catch (error) {
    console.error("CRITICAL REGISTRATION ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};