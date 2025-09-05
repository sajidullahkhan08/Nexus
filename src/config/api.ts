import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        setTokens(accessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updateAvatar: (formData: FormData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getEntrepreneurs: (params?: any) => api.get('/users/entrepreneurs', { params }),
  getInvestors: (params?: any) => api.get('/users/investors', { params }),
  deleteAccount: () => api.delete('/users/account'),
};

export const meetingAPI = {
  createMeeting: (data: any) => api.post('/meetings', data),
  getUserMeetings: (params?: any) => api.get('/meetings', { params }),
  getMeetingById: (id: string) => api.get(`/meetings/${id}`),
  updateMeeting: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  respondToInvitation: (id: string, status: string) => api.put(`/meetings/${id}/respond`, { status }),
  joinMeeting: (id: string) => api.post(`/meetings/${id}/join`),
  leaveMeeting: (id: string) => api.post(`/meetings/${id}/leave`),
  deleteMeeting: (id: string) => api.delete(`/meetings/${id}`),
};

export { api, setTokens, clearTokens, getToken };
export default api;