import { useEffect, useRef, useState } from 'react';
import { addDays, addMonths, addYears, format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { Subscription } from '@/lib/types';

export interface AutoLogEntry {
  name: string;
  count: number;
}

function advanceDate(date: Date, cycle: Subscription['cycle']): Date {
  if (cycle === 'weekly') return addDays(date, 7);
  if (cycle === 'monthly') return addMonths(date, 1);
  return addYears(date, 1);
}

export function useAutoLog() {
  const [logged, setLogged] = useState<AutoLogEntry[]>([]);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: due } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('active', true)
        .lte('next_charge_date', today);

      if (!due?.length) return;

      const entries: AutoLogEntry[] = [];
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      for (const raw of due) {
        const sub = raw as Subscription;
        let next = parseISO(sub.next_charge_date);
        const txs: object[] = [];

        while (next <= endOfToday) {
          txs.push({
            user_id: user.id,
            wallet_id: sub.wallet_id,
            category_id: sub.category_id,
            type: 'expense',
            amount: sub.amount,
            subscription_id: sub.id,
            occurred_at: next.toISOString(),
            note: sub.name,
          });
          next = advanceDate(next, sub.cycle);
        }

        if (txs.length === 0) continue;

        const [{ error: tErr }, { error: sErr }] = await Promise.all([
          supabase.from('transactions').insert(txs),
          supabase
            .from('subscriptions')
            .update({ next_charge_date: format(next, 'yyyy-MM-dd') })
            .eq('id', sub.id),
        ]);

        if (!tErr && !sErr) entries.push({ name: sub.name, count: txs.length });
      }

      if (entries.length > 0) {
        setLogged(entries);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['summary'] });
        queryClient.invalidateQueries({ queryKey: ['wallets'] });
      }
    }

    run();
  }, []);

  return { logged, dismiss: () => setLogged([]) };
}
