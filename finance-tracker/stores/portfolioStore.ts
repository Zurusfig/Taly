import { create } from 'zustand';

interface PortfolioState {
  usdToThb: number;
  lastRefreshed: string | null;
  setRate: (rate: number, at: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()((set) => ({
  usdToThb: 35,
  lastRefreshed: null,
  setRate: (usdToThb, lastRefreshed) => set({ usdToThb, lastRefreshed }),
}));
