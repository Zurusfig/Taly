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
import { useCallback, useRef, useEffect } from 'react';
import { Plus, Wallet as WalletIcon, TrendingUp, TrendingDown } from 'lucide-react-native';
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
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAutoLog } from '@/hooks/useAutoLog';
import { useAssets } from '@/hooks/useAssets';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useYesterdaySnapshot, usePortfolioSnapshots } from '@/hooks/usePortfolioSnapshot';
import { useStreak } from '@/hooks/useStreak';
import { useReconciliation } from '@/hooks/useReconciliation';
import { useProgress } from '@/hooks/useProgress';
import { usePrefsStore } from '@/stores/prefsStore';
import { CreatureCard } from '@/components/CreatureCard';
import { InsightCard } from '@/components/garden/InsightCard';
import { useTodayCompletion } from '@/hooks/useDailyCompletions';
import { useTodayNoSpendDay, useMarkNoSpendDay } from '@/hooks/useNoSpendDays';
import { useThisSundayInsight, useGenerateSundayInsight, useDismissInsight } from '@/hooks/useWeeklyInsights';
import { useHarvestPlant } from '@/hooks/useGarden';
import Svg, { Path } from 'react-native-svg';
import { Flame, Leaf } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

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

// ─── Mini sparkline for home portfolio card ──────────────────────────────────

import type { Snapshot } from '@/hooks/usePortfolioSnapshot';

