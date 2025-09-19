import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { router } from 'expo-router';

function ServiceProviderDashboardContent() {
  const { user, logout } = useAuth();
  const { notifications, getNotificationsForSector, markAsRead, loadNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    Alert.alert(
      'Image Upload Notification',
      `New image uploaded in ${notification.sector} sector by ${notification.uploadedBy}`,
      [
        { text: 'OK' }
      ]
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.notificationImage} />
        </View>
        <View style={styles.notificationDetails}>
          <Text style={styles.notificationTitle}>
            New Image Upload - {item.sector} Sector
          </Text>
          <Text style={styles.notificationSubtitle}>
            Uploaded by: {item.uploadedBy}
          </Text>
          <Text style={styles.notificationTime}>
            {item.uploadedAt.toLocaleString()}
          </Text>
          <Text style={styles.notificationLocation}>
            Location: {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const sectorNotifications = user?.sector 
    ? getNotificationsForSector(user.sector)
    : notifications;

  const unreadCount = sectorNotifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
          <Text style={styles.sectorText}>{user?.sector} Sector Provider</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sectorNotifications.length}</Text>
          <Text style={styles.statLabel}>Total Notifications</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      <View style={styles.notificationsHeader}>
        <Text style={styles.notificationsTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {sectorNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No notifications yet</Text>
          <Text style={styles.emptyStateSubtext}>
            You'll receive notifications when users upload images in your sector
          </Text>
        </View>
      ) : (
        <FlatList
          data={sectorNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.notificationsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  refreshText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  notificationImage: {
    width: '100%',
    height: '100%',
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  notificationLocation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default function ServiceProviderDashboard() {
  return (
    <ProtectedRoute>
      <ServiceProviderDashboardContent />
    </ProtectedRoute>
  );
}
