import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { BASE_URL } from '../utils/api';
import { useAuth } from './AuthContext';

export interface Notification {
  notification_id: number;
  notification_target: string;
  type: string;
  job_id: number;
  sector: string;
  state: number;
  recipient_id: number;
  timestamp: string;
  key: number;
  isRead?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'notification_id' | 'timestamp' | 'key'>) => Promise<void>;
  markAsRead: (notificationId: number) => void;
  getNotificationsForSector: (sector: string) => Notification[];
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (user) {
      try {
        const response = await fetch(`${BASE_URL}/api/notifications/${user.user_id}`);
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const addNotification = async (notificationData: Omit<Notification, 'notification_id' | 'timestamp' | 'key'>) => {
    try {
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      const data = await response.json();
      if (data.notificationId) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // This endpoint is not yet created, but we can prepare for it.
      await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationsForSector = (sector: string) => {
    return notifications.filter(n => n.sector === sector);
  };

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    getNotificationsForSector,
    loadNotifications: fetchNotifications,
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