function MiniSparkline({ snapshots, usdToThb }: { snapshots: Snapshot[]; usdToThb: number }) {
  if (snapshots.length < 2) return <View style={{ width: 64 }} />;
  const W = 64; const H = 32;
  const vals = snapshots.map((s) => s.total_value_usd * usdToThb);
  const min = Math.min(...vals); const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: H - ((v - min) / range) * H * 0.9 - H * 0.05,
  }));
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const isUp = vals[vals.length - 1] >= vals[0];
  return (
    <Svg width={W} height={H}>
      <Path d={lineD} stroke={isUp ? colors.accent : colors.danger} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pushing = useRef(false);
  const { logged: autoLogged, dismiss: dismissAutoLog } = useAutoLog();

  // Reset lock whenever this screen gains focus (sheet dismissed or back-navigated)
  useFocusEffect(useCallback(() => { pushing.current = false; }, []));

  const { data: wallets, isLoading: walletsLoading } = useWallets();
  const { data: stats } = useMonthlyStats();
  const { data: recentTxs } = useRecentTransactions(5);
  const { data: categories } = useCategories();
  const { data: assets } = useAssets();
  const { usdToThb, showOnHome } = usePortfolioStore();
  const { data: yesterdaySnap } = useYesterdaySnapshot();
  const { data: recentSnapshots } = usePortfolioSnapshots('1W');
  const { data: streak } = useStreak();
  const { data: progress } = useProgress();
  const { minimalMode } = usePrefsStore();
  const hasCashWallet = (wallets ?? []).some((w) => w.type === 'cash');
  const { data: todayCompletion } = useTodayCompletion();
  const { data: todayNoSpend } = useTodayNoSpendDay();
  const markNoSpend = useMarkNoSpendDay();
  const { data: sundayInsight } = useThisSundayInsight();
  const generateInsight = useGenerateSundayInsight();
  const dismissInsight = useDismissInsight();
  const harvestPlant = useHarvestPlant();
  const [showFabMenu, setShowFabMenu] = useState(false);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    generateInsight.mutate();
  }, []);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));
  const { show: showReconcile, dismiss: dismissReconcile } = useReconciliation(hasCashWallet);

  const isLoading = walletsLoading;
  const hasWallets = (wallets?.length ?? 0) > 0;

  const totalBalance = wallets?.reduce((s, w) => s + w.balance, 0) ?? 0;

  const portfolioValueUsd = (assets ?? []).reduce((s, a) => {
    return s + a.quantity * (a.last_price ?? a.avg_cost_per_unit ?? 0);
  }, 0);
  const portfolioValueThb = portfolioValueUsd * usdToThb;
  const prevUsd = yesterdaySnap?.total_value_usd ?? null;
  const dayChangePct = prevUsd && prevUsd > 0
    ? ((portfolioValueUsd - prevUsd) / prevUsd) * 100 : null;
  const hasAssets = (assets?.length ?? 0) > 0;

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
        {/* Auto-log banner */}
        {autoLogged.length > 0 && (
          <View style={styles.autoLogBanner}>
            <View style={styles.autoLogContent}>
              <Text style={styles.autoLogTitle}>
                Auto-logged {autoLogged.reduce((s, e) => s + e.count, 0)} subscription{autoLogged.reduce((s, e) => s + e.count, 0) !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.autoLogBody} numberOfLines={1}>
                {autoLogged.map((e) => e.name).join(', ')}
              </Text>
            </View>
            <TouchableOpacity onPress={dismissAutoLog} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Reconciliation banner */}
        {showReconcile && (
          <View style={styles.reconcileBanner}>
            <View style={styles.reconcileContent}>
              <Text style={styles.reconcileTitle}>Cash check</Text>
              <Text style={styles.reconcileBody}>Does your cash wallet balance still look right?</Text>
            </View>
            <TouchableOpacity onPress={dismissReconcile} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.dateLabel}>{format(new Date(), 'MMMM yyyy')}</Text>
            {!minimalMode && (streak?.current ?? 0) > 0 && (
              <View style={styles.streakBadge}>
                <Flame size={13} color={(streak?.todayLogged) ? colors.warning : colors.textDim} />
                <Text style={[styles.streakText, { color: streak?.todayLogged ? colors.warning : colors.textDim }]}>
                  {streak!.current}
                </Text>
              </View>
            )}
          </View>
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

        {/* Sunday insight card */}
        {!minimalMode && sundayInsight && !sundayInsight.seen && (
          <InsightCard
            insight={sundayInsight}
            onDismiss={() => dismissInsight.mutate(sundayInsight.id)}
          />
        )}

        {/* Creature card */}
        {!minimalMode && progress && (
          <CreatureCard
            progress={progress}
            streak={streak}
            completion={todayCompletion}
            showPetals={!minimalMode}
            onHarvest={() => {
              const species = (progress as any).active_plant_species ?? 'sprout';
              harvestPlant.mutate({
                species,
                originLabel: `Stage 5 plant harvested`,
              });
            }}
          />
        )}

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

        {/* Portfolio card */}
        {hasAssets && showOnHome && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/portfolio')}>
                <Text style={styles.sectionAction}>View</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.portfolioCard}
              onPress={() => router.push('/(app)/(tabs)/portfolio')}
              activeOpacity={0.8}
            >
              <View style={styles.portfolioLeft}>
                <Text style={styles.portfolioLabel}>Total value</Text>
                <Text style={styles.portfolioValue}>฿{formatAmount(portfolioValueThb)}</Text>
                <Text style={styles.portfolioUsd}>${formatAmount(portfolioValueUsd)} USD</Text>
                {dayChangePct !== null && (
                  <View style={styles.portfolioDayRow}>
                    {dayChangePct >= 0
                      ? <TrendingUp size={11} color={colors.accent} />
                      : <TrendingDown size={11} color={colors.danger} />
                    }
                    <Text style={[
                      styles.portfolioDayText,
                      { color: dayChangePct >= 0 ? colors.accent : colors.danger },
                    ]}>
                      {dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}% today
                    </Text>
                  </View>
                )}
              </View>
              <MiniSparkline snapshots={recentSnapshots ?? []} usdToThb={usdToThb} />
            </TouchableOpacity>

            {/* Net worth link */}
            <TouchableOpacity
              style={styles.netWorthLink}
              onPress={() => router.push('/(app)/net-worth')}
              activeOpacity={0.8}
            >
              <Text style={styles.netWorthLinkText}>
                Total net worth (wallets + portfolio): ฿{formatAmount(totalBalance + portfolioValueThb)}
              </Text>
              <TrendingUp size={14} color={colors.accent} />
            </TouchableOpacity>
          </>
        )}

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

      {/* FAB long-press menu */}
      {showFabMenu && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setShowFabMenu(false)}
        />
      )}
      {showFabMenu && (
        <View style={[styles.fabMenu, { bottom: 84 + insets.bottom + 64 }]}>
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setShowFabMenu(false);
              if (pushing.current) return;
              pushing.current = true;
              router.push('/(app)/quick-log');
            }}
            activeOpacity={0.8}
          >
            <Plus size={16} color={colors.text} />
            <Text style={styles.fabMenuText}>Log expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.fabMenuItem,
              (todayNoSpend != null) && styles.fabMenuItemDisabled,
            ]}
            onPress={() => {
              if (todayNoSpend != null) return;
              setShowFabMenu(false);
              markNoSpend.mutate();
            }}
            activeOpacity={0.8}
            disabled={todayNoSpend != null}
          >
            <Leaf size={16} color={todayNoSpend != null ? colors.textDim : colors.accent} />
            <Text style={[styles.fabMenuText, todayNoSpend != null && { color: colors.textDim }]}>
              {todayNoSpend != null ? 'No-spend marked' : 'No-spend day'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { bottom: 84 + insets.bottom }, fabStyle]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (showFabMenu) { setShowFabMenu(false); return; }
            if (pushing.current) return;
            pushing.current = true;
            router.push('/(app)/quick-log');
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            fabScale.value = withSpring(1.12, { damping: 10, stiffness: 300 });
            setTimeout(() => { fabScale.value = withSpring(1); }, 200);
            setShowFabMenu(true);
          }}
          delayLongPress={500}
          activeOpacity={0.85}
        >
          <Plus size={28} color={colors.bg} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
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

  // Reconciliation banner
  reconcileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    gap: 12,
  },
  reconcileContent: { flex: 1, gap: 2 },
  reconcileTitle: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.text },
  reconcileBody: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
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

  // Auto-log banner
  autoLogBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    gap: 12,
  },
  autoLogContent: { flex: 1, gap: 2 },
  autoLogTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.text,
  },
  autoLogBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },

  // Portfolio card
  portfolioCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioLeft: { flex: 1, gap: 2 },
  portfolioLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  portfolioValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 24,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  portfolioUsd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  portfolioDayRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  portfolioDayText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },

  // Net worth link
  netWorthLink: {
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  netWorthLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    right: 24,
  },
  fab: {
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
  fabMenu: {
    position: 'absolute',
    right: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 160,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fabMenuItemDisabled: { opacity: 0.5 },
  fabMenuText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.text,
  },
});
