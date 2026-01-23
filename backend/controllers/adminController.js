const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');

exports.approveSupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;
    const { status, remarks, admin_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({ success: false, message: "admin_id is required" });
    }

    const { data: supplierData, error: fetchErr } = await supabase
      .from('suppliers')
      .select('company_name, users(email)')
      .eq('id', supplier_id)
      .single();

    const { data, error } = await supabase.from('suppliers').update({ status }).eq('id', supplier_id).select();
    if (error) throw error;

    await supabase.from('supplier_verification_logs').insert([{
      supplier_id,
      admin_id,
      action: status,
      remarks,
      action_date: new Date()
    }]);

    await supabase.from('audit_logs').insert([{
      user_id: admin_id,
      action: `SUPPLIER_${status}`,
      entity_type: 'SUPPLIER',
      entity_id: supplier_id,
      ip_address: req.ip
    }]);

    if (!fetchErr && supplierData?.users?.email) {
      await sendSupplierStatusEmail(
        supplierData.users.email,
        `Supplier Application ${status}`,
        supplierData.company_name,
        status,
        remarks || "No additional remarks provided."
      );
    }

    res.status(200).json({ success: true, message: `Supplier ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllSuppliers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        id, 
        company_name, 
        status, 
        contact_person_name, 
        contact_phone, 
        created_at,
        users (email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSupplierDetails = async (req, res) => {
  try {
    const { supplier_id } = req.params;

    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        users (email),
        supplier_financials (*),
        supplier_documents (*),
        supplier_categories (category_name)
      `)
      .eq('id', supplier_id)
      .single();

    if (error) throw error;

    // --- UPDATED URL GENERATION LOGIC ---
    // Using the official .getPublicUrl helper for the 'supplier-docs' bucket
    if (data.supplier_documents) {
      data.supplier_documents = data.supplier_documents.map(doc => {
        const { data: urlData } = supabase.storage
          .from('supplier-docs')
          .getPublicUrl(doc.file_path);
          
        return {
          ...doc,
          download_url: urlData.publicUrl
        };
      });
    }

    // Map financial documents (Cancelled Cheque)
    if (data.supplier_financials?.[0]?.cancelled_cheque_file) {
      const { data: chequeUrlData } = supabase.storage
        .from('supplier-docs')
        .getPublicUrl(data.supplier_financials[0].cancelled_cheque_file);
        
      data.supplier_financials[0].cheque_url = chequeUrlData.publicUrl;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function sendSupplierStatusEmail(email, subject, companyName, status, remarks) {
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

  const isApproved = status === 'APPROVED' || status === 'approved';
  const color = isApproved ? '#10b981' : '#ef4444';

  const mailOptions = {
    from: `"Procurement Department" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 15px;">
        <h2 style="color: ${color};">${isApproved ? '✅ Partnership Approved' : '❌ Application Update'}</h2>
        <p>Dear <strong>${companyName}</strong>,</p>
        <p>Your application status has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid ${color}; margin: 20px 0;">
          <strong>Admin Remarks:</strong><br/>
          <p style="color: #4b5563;">${remarks}</p>
        </div>
        ${isApproved 
          ? '<p>Welcome to our network! You can now log in to the portal to view opportunities.</p>' 
          : '<p>Please address the remarks mentioned above and resubmit your details if necessary.</p>'}
        <div style="margin-top: 30px; text-align: center;">
          <a href="http://localhost:3000/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Portal</a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to supplier: ${email}`);
  } catch (err) {
    console.error("❌ Supplier Email Error:", err);
  }
}