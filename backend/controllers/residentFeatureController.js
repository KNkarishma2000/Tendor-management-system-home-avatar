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

    // 1. Fetch resident ID AND Status
    const { data: resident, error: resError } = await supabase
      .from('residents')
      .select('id, status') // Added status here
      .eq('user_id', req.user.id)
      .single();

    if (resError || !resident) return res.status(404).json({ success: false, message: "Resident profile not found" });

    // 2. BLOCK if not approved
    if (resident.status !== 'APPROVED') {
      return res.status(403).json({ 
        success: false, 
        message: "Action restricted. Your account is still pending admin approval." 
      });
    }

    // 3. Handle File Uploads (Only runs if approved)
    let uploadedImagePaths = [];
    if (files && files.length > 0) {
      for (const file of files) {
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
        images: uploadedImagePaths, 
        status: 'pending'
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
    const { item_name, description, price, category, contact_no } = req.body;
    const file = req.file;

    // 1. Fetch profile and Status
    const { data: resident, error: resError } = await supabase
      .from('residents')
      .select('id, status, mobile_no') // Added status here
      .eq('user_id', req.user.id)
      .single();

    if (resError || !resident) return res.status(404).json({ success: false, message: "Resident profile not found" });

    // 2. BLOCK if not approved
    if (resident.status !== 'APPROVED') {
      return res.status(403).json({ 
        success: false, 
        message: "You cannot list items for sale until your account is approved." 
      });
    }

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
        price: parseFloat(price),
        category: category || 'General',
        contact_no: contact_no || resident.mobile_no,
        image_path: itemImagePath, 
        status: 'pending'
      }]);

    if (error) throw error;
    res.status(201).json({ success: true, message: "Listing submitted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 3. ADMIN: MODERATE CONTENT ---
// --- 3. ADMIN: MODERATE CONTENT (Updated for String Status) ---
exports.moderateContent = async (req, res) => {
  try {
    const { id, type, status } = req.body; // status coming from frontend as true/false
    
    const tableMap = {
      'BLOG': 'resident_blogs',
      'MARKETPLACE': 'marketplace_items',
      'GALLERY': 'resident_gallery'
    };

    const table = tableMap[type];
    if (!table) throw new Error("Invalid content type");

    // Convert boolean from frontend to string for DB
    // true -> 'approved', false -> 'rejected'
    const statusString = status === true ? 'approved' : 'rejected';

    const { error } = await supabase
      .from(table)
      .update({ status: statusString }) 
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      message: `${type} has been ${statusString}` 
    });
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
      .eq('status', 'approved')
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
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate Signed URLs for each image in every blog
    for (let blog of data) {
      if (blog.images && blog.images.length > 0) {
        const signedImages = [];
        for (let path of blog.images) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('resident-blogs')
            .createSignedUrl(path, 3600); // Valid for 1 hour

          if (!urlError) {
            signedImages.push(urlData.signedUrl);
          }
        }
        // Replace the paths with actual viewable URLs
        blog.images = signedImages;
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- 6. ADMIN: GET ALL PENDING ---
// --- 6. ADMIN: GET ALL PENDING (Updated) ---
// --- 6. ADMIN: GET ALL PENDING (Fixed to include viewable URLs) ---
exports.getPendingContent = async (req, res) => {
  try {
    const { data: blogs } = await supabase.from('resident_blogs').select('*, residents(full_name)').order('created_at', { ascending: false });
    const { data: items } = await supabase.from('marketplace_items').select('*, residents(full_name)').order('created_at', { ascending: false });
    const { data: gallery } = await supabase.from('resident_gallery').select('*, residents(full_name)').order('created_at', { ascending: false });

    const formatData = (list, bucket) => list.map(item => ({
      ...item,
      status: item.status || 'pending', 
      image_path: item.image_path ? getPublicUrl(bucket, item.image_path) : null,
      images: item.images ? item.images.map(p => getPublicUrl(bucket, p)) : []
    }));

    res.status(200).json({ 
      success: true, 
      pending: { 
        blogs: formatData(blogs || [], 'resident-blogs'), 
        items: formatData(items || [], 'marketplace-items'), 
        gallery: formatData(gallery || [], 'resident-gallery') 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 7. RESIDENT: UPLOAD TO GALLERY (General Photos) ---
// --- 7. RESIDENT: UPLOAD TO GALLERY (Fixed) ---
exports.uploadToGallery = async (req, res) => {
  try {
    const { caption } = req.body;
    const files = req.files;

    // 1. Fetch profile and Status
    const { data: resident, error: resError } = await supabase
      .from('residents')
      .select('id, status') // Added status here
      .eq('user_id', req.user.id)
      .single();

    if (resError || !resident) return res.status(404).json({ success: false, message: "Resident profile not found" });

    // 2. BLOCK if not approved
    if (resident.status !== 'APPROVED') {
      return res.status(403).json({ 
        success: false, 
        message: "Gallery uploads are restricted for pending accounts." 
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one photo" });
    }

    let uploadedGalleryPaths = [];
    for (const file of files) {
      const path = await uploadBuffer('resident-gallery', resident.id, file);
      uploadedGalleryPaths.push(path);
    }

    const insertData = uploadedGalleryPaths.map(path => ({
      resident_id: resident.id,
      image_path: path,
      caption: caption || 'Community Photo',
      status: 'pending' 
    }));

    const { error } = await supabase.from('resident_gallery').insert(insertData);

    if (error) throw error;
    res.status(201).json({ success: true, message: "Photos sent for Admin approval!" });
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
// --- NEW: VIEW ALL BLOGS (For Feed with status badges) ---

// --- NEW: VIEW ALL BLOGS (With Signed URLs for Feed/Admin) ---
exports.getAllBlogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_blogs')
      .select(`*, residents (full_name, block, flat_no)`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate Signed URLs for images
    for (let blog of data) {
      if (blog.images && blog.images.length > 0) {
        const signedImages = [];
        for (let path of blog.images) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('resident-blogs')
            .createSignedUrl(path, 3600);

          if (!urlError) {
            signedImages.push(urlData.signedUrl);
          }
        }
        blog.images = signedImages;
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- HELPER: Get Public URL ---
const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// --- 1. RESIDENT VIEW: ALL GALLERY (All Statuses) ---
exports.getResidentGallery = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_gallery')
      .select(`*, residents (full_name, block, flat_no)`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(photo => ({
      ...photo,
      status: photo.status || 'pending',
      image_path: getPublicUrl('resident-gallery', photo.image_path)
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 2. PUBLIC VIEW: ONLY APPROVED GALLERY ---
exports.getPublicMarketplace = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`*, residents (full_name, block, flat_no)`)
      .eq('status', 'approved') // Only approved
      .order('created_at', { ascending: false });

    if (error) throw error;
    const formatted = data.map(item => ({
      ...item,
      image_path: item.image_path ? getPublicUrl('marketplace-items', item.image_path) : null
    }));
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicGallery = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resident_gallery')
      .select(`*, residents (full_name, block, flat_no)`)
      .eq('status', 'approved') // Only approved
      .order('created_at', { ascending: false });

    if (error) throw error;
    const formatted = data.map(photo => ({
      ...photo,
      image_path: getPublicUrl('resident-gallery', photo.image_path)
    }));
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- RESIDENT VIEW: ALL MARKETPLACE (All Statuses) ---
exports.getResidentMarketplaceFeed = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`*, residents (full_name, block, flat_no)`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = data.map(item => ({
      ...item,
      // Uses string status directly from DB ('pending', 'approved', 'rejected')
      status: item.status || 'pending', 
      image_path: item.image_path ? getPublicUrl('marketplace-items', item.image_path) : null
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- NEW: GET SINGLE BLOG DETAILS ---
exports.getBlogDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: blog, error } = await supabase
      .from('resident_blogs')
      .select(`*, residents (full_name, block, flat_no)`)
      .eq('id', id)
      .single();

    if (error || !blog) {
      return res.status(404).json({ success: false, message: "Blog story not found" });
    }

    // Generate Signed URLs for the images so they can be viewed
    if (blog.images && blog.images.length > 0) {
      const signedImages = [];
      for (let path of blog.images) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from('resident-blogs')
          .createSignedUrl(path, 3600); // URL valid for 1 hour

        if (!urlError) {
          signedImages.push(urlData.signedUrl);
        }
      }
      blog.images = signedImages;
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};