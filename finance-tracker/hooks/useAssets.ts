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
      return data;
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
      return data;
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
  const setRate = usePortfolioStore((s) => s.setRate);

  return useMutation({
    mutationFn: async (assets: Asset[]) => {
      const symbolAssets = assets.filter((a) => a.symbol);
      if (symbolAssets.length === 0) return { updatedCount: 0, usdToThb: null };

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
        prices: Record<string, number>;
        usdToThb: number;
      };

      if (usdToThb) {
        setRate(usdToThb, new Date().toISOString());
      }

      const now = new Date().toISOString();
      await Promise.all(
        symbolAssets
          .filter((a) => a.symbol && prices[a.symbol!] != null)
          .map((a) =>
            supabase
              .from('assets')
              .update({ last_price: prices[a.symbol!]!, last_price_updated_at: now })
              .eq('id', a.id),
          ),
      );

      return { updatedCount: Object.keys(prices).length, usdToThb };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}
