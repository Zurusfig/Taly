import { useQuery } from '@tanstack/react-query';
import { format, subDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface StreakInfo {
  current: number;   // consecutive days ending today (or yesterday)
  longest: number;
  todayLogged: boolean;
}

export function useStreak() {
  return useQuery<StreakInfo>({
    queryKey: ['streak'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('occurred_at')
        .order('occurred_at', { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) {
        return { current: 0, longest: 0, todayLogged: false };
      }

      // Collect unique logged dates (yyyy-MM-dd), newest first
      const days = Array.from(
        new Set(data.map((t) => format(new Date(t.occurred_at), 'yyyy-MM-dd'))),
      ).sort((a, b) => b.localeCompare(a));

      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const todayLogged = days[0] === today;

      // Current streak: count back from today (or yesterday if today not logged)
      let current = 0;
      let cursor = todayLogged ? today : yesterday;
      for (const day of days) {
        if (day === cursor) {
          current++;
          cursor = format(subDays(parseISO(cursor), 1), 'yyyy-MM-dd');
        } else if (day < cursor) {
          break;
        }
      }

      // Longest streak: scan all days
      let longest = 0;
      let run = 1;
      for (let i = 1; i < days.length; i++) {
        const diff = differenceInCalendarDays(parseISO(days[i - 1]), parseISO(days[i]));
        if (diff === 1) {
          run++;
          if (run > longest) longest = run;
        } else {
          run = 1;
        }
      }
      if (days.length > 0 && run > longest) longest = run;
      if (current > longest) longest = current;

      return { current, longest, todayLogged };
    },
    staleTime: 5 * 60 * 1000,
  });
}
