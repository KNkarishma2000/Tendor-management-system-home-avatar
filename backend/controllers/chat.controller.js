const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');

// Helper for sending Email (Reusing your existing SMTP logic)
async function sendChatEmail(toEmail, subject, content) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        },
    });

    await transporter.sendMail({
        from: `"Support Team" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: subject,
        html: content
    });
}

// 1. User Starts a Query
exports.sendUserQuery = async (req, res) => {
    try {
        const { message } = req.body;
        
        // 1. Validate middleware user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "Authentication failed" });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
        const userEmail = req.user.email || '';
        let finalDisplayName = "User";

        // 2. Role-Based Data Fetching Logic
        if (userRole === 'ACCOUNTANT' || userRole === 'MC' || userRole === 'ADMIN') {
            // No extra table exists. Use email or a generic name.
            finalDisplayName = userEmail ? userEmail.split('@')[0] : userRole;
        } 
        else if (userRole === 'RESIDENT') {
            const { data: profile } = await supabase
                .from('residents')
                .select('full_name')
                .eq('user_id', userId)
                .single();
            finalDisplayName = profile?.full_name || userEmail.split('@')[0] || "Resident";
        } 
        else if (userRole === 'SUPPLIER') {
            const { data: profile } = await supabase
                .from('suppliers')
                .select('company_name')
                .eq('user_id', userId)
                .single();
            finalDisplayName = profile?.company_name || userEmail.split('@')[0] || "Supplier";
        }

        // 3. Insert message into chat_support
        const { error: dbError } = await supabase
            .from('chat_support')
            .insert([{ 
                user_id: userId, 
                sender_role: userRole, 
                message: message 
            }]);

        if (dbError) throw dbError;

        // 4. Send Email Notification to Admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const adminHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 15px;">
                    <h2 style="color: #fbbf24;">🛎️ New Support Request</h2>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>From:</strong> ${finalDisplayName}</p>
                        <p style="margin: 5px 0;"><strong>Role:</strong> <span style="background: #000; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${userRole}</span></p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
                    </div>
                    <div style="border-left: 4px solid #fbbf24; padding-left: 15px; margin: 20px 0;">
                        <p style="color: #1f2937; line-height: 1.6;">${message}</p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL}/admin/support" style="background-color: #fbbf24; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">View in Dashboard</a>
                    </div>
                </div>
            `;

            sendChatEmail(adminEmail, `[${userRole}] Message from ${finalDisplayName}`, adminHtml)
                .catch(e => console.error("Admin Notify Error:", e.message));
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Chat Controller Error:", error.message);
        res.status(500).json({ success: false, message: "Error processing your request" });
    }
};
// 2. Admin Replies to a Query
exports.adminReply = async (req, res) => {
    try {
        const { target_user_id, message } = req.body;

        // 1. Save Admin Message to DB
        const { error: dbError } = await supabase
            .from('chat_support')
            .insert([{ user_id: target_user_id, sender_role: 'ADMIN', message: message }]);

        if (dbError) throw dbError;

        // 2. Get User's Email safely
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', target_user_id)
            .single();

        // 3. Send Email only if user exists
        if (!userError && user?.email) {
            const userHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 15px;">
                    <h2 style="color: #2563eb;">✉️ Support Team Responded</h2>
                    <p>Hi <strong>${user.name || 'User'}</strong>,</p>
                    <p>Our support team has responded to your query:</p>
                    <div style="background-color: #f0f7ff; padding: 20px; border-radius: 10px; border-left: 4px solid #2563eb; margin: 20px 0;">
                        <p style="color: #1e3a8a; font-style: italic; line-height: 1.6;">"${message}"</p>
                    </div>
                    <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Reply</a>
                </div>
            `;
            
            // Use .catch to prevent email failure from crashing the request
            sendChatEmail(user.email, "Support Update", userHtml)
                .catch(e => console.error("Email delivery failed:", e.message));
        }

        res.status(200).json({ success: true, message: "Reply sent." });
    } catch (error) {
        console.error("Reply Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 4. Get List of all unique users who have messaged (Admin Only)
exports.getAdminInbox = async (req, res) => {
    try {
        // We select distinct user_ids from chat_support 
        // and join with the users table to get their details
        const { data, error } = await supabase
            .from('chat_support')
            .select(`
                user_id,
                users (
                    email,
                    role
                )
            `)
            // This is a trick to get unique users by grouping/filtering in JS 
            // since Supabase doesn't support 'DISTINCT ON' directly via the JS client easily
        
        if (error) throw error;

        // Filter for unique user_ids manually to ensure the inbox is clean
        const uniqueUsers = [];
        const seen = new Set();

        data.forEach(item => {
            if (!seen.has(item.user_id)) {
                seen.add(item.user_id);
                uniqueUsers.push({
                    user_id: item.user_id,
                    email: item.users?.email || 'Unknown',
                    role: item.users?.role || 'User'
                });
            }
        });

        res.status(200).json({ success: true, data: uniqueUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// 3. Get Chat History (Used by both Admin and User)
exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        
        const { data, error } = await supabase
            .from('chat_support')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};