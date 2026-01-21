// backend/controllers/authController.js
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. REGISTER USER
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert into Supabase 'users' table
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password_hash: passwordHash, 
          role: role || 'SUPPLIER', // Default to Supplier
          is_active: true,
          is_verified: false
        }
      ])
      .select();

    if (error) {
        if (error.code === '23505') return res.status(400).json({ message: "Email already exists" });
        throw error;
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: data[0].id, email: data[0].email, role: data[0].role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. LOGIN USER
// 2. UNIFIED LOGIN (Handles Email or Flat No)
// 2. UNIFIED LOGIN (Handles Email or Flat No)
exports.login = async (req, res) => {
  const { email, flat_no, password } = req.body;
  const ip_address = req.ip || req.headers['x-forwarded-for'];
  const device_info = req.headers['user-agent'];

  try {
    let user = null;
    let residentProfile = null;

    // --- STEP 1: FIND THE USER ---
    if (flat_no) {
      // Logic for RESIDENTS: Find via residents table using flat_no
      const { data: resident, error: resError } = await supabase
        .from('residents')
        .select('status, user_id, users (*)')
        .eq('flat_no', flat_no)
        .single();

      if (resError || !resident) {
        return res.status(401).json({ message: "Invalid Flat Number" });
      }

      if (resident.status !== 'APPROVED') {
        return res.status(403).json({ message: "Resident account pending admin approval." });
      }

      user = resident.users;
      residentProfile = resident;
    } else if (email) {
      // Logic for ADMIN/SUPPLIER/ACCOUNTANT: Find via email
      const { data, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (emailError || !data) {
        return res.status(401).json({ message: "Invalid Email" });
      }
      user = data;
    } else {
      return res.status(400).json({ message: "Please provide Email or Flat Number" });
    }

    // --- STEP 2: VERIFY PASSWORD ---
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    await supabase.from('login_attempts').insert([{
      email: email || `FLAT_${flat_no}`,
      ip_address,
      success: isMatch,
      attempt_time: new Date()
    }]);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "User account is deactivated." });
    }

    // --- NEW: FETCH SUPPLIER DATA IF USER IS A SUPPLIER ---
    let supplier_id = null;
    let company_name = null;

    if (user.role === 'SUPPLIER') {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, company_name')
        .eq('user_id', user.id)
        .single();

      if (supplier) {
        supplier_id = supplier.id;
        company_name = supplier.company_name;
      }
    }

    // --- STEP 3: GENERATE TOKENS ---
    const accessToken = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id }, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: '30d' }
    );

    // --- STEP 4: MANAGE SESSION ---
    await supabase.from('sessions').insert([{
      user_id: user.id,
      refresh_token_hash: refreshToken,
      ip_address,
      device_info,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }]);

    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'Strict' 
    });
    
    // --- STEP 5: SUCCESS RESPONSE (With Supplier Info) ---
    res.status(200).json({ 
      success: true, 
      accessToken, 
      user: { 
        id: user.id, 
        supplier_id: supplier_id, // This is what your Bid table needs
        email: user.email, 
        role: user.role,
        company_name: company_name,
        flat_no: flat_no || null 
      } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// ... existing register and login code ...

// 3. UNIFIED SUPPLIER REGISTRATION (User + Profile)
exports.registerSupplier = async (req, res) => {
  try {
    const { 
        email, 
        password, 
        company_name, 
        registered_address, 
        pan, 
        gstin, 
        contact_person_name, 
        contact_phone 
    } = req.body;

    // 1. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Insert into 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
          email, 
          password_hash: passwordHash, 
          role: 'SUPPLIER',
          is_active: true,
          is_verified: false 
      }])
      .select();

    if (userError) {
        if (userError.code === '23505') return res.status(400).json({ message: "Email already exists" });
        throw userError;
    }

    const newUserId = userData[0].id;

    // 3. Insert into 'suppliers' table
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert([{ 
          user_id: newUserId,
          company_name,
          registered_address,
          pan,
          gstin,
          contact_person_name,
          contact_phone,
          status: 'PENDING' 
      }])
      .select();

    if (supplierError) throw supplierError;

    res.status(201).json({
      success: true,
      message: "Supplier account created successfully. Awaiting Admin Approval.",
      data: {
        user_id: newUserId,
        supplier_id: supplierData[0].id,
        company: supplierData[0].company_name
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Check if token exists in sessions table
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token_hash', refreshToken)
      .single();

    if (!session) return res.status(401).json({ message: "Invalid session" });

    // Generate new Access Token
    const accessToken = jwt.sign(
      { id: decoded.id, role: session.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: "Token expired or invalid" });
  }
};
// 4. LOGOUT (Clear Session & Cookie)
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // 1. Delete the session from Supabase database
    if (refreshToken) {
      await supabase
        .from('sessions')
        .delete()
        .eq('refresh_token_hash', refreshToken);
    }

    // 2. Clear the cookie from the browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.residentLogin = async (req, res) => {
  try {
    const { flat_no, password } = req.body;

    // 1. Find resident by Flat No
    const { data: resident, error: resError } = await supabase
      .from('residents')
      .select('user_id, status, users(password_hash, role)')
      .eq('flat_no', flat_no)
      .single();

    if (resError || !resident) return res.status(401).json({ message: "Invalid Flat Number" });

    // 2. Check if Approved
    if (resident.status !== 'APPROVED') {
      return res.status(403).json({ message: "Your account is pending admin approval." });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, resident.users.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid Password" });

    // 4. Generate Token (standard JWT logic)
    const token = jwt.sign({ id: resident.user_id, role: resident.users.role }, process.env.JWT_SECRET);

    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};