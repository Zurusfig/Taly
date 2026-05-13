import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { formatCurrency, formatTransactionDate, amountColor, amountPrefix } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
import type { Category, Wallet } from '@/lib/types';

interface TransactionItemProps {
  tx: Transaction;
  category?: Category | null;
  wallet?: Wallet | null;
  toWallet?: Wallet | null;
  onPress?: () => void;
}

export function TransactionItem({ tx, category, wallet, toWallet, onPress }: TransactionItemProps) {
  const aColor = amountColor(tx.type);
  const prefix = amountPrefix(tx.type);
  const dotColor = category?.color ?? colors.border;

  const label =
    tx.type === 'transfer'
      ? `${wallet?.name ?? '—'} → ${toWallet?.name ?? '—'}`
      : category?.name ?? 'Uncategorized';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.mid}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {tx.note ? <Text style={styles.note} numberOfLines={1}>{tx.note}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: aColor }]}>
          {prefix}{formatCurrency(tx.amount, wallet?.currency)}
        </Text>
        <Text style={styles.date}>{formatTransactionDate(tx.occurred_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mid: { flex: 1, gap: 2 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.text,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
