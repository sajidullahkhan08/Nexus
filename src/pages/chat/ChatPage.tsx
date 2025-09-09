import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { Message, ChatConversation } from '../../types';
import { findUserById } from '../../data/users';
import { messageAPI } from '../../services/api';
import socketService from '../../services/socketService';
import { MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const chatPartner = userId ? findUserById(userId) : null;

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUser) return;
      try {
        const data = await messageAPI.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, [currentUser]);

  // Load messages for specific conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser || !userId) return;

      try {
        // Map short userId to full ObjectId for API call
        const chatPartner = findUserById(userId);
        if (!chatPartner) return;

        const data = await messageAPI.getConversation(chatPartner._id);
        setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [currentUser, userId]);

  // Socket event listeners
  useEffect(() => {
    if (!currentUser || !userId) return;

    // Get the full ObjectId for the current chat partner
    const chatPartner = findUserById(userId);
    const chatPartnerObjectId = chatPartner?._id;

    // Listen for new messages
    socketService.onNewMessage((message: Message) => {
      // Check if message involves the current chat partner using both short and full IDs
      if (message.senderId === userId || message.receiverId === userId ||
          message.senderId === chatPartnerObjectId || message.receiverId === chatPartnerObjectId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for message read confirmations
    socketService.onMessageRead((data: { messageId: string }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    return () => {
      // Cleanup listeners
      socketService.off('new_message');
      socketService.off('message_read');
    };
  }, [currentUser, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !userId) return;

    try {
      // Map short userId to full ObjectId string
      const receiver = findUserById(userId);
      if (!receiver) {
        console.error('Receiver user not found for id:', userId);
        return;
      }
      const receiverId = receiver._id;

      // Send message via socket with full ObjectId
      await socketService.sendMessage(receiverId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };


  
  if (!currentUser) return null;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />
                
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Voice call"
                >
                  <Phone size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Video call"
                >
                  <Video size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Info"
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>
            
            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(message => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id || message.senderId === currentUser._id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Add emoji"
                >
                  <Smile size={20} />
                </Button>
                
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  fullWidth
                  className="flex-1"
                />
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};