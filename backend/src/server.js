const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import configurations and middleware
const connectDB = require('./config/database');
const { generalLimiter, securityHeaders, sanitizeInput } = require('./middleware/security');
const socketService = require('./services/socketService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const meetingRoutes = require('./routes/meetings');
const documentRoutes = require('./routes/documents');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Connect to database
connectDB();

// Initialize Socket.IO
socketService.initialize(server);

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: [
    'https://nexus-1dgt-git-main-sajidullahkhan08s-projects.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  const allowedOrigins = [
    'https://nexus-1dgt-git-main-sajidullahkhan08s-projects.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Override security headers for uploads to allow cross-origin access
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Nexus Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Nexus Platform API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh-token': 'Refresh access token',
        'POST /api/auth/logout': 'Logout user',
        'POST /api/auth/forgot-password': 'Request password reset',
        'POST /api/auth/reset-password': 'Reset password',
        'GET /api/auth/me': 'Get current user'
      },
      users: {
        'GET /api/users': 'Get all users with filters',
        'GET /api/users/entrepreneurs': 'Get entrepreneurs',
        'GET /api/users/investors': 'Get investors',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/profile': 'Update user profile',
        'PUT /api/users/avatar': 'Update user avatar',
        'DELETE /api/users/account': 'Delete user account'
      },
      meetings: {
        'POST /api/meetings': 'Create meeting',
        'GET /api/meetings': 'Get user meetings',
        'GET /api/meetings/:id': 'Get meeting by ID',
        'PUT /api/meetings/:id': 'Update meeting',
        'PUT /api/meetings/:id/respond': 'Respond to meeting invitation',
        'POST /api/meetings/:id/join': 'Join meeting',
        'POST /api/meetings/:id/leave': 'Leave meeting',
        'DELETE /api/meetings/:id': 'Delete meeting'
      },
      documents: {
        'GET /api/documents': 'Get all documents for user',
        'GET /api/documents/:id': 'Get document by ID',
        'POST /api/documents': 'Upload new document',
        'PUT /api/documents/:id': 'Update document',
        'DELETE /api/documents/:id': 'Delete document',
        'GET /api/documents/:id/download': 'Download document',
        'POST /api/documents/:id/share': 'Share document with user',
        'POST /api/documents/:id/signature': 'Add signature to document'
      }
    },
    websocket: {
      events: {
        chat: ['send_message', 'mark_read', 'typing_start', 'typing_stop'],
        video: ['join_call', 'leave_call', 'offer', 'answer', 'ice_candidate', 'toggle_audio', 'toggle_video'],
        meetings: ['join_meeting', 'leave_meeting', 'start_screen_share', 'stop_screen_share', 'meeting_message']
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large'
    });
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Railway-specific: Listen on all interfaces in production
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, host, () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

  console.log(`
🚀 Nexus Platform Backend Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🏠 Host: ${host}
${isRailway ? '🚂 Platform: Railway' : '🏠 Platform: Local/Other'}
📚 API Docs: http://${host}:${PORT}/api/docs
💻 Health Check: http://${host}:${PORT}/health
  `);

  // Log important environment variables (without sensitive data)
  console.log(`
📊 Configuration:
   - Database: ${process.env.MONGODB_URI ? '✅ Connected' : '❌ Not configured'}
   - JWT: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Not configured'}
   - Email: ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}
   - Frontend: ${process.env.FRONTEND_URL || '❌ Not configured'}
   - Railway: ${isRailway ? '✅ Detected' : '❌ Not detected'}
  `);

  if (isRailway) {
    console.log(`
🔧 Railway Environment Variables:
   - RAILWAY_PROJECT_ID: ${process.env.RAILWAY_PROJECT_ID ? '✅ Set' : '❌ Not set'}
   - RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'Not set'}
   - RAILWAY_STATIC_URL: ${process.env.RAILWAY_STATIC_URL || 'Not set'}
    `);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;