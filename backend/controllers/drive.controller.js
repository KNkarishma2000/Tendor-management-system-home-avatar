const { google } = require('googleapis');
const axios = require('axios'); // <--- ADD THIS LINE
const supabase = require('../config/supabase');
// Initialize the OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Ensure this matches your Google Console Redirect URI
);

// Set the permanent refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const searchDriveFiles = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    // 'q' is the query string for Google Drive
    // name contains: searches the filename
    // trashed = false: ignores deleted files
    const query = searchTerm 
      ? `name contains '${searchTerm}' and trashed = false` 
      : "trashed = false";

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink, mimeType, modifiedTime, size)',
      pageSize: 20,
      orderBy: 'modifiedTime desc'
    });

    res.status(200).json({
      success: true,
      data: response.data.files
    });
  } catch (error) {
    console.error('Google Drive API Error:', error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch files from Google Drive",
      error: error.message
    });
  }
};
// inside drive.controller.js

const processAttendanceSync = async (req, res) => {
  try {
    const { mth_name, MTH, hk, hk_name, mvp, mvp_name } = req.body;

    // A. Forward to n8n and wait for the response
    const n8nResponse = await axios.post('https://n8n.srv1267492.hstgr.cloud/webhook/ae643028-2690-46f4-84b5-8ac6f0d6df6f', {
      mth_name,
      MTH,
      hk,
      hk_name,
      mvp,
      mvp_name
    }, { 
      timeout: 0 // Wait as long as needed
    });

    // B. Get the result from n8n
    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;

    // Log this to your terminal so you can see exactly what n8n sent
    console.log("Data received from n8n:", result);

    // C. Check if we got the URLs (mth is the main one we expect based on your JSON)
    if (!result || !result.mth) {
      throw new Error("n8n finished but the expected URLs (mth) were missing from the response.");
    }

    // D. Store in Supabase
    // Note: We use the URLs from n8n for spreadsheet_id and hk_id columns
    const { data, error } = await supabase
      .from('attendance_sync')
      .insert([{
        filename: mth_name,
        file_url: MTH,
        hk_name: hk_name,
        hk_url: hk,
        mvp_name: mvp_name,
        mvp_url: mvp,
        // We store the FULL URL returned by n8n into these columns
        spreadsheet_id: result.mth,  
        hk_id: result.hkdm,          
        mvp_file_id: result.mep,     
        status: 'PROCESSED'
      }])
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Sync complete! Links saved for the accountant.",
      data: data[0]
    });

  } catch (error) {
    console.error('Sync Error:', error.message);
    res.status(500).json({
      success: false,
      message: "Backend failed to process n8n response",
      error: error.message
    });
  }
};

const getAttendanceHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance_sync')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Add this to your existing drive.controller.js
const processRawDataToExcel = async (req, res) => {
  try {
    // Destructure the names used by the Frontend
    const { filename, neft_file, pos_file, mygate_file } = req.body;

    if (!filename || !neft_file || !pos_file || !mygate_file) {
      return res.status(400).json({ success: false, message: "Missing required files" });
    }

    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/a3da1ea4-d113-4d3b-87bc-a96a1cf3629d';
    
    // Send data to n8n with the EXACT keys you requested
    const n8nResponse = await axios.post(n8nUrl, {
      "filename": filename,
      "neft file": neft_file, // Key with space
      "pos file": pos_file,   // Key with space
      "mygate": mygate_file   // Key changed from mygate_file to mygate
    }, { timeout: 0 });

    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;
    const finalExcelLink = result.excel_link || result.output_url || Object.values(result)[0];

    if (!finalExcelLink) {
      throw new Error("n8n did not return a valid Excel link.");
    }

    // Save to Supabase using your standard DB column names
    const { data, error } = await supabase
      .from('raw_data_exports')
      .insert([{
        filename: filename,
        neft_url: neft_file,
        pos_url: pos_file,
        mygate_url: mygate_file,
        output_excel_url: finalExcelLink,
        status: 'COMPLETED'
      }])
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, data: data[0] });

  } catch (error) {
    console.error('Raw Data Sync Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add a history fetcher for the Raw Data table
const getRawDataHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('raw_data_exports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const processInvoiceExtraction = async (req, res) => {
  try {
    const { folder_name, folder_url } = req.body;

    if (!folder_name || !folder_url) {
      return res.status(400).json({ success: false, message: "Folder name and link are required" });
    }

    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/f844e506-030a-425c-b92e-1dc7fcc3b419';

    // A. Forward to n8n
    const n8nResponse = await axios.post(n8nUrl, {
      "filename": folder_name,
      "filelink": folder_url 
    }, { timeout: 0 });

    // Ensure we have data
    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;
    
    // Safety check: if result is null or undefined, finalLink will fail
    if (!result) {
        throw new Error("n8n returned an empty response.");
    }

    const finalLink = result.final_link || result.output_url || (Object.values(result).length > 0 ? Object.values(result)[0] : null);

    if (!finalLink) {
        throw new Error("Could not find a download link in n8n response.");
    }

    // B. Store in Supabase
    const { data, error } = await supabase
      .from('invoice_extractions')
      .insert([{
        folder_name: folder_name,
        folder_url: folder_url,
        extracted_output_url: finalLink,
        status: 'COMPLETED'
      }])
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data: data[0] });

  } catch (error) {
    // This will now print the EXACT reason in your terminal
    console.error('Invoice Extraction Error:', error.response?.data || error.message);
    res.status(500).json({ 
        success: false, 
        error: "Failed to process invoices",
        details: error.message 
    });
  }
};

// ADD THIS MISSING FUNCTION
const getInvoiceHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoice_extractions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const processReconciliation = async (req, res) => {
  try {
    const { excel_sheet, start_date, end_date, phase1, phase2 } = req.body;

    // YOUR RECONCILIATION WEBHOOK
    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/5913f8ca-e09c-457a-842a-78035ba46b34';

    // A. Forward to n8n with the EXACT JSON structure you provided
    const n8nResponse = await axios.post(n8nUrl, {
      "excel sheet": excel_sheet,
      "Date": start_date,
      "end date": end_date,
      "Elementorphase1": phase1,
      "Elementorphase2": phase2
    }, { timeout: 0 });

    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;

    // B. Store result in Supabase (Using the URLs for record keeping)
    const { data, error } = await supabase
      .from('reconciliation_syncs')
      .insert([{
        main_excel_url: excel_sheet,
        start_date: start_date,
        end_date: end_date,
        phase1_url: phase1,
        phase2_url: phase2,
        reconciliation_sheet_url: result.Reconcilation_sheet, // Ensure these match n8n output keys
        elemensor_final_sheet_url: result.Elemensorfinal_sheet,
        status: 'PROCESSED'
      }])
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data: data[0] });

  } catch (error) {
    console.error('Reconciliation Error:', error.message);
    res.status(500).json({ success: false, error: "Reconciliation sync failed" });
  }
};

// Also add a history fetcher
const getReconciliationHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reconciliation_syncs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const processBankSync = async (req, res) => {

  try {

    const { bank_statement, zoho_link, pos_1709, pos_1708, upi_transactions } = req.body;



    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/3f05839c-b60e-468c-9f42-95629f4b97e7';



    // A. Forward to n8n with the EXACT keys required

    const n8nResponse = await axios.post(n8nUrl, {

      "bank statement": bank_statement,

      "zoho link": zoho_link,

      "POS Link": pos_1709,

      "pos 1708 link": pos_1708,

      "upi-transactions": upi_transactions

    }, { timeout: 0 });



    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;



    // B. Store in Supabase

    const { data, error } = await supabase

      .from('bank_syncs')

      .insert([{

        bank_url: bank_statement,

        zoho_url: zoho_link,

        pos_1709_url: pos_1709,

        pos_1708_url: pos_1708,

        upi_url: upi_transactions,

        output_url: result.output_url || result.final_link || Object.values(result)[0],

        status: 'COMPLETED'

      }])

      .select();



    if (error) throw error;

    res.status(200).json({ success: true, data: data[0] });



  } catch (error) {

    console.error('Bank Sync Error:', error.message);

    res.status(500).json({ success: false, error: "Bank Sync failed" });

  }

};



