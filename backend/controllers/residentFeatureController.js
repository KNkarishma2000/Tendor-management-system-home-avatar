const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');
// --- HELPER: Upload to Storage ---
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
  return data.path;
};

// --- HELPER: Get Public URL ---
const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// --- 1. POST A BLOG (Admin & Resident) ---
exports.createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const files = req.files;
    const isAdmin = req.user.role === 'ADMIN';

    let residentId = null;
    let status = 'pending';

    if (isAdmin) {
      status = 'approved'; // Admin posts are live instantly
    } else {
      const { data: resident, error: resError } = await supabase
        .from('residents')
        .select('id, status')
        .eq('user_id', req.user.id)
        .single();

      if (resError || !resident) return res.status(404).json({ success: false, message: "Resident profile not found" });
      if (resident.status !== 'APPROVED') return res.status(403).json({ success: false, message: "Account pending approval." });
      
      residentId = resident.id;
    }

    let uploadedImagePaths = [];
    if (files && files.length > 0) {
      for (const file of files) {
        // Use user_id as folder name for admin if residentId is null
        const folder = residentId || `admin_${req.user.id}`;
        const path = await uploadBuffer('resident-blogs', folder, file);
        uploadedImagePaths.push(path);
      }
    }

    const { error } = await supabase
      .from('resident_blogs')
      .insert([{ 
        resident_id: residentId, 
        title, 
        content, 
        images: uploadedImagePaths, 
        status: status 
      }]);

    if (error) throw error;
    res.status(201).json({ 
      success: true, 
      message: isAdmin ? "Blog published as Admin!" : "Blog submitted for approval!" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 2. LIST MARKETPLACE ITEM (Admin & Resident) ---
exports.listMarketplaceItem = async (req, res) => {
  try {
    const { item_name, description, price, category, contact_no } = req.body;
    const file = req.file;
    const isAdmin = req.user.role === 'ADMIN';

    let residentId = null;
    let status = isAdmin ? 'approved' : 'pending';
    let finalContact = contact_no;

    if (!isAdmin) {
      const { data: resident, error: resError } = await supabase
        .from('residents')
        .select('id, status, mobile_no')
        .eq('user_id', req.user.id)
        .single();

      if (resError || !resident) return res.status(404).json({ success: false, message: "Resident profile not found" });
      if (resident.status !== 'APPROVED') return res.status(403).json({ success: false, message: "Approval required." });
      
      residentId = resident.id;
      finalContact = contact_no || resident.mobile_no;
    }

    let itemImagePath = null;
    if (file) {
      itemImagePath = await uploadBuffer('marketplace-items', residentId || 'admin', file);
    }

    const { error } = await supabase
      .from('marketplace_items')
      .insert([{ 
        resident_id: residentId, 
        item_name, 
        description, 
        price: parseFloat(price),
        category: category || 'General',
        contact_no: finalContact || 'Admin Office',
        image_path: itemImagePath, 
        status: status
      }]);

    if (error) throw error;
    res.status(201).json({ success: true, message: isAdmin ? "Item listed by Admin!" : "Listing submitted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 3. UPLOAD TO GALLERY (Admin & Resident) ---
exports.uploadToGallery = async (req, res) => {
  try {
    const { caption } = req.body;
    const files = req.files;
    const isAdmin = req.user.role === 'ADMIN';

    let residentId = null;
    let status = isAdmin ? 'approved' : 'pending';

    if (!isAdmin) {
      const { data: resident } = await supabase.from('residents').select('id, status').eq('user_id', req.user.id).single();
      if (!resident || resident.status !== 'APPROVED') return res.status(403).json({ success: false, message: "Unauthorized" });
      residentId = resident.id;
    }

    if (!files || files.length === 0) throw new Error("Upload photos first");

    let insertData = [];
    for (const file of files) {
      const path = await uploadBuffer('resident-gallery', residentId || 'admin', file);
      insertData.push({
        resident_id: residentId,
        image_path: path,
        caption: caption || (isAdmin ? 'Admin Upload' : 'Community Photo'),
        status: status
      });
    }

    const { error } = await supabase.from('resident_gallery').insert(insertData);
    if (error) throw error;
    res.status(201).json({ success: true, message: isAdmin ? "Gallery updated!" : "Photos sent for approval!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- 4. ADMIN MODERATION (Same as before) ---
exports.moderateContent = async (req, res) => {
  try {
    const { id, type, status } = req.body; 
    const tableMap = { 'BLOG': 'resident_blogs', 'MARKETPLACE': 'marketplace_items', 'GALLERY': 'resident_gallery' };
    const table = tableMap[type];
    
    if (!table) throw new Error("Invalid content type");
    const statusString = status === true ? 'approved' : 'rejected';

    const { error: updateError } = await supabase.from(table).update({ status: statusString }).eq('id', id);
    if (updateError) throw updateError;

    // Fetch user email to notify (Only if it wasn't an admin post)
    const { data: content } = await supabase
      .from(table)
      .select(`resident_id, title, item_name, caption, residents(full_name, users(email))`)
      .eq('id', id)
      .single();

    if (content?.residents?.users?.email) {
        const title = content.title || content.item_name || content.caption || "Community Post";
        await sendStatusEmail(content.residents.users.email, `Post ${statusString}`, content.residents.full_name, statusString.toUpperCase(), type);
    }

    res.status(200).json({ success: true, message: `Content ${statusString} successfully.` });
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
// --- 6. ADMIN: GET ALL PENDING (Fixed to include Resident Details) ---
exports.getPendingContent = async (req, res) => {
  try {
    // Select the fields your frontend needs: full_name, block, flat_no
    const { data: blogs } = await supabase
      .from('resident_blogs')
      .select('*, residents(full_name, block, flat_no)')
      .order('created_at', { ascending: false });

    const { data: items } = await supabase
      .from('marketplace_items')
      .select('*, residents(full_name, block, flat_no)')
      .order('created_at', { ascending: false });

    const { data: gallery } = await supabase
      .from('resident_gallery')
      .select('*, residents(full_name, block, flat_no)')
      .order('created_at', { ascending: false });

    const formatData = (list, bucket) => list.map(item => ({
      ...item,
      status: item.status || 'pending', 
      // Mapping the nested Supabase object to the flat keys your frontend uses
      resident_name: item.residents?.full_name || 'Admin/Unknown',
      block: item.residents?.block || 'N/A',
      flat_no: item.residents?.flat_no || 'N/A',
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
// --- ADD THIS TO: community.controller.js ---

// --- 9. RESIDENT: GET MY SUBMISSIONS (Blogs, Marketplace, Gallery) ---
exports.getMySubmissions = async (req, res) => {
  try {
    // 1. Get Resident ID from the logged-in user
    const { data: resident, error: resError } = await supabase
      .from('residents')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (resError || !resident) {
      return res.status(404).json({ success: false, message: "Resident profile not found" });
    }

    // 2. Fetch specific data for this resident
    const { data: blogs } = await supabase
      .from('resident_blogs')
      .select('*')
      .eq('resident_id', resident.id)
      .order('created_at', { ascending: false });

    const { data: items } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('resident_id', resident.id)
      .order('created_at', { ascending: false });

    const { data: gallery } = await supabase
      .from('resident_gallery')
      .select('*')
      .eq('resident_id', resident.id)
      .order('created_at', { ascending: false });

    // 3. Helper to Sign URLs (For Blogs - Private Bucket)
    const signImages = async (list, bucket) => {
      for (let item of list) {
        if (item.images && item.images.length > 0) {
          const signedImages = [];
          for (let path of item.images) {
            const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
            if (data) signedImages.push(data.signedUrl);
          }
          item.images = signedImages;
        }
      }
      return list;
    };

    // 4. Helper for Public URLs (For Marketplace/Gallery - Public Buckets)
    const formatPublicData = (list, bucket) => list.map(item => ({
      ...item,
      image_path: item.image_path ? getPublicUrl(bucket, item.image_path) : null
    }));

    // Process the images
    const processedBlogs = await signImages(blogs || [], 'resident-blogs');
    const processedItems = formatPublicData(items || [], 'marketplace-items');
    const processedGallery = formatPublicData(gallery || [], 'resident-gallery');

    res.status(200).json({ 
      success: true, 
      data: {
        blogs: processedBlogs,
        marketplace: processedItems,
        gallery: processedGallery
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
async function sendStatusEmail(email, subject, title, status, type) {
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

  const mailOptions = {
    from: `"Community Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
        <h2 style="color: ${color};">${isApproved ? '🎉 Content Approved!' : '❌ Content Update'}</h2>
        <p>Hello,</p>
        <p>Your <strong>${type}</strong> submission: "<em>${title}</em>" has been <strong>${status}</strong> by the admin.</p>
        ${isApproved 
          ? '<p>It is now live on the community feed for everyone to see!</p>' 
          : '<p>Unfortunately, your submission did not meet our community guidelines and was rejected.</p>'}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #888;">This is an automated notification from your Resident Portal.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
// --- HELPER: Delete from Storage ---
const deleteFromStorage = async (bucket, paths) => {
  if (!paths || paths.length === 0) return;
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const { error } = await supabase.storage.from(bucket).remove(pathArray);
  if (error) console.error(`Storage deletion error [${bucket}]:`, error.message);
};
// --- DELETE CONTENT (Admin & Owner) ---
exports.deleteContent = async (req, res) => {
  try {
    const { id, type } = req.body; // type: 'BLOG', 'MARKETPLACE', 'GALLERY'
    const isAdmin = req.user.role === 'ADMIN';

    const tableMap = { 
      'BLOG': { table: 'resident_blogs', bucket: 'resident-blogs' }, 
      'MARKETPLACE': { table: 'marketplace_items', bucket: 'marketplace-items' }, 
      'GALLERY': { table: 'resident_gallery', bucket: 'resident-gallery' } 
    };

    const config = tableMap[type];
    if (!config) return res.status(400).json({ success: false, message: "Invalid content type" });

    // 1. Fetch the item to check ownership and get image paths
    const { data: item, error: fetchError } = await supabase
      .from(config.table)
      .select('*, residents(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !item) return res.status(404).json({ success: false, message: "Item not found" });

    // 2. Security Check: Admin or Owner?
    const isOwner = item.residents?.user_id === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this." });
    }

    // 3. Delete Files from Supabase Storage
    if (type === 'BLOG' && item.images) {
      await deleteFromStorage(config.bucket, item.images);
    } else if (item.image_path) {
      await deleteFromStorage(config.bucket, item.image_path);
    }

    // 4. Delete Record from Database
    const { error: deleteError } = await supabase
      .from(config.table)
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({ 
      success: true, 
      message: `${type.toLowerCase()} deleted successfully.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};