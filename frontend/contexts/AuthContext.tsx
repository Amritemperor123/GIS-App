import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin, apiSignup } from '../utils/api';

export interface User {
  id: string;
  email: string;
  username?: string;
  name: string;
  type: 'normal' | 'service_provider';
  sector?: string; // For service providers
  providerName?: string; // For service providers
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (params: { username: string; contactNumber: string; password: string; userType?: 'normal' | 'service_provider' }) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await apiLogin({ username, password });
      if (!result?.success || !result?.user) return false;
      const apiUser = result.user as any;
      const mappedUser: User = {
        id: apiUser.id,
        email: '',
        username: apiUser.username,
        name: apiUser.name ?? apiUser.username,
        type: apiUser.type,
        sector: apiUser.sector,
        providerName: apiUser.providerName,
      };
      await AsyncStorage.setItem('user', JSON.stringify(mappedUser));
      setUser(mappedUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (params: { username: string; contactNumber: string; password: string; userType?: 'normal' | 'service_provider' }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await apiSignup(params);
      return !!result?.success;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
