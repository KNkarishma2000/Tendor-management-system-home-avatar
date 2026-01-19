const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

exports.registerResident = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      full_name, 
      block, 
      flat_no, 
      mobile_no, 
      family_members 
    } = req.body;

    // 1. Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 2. Insert into 'users' table
    // Note: is_active is false until Admin approves
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password_hash, 
        role: 'RESIDENT', 
        is_active: false, 
        is_verified: false 
      }])
      .select();

    if (userError) throw new Error(`User Account Error: ${userError.message}`);
    const userId = userData[0].id;

    // 3. Insert into 'residents' table
    const { data: residentData, error: residentError } = await supabase
      .from('residents')
      .insert([{ 
        user_id: userId,
        full_name, 
        block, 
        flat_no, 
        mobile_no, 
        family_members,
        status: 'PENDING' 
      }])
      .select();

    if (residentError) {
      // Rollback: delete user if resident profile fails
      await supabase.from('users').delete().eq('id', userId);
      throw new Error(`Resident Profile Error: ${residentError.message}`);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Please wait for Admin approval before logging in.",
      resident_id: residentData[0].id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.approveResident = async (req, res) => {
  try {
    const { resident_id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    // 1. Get the resident's user_id
    const { data: resident, error: fetchError } = await supabase
      .from('residents')
      .select('user_id')
      .eq('id', resident_id)
      .single();

    if (fetchError || !resident) throw new Error("Resident not found");

    if (action === 'APPROVE') {
      // Update Resident Status
      await supabase.from('residents').update({ status: 'APPROVED' }).eq('id', resident_id);
      // Activate User Account
      await supabase.from('users').update({ is_active: true }).eq('id', resident.user_id);
      
      return res.status(200).json({ success: true, message: "Resident approved and account activated." });
    } else {
      await supabase.from('residents').update({ status: 'REJECTED' }).eq('id', resident_id);
      return res.status(200).json({ success: true, message: "Resident registration rejected." });
    }

  } catch (error) {
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