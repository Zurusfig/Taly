import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { TimeRange } from '@/stores/portfolioStore';

export interface Snapshot {
  id: string;
  snapshot_date: string;
  total_value_usd: number;
  total_value_thb: number;
}

function rangeStart(range: TimeRange): string {
  const now = new Date();
  switch (range) {
    case '1D': return format(subDays(now, 2), 'yyyy-MM-dd');
    case '1W': return format(subWeeks(now, 1), 'yyyy-MM-dd');
    case '1M': return format(subMonths(now, 1), 'yyyy-MM-dd');
    case '3M': return format(subMonths(now, 3), 'yyyy-MM-dd');
    case '1Y': return format(subYears(now, 1), 'yyyy-MM-dd');
    case 'ALL': return '2000-01-01';
  }
}

export function usePortfolioSnapshots(range: TimeRange) {
  return useQuery<Snapshot[]>({
    queryKey: ['portfolio_snapshots', range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('id, snapshot_date, total_value_usd, total_value_thb')
        .gte('snapshot_date', rangeStart(range))
        .order('snapshot_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useYesterdaySnapshot() {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  return useQuery<Snapshot | null>({
    queryKey: ['portfolio_snapshots', 'yesterday'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('id, snapshot_date, total_value_usd, total_value_thb')
        .lte('snapshot_date', yesterday)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useTakeSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ totalUsd, usdToThb }: { totalUsd: number; usdToThb: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase.from('portfolio_snapshots').upsert(
        {
          user_id: user.id,
          snapshot_date: today,
          total_value_usd: Math.round(totalUsd * 100) / 100,
          total_value_thb: Math.round(totalUsd * usdToThb * 100) / 100,
        },
        { onConflict: 'user_id,snapshot_date' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio_snapshots'] }),
  });
}
