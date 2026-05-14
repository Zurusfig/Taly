import { useQuery } from '@tanstack/react-query';
import {
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  eachDayOfInterval, eachMonthOfInterval,
  format,
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

export interface StackedCategory {
  id: string | null;
  name: string;
  color: string;
  amount: number;
}

export interface TrendPoint {
  x: number;
  label: string;
  income: number;
  expense: number;
  count: number;
  categories: StackedCategory[];
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

function buildCategories(
  txs: Transaction[],
  lookup: Record<string, { name: string; color: string }>,
): StackedCategory[] {
  const amounts: Record<string, number> = {};
  for (const t of txs) {
    const key = t.category_id ?? '__none__';
    amounts[key] = (amounts[key] ?? 0) + Number(t.amount);
  }
  return Object.entries(amounts)
    .map(([id, amount]) => ({
      id: id === '__none__' ? null : id,
      name: id === '__none__' ? 'Uncategorized' : (lookup[id]?.name ?? 'Unknown'),
      color: id === '__none__' ? '#7F8C8D' : (lookup[id]?.color ?? '#7F8C8D'),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
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
      const lookup = Object.fromEntries((cats ?? []).map((c) => [c.id, c]));

      const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

      const expenseTxs = transactions.filter((t) => t.type === 'expense');
      const byCat: Record<string, number> = {};
      for (const t of expenseTxs) {
        const key = t.category_id ?? '__none__';
        byCat[key] = (byCat[key] ?? 0) + Number(t.amount);
      }
      const categoryBreakdown: CategorySlice[] = Object.entries(byCat)
        .map(([id, amount]) => ({
          categoryId: id === '__none__' ? null : id,
          name: id === '__none__' ? 'Uncategorized' : (lookup[id]?.name ?? 'Unknown'),
          color: id === '__none__' ? '#7F8C8D' : (lookup[id]?.color ?? '#7F8C8D'),
          amount,
          percentage: expense > 0 ? (amount / expense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      let trend: TrendPoint[] = [];
      if (period === 'week' || period === 'month') {
        const days = eachDayOfInterval({ start, end });
        trend = days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTxs = transactions.filter((t) => format(new Date(t.occurred_at), 'yyyy-MM-dd') === key);
          const dayExp = dayTxs.filter((t) => t.type === 'expense');
          return {
            x: i,
            label: format(day, period === 'week' ? 'EEE' : 'd'),
            income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
            expense: dayExp.reduce((s, t) => s + Number(t.amount), 0),
            count: dayTxs.length,
            categories: buildCategories(dayExp, lookup),
          };
        });
      } else {
        const months = eachMonthOfInterval({ start, end });
        trend = months.map((month, i) => {
          const key = format(month, 'yyyy-MM');
          const mTxs = transactions.filter((t) => format(new Date(t.occurred_at), 'yyyy-MM') === key);
          const mExp = mTxs.filter((t) => t.type === 'expense');
          return {
            x: i,
            label: format(month, 'MMM'),
            income: mTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
            expense: mExp.reduce((s, t) => s + Number(t.amount), 0),
            count: mTxs.length,
            categories: buildCategories(mExp, lookup),
          };
        });
      }

      return { income, expense, net: income - expense, categoryBreakdown, trend };
    },
  });
}
