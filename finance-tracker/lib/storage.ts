import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getItem(key: string): Promise<string | null> {
  if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  if (Platform.OS !== 'web') return SecureStore.getItemAsync(key);
  return null;
}

export async function setItem(key: string, value: string): Promise<void> {
  if (typeof localStorage !== 'undefined') { localStorage.setItem(key, value); return; }
  if (Platform.OS !== 'web') { await SecureStore.setItemAsync(key, value); return; }
}
