import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { getItem, setItem } from '@/lib/storage';

const KEY = 'last_reconciliation_dismissed';

export function useReconciliation(hasCashWallet: boolean) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasCashWallet) return;
    getItem(KEY).then((val) => {
      if (!val) { setShow(true); return; }
      const daysSince = differenceInDays(new Date(), new Date(val));
      if (daysSince >= 7) setShow(true);
    });
  }, [hasCashWallet]);

  async function dismiss() {
    setShow(false);
    await setItem(KEY, new Date().toISOString());
  }

  return { show, dismiss };
}
