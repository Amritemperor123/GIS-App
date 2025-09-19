import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  sector: string;
  uploadedBy: string;
  uploadedAt: Date;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'uploadedAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  getNotificationsForSector: (sector: string) => Notification[];
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'uploadedAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      uploadedAt: new Date(),
      isRead: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
  };

  const getNotificationsForSector = (sector: string) => {
    return notifications.filter(notification => notification.sector === sector);
  };

  const saveNotifications = async (notificationsToSave: Notification[]) => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notifications');
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Convert uploadedAt back to Date objects
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          uploadedAt: new Date(n.uploadedAt)
        }));
        setNotifications(notificationsWithDates);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    getNotificationsForSector,
    loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
