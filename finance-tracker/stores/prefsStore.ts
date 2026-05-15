import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'prefs_minimal_mode';

interface PrefsState {
  minimalMode: boolean;
  setMinimalMode: (v: boolean) => void;
  hydrate: () => Promise<void>;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  minimalMode: false,
  setMinimalMode: async (v) => {
    set({ minimalMode: v });
    await SecureStore.setItemAsync(KEY, v ? '1' : '0');
  },
  hydrate: async () => {
    const val = await SecureStore.getItemAsync(KEY);
    if (val !== null) set({ minimalMode: val === '1' });
  },
}));
