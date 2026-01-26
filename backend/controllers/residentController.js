const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
// --- Validation Helper ---
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.registerResident = async (req, res) => {
  try {
    const { 
      email, password, full_name, block, flat_no, 
      mobile_no, family_members, otp 
    } = req.body;

    // 1. Basic Email Format Validation
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    // 2. VERIFY OTP FIRST
    const { data: verifyData, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single();

    if (verifyError || !verifyData) {
      return res.status(400).json({ success: false, message: "Invalid or missing OTP. Please verify your email." });
    }

    if (new Date() > new Date(verifyData.expires_at)) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // 3. Check if user already exists (Safety check)
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: "This email is already registered." });
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 5. Transaction: Create User
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password_hash, 
        role: 'RESIDENT', 
        is_active: false, 
        is_verified: true // Set to true because they verified via OTP
      }])
      .select();

    if (userError) throw userError;
    const userId = userData[0].id;

    // 6. Create Resident Profile
    const { error: residentError } = await supabase
      .from('residents')
      .insert([{ 
        user_id: userId, 
        full_name, 
        block, 
        flat_no, 
        mobile_no, 
        family_members: parseInt(family_members) || 1, 
        status: 'PENDING' 
      }]);

    if (residentError) {
      await supabase.from('users').delete().eq('id', userId); // Rollback user
      throw residentError;
    }

    // 7. Cleanup: Delete OTP after successful use
    await supabase.from('email_verifications').delete().eq('email', email);

    res.status(201).json({
      success: true,
      message: "Registration successful! Please wait for Admin approval."
    });

  } catch (error) {
    console.error("🔥 Resident Registration Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.sendResidentOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Check if email is already in use
  const { data: user, error: userError } = await supabase
  .from('users')
  .select('id')
  .eq('email', email)
  .maybeSingle(); // Use maybeSingle to avoid erroring on 0 results

if (user) return res.status(400).json({ message: "Email already exists" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store OTP in your email_verifications table
    const { error } = await supabase
      .from('email_verifications')
      .upsert([{ email, otp, expires_at: expiresAt }], { onConflict: 'email' });

    if (error) throw error;

    // Reuse your existing sendGmailOTP helper
    await sendGmailOTP(email, otp, "Resident Registration");

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
async function sendGmailOTP(email, otp, type) {
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
    from: `"Community Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Verification Code: ${otp}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
        <h2 style="color: #fbbf24;">Verify Your Email</h2>
        <p>Hello,</p>
        <p>Your OTP for <strong>${type}</strong> is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 10px;">
          ${otp}
        </div>
        <p>This code will expire in 15 minutes. Please do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">Resident Management System</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}
exports.approveResident = async (req, res) => {
  try {
    const { resident_id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    // 1. Get the resident's user_id and email
    // Note: Ensure the relationship 'users' is correctly set in Supabase for this join to work
    const { data: resident, error: fetchError } = await supabase
      .from('residents')
      .select('full_name, user_id, users (email)')
      .eq('id', resident_id)
      .single();

    if (fetchError || !resident) throw new Error("Resident not found");

    const userEmail = resident.users.email;
    const fullName = resident.full_name;

    if (action === 'APPROVE') {
      // Update DB
      await supabase.from('residents').update({ status: 'APPROVED' }).eq('id', resident_id);
      await supabase.from('users').update({ is_active: true }).eq('id', resident.user_id);
      
      // ✅ TRIGGER EMAIL (Awaited)
      await sendStatusEmail(
        userEmail, 
        "Welcome to the Community! Account Approved", 
        fullName, // Pass the name as the 'title'
        "APPROVED", 
        "Account"
      );

      return res.status(200).json({ success: true, message: "Resident approved and email sent." });
    } else {
      await supabase.from('residents').update({ status: 'REJECTED' }).eq('id', resident_id);
      
      // ✅ TRIGGER EMAIL (Awaited)
      await sendStatusEmail(userEmail, "Account Registration Update", fullName, "REJECTED", "Account");
      
      return res.status(200).json({ success: true, message: "Resident rejected and email sent." });
    }
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAllResidents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('residents')
      .select(`
        *,
        users (email, is_active) 
      `) // This also pulls the email and active status from the Users table
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Fetch ONLY Pending residents (For Quick Approvals)
exports.getPendingResidents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('residents')
      .select('*')
      .eq('status', 'PENDING');

    if (error) throw error;
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteResident = async (req, res) => {
  try {
    const { resident_id } = req.params;

    // 1. Find the User ID
    const { data: resident, error: fetchError } = await supabase
      .from('residents')
      .select('user_id')
      .eq('id', resident_id)
      .single();

    if (fetchError || !resident) {
      return res.status(404).json({ success: false, message: "Resident profile not found" });
    }

    console.log(`🧹 Starting Sequential Cleanup for: ${resident_id}`);

    // 2. CHILD TABLES CLEANUP (Must finish before proceeding)
    // We do these one by one to ensure the DB locks are released correctly
    
    console.log("-> Deleting Blogs...");
    await supabase.from('resident_blogs').delete().eq('resident_id', resident_id);
    
    console.log("-> Deleting Marketplace...");
    await supabase.from('marketplace_items').delete().eq('resident_id', resident_id);
    
    console.log("-> Deleting Gallery...");
    await supabase.from('resident_gallery').delete().eq('resident_id', resident_id);

    // 3. DELETE RESIDENT PROFILE 
    // Now that children are gone, this will be fast and successful
    console.log("-> Deleting Resident Profile...");
    const { error: deleteResError } = await supabase
      .from('residents')
      .delete()
      .eq('id', resident_id);

    if (deleteResError) throw new Error(`Profile Deletion Failed: ${deleteResError.message}`);

    // 4. DELETE USER ACCOUNT
    console.log("-> Deleting User Account...");
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', resident.user_id);

    if (deleteUserError) throw new Error(`User Account Deletion Failed: ${deleteUserError.message}`);

    console.log("✅ Cleanup Complete");
    res.status(200).json({ 
      success: true, 
      message: "Resident and all associated content deleted successfully." 
    });

  } catch (error) {
    console.error("❌ Critical Delete Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Replace your old sendGmailOTP with this flexible version
async function sendStatusEmail(email, subject, title, status, type) {
  // 1. Create transporter with OAuth2 (Same as your OTP function)
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

  const isApproved = status === 'APPROVED';
  const color = isApproved ? '#10b981' : '#ef4444';

  // 2. Build dynamic content
  let extraContent = '';
  if (isApproved && type === "Account") {
    extraContent = `
      <div style="background-color: #fefce8; padding: 15px; border-radius: 10px; margin-top: 15px; border: 1px solid #fef08a;">
        <p style="margin: 0; font-weight: bold; color: #854d0e;">🚀 What you can do now:</p>
        <ul style="color: #854d0e; margin-top: 5px;">
          <li><strong>Marketplace:</strong> You can now list and sell items.</li>
          <li><strong>Blogs:</strong> Share your stories and news with the community.</li>
          <li><strong>Gallery:</strong> Upload photos to the community gallery.</li>
        </ul>
      </div>
    `;
  } else if (isApproved) {
    extraContent = `<p>It is now live on the community feed for everyone to see!</p>`;
  } else {
    extraContent = `<p>Unfortunately, your submission was not approved at this time. Please contact the administrator for more details.</p>`;
  }

  const mailOptions = {
    from: `"Community Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 20px; color: #333;">
        <h2 style="color: ${color}; margin-top: 0;">${isApproved ? '🎉 Congratulations!' : '❌ Update on Submission'}</h2>
        <p style="font-size: 16px;">Hello ${title},</p>
        <p style="font-size: 16px; line-height: 1.5;">
          Your <strong>${type}</strong> request has been <strong>${status}</strong> by the Admin.
        </p>
        
        ${extraContent}

        <div style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:3000/login" style="background-color: #fbbf24; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: bold;">Login to Dashboard</a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 0.8em; color: #888; text-align: center;">This is an automated notification from your Resident Management System.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Status Email (${status}) sent to: ${email}`);
  } catch (error) {
    console.error("❌ Email Delivery Error:", error);
    // We don't necessarily want to crash the whole request if email fails, 
    // but we should log it.
  }
}