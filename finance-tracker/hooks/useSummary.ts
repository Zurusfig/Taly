import { useQuery } from '@tanstack/react-query';
import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  eachDayOfInterval, eachMonthOfInterval,
  format, getDate, getMonth,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/lib/types';

export type Period = 'week' | 'month' | 'year';

export interface CategorySlice {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface TrendPoint {
  x: number;   // day-of-month or month index
  label: string;
  income: number;
  expense: number;
}

export interface SummaryData {
  income: number;
  expense: number;
  net: number;
  categoryBreakdown: CategorySlice[];
  trend: TrendPoint[];
}

function getPeriodRange(period: Period, ref: Date) {
  switch (period) {
    case 'week':  return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    case 'month': return { start: startOfMonth(ref), end: endOfMonth(ref) };
    case 'year':  return { start: startOfYear(ref), end: endOfYear(ref) };
  }
}

export function useSummary(period: Period, ref: Date = new Date()) {
  const { start, end } = getPeriodRange(period, ref);

  return useQuery<SummaryData>({
    queryKey: ['summary', period, start.toISOString()],
    queryFn: async () => {
      const [{ data: txs, error: tErr }, { data: cats, error: cErr }] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .gte('occurred_at', start.toISOString())
          .lte('occurred_at', end.toISOString())
          .order('occurred_at'),
        supabase.from('categories').select('id, name, color').eq('archived', false),
      ]);
      if (tErr) throw tErr;
      if (cErr) throw cErr;

      const transactions = (txs ?? []) as Transaction[];
      const catMap = Object.fromEntries((cats ?? []).map((c) => [c.id, c]));

      // Stats
      const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

      // Category breakdown (expenses only)
      const expenseTxs = transactions.filter((t) => t.type === 'expense');
      const byCategory: Record<string, number> = {};
      for (const t of expenseTxs) {
        const key = t.category_id ?? '__none__';
        byCategory[key] = (byCategory[key] ?? 0) + Number(t.amount);
      }
      const categoryBreakdown: CategorySlice[] = Object.entries(byCategory)
        .map(([id, amount]) => ({
          categoryId: id === '__none__' ? null : id,
          name: id === '__none__' ? 'Uncategorized' : (catMap[id]?.name ?? 'Unknown'),
          color: id === '__none__' ? '#7F8C8D' : (catMap[id]?.color ?? '#7F8C8D'),
          amount,
          percentage: expense > 0 ? (amount / expense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Trend
      let trend: TrendPoint[] = [];
      if (period === 'week' || period === 'month') {
        const days = eachDayOfInterval({ start, end });
        trend = days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTxs = transactions.filter((t) => t.occurred_at.startsWith(dayStr));
          return {
            x: i,
            label: format(day, period === 'week' ? 'EEE' : 'd'),
            income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
            expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
          };
        });
      } else {
        const months = eachMonthOfInterval({ start, end });
        trend = months.map((month, i) => {
          const monthTxs = transactions.filter((t) => {
            const d = new Date(t.occurred_at);
            return getMonth(d) === i;
          });
          return {
            x: i,
            label: format(month, 'MMM'),
            income: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
            expense: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
          };
        });
      }

      return { income, expense, net: income - expense, categoryBreakdown, trend };
    },
  });
}
