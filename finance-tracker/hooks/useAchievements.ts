import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type AchievementKey =
  | 'first_log'
  | 'log_100'
  | 'log_1000'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'fast_100'
  | 'first_quest'
  | 'quests_10'
  | 'first_harvest'
  | 'garden_10'
  | 'under_budget_month';

export const ACHIEVEMENT_META: Record<AchievementKey, { title: string; xp: number }> = {
  first_log: { title: 'First log', xp: 10 },
  log_100: { title: '100 transactions', xp: 20 },
  log_1000: { title: '1,000 transactions', xp: 50 },
  streak_7: { title: '7-day streak', xp: 15 },
  streak_30: { title: '30-day streak', xp: 30 },
  streak_100: { title: '100-day streak', xp: 75 },
  fast_100: { title: '100 fast logs', xp: 25 },
  first_quest: { title: 'First quest', xp: 15 },
  quests_10: { title: '10 quests', xp: 30 },
  first_harvest: { title: 'First harvest', xp: 25 },
  garden_10: { title: 'Garden of 10', xp: 40 },
  under_budget_month: { title: 'Under budget month', xp: 50 },
};

export function useCheckAchievements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (context: {
      txCount?: number;
      streakDays?: number;
      fastLogCount?: number;
      questsCompleted?: number;
      gardenCount?: number;
      isHarvest?: boolean;
      underBudgetMonth?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: existing } = await supabase
        .from('achievements')
        .select('key')
        .eq('user_id', user.id);
      const alreadyUnlocked = new Set((existing ?? []).map((a: { key: string }) => a.key));

      const toUnlock: AchievementKey[] = [];

      if (context.txCount !== undefined) {
        if (context.txCount >= 1 && !alreadyUnlocked.has('first_log')) toUnlock.push('first_log');
        if (context.txCount >= 100 && !alreadyUnlocked.has('log_100')) toUnlock.push('log_100');
        if (context.txCount >= 1000 && !alreadyUnlocked.has('log_1000')) toUnlock.push('log_1000');
      }
      if (context.streakDays !== undefined) {
        if (context.streakDays >= 7 && !alreadyUnlocked.has('streak_7')) toUnlock.push('streak_7');
        if (context.streakDays >= 30 && !alreadyUnlocked.has('streak_30')) toUnlock.push('streak_30');
        if (context.streakDays >= 100 && !alreadyUnlocked.has('streak_100')) toUnlock.push('streak_100');
      }
      if (context.fastLogCount !== undefined) {
        if (context.fastLogCount >= 100 && !alreadyUnlocked.has('fast_100')) toUnlock.push('fast_100');
      }
      if (context.questsCompleted !== undefined) {
        if (context.questsCompleted >= 1 && !alreadyUnlocked.has('first_quest')) toUnlock.push('first_quest');
        if (context.questsCompleted >= 10 && !alreadyUnlocked.has('quests_10')) toUnlock.push('quests_10');
      }
      if (context.gardenCount !== undefined) {
        if (context.gardenCount >= 10 && !alreadyUnlocked.has('garden_10')) toUnlock.push('garden_10');
      }
      if (context.isHarvest && !alreadyUnlocked.has('first_harvest')) toUnlock.push('first_harvest');
      if (context.underBudgetMonth && !alreadyUnlocked.has('under_budget_month')) toUnlock.push('under_budget_month');

      if (toUnlock.length === 0) return [];

      await supabase.from('achievements').insert(
        toUnlock.map((key) => ({ user_id: user.id, key })),
      );

      // Apply XP for each
      const { data: progress } = await supabase
        .from('user_progress')
        .select('id, xp')
        .eq('user_id', user.id)
        .single();
      if (progress) {
        const bonusXp = toUnlock.reduce((s, k) => s + ACHIEVEMENT_META[k].xp, 0);
        await supabase
          .from('user_progress')
          .update({ xp: progress.xp + bonusXp, updated_at: new Date().toISOString() })
          .eq('id', progress.id);
      }

      return toUnlock;
    },
    onSuccess: (unlocked) => {
      if ((unlocked ?? []).length > 0) {
        qc.invalidateQueries({ queryKey: ['user_progress'] });
      }
    },
  });
}
