const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateProfile,
  updateAvatar,
  getEntrepreneurs,
  getInvestors,
  deleteAccount
} = require('../controllers/userController');

const router = express.Router();

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(auth);

// User routes
router.get('/', getUsers);
router.get('/entrepreneurs', getEntrepreneurs);
router.get('/investors', getInvestors);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);
router.put('/avatar', upload.single('avatar'), updateAvatar);
router.delete('/account', deleteAccount);

module.exports = router;