const getBankHistory = async (req, res) => {

  try {

    const { data, error } = await supabase

      .from('bank_syncs')

      .select('*')

      .order('created_at', { ascending: false });



    if (error) throw error;

    res.status(200).json({ success: true, data });

  } catch (error) {

    res.status(500).json({ success: false, error: error.message });

  }

};
// DON'T FORGET TO EXPORT THEM
const processZohoVsElemensor = async (req, res) => {
  try {
    // 1. Destructure based on your required JSON keys
    const { 
      filename, 
      elemensor_file, 
      sep_file, 
      zoho_balance_sheet, 
      start_date, // from frontend
      end_date    // from frontend
    } = req.body;

    // 2. Create the record in Supabase
    const { data: record, error: dbError } = await supabase
      .from('zoho_elemensor_syncs')
      .insert([{
        filename,
        elemensor_url: elemensor_file,
        sep_url: sep_file,
        zoho_url: zoho_balance_sheet,
        start_date, // Store these for history
        end_date,
        status: 'PROCESSING'
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Trigger n8n with EXACT keys from your sample
    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/230f20ac-49c7-4cda-9bd1-272fe6c493dd';
    
    axios.post(n8nUrl, {
      "file name": filename,
      "elemensor file": elemensor_file,
      "sep file": sep_file,
      "zoho-balance sheet": zoho_balance_sheet,
      "start Date": start_date, // Matches your JSON key (space + Capital D)
      "end_date": end_date,     // Matches your JSON key (underscore)
      "db_record_id": record.id 
    }).catch(err => console.error("n8n Background Error:", err.message));

    res.status(200).json({ 
      success: true, 
      message: "Sync started. Process takes ~30 mins.",
      data: record 
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const getZohoVsElemensorHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('zoho_elemensor_syncs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const processUpdatedAttendance = async (req, res) => {
  try {
    const { 
      MTH, hk, mvp, security, Jll, 
      mth_name, hk_name, mvp_name, security_name, jll 
    } = req.body;

    // A. Forward to n8n Webhook
    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/cde55c8b-bf23-4dc1-ac35-43c988e4eccd';
    
    const n8nResponse = await axios.post(n8nUrl, {
      MTH,
      hk,
      mvp,
      security,
      Jll,
      mth_name,
      hk_name,
      mvp_name,
      security_name,
      jll // Note: frontend sends "jll" lowercase for the name as per your JSON
    }, { timeout: 0 });

    // B. Parse the response (Array handling)
    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;

    if (!result) {
      throw new Error("n8n returned an empty response.");
    }

    // C. Store in Supabase
    // table name: updated_attendance_sync (Make sure this table exists)
    const { data, error } = await supabase
      .from('updated_attendance_sync')
      .insert([{
        mth_name,
        hk_name,
        mvp_name,
        security_name,
        jll_name: jll,
        // The output links from n8n
        mth_output_url: result.mth,
        hk_output_url: result.hkdm,
        mvp_output_url: result.mep,
        security_output_url: result.security,
        jll_output_url: result.Jll,
        status: 'COMPLETED'
      }])
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Updated Attendance Sync complete!",
      data: data[0]
    });

  } catch (error) {
    console.error('Updated Attendance Error:', error.message);
    res.status(500).json({
      success: false,
      message: "Failed to process updated attendance",
      error: error.message
    });
  }
};

const getUpdatedAttendanceHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('updated_attendance_sync')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Add to module.exports...
// Update your module exports at the bottom of drive.controller.js
module.exports = { 
  getUpdatedAttendanceHistory,
  processUpdatedAttendance,
  searchDriveFiles, 
  processAttendanceSync, 
  getAttendanceHistory,
  processRawDataToExcel, // <--- ADD THIS
  getRawDataHistory,
  processInvoiceExtraction,
  getInvoiceHistory,
   processReconciliation,
  getReconciliationHistory,
  processBankSync,

   getBankHistory,
   getZohoVsElemensorHistory,
   processZohoVsElemensor
      // <--- ADD THIS
};
