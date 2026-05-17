import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToastStore } from '@/stores/toastStore';

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

export type AchievementCategory =
  | 'Logging'
  | 'Streaks'
  | 'Speed'
  | 'Quests'
  | 'Garden'
  | 'Budgets';

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'Logging',
  'Streaks',
  'Speed',
  'Quests',
  'Garden',
  'Budgets',
];

export const ACHIEVEMENT_META: Record<
  AchievementKey,
  {
    title: string;
    xp: number;
    icon: string;
    category: AchievementCategory;
    description: string;
    hint: string;
  }
> = {
  first_log: {
    title: 'First log',
    xp: 10,
    icon: 'PenLine',
    category: 'Logging',
    description: 'Logged your first transaction.',
    hint: 'Log your first transaction.',
  },
  log_100: {
    title: '100 transactions',
    xp: 20,
    icon: 'ListChecks',
    category: 'Logging',
    description: 'Logged 100 transactions total.',
    hint: 'Reach 100 transactions.',
  },
  log_1000: {
    title: '1,000 transactions',
    xp: 50,
    icon: 'Award',
    category: 'Logging',
    description: 'Logged 1,000 transactions total.',
    hint: 'Reach 1,000 transactions.',
  },
  streak_7: {
    title: '7-day streak',
    xp: 15,
    icon: 'Flame',
    category: 'Streaks',
    description: 'Logged every day for 7 days straight.',
    hint: 'Log for 7 days in a row.',
  },
  streak_30: {
    title: '30-day streak',
    xp: 30,
    icon: 'Flame',
    category: 'Streaks',
    description: 'Logged every day for 30 days straight.',
    hint: 'Log for 30 days in a row.',
  },
  streak_100: {
    title: '100-day streak',
    xp: 75,
    icon: 'Flame',
    category: 'Streaks',
    description: 'Logged every day for 100 days straight.',
    hint: 'Log for 100 days in a row.',
  },
  fast_100: {
    title: '100 fast logs',
    xp: 25,
    icon: 'Zap',
    category: 'Speed',
    description: 'Logged 100 transactions within 5 minutes of the purchase.',
    hint: 'Log 100 transactions at point of purchase.',
  },
  first_quest: {
    title: 'First quest',
    xp: 15,
    icon: 'MapPin',
    category: 'Quests',
    description: 'Completed your first quest.',
    hint: 'Complete a quest.',
  },
  quests_10: {
    title: '10 quests',
    xp: 30,
    icon: 'MapPin',
    category: 'Quests',
    description: 'Completed 10 quests.',
    hint: 'Complete 10 quests.',
  },
  first_harvest: {
    title: 'First harvest',
    xp: 25,
    icon: 'Sprout',
    category: 'Garden',
    description: 'Harvested your first plant to the garden.',
    hint: 'Reach Stage 5 and harvest your plant.',
  },
  garden_10: {
    title: 'Garden of 10',
    xp: 40,
    icon: 'Flower2',
    category: 'Garden',
    description: 'Grew a garden of 10 plants.',
    hint: 'Harvest 10 plants into your garden.',
  },
  under_budget_month: {
    title: 'Under budget month',
    xp: 50,
    icon: 'Target',
    category: 'Budgets',
    description: 'Stayed under budget for an entire month.',
    hint: 'Set a budget and stay under it for a month.',
  },
};

export interface UnlockedAchievement {
  id: string;
  user_id: string;
  key: AchievementKey;
  unlocked_at: string;
}

export function useUnlockedAchievements() {
  return useQuery<UnlockedAchievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as UnlockedAchievement[];
    },
  });
}

type AchievementContext = {
  txCount?: number;
  streakDays?: number;
  fastLogCount?: number;
  questsCompleted?: number;
  gardenCount?: number;
  isHarvest?: boolean;
  underBudgetMonth?: boolean;
};

function determineToUnlock(
  context: AchievementContext,
  alreadyUnlocked: Set<string>,
): AchievementKey[] {
  const toUnlock: AchievementKey[] = [];

  if (context.txCount !== undefined) {
    if (context.txCount >= 1 && !alreadyUnlocked.has('first_log')) toUnlock.push('first_log');
    if (context.txCount >= 100 && !alreadyUnlocked.has('log_100')) toUnlock.push('log_100');
    if (context.txCount >= 1000 && !alreadyUnlocked.has('log_1000')) toUnlock.push('log_1000');
  }
  if (context.streakDays !== undefined) {
    if (context.streakDays >= 7 && !alreadyUnlocked.has('streak_7')) toUnlock.push('streak_7');
    if (context.streakDays >= 30 && !alreadyUnlocked.has('streak_30')) toUnlock.push('streak_30');
    if (context.streakDays >= 100 && !alreadyUnlocked.has('streak_100'))
      toUnlock.push('streak_100');
  }
  if (context.fastLogCount !== undefined) {
    if (context.fastLogCount >= 100 && !alreadyUnlocked.has('fast_100'))
      toUnlock.push('fast_100');
  }
  if (context.questsCompleted !== undefined) {
    if (context.questsCompleted >= 1 && !alreadyUnlocked.has('first_quest'))
      toUnlock.push('first_quest');
    if (context.questsCompleted >= 10 && !alreadyUnlocked.has('quests_10'))
      toUnlock.push('quests_10');
  }
  if (context.gardenCount !== undefined) {
    if (context.gardenCount >= 10 && !alreadyUnlocked.has('garden_10'))
      toUnlock.push('garden_10');
  }
  if (context.isHarvest && !alreadyUnlocked.has('first_harvest')) toUnlock.push('first_harvest');
  if (context.underBudgetMonth && !alreadyUnlocked.has('under_budget_month'))
    toUnlock.push('under_budget_month');

  return toUnlock;
}

export async function checkAchievementsStandalone(
  context: AchievementContext,
): Promise<AchievementKey[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: existing } = await supabase
      .from('achievements')
      .select('key')
      .eq('user_id', user.id);
    const alreadyUnlocked = new Set((existing ?? []).map((a: { key: string }) => a.key));

    const toUnlock = determineToUnlock(context, alreadyUnlocked);
    if (toUnlock.length === 0) return [];

    await supabase
      .from('achievements')
      .insert(toUnlock.map((key) => ({ user_id: user.id, key })));

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

    for (const key of toUnlock) {
      useToastStore.getState().push(key);
    }

    queryClient.invalidateQueries({ queryKey: ['achievements'] });
    queryClient.invalidateQueries({ queryKey: ['user_progress'] });

    return toUnlock;
  } catch {
    return [];
  }
}

export function useCheckAchievements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (context: AchievementContext) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: existing } = await supabase
        .from('achievements')
        .select('key')
        .eq('user_id', user.id);
      const alreadyUnlocked = new Set((existing ?? []).map((a: { key: string }) => a.key));

      const toUnlock = determineToUnlock(context, alreadyUnlocked);
      if (toUnlock.length === 0) return [];

      await supabase
        .from('achievements')
        .insert(toUnlock.map((key) => ({ user_id: user.id, key })));

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
      const keys = unlocked ?? [];
      if (keys.length > 0) {
        for (const key of keys) {
          useToastStore.getState().push(key);
        }
        qc.invalidateQueries({ queryKey: ['achievements'] });
        qc.invalidateQueries({ queryKey: ['user_progress'] });
      }
    },
  });
}
