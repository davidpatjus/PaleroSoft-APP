"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, UserResponse, AuthResponse } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

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
      
      // Si el usuario es CLIENT, verificar si tiene perfil completo
      if (userData.role === 'CLIENT') {
        await checkClientProfile(userData.id);
      } else {
        // Si no es CLIENT, asegurar que el estado esté en false
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
  };

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
      skipProfileCompletion
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