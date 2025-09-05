const User = require('../models/User');

// Get all users (with filters)
const getUsers = async (req, res) => {
  try {
    const { role, industry, location, page = 1, limit = 10, search } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (industry) query.industry = new RegExp(industry, 'i');
    if (location) query.location = new RegExp(location, 'i');
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { startupName: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.refreshTokens;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Update user avatar
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // In a real app, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      { new: true }
    ).select('-password -refreshTokens');

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar'
    });
  }
};

// Get entrepreneurs
const getEntrepreneurs = async (req, res) => {
  try {
    const { industry, location, fundingRange, page = 1, limit = 10, search } = req.query;
    
    const query = { role: 'entrepreneur' };
    
    if (industry) query.industry = new RegExp(industry, 'i');
    if (location) query.location = new RegExp(location, 'i');
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { startupName: new RegExp(search, 'i') },
        { pitchSummary: new RegExp(search, 'i') },
        { industry: new RegExp(search, 'i') }
      ];
    }

    const entrepreneurs = await User.find(query)
      .select('-password -refreshTokens')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        entrepreneurs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get entrepreneurs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entrepreneurs'
    });
  }
};

// Get investors
const getInvestors = async (req, res) => {
  try {
    const { interests, stage, page = 1, limit = 10, search } = req.query;
    
    const query = { role: 'investor' };
    
    if (interests) {
      query.investmentInterests = { $in: interests.split(',') };
    }
    if (stage) {
      query.investmentStage = { $in: stage.split(',') };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') },
        { investmentInterests: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const investors = await User.find(query)
      .select('-password -refreshTokens')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        investors,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investors'
    });
  }
};

// Delete user account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updateAvatar,
  getEntrepreneurs,
  getInvestors,
  deleteAccount
};