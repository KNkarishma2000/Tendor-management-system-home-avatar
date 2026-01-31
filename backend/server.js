// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import Database Config (just to ensure connection works on startup)
const supabase = require('./config/supabase');
// List of allowed frontend URLs
const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'https://tendor-management-system-home-avata.vercel.app',
  'https://home-avatar.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) 
    // or if the origin is in our whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};


// Import Routes (We will create these in the next step)
const authRoutes = require('./routes/auth');
const tenderRoutes = require('./routes/tenders');
const adminRoutes = require('./routes/admin');
const bidRoutes = require('./routes/bids');
const evaluationRoutes = require('./routes/evaluations');
const awardRoutes = require('./routes/awards');
const supportRoutes = require('./routes/support.routes');
const vendorRoutes = require('./routes/vendorRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supplierRoutes = require('./routes/suppliers');
const residentsRoutes = require('./routes/residents');
const communityRoutes=require('./routes/communityRoutes');
const carnivalRoutes = require('./routes/carnivalRoutes'); 
const driveRoutes = require('./routes/driveRoutes');// ✅ 'routes' should be plural
// const supplierRoutes = require('./routes/suppliers'); // Add later

const app = express();

// =======================
// 1. Middleware
// =======================
app.use(helmet()); // Security headers
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

 // Allow frontend requests
app.use(morgan('dev')); // Logger
app.use(express.json()); // Parse JSON bodies (important for POST requests)
app.use(express.urlencoded({ extended: true }));

// =======================
// 2. Route Handling
// =======================
// Health Check Route (to test if server is running)
app.get('/', (req, res) => {
  res.json({ message: 'Tender Management System API is running 🚀' });
});
const cookieParser = require('cookie-parser');
app.use(cookieParser());
// Mount Module Routes
app.use('/api/vendors', vendorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bids', bidRoutes);

app.use('/api/chatsupport', supportRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/carnival', carnivalRoutes);
app.use('/api/drive', driveRoutes);
// app.use('/api/suppliers', supplierRoutes);

// =======================
// 3. Error Handling
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error', 
    error: err.message 
  });
});

// =======================
// 4. Start Server
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});