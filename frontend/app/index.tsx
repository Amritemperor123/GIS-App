import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, Modal } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView from "../components/MapView";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { getSectorForLocation } from "../utils/locationUtils";
import { router } from 'expo-router';
import { Camera, LogOut, X } from 'lucide-react-native';

function HomeScreenContent() {
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
          // Add notification for the service provider
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

  if (user?.type === 'service_provider') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
            <Text style={styles.sectorText}>{user.sector} Sector Provider</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.providerActions}>
          <TouchableOpacity 
            style={styles.dashboardButton} 
            onPress={handleServiceProviderAccess}
          >
            <Text style={styles.dashboardButtonText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>

        <MapView />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Logout">
          <LogOut color="#fff" />
        </TouchableOpacity>
      </View>

      <MapView />

      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default function HomeScreen() {
  return (
    <ProtectedRoute>
      <HomeScreenContent />
    </ProtectedRoute>
  );
}
