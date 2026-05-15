import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth } from '@/lib/utils';
import type { Transaction, MonthlyStats, TransactionType } from '@/lib/types';
import { applyTransactionXp } from './useProgress';
import { deleteNoSpendDayForDate } from './useNoSpendDays';
import { markCaptureDoneToday } from './useDailyCompletions';
import { checkAchievementsStandalone } from './useAchievements';
import { queryClient } from '@/lib/queryClient';
import type { StreakInfo } from './useStreak';

export const TX_KEY = ['transactions'] as const;

export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

async function fetchTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  let q = supabase
    .from('transactions')
    .select('*')
    .order('occurred_at', { ascending: false });

  if (filters.walletId) q = q.eq('wallet_id', filters.walletId);
  if (filters.categoryId) q = q.eq('category_id', filters.categoryId);
  if (filters.type) q = q.eq('type', filters.type);
  if (filters.startDate) q = q.gte('occurred_at', filters.startDate.toISOString());
  if (filters.endDate) q = q.lte('occurred_at', filters.endDate.toISOString());
  if (filters.limit) q = q.limit(filters.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...TX_KEY, filters],
    queryFn: () => fetchTransactions(filters),
  });
}

export function useRecentTransactions(limit = 5) {
  return useTransactions({ limit });
}

export function useMonthlyStats(): ReturnType<typeof useQuery<MonthlyStats>> {
  const now = new Date();
  return useQuery({
    queryKey: [...TX_KEY, 'monthly', now.getFullYear(), now.getMonth()],
    queryFn: async (): Promise<MonthlyStats> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .gte('occurred_at', startOfMonth(now).toISOString())
        .lte('occurred_at', endOfMonth(now).toISOString())
        .neq('type', 'transfer');
      if (error) throw error;

      const income = (data ?? [])
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0);
      const expense = (data ?? [])
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0);
      return { income, expense, net: income - expense };
    },
  });
}

export interface CreateTransactionInput {
  wallet_id: string;
  category_id?: string | null;
  to_wallet_id?: string | null;
  type: TransactionType;
  amount: number;
  note?: string | null;
  occurred_at?: string;
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const payload = {
        ...input,
        user_id: user.id,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      };
      const { data, error } = await supabase.from('transactions').insert(payload).select().single();
      if (error) throw error;
      // Fire-and-forget side effects
      const occurredDate = format(startOfDay(new Date(payload.occurred_at)), 'yyyy-MM-dd');
      applyTransactionXp(payload.occurred_at).catch(() => {});
      deleteNoSpendDayForDate(occurredDate, user.id).catch(() => {});
      // Only mark capture petal if the transaction is for today
      const isToday = occurredDate === format(startOfDay(new Date()), 'yyyy-MM-dd');
      if (isToday) markCaptureDoneToday().catch(() => {});
      // Achievement check: fetch total count and fast-log count
      (async () => {
        try {
          const { count } = await supabase
            .from('transactions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          const txCount = count ?? 0;

          const { data: timingRows } = await supabase
            .from('transactions')
            .select('created_at, occurred_at')
            .eq('user_id', user.id);
          const fastLogCount = (timingRows ?? []).filter((row) => {
            const diff =
              Math.abs(
                new Date(row.created_at).getTime() - new Date(row.occurred_at).getTime(),
              ) / 60000;
            return diff <= 5;
          }).length;

          const ctx: Parameters<typeof checkAchievementsStandalone>[0] = {
            txCount,
            fastLogCount,
          };
          const streakData = queryClient.getQueryData<StreakInfo>(['streak']);
          if (streakData) {
            ctx.streakDays = streakData.current;
          }
          checkAchievementsStandalone(ctx).catch(() => {});
        } catch {
          // Ignore errors in fire-and-forget
        }
      })();
      return data as Transaction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['user_progress'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
      qc.invalidateQueries({ queryKey: ['no_spend_days'] });
      qc.invalidateQueries({ queryKey: ['daily_completions'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreateTransactionInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      qc.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TX_KEY });
      qc.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}
