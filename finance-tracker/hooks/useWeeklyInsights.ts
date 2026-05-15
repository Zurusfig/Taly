import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, subWeeks, getDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { renderInsightBody, type InsightKey } from '@/lib/garden/insightsPool';

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start: string;
  insight_key: InsightKey;
  insight_body: { title: string; description: string; icon: string };
  seen: boolean;
  generated_at: string;
}

const WI_KEY = ['weekly_insights'] as const;

function thisWeekStart(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

export function useThisSundayInsight() {
  const isSunday = getDay(new Date()) === 0;
  return useQuery<WeeklyInsight | null>({
    queryKey: [...WI_KEY, 'current'],
    queryFn: async () => {
      const ws = thisWeekStart();
      const { data, error } = await supabase
        .from('weekly_insights')
        .select('*')
        .eq('week_start', ws)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as WeeklyInsight;
    },
    enabled: isSunday,
    staleTime: 60 * 60_000,
  });
}

export function useGenerateSundayInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (getDay(new Date()) !== 0) return null; // only on Sunday

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const ws = thisWeekStart();

      // Check if already generated
      const { data: existing } = await supabase
        .from('weekly_insights')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', ws)
        .single();
      if (existing) return null;

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
      const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
      const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });

      const [{ data: txs }, { data: nsd }] = await Promise.all([
        supabase.from('transactions')
          .select('category_id, type, amount, occurred_at, created_at')
          .gte('occurred_at', lastWeekStart.toISOString())
          .lte('occurred_at', weekEnd.toISOString()),
        supabase.from('no_spend_days')
          .select('marked_date')
          .gte('marked_date', ws)
          .lte('marked_date', format(weekEnd, 'yyyy-MM-dd')),
      ]);

      const thisWeekTxs = (txs ?? []).filter((t) => {
        const d = new Date(t.occurred_at);
        return d >= weekStart && d <= weekEnd;
      });
      const lastWeekTxs = (txs ?? []).filter((t) => {
        const d = new Date(t.occurred_at);
        return d >= lastWeekStart && d <= lastWeekEnd;
      });

      // Compute insight candidates
      const candidates: { key: InsightKey; weight: number; data: Parameters<typeof renderInsightBody>[1] }[] = [];

      // top_category_spend
      const catSpend: Record<string, number> = {};
      for (const t of thisWeekTxs) {
        if (t.type === 'expense' && t.category_id) {
          catSpend[t.category_id] = (catSpend[t.category_id] ?? 0) + Number(t.amount);
        }
      }
      const catEntries = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);
      if (catEntries.length > 0) {
        candidates.push({ key: 'top_category_spend', weight: 3, data: { topCategory: { name: catEntries[0][0], amount: catEntries[0][1] } } });
      }

      // no_spend_count
      const noSpendCount = (nsd ?? []).length;
      if (noSpendCount > 0) {
        candidates.push({ key: 'no_spend_count', weight: 4, data: { noSpendCount } });
      }

      // fast_log_milestone
      const fastLogs = thisWeekTxs.filter((t) => {
        const diff = Math.abs(new Date(t.created_at || t.occurred_at).getTime() - new Date(t.occurred_at).getTime()) / 60_000;
        return diff <= 5;
      });
      const fastLogPct = thisWeekTxs.length > 0 ? Math.round((fastLogs.length / thisWeekTxs.length) * 100) : 0;
      if (fastLogPct >= 50) {
        candidates.push({ key: 'fast_log_milestone', weight: 3, data: { fastLogPct } });
      }

      // most_expensive_day
      const daySpend: Record<string, number> = {};
      for (const t of thisWeekTxs) {
        if (t.type === 'expense') {
          const day = format(new Date(t.occurred_at), 'EEEE');
          daySpend[day] = (daySpend[day] ?? 0) + Number(t.amount);
        }
      }
      const dayEntries = Object.entries(daySpend).sort((a, b) => b[1] - a[1]);
      if (dayEntries.length > 0) {
        candidates.push({ key: 'most_expensive_day', weight: 2, data: { mostExpensiveDay: dayEntries[0][0] } });
      }

      if (candidates.length === 0) return null;

      // Weighted random selection
      const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
      let pick = Math.random() * totalWeight;
      let chosen = candidates[0];
      for (const c of candidates) {
        pick -= c.weight;
        if (pick <= 0) { chosen = c; break; }
      }

      const body = renderInsightBody(chosen.key, chosen.data);

      const { data: inserted, error } = await supabase
        .from('weekly_insights')
        .insert({
          user_id: user.id,
          week_start: ws,
          insight_key: chosen.key,
          insight_body: body,
          seen: false,
        })
        .select()
        .single();

      if (error) return null;
      return inserted as WeeklyInsight;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WI_KEY }),
  });
}

export function useDismissInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('weekly_insights').update({ seen: true }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WI_KEY }),
  });
}
