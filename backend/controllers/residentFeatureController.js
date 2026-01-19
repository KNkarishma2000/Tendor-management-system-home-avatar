const supabase = require('../config/supabase');

// --- HELPER: Upload to Storage ---
const uploadBuffer = async (bucket, folder, file) => {
  const filePath = `${folder}/${Date.now()}_${file.originalname}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;
  return data.path; // Returns the storage path
};

// --- 1. RESIDENT: POST A BLOG (Multiple Images) ---
exports.createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files;

    // Get resident ID
    const { data: resident } = await supabase.from('residents').select('id').eq('user_id', req.user.id).single();
    if (!resident) throw new Error("Resident profile not found");

    // Handle File Uploads for Blog
    let uploadedImagePaths = [];
    if (files && files.length > 0) {
      for (const file of files) {
        // We use the 'resident-blogs' bucket
        const path = await uploadBuffer('resident-blogs', resident.id, file);
        uploadedImagePaths.push(path);
      }
    }

    const { error } = await supabase
      .from('resident_blogs')
      .insert([{ 
        resident_id: resident.id, 
        title, 
        content, 
        images: uploadedImagePaths, // Saves array of paths
        is_approved: false 
      }]);

    if (error) throw error;
    res.status(201).json({ success: true, message: "Blog submitted for approval!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. RESIDENT: LIST MARKETPLACE ITEM (Single Image) ---
// --- 2. RESIDENT: LIST MARKETPLACE ITEM (Single Image) ---
exports.listMarketplaceItem = async (req, res) => {
  try {
    // Added category and contact_no to the body destructuring
    const { item_name, description, price, category, contact_no } = req.body;
    const file = req.file; 

    // Get resident profile
    const { data: resident } = await supabase
      .from('residents')
      .select('id, mobile_no')
      .eq('user_id', req.user.id)
      .single();

    if (!resident) throw new Error("Resident profile not found");

    let itemImagePath = null;
    if (file) {
      itemImagePath = await uploadBuffer('marketplace-items', resident.id, file);
    }

    const { error } = await supabase
      .from('marketplace_items')
      .insert([{ 
        resident_id: resident.id, 
        item_name, 
        description, 
        price, 
        category: category || 'General', // Default to General if not provided
        contact_no: contact_no || resident.mobile_no, // Use provided no or profile no
        image_path: itemImagePath, 
        is_approved: false 
      }]);

    if (error) throw error;
    res.status(201).json({ success: true, message: "Listing submitted for approval!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 3. ADMIN: MODERATE CONTENT ---
exports.moderateContent = async (req, res) => {
  try {
    const { id, type, status } = req.body; // status is boolean (true for approve)
  // ADDED 'GALLERY' TO THE MAPPING
    const tableMap = {
      'BLOG': 'resident_blogs',
      'MARKETPLACE': 'marketplace_items',
      'GALLERY': 'resident_gallery'
    };

    const table = tableMap[type];
    if (!table) throw new Error("Invalid content type");

    const { error } = await supabase.from(table).update({ is_approved: status }).eq('id', id);
    if (error) throw error;

    res.status(200).json({ success: true, message: `${type} ${status ? 'Approved' : 'Rejected'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. VIEWING: APPROVED MARKETPLACE ---
exports.getMarketplaceFeed = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      // Ensure category and contact_no are selected
      .select(`*, residents (full_name, block, flat_no)`)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 5. VIEWING: APPROVED BLOGS ---
exports.getApprovedBlogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_blogs')
      .select(`*, residents (full_name, block, flat_no)`)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 6. ADMIN: GET ALL PENDING ---
exports.getPendingContent = async (req, res) => {
  try {
    const { data: blogs } = await supabase.from('resident_blogs').select('*, residents(full_name)').eq('is_approved', false);
    const { data: items } = await supabase.from('marketplace_items').select('*, residents(full_name)').eq('is_approved', false);

    res.status(200).json({ success: true, pending: { blogs, items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 7. RESIDENT: UPLOAD TO GALLERY (General Photos) ---
exports.uploadToGallery = async (req, res) => {
  try {
    const { caption } = req.body;
    const files = req.files;

    // Get resident ID from token
    const { data: resident } = await supabase
      .from('residents')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!resident) throw new Error("Resident profile not found");

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one photo" });
    }

    let uploadedGalleryPaths = [];
    for (const file of files) {
      // Using the 'resident-gallery' bucket as per your setup
      const path = await uploadBuffer('resident-gallery', resident.id, file);
      uploadedGalleryPaths.push(path);
    }

    // Since your schema for gallery might vary, we can store these in a 
    // new table or repurpose the blogs table if it's just 'Photos'
    // Assuming a 'resident_gallery' table exists:
    const { error } = await supabase
      .from('resident_gallery') 
      .insert(uploadedGalleryPaths.map(path => ({
        resident_id: resident.id,
        image_path: path,
        caption: caption || 'Community Photo',
        is_approved: false
      })));

    if (error) throw error;
    res.status(201).json({ success: true, message: "Photos uploaded and sent for Admin approval!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 8. VIEWING: APPROVED GALLERY PHOTOS ---
exports.getApprovedGallery = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_gallery')
      .select(`*, residents (full_name, block, flat_no)`)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};