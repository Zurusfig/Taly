import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Plus, Wallet as WalletIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { colors } from '@/theme/colors';
import { formatCurrency, formatAmount } from '@/lib/utils';
import { useWallets } from '@/hooks/useWallets';
import { useRecentTransactions, useMonthlyStats } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { WalletCard } from '@/components/WalletCard';
import { TransactionItem } from '@/components/TransactionItem';
import { Button } from '@/components/ui/Button';
import { seedDefaultCategories } from '@/hooks/useCategories';
import { useCreateWallet } from '@/hooks/useWallets';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

// ─── Onboarding ─────────────────────────────────────────────────────────────

function OnboardingView() {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const createWallet = useCreateWallet();

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createWallet.mutateAsync({
        name: name.trim(),
        type: 'bank',
        initial_balance: parseFloat(balance) || 0,
        currency: 'THB',
        icon: null,
        color: colors.accent,
      });
      await seedDefaultCategories().catch(() => {}); // best-effort
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.onboardingContainer}
      keyboardShouldPersistTaps="handled"
    >
      <WalletIcon size={40} color={colors.accent} />
      <Text style={styles.onboardingTitle}>Add your first wallet</Text>
      <Text style={styles.onboardingSubtitle}>
        Give it a name and enter your current balance.
      </Text>
      <View style={styles.onboardingForm}>
        <Input
          label="Wallet name"
          placeholder="e.g. SCB Bank"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Current balance (฿)"
          placeholder="0.00"
          value={balance}
          onChangeText={setBalance}
          keyboardType="decimal-pad"
        />
        <Button
          label="Get started"
          onPress={handleCreate}
          loading={createWallet.isPending}
          disabled={!name.trim()}
          style={styles.onboardingBtn}
        />
      </View>
    </ScrollView>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pushing = useRef(false);

  // Reset lock whenever this screen gains focus (sheet dismissed or back-navigated)
  useFocusEffect(useCallback(() => { pushing.current = false; }, []));

  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: stats } = useMonthlyStats();
  const { data: recentTxs } = useRecentTransactions(5);
  const { data: categories } = useCategories();

  const isLoading = walletsLoading;
  const hasWallets = (wallets?.length ?? 0) > 0;

  const totalBalance = wallets?.reduce((s, w) => s + w.balance, 0) ?? 0;

  const categoryMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));
  const walletMap = Object.fromEntries((wallets ?? []).map((w) => [w.id, w]));

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!hasWallets) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <OnboardingView />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateLabel}>{format(new Date(), 'MMMM yyyy')}</Text>
          <Text style={styles.totalBalance}>
            ฿{formatAmount(totalBalance)}
          </Text>
          {/* Monthly stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                +฿{formatAmount(stats?.income ?? 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                -฿{formatAmount(stats?.expense ?? 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Net</Text>
              <Text style={[
                styles.statValue,
                { color: (stats?.net ?? 0) >= 0 ? colors.accent : colors.danger },
              ]}>
                {(stats?.net ?? 0) >= 0 ? '+' : '-'}฿{formatAmount(Math.abs(stats?.net ?? 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wallets</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/wallets')}>
            <Text style={styles.sectionAction}>Manage</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={wallets}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => (
            <WalletCard
              wallet={item}
              onPress={() => router.push(`/(app)/wallets/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          contentContainerStyle={styles.walletList}
          showsHorizontalScrollIndicator={false}
        />

        {/* Recent transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/transactions')}>
            <Text style={styles.sectionAction}>See all</Text>
          </TouchableOpacity>
        </View>
        {(recentTxs?.length ?? 0) === 0 ? (
          <View style={styles.emptyTx}>
            <Text style={styles.emptyTxText}>No transactions yet. Tap + to log one.</Text>
          </View>
        ) : (
          <View style={styles.txCard}>
            {recentTxs?.map((tx) => (
              <TransactionItem
                key={tx.id}
                tx={tx}
                category={categoryMap[tx.category_id ?? ''] ?? null}
                wallet={walletMap[tx.wallet_id] ?? null}
                toWallet={tx.to_wallet_id ? walletMap[tx.to_wallet_id] : null}
                onPress={() => router.push(`/(app)/transaction/${tx.id}`)}
              />
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 84 + insets.bottom }]}
        onPress={() => {
          if (pushing.current) return;
          pushing.current = true;
          router.push('/(app)/quick-log');
        }}
        activeOpacity={0.85}
      >
        <Plus size={28} color={colors.bg} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  // Onboarding
  onboardingContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  onboardingTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  onboardingForm: { width: '100%', gap: 12, marginTop: 8 },
  onboardingBtn: { marginTop: 4 },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 6,
  },
  dateLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalBalance: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 48,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 2 },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.accent,
  },

  // Wallets
  walletList: { paddingHorizontal: 24, paddingBottom: 24 },

  // Transactions
  txCard: {
    marginHorizontal: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyTx: { paddingHorizontal: 24, paddingVertical: 20 },
  emptyTxText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
