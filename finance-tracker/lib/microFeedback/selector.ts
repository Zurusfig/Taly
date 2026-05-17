import type { MicroFact } from '@/stores/microFeedbackStore';

export interface TxContext {
  amount: number;
  occurredAt: string;
  createdAt?: string;
  streakDays?: number;
  totalTxCount?: number;
  isFastLog?: boolean;
  categoryName?: string;
  dayTxCount?: number;
  dayAmounts?: number[];
}

function diffMinutes(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60_000;
}

export function selectMicroFact(ctx: TxContext): MicroFact | null {
  const {
    amount,
    occurredAt,
    createdAt,
    streakDays = 0,
    totalTxCount = 0,
    isFastLog,
    dayTxCount = 0,
    dayAmounts = [],
  } = ctx;

  const occurred = new Date(occurredAt);
  const created = createdAt ? new Date(createdAt) : new Date();
  const diffMin = diffMinutes(occurred, created);

  // Priority 1: fast log
  if (diffMin <= 1 && isFastLog !== false) {
    return { text: 'Logged in under a minute', icon: 'Zap' };
  }

  // Priority 2: streak milestones
  if (streakDays === 7) return { text: '7-day streak — consistency wins', icon: 'Flame' };
  if (streakDays === 30) return { text: '30 days in a row. Remarkable.', icon: 'Flame' };
  if (streakDays === 100) return { text: '100-day streak. You are rare.', icon: 'Star' };

  // Priority 3: total count milestones
  if (totalTxCount === 10) return { text: '10 transactions logged', icon: 'Star' };
  if (totalTxCount === 50) return { text: '50 transactions. Steady habit.', icon: 'Star' };
  if (totalTxCount === 100) return { text: '100 logs. You know your money.', icon: 'Star' };

  // Priority 4: early morning log
  const hour = occurred.getHours();
  if (hour < 8) return { text: 'Logged before 8am — sharp', icon: 'Sun' };

  // Priority 5: largest transaction of the day
  if (dayAmounts.length > 0) {
    const maxAmount = Math.max(...dayAmounts);
    if (amount === maxAmount && dayTxCount > 1) {
      return { text: "Today's biggest spend tracked", icon: 'TrendingDown' };
    }
    // Smallest of the day (with >1 other)
    const minAmount = Math.min(...dayAmounts);
    if (amount === minAmount && dayTxCount > 2) {
      return { text: 'Even the small ones count', icon: 'Clock' };
    }
  }

  // Priority 6: round number
  if (amount % 1000 === 0 && amount >= 1000) {
    return { text: `฿${(amount / 1000).toFixed(0)}K — noted`, icon: 'Star' };
  }
  if (amount % 100 === 0 && amount >= 100) {
    return { text: 'Round number, clean record', icon: 'Zap' };
  }

  // Priority 7: logged within 5 min (not under 1 min — already handled)
  if (diffMin <= 5) {
    return { text: 'Logged at point of purchase', icon: 'Zap' };
  }

  // Priority 8: generic positive notes
  const generics: MicroFact[] = [
    { text: 'Every log builds clarity', icon: 'Sun' },
    { text: 'Awareness is the first step', icon: 'Sun' },
    { text: 'Tracked. One step ahead.', icon: 'Star' },
  ];
  return generics[totalTxCount % generics.length];
}
