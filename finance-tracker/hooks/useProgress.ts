import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, startOfDay, format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface UserProgress {
  id: string;
  user_id: string;
  xp: number;
  last_logged_date: string | null;
  created_at: string;
  active_plant_species: string;
  active_plant_planted_at: string | null;
  long_press_hint_dismissed: boolean;
}

export type CreatureStage = 1 | 2 | 3 | 4 | 5;
export type CreatureMood = 'happy' | 'neutral' | 'sleepy' | 'hungry';

export const STAGE_THRESHOLDS: [CreatureStage, number][] = [
  [5, 1500],
  [4, 500],
  [3, 200],
  [2, 50],
  [1, 0],
];

export function xpToStage(xp: number): CreatureStage {
  for (const [stage, threshold] of STAGE_THRESHOLDS) {
    if (xp >= threshold) return stage;
  }
  return 1;
}

export function nextStageXp(xp: number): number | null {
  const thresholds = [50, 200, 500, 1500];
  for (const t of thresholds) {
    if (xp < t) return t;
  }
  return null;
}

export function moodFromLastLogged(lastLoggedDate: string | null): CreatureMood {
  if (!lastLoggedDate) return 'hungry';
  const today = startOfDay(new Date());
  const last = startOfDay(new Date(lastLoggedDate));
  const days = differenceInDays(today, last);
  if (days === 0) return 'happy';
  if (days === 1) return 'neutral';
  if (days === 2) return 'sleepy';
  return 'hungry';
}

const PROGRESS_KEY = ['user_progress'] as const;

export function useProgress() {
  return useQuery({
    queryKey: PROGRESS_KEY,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Row doesn't exist — create it
        const { data: created, error: createError } = await supabase
          .from('user_progress')
          .insert({ user_id: user.id, xp: 0 })
          .select()
          .single();
        if (createError) throw createError;
        return created as UserProgress;
      }
      if (error) throw error;
      return data as UserProgress;
    },
    staleTime: 30_000,
  });
}

export async function applyTransactionXp(occurredAt: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const createdAt = new Date();
  const occurred = new Date(occurredAt);
  const diffMin = Math.abs(createdAt.getTime() - occurred.getTime()) / 60_000;
  const xpGain = 5 + (diffMin <= 5 ? 5 : 0);

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  // Upsert: if row exists increment xp and update last_logged_date
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id, xp')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    await supabase
      .from('user_progress')
      .update({ xp: existing.xp + xpGain, last_logged_date: today, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  } else {
    await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        xp: xpGain,
        last_logged_date: today,
        active_plant_species: 'sprout',
        active_plant_planted_at: new Date().toISOString(),
      });
  }
}

export function useDailyRollover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // No-op: mood is derived from last_logged_date at query time; nothing to write on rollover
      // This exists so AppState listener can invalidate the progress cache on foreground
      await Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROGRESS_KEY });
    },
  });
}
