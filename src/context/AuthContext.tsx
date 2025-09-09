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
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Initialize socket connection if user is logged in
        if (accessToken) {
          socketService.connect().catch(console.error);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
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

      // Initialize socket connection with a small delay to ensure token is stored
      setTimeout(() => {
        socketService.connect().catch(error => {
          console.log('Socket connection failed during login:', error.message);
        });
      }, 100);

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
          location: '',
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

      // Initialize socket connection with a small delay to ensure token is stored
      setTimeout(() => {
        socketService.connect().catch(error => {
          console.log('Socket connection failed during registration:', error.message);
        });
      }, 100);

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
      authAPI.logout().catch(console.error);
    }

    // Disconnect socket
    socketService.disconnect();

    // Clear local storage
    setUser(null);
    clearTokens();
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      console.log('updateProfile called with userId:', userId, 'updates:', updates);

      // If updates are provided, use them directly (for avatar updates)
      if (Object.keys(updates).length > 0) {
        const updatedUser = { ...user, ...updates } as User;
        console.log('Updated user object:', updatedUser);

        // Update current user if it's the same user
        if (user?._id === userId) {
          console.log('Updating user state with new avatar URL:', updates.avatarUrl);
          setUser(updatedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          console.log('User state updated successfully');
        }

        return;
      }

      // Fallback: Get fresh user data from server
      console.log('Fetching fresh user data from server');
      const response = await authAPI.getMe();
      const freshUser = response.data.data.user;
      console.log('Fresh user data from server:', freshUser);

      // Update current user if it's the same user
      if (user?._id === userId) {
        setUser(freshUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
        console.log('User state updated with fresh data');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Force refresh user data from server
  const refreshUser = async (): Promise<void> => {
    try {
      console.log('Refreshing user data from server');
      const response = await authAPI.getMe();
      const freshUser = response.data.data.user;
      console.log('Fresh user data:', freshUser);

      setUser(freshUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
      console.log('User data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
    refreshUser,
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