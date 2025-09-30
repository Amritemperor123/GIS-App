import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, Modal, Switch } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView from "../components/MapView";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useJobs } from "../contexts/JobsContext";
import { getSectorForLocation } from "../utils/locationUtils";
import { router } from 'expo-router';
import { Camera, LogOut, X, UserCircle2, Bell, BarChart3, LayoutDashboard, Moon, Sun } from 'lucide-react-native';
import { useColorScheme } from "../hooks/use-color-scheme";

function HomeScreenContent() {
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const { createJob } = useJobs();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mapDarkMode, setMapDarkMode] = useState<boolean>(useColorScheme() === 'dark');
  const insets = useSafeAreaInsets();

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

  const handleImageUpload = async () => {
    try {
      // Request camera permission
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPerm.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permission to take a photo.');
        return;
      }

      // Request location permissions
      const DEFAULT_LOCATION = { latitude: 25.3176, longitude: 82.9739 }; // Varanasi
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== 'granted') {
        Alert.alert('Permission Required', 'Location denied. Using default location (Varanasi).');
      }

      // Launch camera (do not save to device storage; image stays in app cache)
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        
        // Get current location
        let userLocation = DEFAULT_LOCATION;
        try {
          if (locationPermission.status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            userLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
          }
        } catch (e) {
          // keep default Varanasi on failure
        }

        // Determine which sector the user is in
        const sectorInfo = getSectorForLocation(userLocation);
        
        if (sectorInfo) {
          // Create job and notify providers in sector
          createJob({
            sector: sectorInfo.sector,
            location: userLocation,
            imageUri: result.assets[0].uri,
            createdBy: user?.name || 'Unknown User',
          });
          addNotification({
            imageUrl: result.assets[0].uri,
            location: userLocation,
            sector: sectorInfo.sector,
            uploadedBy: user?.name || 'Unknown User',
          });

          Alert.alert(
            'Upload Successful',
            `Image uploaded successfully! Service provider for ${sectorInfo.sector} sector (${sectorInfo.provider}) will be notified.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Location Not Covered',
            'Your current location is not within any service sector. Please try again from a covered area.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setShowUploadModal(false);
    }
  };

  const handleServiceProviderAccess = () => {
    router.push('/dashboard');
  };

  const handleOpenSidebar = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleNotificationsPress = () => {
    if (user?.type === 'service_provider') {
      router.push('/dashboard');
    } else {
      Alert.alert('Notifications', 'Notifications view is coming soon.');
    }
    setIsSidebarOpen(false);
  };
  const handleStatisticsPress = () => {
    Alert.alert('Statistics', 'Statistics view is coming soon.');
    setIsSidebarOpen(false);
  };
  const handleLogoutPress = () => {
    setIsSidebarOpen(false);
    handleLogout();
  };

  if (user?.type === 'service_provider') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <TouchableOpacity style={[styles.profileFab, { top: insets.top + 12 }]} onPress={handleOpenSidebar} accessibilityRole="button" accessibilityLabel="Open profile menu">
          <UserCircle2 color="#111827" />
        </TouchableOpacity>
        <MapView mapDarkMode={mapDarkMode} />

        {isSidebarOpen && (
          <View style={styles.sidebarOverlay}>
            <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={handleCloseSidebar} />
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>Menu</Text>
                <TouchableOpacity onPress={handleCloseSidebar} accessibilityRole="button" accessibilityLabel="Close menu">
                  <X color="#111827" />
                </TouchableOpacity>
              </View>
              <View style={styles.profileSection}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{(user?.name || 'U').slice(0,1).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{user?.name}</Text>
                  <Text style={styles.profileSubtext}>Service Provider • {user?.sector}</Text>
                </View>
              </View>
              <View style={styles.sidebarContent}>
                <View style={styles.menuList}>
                  <TouchableOpacity style={styles.menuItem} onPress={handleServiceProviderAccess}>
                    <LayoutDashboard color="#111827" />
                    <Text style={styles.menuItemText}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={handleNotificationsPress}>
                    <Bell color="#111827" />
                    <Text style={styles.menuItemText}>Notifications</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={handleStatisticsPress}>
                    <BarChart3 color="#111827" />
                    <Text style={styles.menuItemText}>Statistics</Text>
                  </TouchableOpacity>
                  <View style={styles.menuItemRow}>
                    {mapDarkMode ? <Moon color="#111827" /> : <Sun color="#111827" />}
                    {mapDarkMode ? <Text style={styles.menuItemText}>Dark Mode</Text> : <Text style={styles.menuItemText}>Light Mode</Text>}
                    <View style={{ flex: 1 }} />
                    <Switch value={mapDarkMode} onValueChange={setMapDarkMode} />
                  </View>
                </View>
                <View style={styles.sidebarFooter}>
                  <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogoutPress}>
                    <LogOut color="#ef4444" />
                    <Text style={[styles.menuItemText, styles.menuItemDangerText]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <TouchableOpacity style={[styles.profileFab, { top: insets.top + 12 }]} onPress={handleOpenSidebar} accessibilityRole="button" accessibilityLabel="Open profile menu">
        <UserCircle2 color="#111827" />
      </TouchableOpacity>
        <MapView mapDarkMode={mapDarkMode} />

      <TouchableOpacity
        style={[styles.uploadButton, { bottom: insets.bottom + 20 }, isUploading && styles.uploadButtonDisabled]}
        onPress={() => setShowUploadModal(true)}
        disabled={isUploading}
        accessibilityRole="button"
        accessibilityLabel={isUploading ? 'Uploading' : 'Upload image'}
      >
        <Camera color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Image</Text>
            <Text style={styles.modalSubtitle}>
              Upload an image to notify service providers in your area
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUploadModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <X color="#374151" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.uploadModalButton]}
                onPress={handleImageUpload}
                disabled={isUploading}
                accessibilityRole="button"
                accessibilityLabel={isUploading ? 'Uploading' : 'Take photo'}
              >
                <Camera color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isSidebarOpen && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={handleCloseSidebar} />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Menu</Text>
              <TouchableOpacity onPress={handleCloseSidebar} accessibilityRole="button" accessibilityLabel="Close menu">
                <X color="#111827" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileSection}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{(user?.name || 'U').slice(0,1).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileSubtext}>Normal User</Text>
              </View>
            </View>
            <View style={styles.sidebarContent}>
              <View style={styles.menuList}>
                <TouchableOpacity style={styles.menuItem} onPress={handleNotificationsPress}>
                  <Bell color="#111827" />
                  <Text style={styles.menuItemText}>Notifications</Text>
                </TouchableOpacity>
                <View style={styles.menuItemRow}>
                  {mapDarkMode ? <Moon color="#111827" /> : <Sun color="#111827" />}
                  {mapDarkMode ? <Text style={styles.menuItemText}>Dark Mode</Text> : <Text style={styles.menuItemText}>Light Mode</Text>}
                  <View style={{ flex: 1 }} />
                  <Switch value={mapDarkMode} onValueChange={setMapDarkMode} />
                </View>
                <TouchableOpacity style={styles.menuItem} onPress={handleStatisticsPress}>
                  <BarChart3 color="#111827" />
                  <Text style={styles.menuItemText}>Statistics</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sidebarFooter}>
                <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogoutPress}>
                  <LogOut color="#ef4444" />
                  <Text style={[styles.menuItemText, styles.menuItemDangerText]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileFab: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectorText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  providerActions: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dashboardButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  dashboardButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  uploadModalButton: {
    backgroundColor: '#3b82f6',
  },
  uploadModalButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sidebar: {
    width: 280,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    display: 'flex',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 8,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#111827',
    fontWeight: '700',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  profileSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuList: {
    paddingTop: 8,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  menuItemDangerText: {
    color: '#ef4444',
  },
  sidebarContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sidebarFooter: {
    paddingTop: 12,
  },
});

export default function HomeScreen() {
  return (
    <ProtectedRoute>
      <HomeScreenContent />
    </ProtectedRoute>
  );
}
