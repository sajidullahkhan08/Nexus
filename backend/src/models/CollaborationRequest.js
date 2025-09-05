const mongoose = require('mongoose');

const collaborationRequestSchema = new mongoose.Schema({
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entrepreneur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  respondedAt: Date,
  meetingScheduled: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  documentsShared: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  investmentAmount: {
    type: Number,
    min: 0
  },
  investmentTerms: {
    equity: Number,
    valuation: Number,
    conditions: [String]
  }
}, {
  timestamps: true
});

// Prevent duplicate requests
collaborationRequestSchema.index({ investor: 1, entrepreneur: 1 }, { unique: true });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);