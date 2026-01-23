const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');
// 1. Get all qualified bids to identify L1 (Lowest Bidder)
// backend/controllers/awardController.js

// backend/controllers/awardController.js

exports.getComparison = async (req, res) => {
  try {
    const { tender_id } = req.params;

    const { data, error } = await supabase
      .from('bids')
      .select(`
        id, status, submitted_at, supplier_id,
        suppliers ( company_name ),
        bid_financials ( total_amount, encrypted_file_path ),
        bid_technical_documents ( file_path ),
        bid_common_documents ( emd_proof_file )
      `)
      .eq('tender_id', tender_id);

    if (error) throw error;

    const bidsWithUrls = await Promise.all(data.map(async (bid) => {
      // Create a clean filename prefix (e.g., "SolarTech_Solutions")
      const safeName = bid.suppliers?.company_name?.replace(/\s+/g, '_') || 'Supplier';

      // 1. Technical Document Signed URL with Custom Filename
      const { data: tech } = await supabase.storage
        .from('technical-bids')
        .createSignedUrl(bid.bid_technical_documents[0]?.file_path, 3600, {
          download: `${safeName}_Technical_Proposal.pdf` // FORCES FILENAME ON DOWNLOAD
        });

      // 2. Financial Document Signed URL with Custom Filename
      const { data: fin } = await supabase.storage
        .from('financial-bids')
        .createSignedUrl(bid.bid_financials[0]?.encrypted_file_path, 3600, {
          download: `${safeName}_Financial_Bid.pdf`
        });

      return {
        ...bid,
        docs: {
          technicalUrl: tech?.signedUrl || null,
          financialUrl: fin?.signedUrl || null
        }
      };
    }));

    res.status(200).json({ success: true, qualified_bids: bidsWithUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 2. Award the Tender to the Winner
// backend/controllers/awardController.js
// backend/controllers/awardController.js
// backend/controllers/awardController.js

exports.awardTender = async (req, res) => {
  try {
    const { tender_id, winning_bid_id } = req.body;
    console.log("Processing award for Tender:", tender_id);

    // 1. Check for existing award to prevent double-awarding
    const { data: existingAward } = await supabase
      .from('tender_awards')
      .select('id')
      .eq('tender_id', tender_id)
      .maybeSingle();

    if (existingAward) {
      return res.status(400).json({ success: false, message: "Action Blocked: Already awarded." });
    }

    // 2. Fetch all bids with related details for the email
    const { data: allBids, error: bidError } = await supabase
      .from('bids')
      .select(`
        id, 
        supplier_id,
        suppliers ( company_name, users (email) ),
        tenders ( id, title, status ) 
      `)
      .eq('tender_id', tender_id);

    if (bidError) throw bidError;

    // 3. Match the winning bid
    const winningBid = allBids.find(b => 
      String(b.id).toLowerCase().trim() === String(winning_bid_id).toLowerCase().trim()
    );
    
    if (!winningBid) {
        return res.status(404).json({ success: false, message: "Winning bid ID not found." });
    }

    // 4. Update statuses in parallel 
    // Note: We use 'WON' here to match your getStatusConfig logic
    const updateResults = await Promise.all([
        supabase.from('bids').update({ status: 'WON' }).eq('id', winning_bid_id),
        supabase.from('bids').update({ status: 'LOST' }).eq('tender_id', tender_id).neq('id', winning_bid_id),
        supabase.from('tenders').update({ status: 'AWARDED' }).eq('id', tender_id)
    ]);

    // Check if any database updates failed
    if (updateResults.some(res => res.error)) {
        const firstError = updateResults.find(res => res.error).error;
        throw new Error(`Database Update Failed: ${firstError.message}`);
    }

    // 5. Create the official Award Record
    const { error: awardError } = await supabase.from('tender_awards').insert([{
      tender_id,
      bid_id: winning_bid_id,
      supplier_id: winningBid.supplier_id,
      award_date: new Date(),
    }]);

    if (awardError) throw awardError;

    // 6. TRIGGER EMAIL NOTIFICATION using your existing function
    if (winningBid.suppliers?.users?.email) {
        try {
            await sendBidStatusEmail(
                winningBid.suppliers.users.email,
                `Congratulations! Your Bid for ${winningBid.tenders.title} was Successful`,
                winningBid.suppliers.company_name,
                'WON',
                winningBid.tenders.title,
                tender_id // Using ID as Ref No.
            );
            console.log("Award email sent to:", winningBid.suppliers.users.email);
        } catch (mailErr) {
            console.error("Mail Delivery Failed:", mailErr);
            // We don't throw here so the user still gets a success response for the award
        }
    }

    res.status(200).json({ success: true, message: "Tender awarded successfully and winner notified." });

  } catch (error) {
    console.error("Award Error Details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/awardController.js

exports.finalizeAward = async (req, res) => {
  try {
    const { award_id } = req.params;
    const { admin_id } = req.body;
    
    if (!req.files || !req.files['loi_file'] || !req.files['contract_file']) {
      return res.status(400).json({ success: false, message: "Upload both files." });
    }

    // Fetch winner details before updating
    const { data: awardData } = await supabase
      .from('tender_awards')
      .select(`
        id,
        suppliers (company_name, users (email)),
        tender_id (tender_no, title)
      `)
      .eq('id', award_id)
      .single();

    const loiFile = req.files['loi_file'][0];
    const contractFile = req.files['contract_file'][0];

    const loiPath = `awards/${award_id}/loi_${Date.now()}.pdf`;
    const contractPath = `awards/${award_id}/contract_${Date.now()}.pdf`;

    await supabase.storage.from('contracts').upload(loiPath, loiFile.buffer);
    await supabase.storage.from('contracts').upload(contractPath, contractFile.buffer);

    const { error } = await supabase
      .from('tender_awards')
      .update({ loi_file: loiPath, contract_file: contractPath })
      .eq('id', award_id);

    if (error) throw error;

    // Send Notification
    if (awardData?.suppliers?.users?.email) {
       await sendFinalizationEmail(
         awardData.suppliers.users.email,
         awardData.suppliers.company_name,
         awardData.tender_id.tender_no
       );
    }

    res.status(200).json({ success: true, message: "Documents uploaded and supplier notified." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getTransporter = () => {
  return nodemailer.createTransport({
    // Connection settings MUST be at the top level
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for 587
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });
};
async function sendBidStatusEmail(email, subject, companyName, status, tenderTitle, tenderNo) {
  const transporter = getTransporter();
  const isWinner = status === 'WON';
  
  const mailOptions = {
    from: `"Tender Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: ${isWinner ? '#10b981' : '#6b7280'};">${isWinner ? 'Congratulations!' : 'Tender Status Update'}</h2>
        <p>Dear ${companyName},</p>
        <p>The evaluation for <strong>${tenderNo} - ${tenderTitle}</strong> has been completed.</p>
        <p>Your bid status: <strong style="color: ${isWinner ? '#10b981' : '#ef4444'};">${status}</strong></p>
        ${isWinner 
          ? '<p>Our team will contact you shortly regarding the LOI and Contract signing.</p>' 
          : '<p>Thank you for your participation. We encourage you to bid for future opportunities.</p>'}
      </div>
    `
  };
  return await transporter.sendMail(mailOptions);
}
async function sendFinalizationEmail(email, companyName, tenderNo) {
  const transporter = getTransporter(); // Use the helper function here too!
  const mailOptions = {
    from: `"Tender Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Action Required: Documents Uploaded for ${tenderNo}`,
    html: `<p>Dear ${companyName}, your Letter of Intent and Contract are now available for download in the portal.</p>`
  };
  await transporter.sendMail(mailOptions);
}

