import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/lib/types';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
  dimmed?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  credit: 'Credit',
  other: 'Other',
};

export function WalletCard({ wallet, onPress, dimmed }: WalletCardProps) {
  const accentColor = wallet.color ?? colors.accent;
  const isSavings = !(wallet.is_usable ?? true);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.card, dimmed && styles.dimmed]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{wallet.name}</Text>
          {isSavings && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsLabel}>Savings</Text>
            </View>
          )}
        </View>
        <Text style={styles.balance}>
          {formatCurrency(wallet.balance, wallet.currency)}
        </Text>
        <Text style={styles.type}>{TYPE_LABELS[wallet.type] ?? wallet.type}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dimmed: { opacity: 0.45 },
  accent: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 14,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  savingsBadge: {
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  savingsLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  balance: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  type: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
