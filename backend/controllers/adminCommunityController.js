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