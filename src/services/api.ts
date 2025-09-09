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

export const userAPI = {
  // Get all users with filters
  getUsers: async (params?: Record<string, unknown>) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get entrepreneurs
  getEntrepreneurs: async () => {
    const response = await api.get('/users/entrepreneurs');
    return response.data;
  },

  // Get investors
  getInvestors: async () => {
    const response = await api.get('/users/investors');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: Record<string, unknown>) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Update user avatar
  updateAvatar: async (avatarFile: File) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    const response = await api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete user account
  deleteAccount: async () => {
    const response = await api.delete('/users/account');
    return response.data;
  },
};

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
