import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { getAllSectors } from '../utils/locationUtils';

function ProfileContent() {
  const { user, updateUser, logout, deleteUser } = useAuth();
  
  const initialUsername = user?.username || '';
  const initialContact = user?.contact || '';
  const initialSector = user?.sector ?? null;

  const [username, setUsername] = useState(initialUsername);
  const [contact, setContact] = useState(initialContact);
  const [sector, setSector] = useState<string | null>(initialSector);
  
  const sectors = useMemo(() => Array.from(new Set(getAllSectors().map(s => s.sector))), []);

  const hasChanged =
    username !== initialUsername ||
    contact !== initialContact ||
    sector !== initialSector;

  const handleSave = async () => {
    if (!user || !hasChanged) return;

    const fieldsToUpdate: { username?: string; contact?: string; sector?: string | null } = {};

    if (username !== initialUsername) {
      if (!username) {
        Alert.alert('Error', 'Name cannot be empty');
        return;
      }
      fieldsToUpdate.username = username;
    }

    if (contact !== initialContact) {
      if (!/^\d{10}$/.test(contact || '')) {
        Alert.alert('Error', 'Enter a valid 10-digit phone');
        return;
      }
      fieldsToUpdate.contact = contact;
    }

    if (sector !== initialSector) {
      fieldsToUpdate.sector = sector;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return;
    }

    const ok = await updateUser(fieldsToUpdate);

    if (ok) {
      Alert.alert('Saved', 'Profile updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteUser();
            if (!ok) {
              Alert.alert('Error', 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service Provider Profile</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Your name" />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        <TextInput 
          style={styles.input} 
          value={contact} 
          onChangeText={(t) => setContact(t.replace(/\D/g, '').slice(0,10))} 
          keyboardType="number-pad" 
          placeholder="1234567890" 
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Sector</Text>
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 180 }}>
            {sectors.map(s => (
              <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => setSector(s)}>
                <Text style={{ color: sector === s ? '#3b82f6' : '#111827' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.selectedText}>Selected: {sector ?? 'None'}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.saveBtn, !hasChanged && styles.saveBtnDisabled]} 
        onPress={handleSave}
        disabled={!hasChanged}
      >
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f9fafb' },
  dropdown: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, backgroundColor: '#f9fafb' },
  dropdownItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  selectedText: { marginTop: 8, color: '#6b7280' },
  saveBtn: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { backgroundColor: '#9ca3af' },
  saveText: { color: 'white', fontWeight: '600' },
  logoutBtn: { backgroundColor: '#f9fafb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#d1d5db' },
  logoutText: { color: '#111827', fontWeight: '600' },
  deleteBtn: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  deleteText: { color: 'white', fontWeight: '600' },
});
