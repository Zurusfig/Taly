import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export interface CategoryMastery {
  id: string;
  user_id: string;
  category_id: string;
  level: number;
  xp: number;
  current_streak_weeks: number;
  longest_streak_weeks: number;
}

export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export const MASTERY_THRESHOLDS = [0, 100, 300, 600, 1000] as const;
export const MASTERY_TITLES: Record<number, string> = {
  1: 'Tracker',
  2: 'Observer',
  3: 'Steady Hand',
  4: 'Disciplined',
  5: 'Mastered',
};

export function masteryLevel(xp: number): MasteryLevel {
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

export function masteryNextThreshold(xp: number): number | null {
  const thresholds = [100, 300, 600, 1000];
  for (const t of thresholds) {
    if (xp < t) return t;
  }
  return null;
}

const CM_KEY = ['category_mastery'] as const;

export function useCategoryMasteryMap() {
  return useQuery<Record<string, CategoryMastery>>({
    queryKey: CM_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_mastery')
        .select('*');
      if (error) throw error;
      const map: Record<string, CategoryMastery> = {};
      for (const row of data ?? []) map[row.category_id] = row as CategoryMastery;
      return map;
    },
    staleTime: 5 * 60_000,
  });
}

export function useEvaluateCategoryMastery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      const [{ data: budgets }, { data: txs }, { data: mastery }] = await Promise.all([
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('transactions')
          .select('category_id, amount, occurred_at')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('occurred_at', lastWeekStart.toISOString()),
        supabase.from('category_mastery').select('*').eq('user_id', user.id),
      ]);

      const masteryMap: Record<string, CategoryMastery> = {};
      for (const m of mastery ?? []) masteryMap[m.category_id] = m;

      // Per-category weekly spending
      const thisWeekSpend: Record<string, number> = {};
      const lastWeekSpend: Record<string, number> = {};
      for (const t of txs ?? []) {
        if (!t.category_id) continue;
        const d = new Date(t.occurred_at);
        if (d >= thisWeekStart && d <= thisWeekEnd) {
          thisWeekSpend[t.category_id] = (thisWeekSpend[t.category_id] ?? 0) + Number(t.amount);
        } else if (d >= lastWeekStart && d <= lastWeekEnd) {
          lastWeekSpend[t.category_id] = (lastWeekSpend[t.category_id] ?? 0) + Number(t.amount);
        }
      }

      const weeklyBudgetMap: Record<string, number> = {};
      for (const b of budgets ?? []) {
        if (b.category_id && b.period === 'weekly') weeklyBudgetMap[b.category_id] = Number(b.amount);
      }

      const updates: Promise<void>[] = [];

      for (const catId of Object.keys({ ...thisWeekSpend, ...weeklyBudgetMap })) {
        const spent = thisWeekSpend[catId] ?? 0;
        const lastSpent = lastWeekSpend[catId] ?? 0;
        const budget = weeklyBudgetMap[catId];
        const existing = masteryMap[catId];

        let xpGain = 0;
        if (budget !== undefined) {
          if (spent <= budget) xpGain = 25;
        } else if (lastSpent > 0) {
          const diff = (lastSpent - spent) / lastSpent;
          if (Math.abs(diff) <= 0.1) xpGain = 10; // consistent
          else if (diff > 0.1) xpGain = 25; // improvement
        }

        if (xpGain === 0) continue;

        const newXp = (existing?.xp ?? 0) + xpGain;
        const newLevel = masteryLevel(newXp);
        const prevLevel = masteryLevel(existing?.xp ?? 0);
        const leveledUp = newLevel > (prevLevel);
        const newStreak = (existing?.current_streak_weeks ?? 0) + 1;

        if (existing) {
          updates.push(
            supabase.from('category_mastery').update({
              xp: newXp,
              level: newLevel,
              current_streak_weeks: newStreak,
              longest_streak_weeks: Math.max(newStreak, existing.longest_streak_weeks ?? 0),
            }).eq('id', existing.id).then(() => {}) as Promise<void>,
          );
        } else {
          updates.push(
            supabase.from('category_mastery').insert({
              user_id: user.id,
              category_id: catId,
              xp: newXp,
              level: newLevel,
              current_streak_weeks: 1,
              longest_streak_weeks: 1,
            }).then(() => {}) as Promise<void>,
          );
        }
      }

      await Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CM_KEY }),
  });
}
