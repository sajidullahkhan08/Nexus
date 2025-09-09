import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const messageAPI = {
  // Get messages between two users
  getConversation: async (userId: string) => {
    const response = await api.get(`/messages/conversation/${userId}`);
    return response.data;
  },

  // Get all conversations for current user
  getConversations: async () => {
    const response = await api.get('/messages/conversation-list');
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId: string) => {
    const response = await api.put(`/messages/mark-read/${messageId}`);
    return response.data;
  },
};

export default api;
