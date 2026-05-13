import { create } from 'zustand';
import type { TransactionType } from '@/lib/types';

interface QuickLogState {
  type: TransactionType;
  walletId: string | null;
  categoryId: string | null;
  toWalletId: string | null;
  setType: (t: TransactionType) => void;
  setWalletId: (id: string) => void;
  setCategoryId: (id: string | null) => void;
  setToWalletId: (id: string | null) => void;
  reset: () => void;
}

export const useQuickLogStore = create<QuickLogState>((set) => ({
  type: 'expense',
  walletId: null,
  categoryId: null,
  toWalletId: null,
  setType: (type) => set({ type, categoryId: null, toWalletId: null }),
  setWalletId: (walletId) => set({ walletId }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setToWalletId: (toWalletId) => set({ toWalletId }),
  reset: () => set({ type: 'expense', walletId: null, categoryId: null, toWalletId: null }),
}));
