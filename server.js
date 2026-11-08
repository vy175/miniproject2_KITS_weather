const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Đã xảy ra lỗi nội bộ máy chủ.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Weather Backend Server (Layered Architecture)`);
  console.log(`🗄️ Database:       SQLite (src/database/connection.js)`);
  console.log(`📍 Web Dashboard:  http://localhost:${PORT}`);
  console.log(`📍 Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
