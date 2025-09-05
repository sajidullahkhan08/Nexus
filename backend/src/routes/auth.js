const express = require('express');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validateRegistration, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

module.exports = router;