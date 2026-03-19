const supabase = require('../config/supabase');

// Create a Carnival Event
exports.createCarnival = async (req, res) => {
  try {
    const { 
      event_title, 
      event_date, 
      bid_deadline, // New field for bid submission deadline
      total_stalls, 
      base_stall_price, 
      extra_stall_price 
    } = req.body;

    const { data, error } = await supabase
      .from('carnivals')
      .insert([{ 
        event_title, 
        event_date, 
        bid_deadline, // Mapping to the new 'bid_deadline' column
        total_stalls, 
        base_stall_price, 
        extra_stall_price 
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, message: "Carnival created successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a Notice/Alert
exports.createNotice = async (req, res) => {
  try {
    const { title, notice_type, display_date, content } = req.body;
    const { data, error } = await supabase
      .from('notices')
      .insert([{ title, 
        notice_type: notice_type.toUpperCase(), display_date, content }])
      .select();

    if (error) throw error;
    res.status(201).json({ success: true, message: "Notice published", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all Carnivals (Sorted by upcoming date)
exports.getAllCarnivals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carnivals')
      .select('*') // This will now fetch 'bid_deadline' along with other columns
      .order('event_date', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all Notices (Sorted by most recent)
exports.getAllNotices = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('display_date', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- DELETE Notice ---
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- DELETE Carnival ---
exports.deleteCarnival = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Carnival ID is required" });
    }

    // Attempt to delete from the 'carnivals' table
    const { data, error } = await supabase
      .from('carnivals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      message: "Carnival deleted successfully" 
    });
  } catch (error) {
    console.error("Delete Carnival Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
exports.getHomeDashboard = async (req, res) => {
  try {
    // 1. Fetch data from Supabase
    // Using individual awaits or wrap in try/catch to see exactly which one fails
    const { data: notices, error: nErr } = await supabase.from('notices').select('*').order('display_date', { ascending: false }).limit(4);
    const { data: blogs, error: bErr } = await supabase.from('resident_blogs').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(3);
    const { data: carnivals, error: cErr } = await supabase.from('carnivals').select('*').order('event_date', { ascending: true }).limit(3);
    const { data: gallery, error: gErr } = await supabase.from('resident_gallery').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
    const { data: marketplace, error: mErr } = await supabase.from('marketplace_items').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(3);

    // Check for critical table errors
    if (nErr || bErr || cErr || gErr || mErr) {
      console.error("Supabase Error:", { nErr, bErr, cErr, gErr, mErr });
    }

    // 2. Internal Helper to generate the URL (avoids "undefined" errors)
    const buildUrl = (bucket, path) => {
      if (!path) return null;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || null;
    };

    // 3. Safely Map Data
    const formattedGallery = (gallery || []).map(item => ({
      ...item,
      image_path: buildUrl('resident-gallery', item.image_path)
    }));

    const formattedMarketplace = (marketplace || []).map(item => ({
      ...item,
      image_path: buildUrl('marketplace-items', item.image_path)
    }));

    const formattedBlogs = (blogs || []).map(blog => ({
      ...blog,
      // If blog.images is a string (Postgres array), handle it safely
      images: Array.isArray(blog.images) 
        ? blog.images.map(path => buildUrl('resident-blogs', path)) 
        : []
    }));

    // 4. Send Response
    res.status(200).json({
      success: true,
      data: {
        notices: notices || [],
        blogs: formattedBlogs,
        carnivals: carnivals || [],
        gallery: formattedGallery,
        marketplace: formattedMarketplace
      }
    });

  } catch (error) {
    console.error("Dashboard Crash:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};
