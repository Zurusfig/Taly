import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { markCaptureDoneToday } from './useDailyCompletions';

export interface NoSpendDay {
  id: string;
  user_id: string;
  marked_date: string;
  marked_at: string;
}

const NSD_KEY = ['no_spend_days'] as const;
const today = () => format(startOfDay(new Date()), 'yyyy-MM-dd');

export function useTodayNoSpendDay() {
  const d = today();
  return useQuery<NoSpendDay | null>({
    queryKey: [...NSD_KEY, d],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('no_spend_days')
        .select('*')
        .eq('marked_date', d)
        .single();
      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data as NoSpendDay;
    },
    staleTime: 60_000,
  });
}

export function useMarkNoSpendDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const d = today();
      const { error } = await supabase.from('no_spend_days').upsert({
        user_id: user.id,
        marked_date: d,
        marked_at: new Date().toISOString(),
      }, { onConflict: 'user_id,marked_date' });
      if (error) throw error;
      markCaptureDoneToday().catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NSD_KEY });
      qc.invalidateQueries({ queryKey: ['daily_completions'] });
    },
  });
}

export async function deleteNoSpendDayForDate(date: string, userId: string) {
  await supabase
    .from('no_spend_days')
    .delete()
    .eq('user_id', userId)
    .eq('marked_date', date);
}
