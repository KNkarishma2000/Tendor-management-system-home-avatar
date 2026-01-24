const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
exports.registerSupplierProfile = async (req, res) => {
  console.log("--- STARTING REGISTRATION ---");
  console.log("Body:", req.body);
  console.log("Files received:", req.files ? req.files.length : "NONE");

  try {
    const { 
      email, password, company_name, registered_address, 
      pan, gstin, cin, contact_person_name, contact_phone, 
      bank_account_no, ifsc_code, bank_name, categories 
    } = req.body;

    // 1. Create User
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ email, password_hash, role: 'SUPPLIER', is_active: true, is_verified: false }])
      .select();

    if (userError) throw new Error(`User Table: ${userError.message}`);
    const userId = userData[0].id;
    console.log("✅ User created:", userId);

    // 2. Create Supplier
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert([{ 
        user_id: userId, company_name, registered_address, pan, gstin, cin, 
        contact_person_name, contact_phone, status: 'PENDING' 
      }])
      .select();

    if (supplierError) throw new Error(`Supplier Table: ${supplierError.message}`);
    const supplierId = supplierData[0].id;
    console.log("✅ Supplier created:", supplierId);

    // 3. File Uploads
    let cancelledChequePath = null;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = `${supplierId}/${Date.now()}_${file.fieldname}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-docs') 
          .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (uploadError) {
          console.error("❌ Upload fail:", uploadError.message);
          continue;
        }

        if (file.fieldname === 'cancelled_cheque') cancelledChequePath = uploadData.path;

        // Add to documents table
        await supabase.from('supplier_documents').insert([{
          supplier_id: supplierId,
          document_type: file.fieldname.toUpperCase(), 
          file_path: uploadData.path
        }]);
      }
    }

    // 4. Financials - WE MUST WAIT FOR THIS
    const { error: finError } = await supabase
      .from('supplier_financials')
      .insert([{
        supplier_id: supplierId,
        bank_account_no, 
        ifsc_code,
        bank_name,
        cancelled_cheque_file: cancelledChequePath
      }]);
    
    if (finError) console.error("❌ Financials Table Error:", finError.message);
    else console.log("✅ Financials added");

    // 5. Categories
    if (categories) {
      const catArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
      const inserts = catArray.map(cat => ({ supplier_id: supplierId, category_name: cat }));
      const { error: catErr } = await supabase.from('supplier_categories').insert(inserts);
      if (catErr) console.error("❌ Category Error:", catErr.message);
      else console.log("✅ Categories added");
    }

    return res.status(201).json({ success: true, message: "Profile Registered Successfully" });

  } catch (error) {
    console.error("❌ SYSTEM FAILURE:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};