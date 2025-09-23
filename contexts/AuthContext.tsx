"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, UserResponse, AuthResponse, Notification } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT' | 'FAST_CLIENT';
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  isProfileIncomplete: boolean;
  isCheckingProfile: boolean;
  completeClientProfile: (profileData: {
    companyName: string;
    contactPerson: string;
    phone?: string;
    address?: string;
  }) => Promise<boolean>;
  skipProfileCompletion: () => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  isLoadingNotifications: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  const checkClientProfile = useCallback(async (userId: string) => {
    setIsCheckingProfile(true);
    try {
      await apiClient.getClientProfileByUserId(userId);
      setIsProfileIncomplete(false);
    } catch (error) {
      // Si el endpoint retorna error (404), significa que el perfil no existe
      console.log("Client profile not found. User needs to complete profile.");
      setIsProfileIncomplete(true);
    } finally {
      setIsCheckingProfile(false);
    }
  }, []);

  const completeClientProfile = useCallback(async (profileData: {
    companyName: string;
    contactPerson: string;
    phone?: string;
    address?: string;
  }): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await apiClient.completeClientProfile(user.id, profileData);
      setIsProfileIncomplete(false);
      return true;
    } catch (error) {
      console.error('Failed to complete client profile:', error);
      return false;
    }
  }, [user]);

  const skipProfileCompletion = useCallback(() => {
    // Permite al usuario continuar sin completar el perfil
    setIsProfileIncomplete(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
      
      // Si el usuario es CLIENT (pero no FAST_CLIENT), verificar si tiene perfil completo
      if (userData.role === 'CLIENT') {
        await checkClientProfile(userData.id);
      } else {
        // Si no es CLIENT regular, asegurar que el estado esté en false
        // FAST_CLIENT no necesita completar perfil
        setIsProfileIncomplete(false);
        setIsCheckingProfile(false);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // If token is invalid, clear it
      apiClient.clearToken();
      setUser(null);
      setIsProfileIncomplete(false);
      setIsCheckingProfile(false);
    }
  }, [checkClientProfile]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.setToken(token);
        await refreshUser();
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response: AuthResponse = await apiClient.login(email, password);
      
      // Get the full user data with role information
      await refreshUser();
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (fullName: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response: AuthResponse = await apiClient.register(fullName, email, password);
      
      // Get the full user data with role information
      await refreshUser();
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    setIsProfileIncomplete(false);
    setIsCheckingProfile(false);
    
    // Clear notifications on logout
    setNotifications([]);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  // Notifications functions
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingNotifications(true);
    try {
      let fetchedNotifications: Notification[] = [];
      
      if (user.role === 'ADMIN') {
        fetchedNotifications = await apiClient.getAllNotificationsForAdmin();
      } else {
        fetchedNotifications = await apiClient.getNotifications();
      }
      
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Polling effect for notifications
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();

    // Set up polling interval (5 minutes)
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    setPollInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, fetchNotifications]);

  // Fetch notifications on route change (for immediate updates)
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [pathname, user, fetchNotifications]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading, 
      refreshUser,
      isProfileIncomplete,
      isCheckingProfile,
      completeClientProfile,
      skipProfileCompletion,
      // Notifications
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      isLoadingNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}