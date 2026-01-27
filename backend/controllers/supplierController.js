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
exports.updateSupplierProfile = async (req, res) => {
  console.log("--- STARTING PROFILE UPDATE ---");
  const userId = req.user.id;

  try {
    const { 
      company_name, registered_address, pan, gstin, cin, 
      contact_person_name, contact_phone, 
      bank_account_no, ifsc_code, bank_name, categories 
    } = req.body;

    // 1. Get Supplier ID
    const { data: supplier, error: sError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (sError || !supplier) throw new Error("Supplier profile not found");
    const supplierId = supplier.id;

    // 2. Update Basic Profile
    await supabase.from('suppliers').update({
      company_name, registered_address, pan, gstin, cin,
      contact_person_name, contact_phone,
      status: 'PENDING' 
    }).eq('id', supplierId);

    // 3. Handle File Uploads & Document Table
    let cancelledChequePath = null;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = `${supplierId}/${Date.now()}_${file.fieldname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-docs')
          .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (!uploadError) {
          const docType = file.fieldname.toUpperCase(); // Ensure this matches DB Enum exactly
          
          if (file.fieldname === 'cancelled_cheque') cancelledChequePath = uploadData.path;

          await supabase.from('supplier_documents').upsert({
            supplier_id: supplierId,
            document_type: docType,
            file_path: uploadData.path,
            updated_at: new Date()
          }, { onConflict: 'supplier_id, document_type' });
        }
      }
    }

    // 4. Update Financials (Explicit check to ensure update happens)
    const financialData = {
      supplier_id: supplierId,
      bank_account_no,
      ifsc_code,
      bank_name,
      ...(cancelledChequePath && { cancelled_cheque_file: cancelledChequePath })
    };

    const { error: finError } = await supabase
      .from('supplier_financials')
      .upsert(financialData, { onConflict: 'supplier_id' });

    if (finError) {
        console.error("❌ Financials Update Error:", finError.message);
        throw new Error("Failed to update bank details: " + finError.message);
    }

    // 5. Update Categories
    if (categories) {
      const catArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
      await supabase.from('supplier_categories').delete().eq('supplier_id', supplierId);
      if (catArray.length > 0) {
        const inserts = catArray.map(cat => ({ supplier_id: supplierId, category_name: cat }));
        await supabase.from('supplier_categories').insert(inserts);
      }
    }

    return res.status(200).json({ success: true, message: "Profile and Bank Details updated successfully!" });

  } catch (error) {
    console.error("❌ UPDATE FAILURE:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.getSupplierProfile = async (req, res) => {
  console.log("--- FETCHING SUPPLIER PROFILE ---");
  const userId = req.user.id; // From auth middleware

  try {
    // 1. Get basic supplier info
    const { data: supplier, error: sError } = await supabase
      .from('suppliers')
      .select(`
        *,
        supplier_financials (*),
        supplier_categories (category_name),
        supplier_documents (document_type, file_path)
      `)
      .eq('user_id', userId)
      .single();

    if (sError || !supplier) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // 2. Format the response for easier use in React
    const formattedProfile = {
      ...supplier,
    financials: supplier.supplier_financials || {},

      categories: supplier.supplier_categories.map(c => c.category_name),
      documents: supplier.supplier_documents
    };

    return res.status(200).json({ 
      success: true, 
      data: formattedProfile 
    });

  } catch (error) {
    console.error("❌ FETCH FAILURE:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};