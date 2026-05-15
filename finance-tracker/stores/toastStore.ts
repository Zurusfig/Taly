import { create } from 'zustand';

export interface ToastItem {
  id: string;
  key: string;
}

interface ToastState {
  queue: ToastItem[];
  push: (key: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  queue: [],
  push: (key) => set((s) => ({ queue: [...s.queue, { id: `${key}-${Date.now()}`, key }] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
}));
