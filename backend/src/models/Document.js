const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: String,
      enum: ['view', 'edit', 'download'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  category: {
    type: String,
    enum: ['pitch-deck', 'business-plan', 'financial', 'legal', 'other'],
    default: 'other'
  },
  version: {
    type: Number,
    default: 1
  },
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'rejected'],
    default: 'draft'
  },
  tags: [String],
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  signatures: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    signatureUrl: String,
    signedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ 'sharedWith.user': 1 });
documentSchema.index({ category: 1 });

module.exports = mongoose.model('Document', documentSchema);