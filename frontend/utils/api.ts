import Constants from 'expo-constants';
import { Platform } from 'react-native';
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  const hostUri: string | undefined = (Constants as any).expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:3000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}
const BASE_URL = resolveBaseUrl();

export async function apiSignup(params: { username: string; contactNumber: string; password: string; userType?: 'normal' | 'service_provider'; sector?: string }) {
  const { username, contactNumber, password, userType, sector } = params;
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_name: username,
      contact: contactNumber,
      password,
      user_type: userType,
      sector,
    }),
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'Signup failed');
  }
  return res.json();
}

export async function apiLogin(params: { username: string; password: string }) {

  const { username, password } = params;

  const res = await fetch(`${BASE_URL}/api/auth/login`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ user_name: username, password }),

  });

  if (!res.ok) {

    const data = await safeJson(res);

    throw new Error(data?.error || 'Login failed');

  }

  return res.json();

}

export async function apiUpdateUser(params: { id: number | string; username?: string; contact?: string; sector?: string | null }) {
  const { id, ...updateData } = params;
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'Update failed');
  }
  return res.json();
}

export async function apiDeleteUser(id: number | string) {
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'Delete failed');
  }
  return res.json();
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export { BASE_URL };
