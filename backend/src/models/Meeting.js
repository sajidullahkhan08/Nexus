const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  meetingType: {
    type: String,
    enum: ['video', 'audio', 'in-person'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  roomId: {
    type: String,
    unique: true
  },
  recordingUrl: String,
  notes: String,
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification'],
      default: 'email'
    },
    time: {
      type: Number, // minutes before meeting
      default: 15
    },
    sent: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Validate end time is after start time
meetingSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  }
  next();
});

// Generate unique room ID
meetingSchema.pre('save', function(next) {
  if (!this.roomId) {
    this.roomId = `room_${this._id}_${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);