// backend/controllers/authController.js
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
// 1. REGISTER USER
// backend/controllers/authController.js

// backend/controllers/authController.js

exports.register = async (req, res) => {
  try {
    // 1. Destructure all possible fields from the request body
    const { 
      email, password, role, otp,
      // Resident specific fields
      full_name, block, flat_no, mobile_no, family_members,
      // Supplier specific fields (Extended for Admin use)
      company_name, registered_address, contact_person_name, contact_phone,
      pan, gstin, cin, bank_account_no, ifsc_code, bank_name, categories
    } = req.body;

    // 2. Identify if this is an Admin creating the user
    const isAdminAction = req.user && req.user.role === 'ADMIN';

    // 3. Security: Only Admins can create staff roles
    const staffRoles = ['ACCOUNTANT', 'MC', 'ADMIN'];
    if (staffRoles.includes(role) && !isAdminAction) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Only administrators can create staff or MC accounts." 
      });
    }

    // 4. OTP Verification (Skipped for Admins)
    if (!isAdminAction && (role === 'RESIDENT' || role === 'SUPPLIER')) {
      if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

      const { data: verifyData, error: verifyError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .single();

      if (verifyError || !verifyData || new Date() > new Date(verifyData.expires_at)) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      }
    }

    // 5. Hash Password & Create User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
          email: email.toLowerCase().trim(), 
          password_hash: passwordHash, 
          role: role || 'RESIDENT', 
          is_active: true, 
          is_verified: true 
      }])
      .select();

    if (userError) {
      if (userError.code === '23505') return res.status(400).json({ success: false, message: "Email already exists." });
      throw userError;
    }

    const userId = userData[0].id;
    let profileError = null;

    // 6. Branching Logic for Profile Tables
   if (role === 'RESIDENT' || role === 'MC') { 
  const { error } = await supabase.from('residents').insert([{ 
    user_id: userId, 
    full_name, 
    block, 
    flat_no, 
    mobile_no, 
    family_members: parseInt(family_members) || 1,
    // MC members created by Admin should be APPROVED by default
    status: (role === 'MC' || isAdminAction) ? 'APPROVED' : 'PENDING'
  }]);
  profileError = error;
}
    else if (role === 'SUPPLIER') {
      // Step A: Create Supplier Profile
      const { data: supplierData, error: sError } = await supabase
        .from('suppliers')
        .insert([{ 
          user_id: userId, 
          company_name, 
          contact_person_name, 
          contact_phone, 
          registered_address,
          pan,
          gstin,
          cin,
          status: isAdminAction ? 'APPROVED' : 'PENDING'
        }])
        .select();

      if (sError) {
        profileError = sError;
      } else {
        const supplierId = supplierData[0].id;

        // Step B: Insert Financials (Bank Info)
        if (bank_account_no) {
          await supabase.from('supplier_financials').insert([{
            supplier_id: supplierId,
            bank_account_no,
            ifsc_code,
            bank_name
          }]);
        }

        // Step C: Handle Categories (if provided)
        if (categories && Array.isArray(categories)) {
          const catInserts = categories.map(cat => ({ supplier_id: supplierId, category_name: cat }));
          await supabase.from('supplier_categories').insert(catInserts);
        }
      }
    }

    // 7. Rollback User if Profile creation fails
    if (profileError) {
      await supabase.from('users').delete().eq('id', userId);
      return res.status(500).json({ success: false, message: `Profile creation failed: ${profileError.message}` });
    }

    // 8. Cleanup OTP for non-admin registrations
    if (!isAdminAction && (role === 'RESIDENT' || role === 'SUPPLIER')) {
      await supabase.from('email_verifications').delete().eq('email', email);
    }

    res.status(201).json({
      success: true,
      message: isAdminAction 
        ? `${role} account and profile created successfully by Admin.` 
        : "Registration successful! Please wait for Admin approval."
    });

  } catch (error) {
    console.error("Registration Error:", error.message);
    res.status(500).json({ success: false, message: "An internal error occurred." });
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
    let profileData = {
      status: 'PENDING',
      display_name: 'User',
      profile_id: null
    };

    // --- STEP 1: FIND THE USER & FETCH ROLE-SPECIFIC STATUS ---
    if (flat_no) {
      // 🏠 RESIDENT LOGIN LOGIC
      const { data: resident, error: resError } = await supabase
        .from('residents')
        .select('id, status, full_name, user_id, users (*)')
        .eq('flat_no', flat_no)
        .single();

      if (resError || !resident) {
        return res.status(401).json({ success: false, message: "Invalid Flat Number" });
      }

      user = resident.users;
      profileData = {
        status: resident.status, // Fetched from residents table
        display_name: resident.full_name,
        profile_id: resident.id
      };
    } else if (email) {
      // 📧 EMAIL LOGIN LOGIC (Admin, Supplier, Accountant)
      const { data: userData, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (emailError || !userData) {
        return res.status(401).json({ success: false, message: "Invalid Email" });
      }
      user = userData;

      // If user is a SUPPLIER, we must fetch their status from the suppliers table
      if (user.role === 'SUPPLIER') {
        const { data: supplier } = await supabase
          .from('suppliers')
          .select('id, status, company_name')
          .eq('user_id', user.id)
          .single();

        if (supplier) {
          profileData = {
            status: supplier.status, // Fetched from suppliers table
            display_name: supplier.company_name,
            profile_id: supplier.id
          };
        }
      } else {
        // Admins and other staff are usually auto-approved
        profileData = {
          status: 'APPROVED',
          display_name: 'Administrator',
          profile_id: null
        };
      }
    } else {
      return res.status(400).json({ success: false, message: "Provide Email or Flat Number" });
    }

    // --- STEP 2: VERIFY PASSWORD ---
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    // Log login attempt
    await supabase.from('login_attempts').insert([{
      email: email || `FLAT_${flat_no}`,
      ip_address,
      success: isMatch,
      attempt_time: new Date()
    }]);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Password" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account is deactivated." });
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
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'Strict' 
    });
    
    // --- STEP 5: SUCCESS RESPONSE ---
    // Returning the 'status' from the profile table ensures the UI shows 'PENDING' or 'APPROVED'
    res.status(200).json({ 
      success: true, 
      accessToken, 
      user: { 
        id: user.id, 
        role: user.role,
        email: user.email,
        status: profileData.status, // LIVE STATUS FROM TABLE
        display_name: profileData.display_name,
        profile_id: profileData.profile_id,
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


// --- HELPER: Send OTP via Gmail ---
async function sendGmailOTP(email, otp, type = "Registration") {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    from: `"Avatar Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${type} Verification Code`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
        <h2 style="color: #4CAF50;">Verify Your Email</h2>
        <p>Use the following One-Time Password (OTP) to complete your ${type.toLowerCase()}:</p>
        <h1 style="text-align: center; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// --- 1. SEND OTP (Call this first from Frontend) ---
exports.sendSupplierOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Upsert OTP into verification table
    const { error } = await supabase
      .from('email_verifications')
      .upsert([{ email, otp, expires_at: expiresAt }], { onConflict: 'email' });

    if (error) throw error;

    await sendGmailOTP(email, otp, "Supplier Registration");

    res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. FULL REGISTER SUPPLIER (With OTP Check & File Upload) ---
// --- FULL REGISTER SUPPLIER (With OTP Check & Multi-Table Save) ---
exports.registerSupplier = async (req, res) => {
  console.log("--- STARTING FULL SUPPLIER REGISTRATION ---");
  console.log("Files received:", req.files ? req.files.length : "NONE");

  try {
    const { 
      email, password, otp, company_name, registered_address, 
      pan, gstin, cin, contact_person_name, contact_phone, 
      bank_account_no, ifsc_code, bank_name, categories 
    } = req.body;

    // A. Verify OTP
    const { data: verifyData, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single();

    if (verifyError || !verifyData) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (new Date() > new Date(verifyData.expires_at)) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // B. Step 1: Create User Account
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
          email, 
          password_hash, 
          role: 'SUPPLIER', 
          is_active: true, 
          is_verified: true 
      }])
      .select();

    if (userError) throw new Error(`User Table Failure: ${userError.message}`);
    const userId = userData[0].id;
    console.log("✅ Step 1: User created:", userId);

    // C. Step 2: Create Supplier Profile
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

    if (supplierError) {
      // Rollback user if supplier creation fails
      await supabase.from('users').delete().eq('id', userId);
      throw new Error(`Supplier Table Failure: ${supplierError.message}`);
    }
    const supplierId = supplierData[0].id;
    console.log("✅ Step 2: Supplier profile created:", supplierId);

    // D. Step 3: Handle File Uploads & Document Registry
    let cancelledChequePath = null;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = `${supplierId}/${Date.now()}_${file.fieldname}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('supplier-docs') 
          .upload(filePath, file.buffer, { contentType: file.mimetype });

        if (uploadError) {
          console.error(`❌ Upload failed for ${file.fieldname}:`, uploadError.message);
          continue;
        }

        // Track the path for the financials table later
        if (file.fieldname === 'cancelled_cheque') {
          cancelledChequePath = uploadData.path;
        }

        // Add entry to supplier_documents table
        const { error: docError } = await supabase.from('supplier_documents').insert([{
          supplier_id: supplierId,
          document_type: file.fieldname.toUpperCase(),
          file_path: uploadData.path
        }]);
        
        if (docError) console.error("❌ Document Record Error:", docError.message);
      }
      console.log("✅ Step 3: Files processed");
    }

    // E. Step 4: Insert Financials (Critical for Payments)
    const { error: finError } = await supabase
      .from('supplier_financials')
      .insert([{
        supplier_id: supplierId,
        bank_account_no, 
        ifsc_code,
        bank_name,
        cancelled_cheque_file: cancelledChequePath
      }]);

    if (finError) {
        console.error("❌ Step 4: Financials Table Error:", finError.message);
        // We don't throw here to prevent full failure, but log it clearly
    } else {
        console.log("✅ Step 4: Financials saved");
    }

    // F. Step 5: Handle Categories (Multi-select)
    if (categories) {
      try {
        const catArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
        if (Array.isArray(catArray) && catArray.length > 0) {
          const inserts = catArray.map(cat => ({ 
              supplier_id: supplierId, 
              category_name: cat 
          }));
          const { error: catError } = await supabase.from('supplier_categories').insert(inserts);
          if (catError) console.error("❌ Step 5: Category Insert Error:", catError.message);
          else console.log("✅ Step 5: Categories saved");
        }
      } catch (parseError) {
        console.error("❌ Category Parsing Error:", parseError.message);
      }
    }

    // G. Final Step: Cleanup OTP
    await supabase.from('email_verifications').delete().eq('email', email);
    console.log("✅ Registration Complete for:", email);

    res.status(201).json({ 
        success: true, 
        message: "Verified Supplier Registered! Please wait for admin approval." 
    });

  } catch (error) {
    console.error("❌ CRITICAL REGISTRATION FAILURE:", error.message);
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
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1. Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Security: Don't reveal if email exists or not, but for now we return success
      return res.status(200).json({ success: true, message: "If account exists, OTP sent." });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // 3. Save OTP to Database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        reset_otp: otp, 
        reset_otp_expires: expiresAt.toISOString() 
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // 4. Send Email via OneSignal
   await sendGmailOTP(email, otp);

    res.status(200).json({ success: true, message: `OTP sent to ${email}` });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. RESET PASSWORD (Verify OTP & Update)
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Validate Input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and New Password are required" });
    }

    // 2. Fetch User and OTP details
    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_otp, reset_otp_expires')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: "Invalid Request" });
    }

    // 3. Verify OTP
    const currentTime = new Date();
    const expiryTime = new Date(user.reset_otp_expires);

    if (user.reset_otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (currentTime > expiryTime) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // 4. Hash New Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 5. Update Password & Clear OTP
    const { error: saveError } = await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
        reset_otp: null,
        reset_otp_expires: null
      })
      .eq('id', user.id);

    if (saveError) throw saveError;

    res.status(200).json({ success: true, message: "Password reset successfully. Please login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// HELPER: Send Email via OneSignal API
// ==========================================
async function sendGmailOTP(email, otp) {
  const transporter = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     secure: false, // Use TLS
     auth: {
       type: 'OAuth2',
       user: process.env.EMAIL_USER,
       clientId: process.env.GMAIL_CLIENT_ID,
       clientSecret: process.env.GMAIL_CLIENT_SECRET,
       refreshToken: process.env.GMAIL_REFRESH_TOKEN,
     },
   });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password - OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p style="font-size: 1.2em;">Your OTP is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
        <hr />
        <p style="font-size: 0.8em; color: #888;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Gmail Sent successfully");
  } catch (error) {
    console.error("❌ Gmail API Error:", error);
    throw new Error("Failed to send OTP email via Gmail");
  }
}