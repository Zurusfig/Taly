import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { formatCurrency } from '@/lib/utils';
import type { Wallet } from '@/lib/types';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  credit: 'Credit',
  other: 'Other',
};

export function WalletCard({ wallet, onPress }: WalletCardProps) {
  const accentColor = wallet.color ?? colors.accent;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{wallet.name}</Text>
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
  accent: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 14,
    gap: 4,
  },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
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
