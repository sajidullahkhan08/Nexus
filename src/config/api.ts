import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('business_nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  refreshToken: (data: any) => api.post('/auth/refresh-token', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
};

// User API
export const userAPI = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updateAvatar: (data: FormData) => api.put('/users/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getEntrepreneurs: (params?: any) => api.get('/users/entrepreneurs', { params }),
  getInvestors: (params?: any) => api.get('/users/investors', { params }),
  deleteAccount: () => api.delete('/users/account'),
};

// Document API
export const documentAPI = {
  getDocuments: (params?: any) => api.get('/documents', { params }),
  getDocumentById: (id: string) => api.get(`/documents/${id}`),
  uploadDocument: (data: FormData) => api.post('/documents', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateDocument: (id: string, data: any) => api.put(`/documents/${id}`, data),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
  downloadDocument: (id: string) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  shareDocument: (id: string, data: any) => api.post(`/documents/${id}/share`, data),
  addSignature: (id: string, data: FormData) => api.post(`/documents/${id}/signature`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Meeting API
export const meetingAPI = {
  createMeeting: (data: any) => api.post('/meetings', data),
  getMeetings: (params?: any) => api.get('/meetings', { params }),
  getMeetingById: (id: string) => api.get(`/meetings/${id}`),
  updateMeeting: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  respondToMeeting: (id: string, data: any) => api.put(`/meetings/${id}/respond`, data),
  joinMeeting: (id: string) => api.post(`/meetings/${id}/join`),
  leaveMeeting: (id: string) => api.post(`/meetings/${id}/leave`),
  deleteMeeting: (id: string) => api.delete(`/meetings/${id}`),
};

// Utility functions
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (token: string) => localStorage.setItem('accessToken', token);
export const removeToken = () => localStorage.removeItem('accessToken');

// Token management functions for AuthContext
export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export default api;