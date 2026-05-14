import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/lib/supabase';

export const BUDGETS_KEY = ['budgets'] as const;

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  period: 'weekly' | 'monthly' | 'yearly';
  amount: number;
  created_at: string;
  // joined
  category_name?: string;
  category_color?: string;
  spent?: number;
}

export interface BudgetInput {
  category_id: string | null;
  period: 'weekly' | 'monthly' | 'yearly';
  amount: number;
}

function currentPeriodRange(period: 'weekly' | 'monthly' | 'yearly') {
  const now = new Date();
  switch (period) {
    case 'weekly':  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'yearly':  return { start: startOfYear(now), end: endOfYear(now) };
  }
}

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: BUDGETS_KEY,
    queryFn: async () => {
      const [{ data: budgets, error: bErr }, { data: cats }, { data: txs }] = await Promise.all([
        supabase.from('budgets').select('*').order('created_at'),
        supabase.from('categories').select('id, name, color').eq('archived', false),
        supabase.from('transactions').select('category_id, type, amount, occurred_at').eq('type', 'expense'),
      ]);
      if (bErr) throw bErr;

      const catMap = Object.fromEntries((cats ?? []).map((c) => [c.id, c]));

      return (budgets ?? []).map((b) => {
        const { start, end } = currentPeriodRange(b.period);
        const spent = (txs ?? [])
          .filter((t) => {
            const inPeriod = new Date(t.occurred_at) >= start && new Date(t.occurred_at) <= end;
            if (b.category_id) return inPeriod && t.category_id === b.category_id;
            return inPeriod; // total budget
          })
          .reduce((s, t) => s + Number(t.amount), 0);

        const cat = b.category_id ? catMap[b.category_id] : null;
        return {
          ...b,
          amount: Number(b.amount),
          category_name: cat?.name ?? (b.category_id ? 'Unknown' : 'Total spending'),
          category_color: cat?.color ?? null,
          spent,
        };
      });
    },
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('budgets').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: BudgetInput & { id: string }) => {
      const { data, error } = await supabase.from('budgets').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BUDGETS_KEY }),
  });
}
