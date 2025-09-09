const connectDB = require('../src/config/database');

module.exports = async (req, res) => {
  try {
    // Test database connection
    await connectDB();

    res.status(200).json({
      success: true,
      message: 'Nexus Backend API is running on Vercel',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: 'vercel'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};