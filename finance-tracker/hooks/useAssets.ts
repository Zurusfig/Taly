import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Asset } from '@/lib/types';
import { usePortfolioStore } from '@/stores/portfolioStore';

export type { Asset };

export interface AssetInput {
  type: Asset['type'];
  symbol: string | null;
  name: string;
  quantity: number;
  avg_cost_per_unit: number | null;
  currency: string;
}

export interface SymbolResult {
  symbol: string;
  description: string;
  type: string;
  displaySymbol: string;
}

export interface PriceInfo {
  current_price: number;
  percent_change: number;
}

export function useAssets() {
  return useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSearchSymbols(query: string) {
  return useQuery<SymbolResult[]>({
    queryKey: ['symbol_search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data, error } = await supabase.functions.invoke('search-symbols', {
        body: { query },
      });
      if (error) throw error;
      return ((data as SymbolResult[]) ?? []).slice(0, 12);
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('assets')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AssetInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useRefreshPrices() {
  const qc = useQueryClient();
  const { setRate, setLastRefreshed } = usePortfolioStore();

  return useMutation({
    mutationFn: async (assets: Asset[]) => {
      const symbolAssets = assets.filter((a) => a.symbol);
      if (symbolAssets.length === 0) return { prices: {}, usdToThb: null };

      const { data, error } = await supabase.functions.invoke('refresh-prices', {
        body: {
          assets: symbolAssets.map((a) => ({
            id: a.id,
            symbol: a.symbol,
            type: a.type,
            currency: a.currency,
          })),
        },
      });
      if (error) throw error;

      const { prices, usdToThb } = data as {
        prices: Record<string, PriceInfo>;
        usdToThb: number;
      };

      if (usdToThb) setRate(usdToThb, new Date().toISOString());

      const now = new Date().toISOString();
      await Promise.all(
        symbolAssets
          .filter((a) => a.symbol && prices[a.symbol!] != null)
          .map((a) =>
            supabase.from('assets').update({
              last_price: prices[a.symbol!]!.current_price,
              last_price_updated_at: now,
            }).eq('id', a.id),
          ),
      );

      setLastRefreshed(now);
      return { prices, usdToThb };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}
