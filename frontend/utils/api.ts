import Constants from 'expo-constants';
import { Platform } from 'react-native';
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  const hostUri: string | undefined = (Constants as any).expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:3001`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}
const BASE_URL = resolveBaseUrl();

export async function apiSignup(params: { username: string; contactNumber: string; password: string; userType?: 'normal' | 'service_provider' }) {
  const res = await fetch(`${BASE_URL}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'Signup failed');
  }
  return res.json();
}

export async function apiLogin(params: { username: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'Login failed');
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


