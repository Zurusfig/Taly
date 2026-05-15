import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { differenceInDays } from 'date-fns';

const KEY = 'last_reconciliation_dismissed';

export function useReconciliation(hasCashWallet: boolean) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasCashWallet) return;
    SecureStore.getItemAsync(KEY).then((val) => {
      if (!val) { setShow(true); return; }
      const daysSince = differenceInDays(new Date(), new Date(val));
      if (daysSince >= 7) setShow(true);
    });
  }, [hasCashWallet]);

  async function dismiss() {
    setShow(false);
    await SecureStore.setItemAsync(KEY, new Date().toISOString());
  }

  return { show, dismiss };
}
