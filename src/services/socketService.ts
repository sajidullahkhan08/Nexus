import { io, Socket } from 'socket.io-client';
import { getToken } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const token = getToken();
      
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.disconnect();
        }
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Chat methods
  sendMessage(receiverId: string, content: string, messageType: string = 'text') {
    if (this.socket) {
      this.socket.emit('send_message', {
        receiverId,
        content,
        messageType
      });
    }
  }

  markMessageAsRead(messageId: string, senderId: string) {
    if (this.socket) {
      this.socket.emit('mark_read', {
        messageId,
        senderId
      });
    }
  }

  startTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', { receiverId });
    }
  }

  stopTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', { receiverId });
    }
  }

  // Video call methods
  joinCall(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_call', { roomId });
    }
  }

  leaveCall(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave_call', { roomId });
    }
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit, targetUserId?: string) {
    if (this.socket) {
      this.socket.emit('offer', {
        roomId,
        offer,
        targetUserId
      });
    }
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit, targetUserId?: string) {
    if (this.socket) {
      this.socket.emit('answer', {
        roomId,
        answer,
        targetUserId
      });
    }
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit, targetUserId?: string) {
    if (this.socket) {
      this.socket.emit('ice_candidate', {
        roomId,
        candidate,
        targetUserId
      });
    }
  }

  toggleAudio(roomId: string, isAudioEnabled: boolean) {
    if (this.socket) {
      this.socket.emit('toggle_audio', {
        roomId,
        isAudioEnabled
      });
    }
  }

  toggleVideo(roomId: string, isVideoEnabled: boolean) {
    if (this.socket) {
      this.socket.emit('toggle_video', {
        roomId,
        isVideoEnabled
      });
    }
  }

  // Meeting methods
  joinMeeting(meetingId: string, roomId: string) {
    if (this.socket) {
      this.socket.emit('join_meeting', {
        meetingId,
        roomId
      });
    }
  }

  leaveMeeting(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave_meeting', { roomId });
    }
  }

  startScreenShare(roomId: string) {
    if (this.socket) {
      this.socket.emit('start_screen_share', { roomId });
    }
  }

  stopScreenShare(roomId: string) {
    if (this.socket) {
      this.socket.emit('stop_screen_share', { roomId });
    }
  }

  sendMeetingMessage(roomId: string, message: string) {
    if (this.socket) {
      this.socket.emit('meeting_message', {
        roomId,
        message
      });
    }
  }

  // Event listeners
  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageSent(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('message_sent', callback);
    }
  }

  onMessageRead(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('message_read', callback);
    }
  }

  onUserTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  // Video call event listeners
  onUserJoinedCall(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_joined_call', callback);
    }
  }

  onUserLeftCall(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_left_call', callback);
    }
  }

  onOffer(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('offer', callback);
    }
  }

  onAnswer(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('answer', callback);
    }
  }

  onIceCandidate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('ice_candidate', callback);
    }
  }

  onUserAudioToggled(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_audio_toggled', callback);
    }
  }

  onUserVideoToggled(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_video_toggled', callback);
    }
  }

  // Meeting event listeners
  onParticipantJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('participant_joined', callback);
    }
  }

  onParticipantLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('participant_left', callback);
    }
  }

  onMeetingParticipants(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('meeting_participants', callback);
    }
  }

  onScreenShareStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('screen_share_started', callback);
    }
  }

  onScreenShareStopped(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('screen_share_stopped', callback);
    }
  }

  onMeetingMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('meeting_message', callback);
    }
  }

  // Remove event listeners
  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();