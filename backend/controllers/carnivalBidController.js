const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');
// --- 1. SUBMIT CARNIVAL BID ---
// --- 1. SUBMIT CARNIVAL BID (With Strict Deadline Enforcement) ---
// --- 1. SUBMIT CARNIVAL BID (Updated with Auth Integration) ---
exports.submitCarnivalBid = async (req, res) => {
  try {
    const { carnival_id, bid_amount, proposal_description } = req.body;
    const user_id = req.user.id;

    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .select('id, company_name, users(email)')
      .eq('user_id', user_id)
      .single();

    if (supErr || !supplier) {
      return res.status(403).json({ success: false, message: "Supplier profile not found." });
    }

    const supplier_id = supplier.id;

    const { data: carnival, error: carError } = await supabase
      .from('carnivals')
      .select('event_title, event_date, bid_deadline')
      .eq('id', carnival_id)
      .single();

    const now = new Date();
    const deadline = new Date(carnival.bid_deadline);
    if (now > deadline) {
      return res.status(403).json({ success: false, message: `Bidding closed.` });
    }

    const files = req.files;
    if (!files || !files.technical_doc || !files.financial_doc) {
      return res.status(400).json({ success: false, message: "Documents are required." });
    }

    const techPath = `carnivals/${carnival_id}/sup_${supplier_id}_tech.pdf`;
    const finPath = `carnivals/${carnival_id}/sup_${supplier_id}_fin.pdf`;

    // UPDATED: Added contentType to ensure it loads as a PDF, not raw text
    await supabase.storage.from('carnival-docs').upload(techPath, files.technical_doc[0].buffer, { 
      upsert: true,
      contentType: 'application/pdf' 
    });
    await supabase.storage.from('carnival-docs').upload(finPath, files.financial_doc[0].buffer, { 
      upsert: true,
      contentType: 'application/pdf'
    });

    const { error: insertErr } = await supabase.from('carnival_bids').insert([{
      carnival_id,
      supplier_id,
      bid_amount,
      proposal_description,
      technical_doc_path: techPath,
      financial_doc_path: finPath,
      status: 'PENDING'
    }]);

    if (insertErr) throw insertErr;

    if (supplier?.users?.email) {
      await sendCarnivalSubmissionEmail(supplier.users.email, supplier.company_name, carnival.event_title);
    }

    res.status(201).json({ success: true, message: "Bid submitted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 2. GET MY CARNIVAL BID STATUS ---
// --- 2. GET MY CARNIVAL BID STATUS (FIXED) ---
exports.getMyCarnivalBidStatus = async (req, res) => {
  try {
    const { carnival_id } = req.params;
    const user_id = req.user.id;

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, company_name')
      .eq('user_id', user_id)
      .single();

    if (!supplier) return res.status(200).json({ success: true, bid: null });

    const { data: bid, error } = await supabase
      .from('carnival_bids')
      .select('*')
      .eq('carnival_id', carnival_id)
      .eq('supplier_id', supplier.id)
      .maybeSingle();

    if (error) throw error;
    if (!bid) return res.status(200).json({ success: true, bid: null });

    const companyName = supplier.company_name.replace(/\s+/g, '_');

    const getSignedUrl = async (path, type) => {
      if (!path) return null;
      const { data, error: urlError } = await supabase.storage
        .from('carnival-docs')
        .createSignedUrl(path, 3600, {
          download: `${companyName}_${type}.pdf`
        });
      return data?.signedUrl;
    };

    const urls = {
      technical: await getSignedUrl(bid.technical_doc_path, 'Technical'),
      financial: await getSignedUrl(bid.financial_doc_path, 'Financial')
    };

    res.status(200).json({ 
      success: true, 
      bid: bid,
      downloadUrls: urls
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- 3. ADMIN: APPROVE/REJECT BID ---
exports.updateCarnivalBidStatus = async (req, res) => {
  try {
    const { bid_id, status } = req.body; 

    // Update and Fetch related data for the email
    const { data: bid, error } = await supabase
      .from('carnival_bids')
      .update({ status })
      .eq('id', bid_id)
      .select(`
        status,
        carnivals (event_title),
        suppliers (company_name, users (email))
      `)
      .single();

    if (error) throw error;

    // CALL THE EMAIL FUNCTION
    if (bid?.suppliers?.users?.email) {
      await sendCarnivalStatusEmail(
        bid.suppliers.users.email,
        bid.suppliers.company_name,
        bid.carnivals.event_title,
        status
      );
    }

    res.status(200).json({ success: true, message: `Bid ${status} and supplier notified.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- GET ALL ACTIVE CARNIVALS (For Public/Supplier Website) ---
// --- GET ALL ACTIVE CARNIVALS ---
exports.getActiveCarnivals = async (req, res) => {
  try {
    const now = new Date().toISOString(); // Get current time in ISO format
    
    const { data, error } = await supabase
      .from('carnivals')
      .select('*') 
      // Only fetch carnivals where the current time is BEFORE the bid_deadline
      .gt('bid_deadline', now) 
      .order('event_date', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- ADMIN: GET CARNIVAL WITH ALL BIDS ---
// Update to your existing controller function
exports.getCarnivalBidsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: carnival, error } = await supabase
      .from('carnivals')
      .select(`*, carnival_bids (*, suppliers (*, users (email)))`)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Generate signed URLs with custom download filenames
    const bidsWithUrls = await Promise.all(carnival.carnival_bids.map(async (bid) => {
      const companyName = bid.suppliers.company_name.replace(/\s+/g, '_'); // Clean name for filename
      
      const { data: tech } = await supabase.storage
        .from('carnival-docs')
        .createSignedUrl(bid.technical_doc_path, 3600, {
          download: `${companyName}_Technical_Doc.pdf` // Forces proper filename
        });

      const { data: fin } = await supabase.storage
        .from('carnival-docs')
        .createSignedUrl(bid.financial_doc_path, 3600, {
          download: `${companyName}_Financial_Doc.pdf` // Forces proper filename
        });

      return { ...bid, techUrl: tech?.signedUrl, finUrl: fin?.signedUrl };
    }));

    res.status(200).json({ 
      success: true, 
      data: { ...carnival, carnival_bids: bidsWithUrls } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
async function sendCarnivalSubmissionEmail(email, companyName, carnivalTitle) {
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
    from: `"Carnival Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Bid Submitted: ${carnivalTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2563eb;">Bid Received</h2>
        <p>Dear ${companyName},</p>
        <p>Your bid for the carnival <strong>${carnivalTitle}</strong> has been successfully submitted.</p>
        <p>Current Status: <strong>PENDING</strong></p>
        <p>Our admin team will review your documents soon.</p>
      </div>`
  };
  await transporter.sendMail(mailOptions);
}

async function sendCarnivalStatusEmail(email, companyName, carnivalTitle, status) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  const isApproved = status === 'APPROVED';
  const mailOptions = {
    from: `"Carnival Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Update on Carnival Bid: ${carnivalTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">${isApproved ? 'Bid Approved!' : 'Bid Update'}</h2>
        <p>Dear ${companyName},</p>
        <p>The review for your bid on <strong>${carnivalTitle}</strong> is complete.</p>
        <p>Status: <strong>${status}</strong></p>
        ${isApproved 
          ? '<p>Congratulations! Log in to the portal to see stall allocation.</p>' 
          : '<p>Unfortunately, your bid was not selected for this event.</p>'}
      </div>`
  };
  await transporter.sendMail(mailOptions);
}