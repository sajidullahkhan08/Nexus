import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MessageCircle, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';

interface Participant {
  userId: string;
  userName: string;
  avatarUrl: string;
  stream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export const VideoCallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [userId: string]: HTMLVideoElement }>({});
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const localStream = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!user || !roomId) return;

    initializeCall();
    return () => {
      cleanup();
    };
  }, [user, roomId]);

  const initializeCall = async () => {
    try {
      // Connect to socket
      await socketService.connect();
      setIsConnected(true);

      // Join the call room
      socketService.joinCall(roomId!);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Set up socket event listeners
      setupSocketListeners();

    } catch (error) {
      console.error('Failed to initialize call:', error);
    }
  };

  const setupSocketListeners = () => {
    // User joined call
    socketService.onUserJoinedCall((data) => {
      console.log('User joined call:', data);
      addParticipant(data);
      createPeerConnection(data.userId);
    });

    // User left call
    socketService.onUserLeftCall((data) => {
      console.log('User left call:', data);
      removeParticipant(data.userId);
    });

    // WebRTC signaling
    socketService.onOffer(async (data) => {
      const { offer, fromUserId } = data;
      const peerConnection = createPeerConnection(fromUserId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socketService.sendAnswer(roomId!, answer, fromUserId);
    });

    socketService.onAnswer(async (data) => {
      const { answer, fromUserId } = data;
      const peerConnection = peerConnections.current[fromUserId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketService.onIceCandidate(async (data) => {
      const { candidate, fromUserId } = data;
      const peerConnection = peerConnections.current[fromUserId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Media controls
    socketService.onUserAudioToggled((data) => {
      updateParticipantAudio(data.userId, data.isAudioEnabled);
    });

    socketService.onUserVideoToggled((data) => {
      updateParticipantVideo(data.userId, data.isVideoEnabled);
    });
  };

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add local stream tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      updateParticipantStream(userId, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(roomId!, event.candidate.toJSON(), userId);
      }
    };

    peerConnections.current[userId] = peerConnection;
    return peerConnection;
  };

  const addParticipant = (data: any) => {
    setParticipants(prev => [...prev, {
      userId: data.userId,
      userName: data.userName,
      avatarUrl: data.avatarUrl,
      isAudioEnabled: true,
      isVideoEnabled: true
    }]);
  };

  const removeParticipant = (userId: string) => {
    setParticipants(prev => prev.filter(p => p.userId !== userId));
    if (peerConnections.current[userId]) {
      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
    }
  };

  const updateParticipantStream = (userId: string, stream: MediaStream) => {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, stream } : p
    ));
  };

  const updateParticipantAudio = (userId: string, isEnabled: boolean) => {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, isAudioEnabled: isEnabled } : p
    ));
  };

  const updateParticipantVideo = (userId: string, isEnabled: boolean) => {
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, isVideoEnabled: isEnabled } : p
    ));
  };

  const toggleAudio = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socketService.toggleAudio(roomId!, audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socketService.toggleVideo(roomId!, videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        const screenTrack = localStream.current?.getVideoTracks().find(track =>
          track.getSettings().displaySurface
        );
        if (screenTrack) {
          screenTrack.stop();
          socketService.stopScreenShare(roomId!);
          setIsScreenSharing(false);
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          socketService.stopScreenShare(roomId!);
        };

        // Replace video track in all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        socketService.startScreenShare(roomId!);
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
    }
  };

  const endCall = () => {
    cleanup();
    navigate(-1);
  };

  const cleanup = () => {
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // Stop local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    // Leave call
    if (roomId) {
      socketService.leaveCall(roomId);
    }

    socketService.disconnect();
  };

  const sendMessage = () => {
    if (newMessage.trim() && roomId) {
      socketService.sendMeetingMessage(roomId, newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-lg font-semibold">Video Call</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-300 text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users size={20} className="text-gray-300" />
          <span className="text-gray-300">{participants.length + 1} participants</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
        {/* Local Video */}
        <Card className="bg-gray-800 border-gray-700">
          <CardBody className="p-2">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-48 bg-gray-700 rounded object-cover"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white text-sm">{user?.name} (You)</span>
              <div className="flex space-x-1">
                {!isAudioEnabled && <MicOff size={16} className="text-red-500" />}
                {!isVideoEnabled && <VideoOff size={16} className="text-red-500" />}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Remote Videos */}
        {participants.map(participant => (
          <Card key={participant.userId} className="bg-gray-800 border-gray-700">
            <CardBody className="p-2">
              {participant.stream ? (
                <video
                  ref={el => {
                    if (el) remoteVideoRefs.current[participant.userId] = el;
                    if (el && participant.stream) el.srcObject = participant.stream;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-48 bg-gray-700 rounded object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 rounded flex items-center justify-center">
                  <Avatar
                    src={participant.avatarUrl}
                    alt={participant.userName}
                    size="lg"
                  />
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-white text-sm">{participant.userName}</span>
                <div className="flex space-x-1">
                  {!participant.isAudioEnabled && <MicOff size={16} className="text-red-500" />}
                  {!participant.isVideoEnabled && <VideoOff size={16} className="text-red-500" />}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4">
        <Button
          variant={isAudioEnabled ? "secondary" : "danger"}
          size="lg"
          onClick={toggleAudio}
          leftIcon={isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        >
          {isAudioEnabled ? 'Mute' : 'Unmute'}
        </Button>

        <Button
          variant={isVideoEnabled ? "secondary" : "danger"}
          size="lg"
          onClick={toggleVideo}
          leftIcon={isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        >
          {isVideoEnabled ? 'Stop Video' : 'Start Video'}
        </Button>

        <Button
          variant={isScreenSharing ? "primary" : "secondary"}
          size="lg"
          onClick={toggleScreenShare}
          leftIcon={<Monitor size={20} />}
        >
          {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        </Button>

        <Button
          variant="danger"
          size="lg"
          onClick={endCall}
          leftIcon={<PhoneOff size={20} />}
        >
          End Call
        </Button>
      </div>

      {/* Chat Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex space-x-4">
          <div className="flex-1">
            <div className="bg-gray-700 rounded p-3 h-32 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div key={index} className="text-white text-sm mb-2">
                  <strong>{msg.userName}:</strong> {msg.message}
                </div>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <Button
              onClick={sendMessage}
              leftIcon={<MessageCircle size={16} />}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};