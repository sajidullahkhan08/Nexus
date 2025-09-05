const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'transfer', 'payment', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  // For transfers
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Payment gateway details
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'bank'],
    default: 'stripe'
  },
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  // Metadata
  metadata: {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting'
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    investmentId: String,
    notes: String
  },
  // Fees
  platformFee: {
    type: Number,
    default: 0
  },
  gatewayFee: {
    type: Number,
    default: 0
  },
  netAmount: Number,
  // Timestamps
  processedAt: Date,
  failedAt: Date,
  failureReason: String
}, {
  timestamps: true
});

// Generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Calculate net amount
  this.netAmount = this.amount - (this.platformFee || 0) - (this.gatewayFee || 0);
  
  next();
});

// Index for efficient queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);