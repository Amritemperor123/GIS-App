import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getAllSectors, getSectorForLocation } from '../utils/locationUtils';
import { useAuth } from '../contexts/AuthContext';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'normal' | 'service_provider'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth() as any;
  const [sector, setSector] = useState<string>('');
  const [sectorAuto, setSectorAuto] = useState<string>('');
  const [isDetectingSector, setIsDetectingSector] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [useCustomSector, setUseCustomSector] = useState(false);

  useEffect(() => {
    const uniqueSectors = Array.from(new Set(getAllSectors().map(s => s.sector)));
    setSectors(uniqueSectors);
  }, []);

  useEffect(() => {
    if (userType !== 'service_provider') return;
    (async () => {
      try {
        setIsDetectingSector(true);
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          setSectorAuto('');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const info = getSectorForLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setSectorAuto(info?.sector || '');
      } finally {
        setIsDetectingSector(false);
      }
    })();
  }, [userType]);

  const handleSignup = async () => {
    if (!username || !contactNumber || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!/^\d{10}$/.test(contactNumber)) {
      Alert.alert('Error', 'Enter a valid 10-digit contact number');
      return;
    }

    if (userType === 'service_provider') {
      const pickedSector = useCustomSector ? sector : sectorAuto;
      if (!pickedSector) {
        Alert.alert('Error', 'Sector ID is required for service providers');
        return;
      }
    }

    setIsLoading(true);
    try {
      const success = await signup({ username, contactNumber, password, userType, sector: userType === 'service_provider' ? (useCustomSector ? sector : sectorAuto) : undefined });
      if (success) {
        Alert.alert('Success', 'Account created. You can sign in now.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      } else {
        Alert.alert('Error', 'Signup failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter a username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={contactNumber}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, '').slice(0, 10);
                setContactNumber(digitsOnly);
              }}
              placeholder="1234567890"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
            />
          </View>

          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'normal' && styles.userTypeButtonActive
              ]}
              onPress={() => setUserType('normal')}
              accessibilityRole="button"
              accessibilityLabel="Normal user"
            >
              <Feather name="user" size={20} color={userType === 'normal' ? 'white' : '#6b7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'service_provider' && styles.userTypeButtonActive
              ]}
              onPress={() => setUserType('service_provider')}
              accessibilityRole="button"
              accessibilityLabel="Service provider"
            >
              <Feather name="briefcase" size={20} color={userType === 'service_provider' ? 'white' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {userType === 'service_provider' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sector ID</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {isDetectingSector ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : (
                  <Text style={{ color: sectorAuto ? '#111827' : '#9ca3af' }}>
                    {sectorAuto ? `Detected: ${sectorAuto}` : 'Unable to detect automatically'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setUseCustomSector(!useCustomSector)}
                style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#f3f4f6', marginBottom: 8 }}
              >
                <Text style={{ color: '#111827' }}>{useCustomSector ? 'Use detected sector' : 'Choose different sector'}</Text>
              </TouchableOpacity>
              {useCustomSector && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={{ maxHeight: 160 }}>
                    {sectors.map((s) => (
                      <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => setSector(s)}>
                        <Text style={{ color: sector === s ? '#3b82f6' : '#111827' }}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={{ marginTop: 8, color: '#6b7280' }}>Selected: {sector || 'None'}</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  userTypeTextActive: {
    color: 'white',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
});


