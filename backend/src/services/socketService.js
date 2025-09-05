const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.meetingRooms = new Map();
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user
      });

      // Update user online status
      this.updateUserOnlineStatus(socket.userId, true);

      // Handle chat events
      this.handleChatEvents(socket);
      
      // Handle video call events
      this.handleVideoCallEvents(socket);
      
      // Handle meeting events
      this.handleMeetingEvents(socket);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`);
        this.connectedUsers.delete(socket.userId);
        this.updateUserOnlineStatus(socket.userId, false);
      });
    });
  }

  handleChatEvents(socket) {
    // Join personal room for direct messages
    socket.join(`user_${socket.userId}`);

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, messageType = 'text' } = data;
        
        // Create message in database (you'll need to implement this)
        const message = {
          sender: socket.userId,
          receiver: receiverId,
          content,
          messageType,
          timestamp: new Date(),
          isRead: false
        };

        // Send to receiver if online
        socket.to(`user_${receiverId}`).emit('new_message', message);
        
        // Send confirmation to sender
        socket.emit('message_sent', { success: true, message });
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Mark message as read
    socket.on('mark_read', (data) => {
      const { messageId, senderId } = data;
      socket.to(`user_${senderId}`).emit('message_read', { messageId });
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      socket.to(`user_${receiverId}`).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });
  }

  handleVideoCallEvents(socket) {
    // Join call room
    socket.on('join_call', (data) => {
      const { roomId } = data;
      socket.join(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined_call', {
        userId: socket.userId,
        userName: socket.user.name,
        avatarUrl: socket.user.avatarUrl
      });

      // Send list of users already in the room
      const room = this.io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const usersInRoom = Array.from(room).map(socketId => {
          const userSocket = this.io.sockets.sockets.get(socketId);
          return userSocket ? {
            userId: userSocket.userId,
            userName: userSocket.user.name,
            avatarUrl: userSocket.user.avatarUrl
          } : null;
        }).filter(Boolean);

        socket.emit('room_users', usersInRoom);
      }
    });

    // WebRTC signaling
    socket.on('offer', (data) => {
      const { roomId, offer, targetUserId } = data;
      socket.to(roomId).emit('offer', {
        offer,
        fromUserId: socket.userId,
        fromUserName: socket.user.name
      });
    });

    socket.on('answer', (data) => {
      const { roomId, answer, targetUserId } = data;
      socket.to(roomId).emit('answer', {
        answer,
        fromUserId: socket.userId,
        fromUserName: socket.user.name
      });
    });

    socket.on('ice_candidate', (data) => {
      const { roomId, candidate, targetUserId } = data;
      socket.to(roomId).emit('ice_candidate', {
        candidate,
        fromUserId: socket.userId
      });
    });

    // Media controls
    socket.on('toggle_audio', (data) => {
      const { roomId, isAudioEnabled } = data;
      socket.to(roomId).emit('user_audio_toggled', {
        userId: socket.userId,
        isAudioEnabled
      });
    });

    socket.on('toggle_video', (data) => {
      const { roomId, isVideoEnabled } = data;
      socket.to(roomId).emit('user_video_toggled', {
        userId: socket.userId,
        isVideoEnabled
      });
    });

    // Leave call
    socket.on('leave_call', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.to(roomId).emit('user_left_call', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });
  }

  handleMeetingEvents(socket) {
    // Join meeting room
    socket.on('join_meeting', (data) => {
      const { meetingId, roomId } = data;
      socket.join(roomId);
      
      if (!this.meetingRooms.has(roomId)) {
        this.meetingRooms.set(roomId, new Set());
      }
      
      this.meetingRooms.get(roomId).add(socket.userId);

      // Notify others
      socket.to(roomId).emit('participant_joined', {
        userId: socket.userId,
        userName: socket.user.name,
        avatarUrl: socket.user.avatarUrl
      });

      // Send current participants
      const participants = Array.from(this.meetingRooms.get(roomId)).map(userId => {
        const connectedUser = this.connectedUsers.get(userId);
        return connectedUser ? {
          userId,
          userName: connectedUser.user.name,
          avatarUrl: connectedUser.user.avatarUrl
        } : null;
      }).filter(Boolean);

      socket.emit('meeting_participants', participants);
    });

    // Leave meeting
    socket.on('leave_meeting', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      
      if (this.meetingRooms.has(roomId)) {
        this.meetingRooms.get(roomId).delete(socket.userId);
        
        if (this.meetingRooms.get(roomId).size === 0) {
          this.meetingRooms.delete(roomId);
        }
      }

      socket.to(roomId).emit('participant_left', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    // Screen sharing
    socket.on('start_screen_share', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('screen_share_started', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('stop_screen_share', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('screen_share_stopped', {
        userId: socket.userId
      });
    });

    // Meeting chat
    socket.on('meeting_message', (data) => {
      const { roomId, message } = data;
      socket.to(roomId).emit('meeting_message', {
        userId: socket.userId,
        userName: socket.user.name,
        message,
        timestamp: new Date()
      });
    });
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  // Utility methods
  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = new SocketService();