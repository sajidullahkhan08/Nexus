const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['entrepreneur', 'investor'],
    required: [true, 'Role is required']
  },
  avatarUrl: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  // Entrepreneur specific fields
  startupName: {
    type: String,
    required: function() { return this.role === 'entrepreneur'; }
  },
  pitchSummary: {
    type: String,
    required: function() { return this.role === 'entrepreneur'; }
  },
  fundingNeeded: {
    type: String,
    required: function() { return this.role === 'entrepreneur'; }
  },
  industry: {
    type: String,
    required: function() { return this.role === 'entrepreneur'; }
  },
  location: String,
  foundedYear: {
    type: Number,
    required: function() { return this.role === 'entrepreneur'; }
  },
  teamSize: {
    type: Number,
    required: function() { return this.role === 'entrepreneur'; }
  },
  // Investor specific fields
  investmentInterests: [{
    type: String,
    required: function() { return this.role === 'investor'; }
  }],
  investmentStage: [{
    type: String,
    required: function() { return this.role === 'investor'; }
  }],
  portfolioCompanies: [String],
  totalInvestments: {
    type: Number,
    default: 0
  },
  minimumInvestment: {
    type: String,
    required: function() { return this.role === 'investor'; }
  },
  maximumInvestment: {
    type: String,
    required: function() { return this.role === 'investor'; }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate avatar URL if not provided
userSchema.pre('save', function(next) {
  if (!this.avatarUrl) {
    this.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);