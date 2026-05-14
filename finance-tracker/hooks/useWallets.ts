import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Wallet } from '@/lib/types';

export const WALLETS_KEY = ['wallets'] as const;

async function fetchWallets(): Promise<Wallet[]> {
  const [{ data: wallets, error: wErr }, { data: txs, error: tErr }] = await Promise.all([
    supabase.from('wallets').select('*').eq('archived', false).order('created_at'),
    supabase.from('transactions').select('wallet_id, to_wallet_id, type, amount'),
  ]);
  if (wErr) throw wErr;
  if (tErr) throw tErr;

  return (wallets ?? []).map((w) => {
    const all = txs ?? [];
    const balance =
      Number(w.initial_balance) +
      all.filter((t) => t.wallet_id === w.id && t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) -
      all.filter((t) => t.wallet_id === w.id && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) +
      all.filter((t) => t.to_wallet_id === w.id && t.type === 'transfer').reduce((s, t) => s + Number(t.amount), 0) -
      all.filter((t) => t.wallet_id === w.id && t.type === 'transfer').reduce((s, t) => s + Number(t.amount), 0);
    return { ...w, balance } as Wallet;
  });
}

export function useWallets() {
  return useQuery({ queryKey: WALLETS_KEY, queryFn: fetchWallets });
}

type WalletInput = Pick<Wallet, 'name' | 'type' | 'initial_balance' | 'currency' | 'icon' | 'color'>;

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WalletInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('wallets').insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WALLETS_KEY }),
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<WalletInput> & { id: string }) => {
      const { data, error } = await supabase.from('wallets').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WALLETS_KEY }),
  });
}

export function useArchiveWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wallets').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WALLETS_KEY }),
  });
}
