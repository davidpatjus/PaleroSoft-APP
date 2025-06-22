"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // If token is invalid, clear it
      apiClient.clearToken();
      setUser(null);
    }
  };

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
  }, []);

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
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, refreshUser }}>
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