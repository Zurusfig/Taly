import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface DailyCompletion {
  id: string;
  user_id: string;
  completion_date: string;
  capture_done: boolean;
  awareness_done: boolean;
  discipline_done: boolean;
  all_done_at: string | null;
}

const today = () => format(startOfDay(new Date()), 'yyyy-MM-dd');

const DC_KEY = (date: string) => ['daily_completions', date] as const;

export function useTodayCompletion() {
  const d = today();
  return useQuery<DailyCompletion | null>({
    queryKey: DC_KEY(d),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_completions')
        .select('*')
        .eq('completion_date', d)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as DailyCompletion;
    },
    staleTime: 60_000,
  });
}

async function upsertCompletion(fields: Partial<DailyCompletion>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const d = today();

  const { data: existing } = await supabase
    .from('daily_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('completion_date', d)
    .single();

  const merged = { ...(existing ?? {}), ...fields };
  const allDone = merged.capture_done && merged.awareness_done && merged.discipline_done;

  if (existing) {
    await supabase
      .from('daily_completions')
      .update({
        ...fields,
        all_done_at: allDone && !existing.all_done_at ? new Date().toISOString() : existing.all_done_at,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('daily_completions').insert({
      user_id: user.id,
      completion_date: d,
      capture_done: false,
      awareness_done: false,
      discipline_done: false,
      ...fields,
      all_done_at: allDone ? new Date().toISOString() : null,
    });
  }
}

export function useMarkCaptureDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => upsertCompletion({ capture_done: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DC_KEY(today()) }),
  });
}

export function useMarkAwarenessDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => upsertCompletion({ awareness_done: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DC_KEY(today()) }),
  });
}

export function useMarkDisciplineDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => upsertCompletion({ discipline_done: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: DC_KEY(today()) }),
  });
}

// Standalone helpers (no React hooks) — safe to call from other hooks/mutations
export async function markCaptureDoneToday() {
  await upsertCompletion({ capture_done: true });
}

export async function markAwarenessDoneToday() {
  await upsertCompletion({ awareness_done: true });
}

export async function markDisciplineDoneToday(isDone: boolean) {
  await upsertCompletion({ discipline_done: isDone });
}

// Called from budget/transaction hooks after evaluating discipline state
export function useEvaluateDiscipline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fastLogRate }: { fastLogRate: number }) => {
      await upsertCompletion({ discipline_done: fastLogRate >= 0.5 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DC_KEY(today()) }),
  });
}
