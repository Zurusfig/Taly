import * as SecureStore from 'expo-secure-store';

const hasLocalStorage = typeof localStorage !== 'undefined';

export async function getItem(key: string): Promise<string | null> {
  if (hasLocalStorage) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (hasLocalStorage) { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}
