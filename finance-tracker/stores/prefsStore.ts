import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_MINIMAL = 'prefs_minimal_mode';
const KEY_SOUND = 'prefs_sound_enabled';

interface PrefsState {
  minimalMode: boolean;
  soundEnabled: boolean;
  setMinimalMode: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  hydrate: () => Promise<void>;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  minimalMode: false,
  soundEnabled: false,
  setMinimalMode: async (v) => {
    set({ minimalMode: v });
    await SecureStore.setItemAsync(KEY_MINIMAL, v ? '1' : '0');
  },
  setSoundEnabled: async (v) => {
    set({ soundEnabled: v });
    await SecureStore.setItemAsync(KEY_SOUND, v ? '1' : '0');
  },
  hydrate: async () => {
    const [minimal, sound] = await Promise.all([
      SecureStore.getItemAsync(KEY_MINIMAL),
      SecureStore.getItemAsync(KEY_SOUND),
    ]);
    const updates: Partial<PrefsState> = {};
    if (minimal !== null) updates.minimalMode = minimal === '1';
    if (sound !== null) updates.soundEnabled = sound === '1';
    set(updates);
  },
}));
