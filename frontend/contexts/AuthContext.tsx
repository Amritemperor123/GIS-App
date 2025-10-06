import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin, apiSignup, apiUpdateUser } from '../utils/api';

export interface User {
  id: string;
  username: string;
  contact?: string;
  type: 'normal' | 'service_provider';
  sector?: string; 
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (params: { username: string; contactNumber: string; password: string; userType?: 'normal' | 'service_provider'; sector?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (fields: { username?: string; contact?: string; sector?: string | null }) => Promise<boolean>;
  deleteUser: () => Promise<boolean>;
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
        username: apiUser.username,
        contact: apiUser.contact,
        type: apiUser.type,
        sector: apiUser.sector,
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

  const signup = async (params: { username: string; contactNumber: string; password: string; userType?: 'normal' | 'service_provider'; sector?: string }): Promise<boolean> => {
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

  const updateUser = async (fields: { username?: string; contact?: string; sector?: string | null }): Promise<boolean> => {
    if (!user) return false;
    try {
      await apiUpdateUser({ id: user.id, ...fields });
      const updatedUser = { ...user, ...fields };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (e) {
      console.error('Update user error:', e);
      return false;
    }
  };

  const deleteUser = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      await apiDeleteUser(user.id);
      await logout();
      return true;
    } catch (e) {
      console.error('Delete user error:', e);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    updateUser,
    deleteUser,
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
