const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { sendMeetingInvitation } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

// Create meeting
const createMeeting = async (req, res) => {
  try {
    const { title, description, participants, startTime, endTime, meetingType } = req.body;
    const organizerId = req.user._id;

    // Validate meeting time
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({
        success: false,
        message: 'Meeting start time must be in the future'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Meeting end time must be after start time'
      });
    }

    // Check for conflicts
    const conflicts = await Meeting.find({
      $or: [
        { organizer: organizerId },
        { 'participants.user': { $in: participants } }
      ],
      status: { $in: ['scheduled', 'ongoing'] },
      $or: [
        {
          startTime: { $lte: start },
          endTime: { $gt: start }
        },
        {
          startTime: { $lt: end },
          endTime: { $gte: end }
        },
        {
          startTime: { $gte: start },
          endTime: { $lte: end }
        }
      ]
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Meeting time conflicts with existing meetings'
      });
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      description,
      organizer: organizerId,
      participants: participants.map(userId => ({ user: userId })),
      startTime: start,
      endTime: end,
      meetingType,
      roomId: `room_${uuidv4()}`
    });

    // Populate meeting data
    await meeting.populate([
      { path: 'organizer', select: 'name email avatarUrl' },
      { path: 'participants.user', select: 'name email avatarUrl' }
    ]);

    // Send invitations
    try {
      for (const participant of meeting.participants) {
        if (participant.user._id.toString() !== organizerId.toString()) {
          await sendMeetingInvitation(meeting, participant.user);
        }
      }
    } catch (emailError) {
      console.error('Failed to send meeting invitations:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: { meeting }
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting'
    });
  }
};

// Get user meetings
const getUserMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10, upcoming = false } = req.query;

    const query = {
      $or: [
        { organizer: userId },
        { 'participants.user': userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.startTime = { $gte: new Date() };
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'name email avatarUrl')
      .populate('participants.user', 'name email avatarUrl')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startTime: 1 });

    const total = await Meeting.countDocuments(query);

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get user meetings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings'
    });
  }
};

// Get meeting by ID
const getMeetingById = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId)
      .populate('organizer', 'name email avatarUrl')
      .populate('participants.user', 'name email avatarUrl')
      .populate('documents');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is authorized to view this meeting
    const isAuthorized = meeting.organizer._id.toString() === userId.toString() ||
      meeting.participants.some(p => p.user._id.toString() === userId.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { meeting }
    });
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting'
    });
  }
};

// Update meeting
const updateMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;
    const updates = req.body;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Only organizer can update meeting
    if (meeting.organizer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only meeting organizer can update the meeting'
      });
    }

    // Don't allow updates to past meetings
    if (meeting.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update past meetings'
      });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'organizer', select: 'name email avatarUrl' },
      { path: 'participants.user', select: 'name email avatarUrl' }
    ]);

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: { meeting: updatedMeeting }
    });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting'
    });
  }
};

// Respond to meeting invitation
const respondToInvitation = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;
    const { status } = req.body; // 'accepted' or 'declined'

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Find participant
    const participantIndex = meeting.participants.findIndex(
      p => p.user.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(403).json({
        success: false,
        message: 'You are not invited to this meeting'
      });
    }

    // Update participant status
    meeting.participants[participantIndex].status = status;
    await meeting.save();

    await meeting.populate([
      { path: 'organizer', select: 'name email avatarUrl' },
      { path: 'participants.user', select: 'name email avatarUrl' }
    ]);

    res.json({
      success: true,
      message: `Meeting invitation ${status}`,
      data: { meeting }
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to invitation'
    });
  }
};

// Join meeting
const joinMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is authorized
    const isAuthorized = meeting.organizer.toString() === userId.toString() ||
      meeting.participants.some(p => p.user.toString() === userId.toString());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check meeting time
    const now = new Date();
    const meetingStart = new Date(meeting.startTime);
    const meetingEnd = new Date(meeting.endTime);

    if (now < meetingStart) {
      return res.status(400).json({
        success: false,
        message: 'Meeting has not started yet'
      });
    }

    if (now > meetingEnd) {
      return res.status(400).json({
        success: false,
        message: 'Meeting has ended'
      });
    }

    // Update meeting status if needed
    if (meeting.status === 'scheduled') {
      meeting.status = 'ongoing';
    }

    // Update participant join time
    const participantIndex = meeting.participants.findIndex(
      p => p.user.toString() === userId.toString()
    );

    if (participantIndex !== -1) {
      meeting.participants[participantIndex].joinedAt = now;
    }

    await meeting.save();

    res.json({
      success: true,
      message: 'Joined meeting successfully',
      data: {
        roomId: meeting.roomId,
        meeting
      }
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join meeting'
    });
  }
};

// Leave meeting
const leaveMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Update participant leave time
    const participantIndex = meeting.participants.findIndex(
      p => p.user.toString() === userId.toString()
    );

    if (participantIndex !== -1) {
      meeting.participants[participantIndex].leftAt = new Date();
    }

    await meeting.save();

    res.json({
      success: true,
      message: 'Left meeting successfully'
    });
  } catch (error) {
    console.error('Leave meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave meeting'
    });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Only organizer can delete meeting
    if (meeting.organizer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only meeting organizer can delete the meeting'
      });
    }

    await Meeting.findByIdAndDelete(meetingId);

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting'
    });
  }
};

module.exports = {
  createMeeting,
  getUserMeetings,
  getMeetingById,
  updateMeeting,
  respondToInvitation,
  joinMeeting,
  leaveMeeting,
  deleteMeeting
};