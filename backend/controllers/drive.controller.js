const { google } = require('googleapis');
const axios = require('axios'); // <--- ADD THIS LINE
const supabase = require('../config/supabase');
// Initialize the OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Ensure this matches your Google Console Redirect URI
);

// Set the permanent refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
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
  let initialRecordId = null;
  try {
    const { filename, neft_file, pos_file, mygate_file } = req.body;

    if (!filename || !neft_file || !pos_file || !mygate_file) {
      return res.status(400).json({ success: false, message: "Missing required files" });
    }

    // 1. IMMEDIATELY create a record in Supabase with status 'PROCESSING'
    // This ensures that even if the user refreshes or leaves the page, the "Busy" state is saved.
    const { data: initialData, error: initialError } = await supabase
      .from('raw_data_exports')
      .insert([{
        filename: filename,
        neft_url: neft_file,
        pos_url: pos_file,
        mygate_url: mygate_file,
        status: 'PROCESSING' // Set status to processing immediately
      }])
      .select()
      .single();

    if (initialError) throw initialError;
    initialRecordId = initialData.id;

    // 2. Trigger the n8n Webhook
    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/a3da1ea4-d113-4d3b-87bc-a96a1cf3629d';
    
    const n8nResponse = await axios.post(n8nUrl, {
      "filename": filename,
      "neft file": neft_file,
      "pos file": pos_file,
      "mygate": mygate_file
    }, { timeout: 0 }); // timeout: 0 allows the request to stay open as long as needed

    // 3. Parse n8n Result
    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;
    const finalExcelLink = result.excel_link || result.output_url || Object.values(result)[0];

    if (!finalExcelLink) {
      throw new Error("n8n did not return a valid Excel link.");
    }

    // 4. UPDATE the existing record to 'COMPLETED' with the link
    const { data: finalData, error: updateError } = await supabase
      .from('raw_data_exports')
      .update({
        output_excel_url: finalExcelLink,
        status: 'COMPLETED'
      })
      .eq('id', initialRecordId)
      .select();

    if (updateError) throw updateError;

    res.status(200).json({ success: true, data: finalData[0] });

  } catch (error) {
    console.error('Raw Data Sync Error:', error.message);
    
    // Optional: If we created a record but then it failed, mark it as FAILED in DB
    if (initialRecordId) {
      await supabase
        .from('raw_data_exports')
        .update({ status: 'FAILED' })
        .eq('id', initialRecordId);
    }

    res.status(500).json({ 
      success: false, 
      message: "Processing failed", 
      error: error.message 
    });
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
  let initialRecordId = null;

  try {
    const { folder_name, folder_url } = req.body;

    if (!folder_name || !folder_url) {
      return res.status(400).json({ success: false, message: "Folder name and link are required" });
    }

    // 1. Create a record with status 'PROCESSING'
    const { data: initialData, error: initialError } = await supabase
      .from('invoice_extractions')
      .insert([{
        folder_name: folder_name,
        folder_url: folder_url,
        status: 'PROCESSING'
      }])
      .select()
      .single();

    if (initialError) throw initialError;
    initialRecordId = initialData.id;

    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/f844e506-030a-425c-b92e-1dc7fcc3b419';

    // 2. Forward to n8n (If you stop execution in n8n, this will throw an error)
    const n8nResponse = await axios.post(n8nUrl, {
      "filename": folder_name,
      "filelink": folder_url 
    }, { timeout: 0 });

    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;
    
    if (!result) throw new Error("n8n returned an empty response.");

    const finalLink = result.final_link || result.output_url || (Object.values(result).length > 0 ? Object.values(result)[0] : null);

    if (!finalLink) throw new Error("Could not find a download link in n8n response.");

    // 3. Update status to 'COMPLETED'
    const { data: finalData, error: finalError } = await supabase
      .from('invoice_extractions')
      .update({
        extracted_output_url: finalLink,
        status: 'COMPLETED'
      })
      .eq('id', initialRecordId)
      .select();

    if (finalError) throw finalError;
    
    res.status(200).json({ success: true, data: finalData[0] });

  } catch (error) {
    console.error('Invoice Extraction Error:', error.message);
    
    // 4. Update status to 'FAILED' if the process was interrupted
    if (initialRecordId) {
      await supabase
        .from('invoice_extractions')
        .update({ status: 'FAILED' })
        .eq('id', initialRecordId);
    }

    res.status(500).json({ 
        success: false, 
        error: "Process failed or was stopped",
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
    // 1. FIXED DESTRUCTURING: These must match the keys in 'exactPayload' from frontend
    const { 
      "serial no": serial_no, 
      "excel sheet": excel_sheet, 
      "Date": start_date, 
      "end date": end_date, 
      "Elementorphase1": phase1, 
      "Elementorphase2": phase2 
    } = req.body;

    // Validate if data exists before calling n8n
    if (!serial_no || !excel_sheet) {
      return res.status(400).json({ success: false, message: "Missing required fields in request body" });
    }

    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/5913f8ca-e09c-457a-842a-78035ba46b34';

    // 2. Forward to n8n (Using the variables extracted above)
    // We send them back with the exact keys n8n expects
    const n8nResponse = await axios.post(n8nUrl, {
      "serial no": serial_no,
      "excel sheet": excel_sheet,
      "Date": start_date,
      "end date": end_date,
      "Elementorphase1": phase1,
      "Elementorphase2": phase2
    }, { timeout: 0 });

    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;

    // 3. Store result in Supabase
    const { data, error } = await supabase
      .from('reconciliation_syncs')
      .insert([{
        serial_no: serial_no, 
        main_excel_url: excel_sheet,
        start_date: start_date,
        end_date: end_date,
        phase1_url: phase1,
        phase2_url: phase2,
        reconciliation_sheet_url: result.Reconcilation_sheet, 
        elemensor_final_sheet_url: result.Elemensorfinal_sheet,
        status: 'PROCESSED'
      }])
      .select();

    if (error) throw error;
    res.status(200).json({ success: true, data: data[0] });

  } catch (error) {
    console.error('Reconciliation Error:', error.message);
    res.status(500).json({ success: false, error: "Reconciliation sync failed", details: error.message });
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
  let initialRecordId = null;
  try {
    const { filename, elemensor_file, zoho_balance_sheet, start_date, end_date } = req.body;

    // 1. Create record with 'PENDING'
    const { data: initialData, error: initialError } = await supabase
      .from('zoho_elemensor_syncs')
      .insert([{
        filename, elemensor_url: elemensor_file, zoho_url: zoho_balance_sheet,
        start_date, end_date, status: 'PENDING'  // Start as PENDING
      }])
      .select()
      .single();

    if (initialError) throw initialError;
    initialRecordId = initialData.id;

    // 2. Call n8n
    const n8nUrl = 'https://n8n.srv1267492.hstgr.cloud/webhook/230f20ac-49c7-4cda-9bd1-272fe6c493dd';
    const n8nResponse = await axios.post(n8nUrl, {
      "file name": filename, "elemensor file": elemensor_file,
      "zoho-balance sheet": zoho_balance_sheet, "start Date": start_date, "end_date": end_date
    }, { timeout: 0 });

    // 3. Check HTTP status first
    if (n8nResponse.status !== 200) {
      throw new Error(`n8n HTTP ${n8nResponse.status}: ${n8nResponse.statusText}`);
    }

    const result = Array.isArray(n8nResponse.data) ? n8nResponse.data[0] : n8nResponse.data;

    // 4. Handle n8n status (from Respond to Webhook node)
    let dbStatus = 'FAILED';
    let outputUrl = null;
    if (result && typeof result === 'object') {
      const n8nStatus = result.status?.toLowerCase() || 'unknown';
      if (n8nStatus === 'success' || n8nStatus === 'completed') {
        outputUrl = result.output_url || result.final_link || result.spreadsheet_url || Object.values(result).find(v => typeof v === 'string' && v.includes('spreadsheet'));
        dbStatus = outputUrl ? 'COMPLETED' : 'FAILED';
      } else if (n8nStatus === 'pending') {
        dbStatus = 'PENDING';
      } else if (n8nStatus === 'canceled' || n8nStatus === 'error' || n8nStatus === 'stopped') {
        dbStatus = 'CANCELED';
      }
    }

    // 5. Update DB with status and link
    const { data: finalData, error: finalError } = await supabase
      .from('zoho_elemensor_syncs')
      .update({ output_url: outputUrl, status: dbStatus })
      .eq('id', initialRecordId)
      .select();

    if (finalError) throw finalError;

    res.status(200).json({ 
      success: true, 
      status: dbStatus, 
      data: finalData[0],
      n8n_raw: result  // For debugging
    });

  } catch (error) {
    console.error('Zoho-Elemensor Error:', error.message);
    if (initialRecordId) {
      await supabase.from('zoho_elemensor_syncs').update({ status: 'FAILED' }).eq('id', initialRecordId);
    }
    res.status(500).json({ success: false, error: "Process failed", details: error.message });
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
