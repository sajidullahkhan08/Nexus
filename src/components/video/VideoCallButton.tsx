import React, { useState } from 'react';
import { Video, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { meetingAPI } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface VideoCallButtonProps {
  targetUserId: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  targetUserId,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartCall = async () => {
    if (!user) {
      toast.error('Please log in to start a call');
      return;
    }

    setIsLoading(true);
    try {
      // Generate a unique room ID
      const roomId = `call_${user._id}_${targetUserId}_${Date.now()}`;

      // Navigate to the video call page
      navigate(`/call/${roomId}`);

      toast.success('Starting video call...');
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start video call');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartCall}
      disabled={isLoading}
      leftIcon={<Video size={16} />}
      className={className}
    >
      {isLoading ? 'Starting...' : 'Video Call'}
    </Button>
  );
};