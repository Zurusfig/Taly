import { create } from 'zustand';

export type CurrencyMode = 'usd' | 'thb' | 'both';
export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface PortfolioState {
  currencyMode: CurrencyMode;
  timeRange: TimeRange;
  usdToThb: number;
  rateUpdatedAt: string | null;
  lastRefreshed: string | null;
  setCurrencyMode: (m: CurrencyMode) => void;
  setTimeRange: (r: TimeRange) => void;
  setRate: (rate: number, at: string) => void;
  setLastRefreshed: (at: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()((set) => ({
  currencyMode: 'both',
  timeRange: '1M',
  usdToThb: 35,
  rateUpdatedAt: null,
  lastRefreshed: null,
  setCurrencyMode: (currencyMode) => set({ currencyMode }),
  setTimeRange: (timeRange) => set({ timeRange }),
  setRate: (usdToThb, rateUpdatedAt) => set({ usdToThb, rateUpdatedAt }),
  setLastRefreshed: (lastRefreshed) => set({ lastRefreshed }),
}));

export function isMarketHours(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const etHour = (now.getUTCHours() + 19) % 24; // UTC-5 (EST)
  const mins = etHour * 60 + now.getUTCMinutes();
  return mins >= 570 && mins < 960; // 9:30–16:00 ET
}

export function shouldAutoRefresh(lastRefreshed: string | null): boolean {
  if (!lastRefreshed) return true;
  const elapsed = Date.now() - new Date(lastRefreshed).getTime();
  return elapsed > 15 * 60 * 1000 && isMarketHours();
}
