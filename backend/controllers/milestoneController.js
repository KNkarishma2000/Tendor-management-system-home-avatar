const supabase = require('../config/supabase');

exports.createMilestones = async (req, res) => {
  try {
    const { tender_id, milestones } = req.body; // 'milestones' is an array of objects

    // Bulk insert into project_milestones table
    const milestoneData = milestones.map(m => ({
      tender_id,
      description: m.description,
      due_date: m.due_date,
      status: 'PENDING' // Default status
    }));

    const { data, error } = await supabase
      .from('project_milestones')
      .insert(milestoneData)
      .select();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: "Project milestones established successfully.",
      milestones: data 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};