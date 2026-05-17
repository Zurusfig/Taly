import { create } from 'zustand';
import { getItem, setItem } from '@/lib/storage';

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
    await setItem(KEY_MINIMAL, v ? '1' : '0');
  },
  setSoundEnabled: async (v) => {
    set({ soundEnabled: v });
    await setItem(KEY_SOUND, v ? '1' : '0');
  },
  hydrate: async () => {
    const [minimal, sound] = await Promise.all([
      getItem(KEY_MINIMAL),
      getItem(KEY_SOUND),
    ]);
    const updates: Partial<PrefsState> = {};
    if (minimal !== null) updates.minimalMode = minimal === '1';
    if (sound !== null) updates.soundEnabled = sound === '1';
    set(updates);
  },
}));
