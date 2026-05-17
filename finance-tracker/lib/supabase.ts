import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Three contexts:
//   browser  → typeof localStorage !== 'undefined' → use localStorage
//   native   → Platform.OS !== 'web'               → use SecureStore
//   Node SSR → neither                              → no-op (Metro startup)
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(key);
    return null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof localStorage !== 'undefined') { localStorage.setItem(key, value); return; }
    if (Platform.OS !== 'web') { await SecureStore.setItemAsync(key, value); return; }
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof localStorage !== 'undefined') { localStorage.removeItem(key); return; }
    if (Platform.OS !== 'web') { await SecureStore.deleteItemAsync(key); return; }
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
