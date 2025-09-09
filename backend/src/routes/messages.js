const express = require('express');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get messages between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email avatarUrl')
    .populate('receiver', 'name email avatarUrl')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all messages for the user
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email avatarUrl')
    .populate('receiver', 'name email avatarUrl')
    .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversations = {};
    messages.forEach(message => {
      const partnerId = message.sender._id.toString() === currentUserId
        ? message.receiver._id.toString()
        : message.sender._id.toString();

      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partner: message.sender._id.toString() === currentUserId ? message.receiver : message.sender,
          lastMessage: message,
          unreadCount: 0
        };
      }

      // Count unread messages
      if (message.receiver._id.toString() === currentUserId && !message.isRead) {
        conversations[partnerId].unreadCount++;
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark messages as read
router.put('/read/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, receiver: currentUserId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

module.exports = router;
