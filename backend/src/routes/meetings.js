const express = require('express');
const { auth } = require('../middleware/auth');
const { validateMeeting } = require('../middleware/validation');
const {
  createMeeting,
  getUserMeetings,
  getMeetingById,
  updateMeeting,
  respondToInvitation,
  joinMeeting,
  leaveMeeting,
  deleteMeeting
} = require('../controllers/meetingController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Meeting routes
router.post('/', validateMeeting, createMeeting);
router.get('/', getUserMeetings);
router.get('/:id', getMeetingById);
router.put('/:id', updateMeeting);
router.put('/:id/respond', respondToInvitation);
router.post('/:id/join', joinMeeting);
router.post('/:id/leave', leaveMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;