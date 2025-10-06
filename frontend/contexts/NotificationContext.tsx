import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { BASE_URL } from '../utils/api';
import { useAuth } from './AuthContext';

export interface Notification {
  notificationId: number;
  recipientUserId: number;
  type: string;
  jobId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'notificationId' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const response = await fetch(`${BASE_URL}/api/notifications/${user.id}`);
          const data = await response.json();
          if (data.success) {
            setNotifications(data.notifications);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
  }, [user]);

  const addNotification = async (notificationData: Omit<Notification, 'notificationId' | 'createdAt' | 'isRead'>) => {
    try {
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });
      const data = await response.json();
      if (data.success) {
        // Refetch notifications after adding a new one
        const response = await fetch(`${BASE_URL}/api/notifications/${notificationData.recipientUserId}`);
        const newData = await response.json();
        if (newData.success) {
          setNotifications(newData.notifications);
        }
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = (notificationId: number) => {
    // TODO: Implement backend logic to mark notification as read
    setNotifications(prev =>
      prev.map(notification =>
        notification.notificationId === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
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
