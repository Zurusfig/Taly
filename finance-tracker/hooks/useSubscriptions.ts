import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Subscription, SubscriptionCycle } from '@/lib/types';

export type { Subscription };

export interface SubscriptionRow extends Subscription {
  wallet_name: string;
  wallet_color: string | null;
  category_name: string | null;
  category_color: string | null;
}

export interface SubscriptionInput {
  name: string;
  amount: number;
  wallet_id: string;
  category_id: string | null;
  cycle: SubscriptionCycle;
  cycle_anchor_date: string;
  next_charge_date: string;
}

export function useSubscriptions() {
  return useQuery<SubscriptionRow[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, wallets(name, color), categories(name, color)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        ...s,
        wallet_name: s.wallets?.name ?? '',
        wallet_color: s.wallets?.color ?? null,
        category_name: s.categories?.name ?? null,
        category_color: s.categories?.color ?? null,
      }));
    },
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubscriptionInput) => {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr || !user) throw new Error('Not authenticated');
      const { error } = await supabase.from('subscriptions').insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subscription> & { id: string }) => {
      const { error } = await supabase.from('subscriptions').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}
