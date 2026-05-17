import { create } from 'zustand';

export interface MicroFact {
  text: string;
  icon: 'Zap' | 'Flame' | 'Star' | 'Sun' | 'Clock' | 'TrendingDown';
}

interface MicroFeedbackState {
  pendingFact: MicroFact | null;
  setPendingFact: (fact: MicroFact) => void;
  clearFact: () => void;
}

export const useMicroFeedbackStore = create<MicroFeedbackState>((set) => ({
  pendingFact: null,
  setPendingFact: (fact) => set({ pendingFact: fact }),
  clearFact: () => set({ pendingFact: null }),
}));
