import { create } from 'zustand';

export type ChartVariant = 'line' | 'bar' | 'stacked' | 'area';

interface ChartState {
  variant: ChartVariant;
  setVariant: (v: ChartVariant) => void;
}

export const useChartStore = create<ChartState>()((set) => ({
  variant: 'bar',
  setVariant: (variant) => set({ variant }),
}));
