import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { authAPI, setTokens, clearTokens } from '../config/api';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const accessToken = localStorage.getItem('accessToken');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      
      // Initialize socket connection if user is logged in
      if (accessToken) {
        socketService.connect().catch(console.error);
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login({ email, password, role });
      const { user: userData, accessToken, refreshToken } = response.data.data;
      
      // Store tokens and user data
      setTokens(accessToken, refreshToken);
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      
      // Initialize socket connection
      await socketService.connect();
      
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Prepare registration data based on role
      const registrationData = {
        name,
        email,
        password,
        role,
        // Add default values for role-specific fields
        ...(role === 'entrepreneur' ? {
          startupName: 'My Startup',
          pitchSummary: 'Building the next big thing',
          fundingNeeded: '$100K',
          industry: 'Technology',
          location: 'San Francisco, CA',
          foundedYear: new Date().getFullYear(),
          teamSize: 1
        } : {
          investmentInterests: ['Technology'],
          investmentStage: ['Seed'],
          portfolioCompanies: [],
          totalInvestments: 0,
          minimumInvestment: '$10K',
          maximumInvestment: '$100K'
        })
      };
      
      const response = await authAPI.register(registrationData);
      const { user: userData, accessToken, refreshToken } = response.data.data;
      
      // Store tokens and user data
      setTokens(accessToken, refreshToken);
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      
      // Initialize socket connection
      await socketService.connect();
      
      toast.success('Account created successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authAPI.forgotPassword(email);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await authAPI.resetPassword(token, newPassword);
      toast.success('Password reset successfully');
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout API if refresh token exists
    if (refreshToken) {
      authAPI.logout(refreshToken).catch(console.error);
    }
    
    // Disconnect socket
    socketService.disconnect();
    
    // Clear local storage
    setUser(null);
    clearTokens();
    localStorage.removeItem(USER_STORAGE_KEY);
    
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const response = await authAPI.getMe(); // Get fresh user data
      const updatedUser = response.data.data.user;
      
      // Update current user if it's the same user
      if (user?.id === userId) {
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};