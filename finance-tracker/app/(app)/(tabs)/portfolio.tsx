import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useAssets, useRefreshPrices, type Asset } from '@/hooks/useAssets';
import { usePortfolioSnapshots, useYesterdaySnapshot, useTakeSnapshot } from '@/hooks/usePortfolioSnapshot';
import { markAwarenessDoneToday } from '@/hooks/useDailyCompletions';
import {
  usePortfolioStore,
  shouldAutoRefresh,
  type CurrencyMode,
  type TimeRange,
} from '@/stores/portfolioStore';
import { PortfolioChart } from '@/components/charts/PortfolioChart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assetCurrentVal(a: Asset) {
  return a.quantity * (a.last_price ?? a.avg_cost_per_unit ?? 0);
}

function assetCost(a: Asset) {
  return a.quantity * (a.avg_cost_per_unit ?? 0);
}

function assetGainPct(a: Asset): number | null {
  const cost = assetCost(a);
  if (cost === 0 || a.avg_cost_per_unit == null || a.last_price == null) return null;
  return ((assetCurrentVal(a) - cost) / cost) * 100;
}

type SortMode = 'value' | 'gain' | 'alpha';

function sorted(assets: Asset[], sort: SortMode): Asset[] {
  const s = [...assets];
  if (sort === 'value') s.sort((a, b) => assetCurrentVal(b) - assetCurrentVal(a));
  else if (sort === 'gain') s.sort((a, b) => (assetGainPct(b) ?? -Infinity) - (assetGainPct(a) ?? -Infinity));
  else s.sort((a, b) => (a.symbol ?? a.name).localeCompare(b.symbol ?? b.name));
  return s;
}

// ─── Amount display ───────────────────────────────────────────────────────────

interface AmountProps {
  usd: number;
  mode: CurrencyMode;
  usdToThb: number;
  large?: boolean;
  color?: string;
}

function Amount({ usd, mode, usdToThb, large = false, color }: AmountProps) {
  const thb = usd * usdToThb;
  const primaryStyle = [large ? styles.amountLarge : styles.amountNormal, color ? { color } : {}];
  const secondaryStyle = large ? styles.amountSecondaryLarge : styles.amountSecondary;

  if (mode === 'usd') {
    return <Text style={primaryStyle}>${formatAmount(usd)}</Text>;
  }
  if (mode === 'thb') {
    return <Text style={primaryStyle}>฿{formatAmount(thb)}</Text>;
  }
  return (
    <View>
      <Text style={primaryStyle}>฿{formatAmount(thb)}</Text>
      <Text style={secondaryStyle}>${formatAmount(usd)}</Text>
    </View>
  );
}

// ─── Currency toggle ──────────────────────────────────────────────────────────

const MODES: CurrencyMode[] = ['usd', 'thb', 'both'];

function CurrencyToggle({ value, onChange }: { value: CurrencyMode; onChange: (m: CurrencyMode) => void }) {
  return (
    <View style={styles.toggle}>
      {MODES.map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => { onChange(m); Haptics.selectionAsync(); }}
          style={[styles.toggleBtn, value === m && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleLabel, value === m && styles.toggleLabelActive]}>
            {m.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Holding card ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<Asset['type'], string> = {
  stock: 'STOCK', etf: 'ETF', gold: 'GOLD', crypto: 'CRYPTO', other: 'OTHER',
};

interface HoldingCardProps {
  asset: Asset;
  mode: CurrencyMode;
  usdToThb: number;
  onPress: () => void;
}

function HoldingCard({ asset: a, mode, usdToThb, onPress }: HoldingCardProps) {
  const val = assetCurrentVal(a);
  const glPct = assetGainPct(a);
  const hasPrice = a.last_price != null;

  return (
    <TouchableOpacity style={styles.holdingRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.holdingLeft}>
        <View style={styles.holdingTop}>
          <Text style={styles.holdingSymbol}>{a.symbol ?? a.name}</Text>
          {!hasPrice && a.symbol && (
            <AlertTriangle size={12} color={colors.warning} style={{ marginLeft: 4 }} />
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{TYPE_LABELS[a.type]}</Text>
          </View>
        </View>
        <Text style={styles.holdingName} numberOfLines={1}>{a.name}</Text>
        <Text style={styles.holdingMeta}>
          {a.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} units
          {hasPrice && a.last_price != null
            ? `  ·  $${formatAmount(a.last_price)}`
            : '  ·  no price'
          }
        </Text>
      </View>
      <View style={styles.holdingRight}>
        <Amount usd={val} mode={mode} usdToThb={usdToThb} />
        {glPct !== null && (
          <View style={styles.glRow}>
            {glPct >= 0
              ? <TrendingUp size={11} color={colors.accent} />
              : <TrendingDown size={11} color={colors.danger} />
            }
            <Text style={[styles.glText, { color: glPct >= 0 ? colors.accent : colors.danger }]}>
              {glPct >= 0 ? '+' : ''}{glPct.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
const SORTS: { key: SortMode; label: string }[] = [
  { key: 'value', label: 'Value' },
  { key: 'gain', label: '% Gain' },
  { key: 'alpha', label: 'A–Z' },
];

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencyMode, timeRange, usdToThb, lastRefreshed, setCurrencyMode, setTimeRange } = usePortfolioStore();
  const [sortMode, setSortMode] = useState<SortMode>('value');
  const [chartWidth, setChartWidth] = useState(0);

  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: snapshots } = usePortfolioSnapshots(timeRange);
  const { data: yesterday } = useYesterdaySnapshot();
  const refresh = useRefreshPrices();
  const takeSnapshot = useTakeSnapshot();

  // Portfolio totals
  const totalUsd = (assets ?? []).reduce((s, a) => s + assetCurrentVal(a), 0);
  const totalCostUsd = (assets ?? []).reduce((s, a) => s + assetCost(a), 0);
  const overallGain = totalUsd - totalCostUsd;
  const overallGainPct = totalCostUsd > 0 ? (overallGain / totalCostUsd) * 100 : null;

  // Day change vs yesterday's snapshot
  const prevUsd = yesterday?.total_value_usd ?? null;
  const dayChangeUsd = prevUsd !== null ? totalUsd - prevUsd : null;
  const dayChangePct = prevUsd && prevUsd > 0 ? ((totalUsd - prevUsd) / prevUsd) * 100 : null;

  const hasAssets = (assets?.length ?? 0) > 0;

  useEffect(() => { markAwarenessDoneToday().catch(() => {}); }, []);

  // Auto-refresh on mount
  useEffect(() => {
    if (!hasAssets || !assets) return;
    if (shouldAutoRefresh(lastRefreshed)) {
      refresh.mutate(assets);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAssets]);

  // Take daily snapshot after successful refresh
  useEffect(() => {
    if (!refresh.isSuccess || !hasAssets) return;
    takeSnapshot.mutate({ totalUsd, usdToThb });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh.isSuccess]);

  const handleRefresh = useCallback(() => {
    if (!assets?.length) return;
    refresh.mutate(assets, {
      onError: (e: any) => Alert.alert('Refresh failed', e.message ?? 'Could not fetch prices.'),
      onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    });
  }, [assets]);

  const isRefreshing = refresh.isPending;
  const holdingList = sorted(assets ?? [], sortMode);

  const displayDayChange = dayChangePct !== null
    ? `${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)}%  ${dayChangeUsd !== null ? `(${dayChangeUsd >= 0 ? '+' : ''}$${formatAmount(Math.abs(dayChangeUsd))})` : ''}`
    : null;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Fixed header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Portfolio</Text>
          <CurrencyToggle value={currencyMode} onChange={setCurrencyMode} />
        </View>

        {assetsLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />
        ) : (
          <>
            <Amount usd={totalUsd} mode={currencyMode} usdToThb={usdToThb} large />
            {displayDayChange !== null && (
              <View style={styles.dayChangeRow}>
                {dayChangePct !== null && dayChangePct >= 0
                  ? <TrendingUp size={13} color={colors.accent} />
                  : <TrendingDown size={13} color={colors.danger} />
                }
                <Text style={[
                  styles.dayChangeText,
                  { color: (dayChangePct ?? 0) >= 0 ? colors.accent : colors.danger },
                ]}>
                  {displayDayChange} today
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Chart card */}
        <View style={styles.card}>
          {/* Time range chips */}
          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setTimeRange(r)}
                style={[styles.rangeChip, timeRange === r && styles.rangeChipActive]}
              >
                <Text style={[styles.rangeLabel, timeRange === r && styles.rangeLabelActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            style={styles.chartWrap}
          >
            <PortfolioChart
              snapshots={snapshots ?? []}
              mode={currencyMode === 'both' ? 'thb' : currencyMode}
              usdToThb={usdToThb}
              width={chartWidth}
            />
          </View>

          {/* Refresh timestamp */}
          <Text style={styles.updatedAt}>
            {isRefreshing
              ? 'Refreshing prices…'
              : lastRefreshed
                ? `Prices updated ${formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}`
                : 'Pull down to refresh prices'
            }
          </Text>
        </View>

        {/* Holdings */}
        {hasAssets && (
          <View style={styles.holdingsSection}>
            <View style={styles.holdingsHeader}>
              <Text style={styles.holdingsTitle}>Holdings</Text>
              <View style={styles.sortRow}>
                {SORTS.map(({ key, label }) => (
                  <TouchableOpacity key={key} onPress={() => setSortMode(key)} style={styles.sortBtn}>
                    <Text style={[styles.sortLabel, sortMode === key && styles.sortLabelActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.holdingsList}>
              {holdingList.map((a) => (
                <HoldingCard
                  key={a.id}
                  asset={a}
                  mode={currencyMode}
                  usdToThb={usdToThb}
                  onPress={() => router.push(`/(app)/assets/${a.id}`)}
                />
              ))}
            </View>

            {/* Summary row */}
            {overallGainPct !== null && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Overall return</Text>
                <View style={styles.summaryRight}>
                  <Text style={[
                    styles.summaryPct,
                    { color: overallGain >= 0 ? colors.accent : colors.danger },
                  ]}>
                    {overallGain >= 0 ? '+' : ''}{overallGainPct.toFixed(2)}%
                  </Text>
                  <Text style={styles.summaryAbs}>
                    {overallGain >= 0 ? '+' : ''}${formatAmount(Math.abs(overallGain))}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {!hasAssets && !assetsLoading && (
          <View style={styles.empty}>
            <TrendingUp size={44} color={colors.textDim} />
            <Text style={styles.emptyTitle}>No holdings yet</Text>
            <Text style={styles.emptyBody}>Track stocks, ETFs, crypto, and more.</Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 96 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 84 + insets.bottom }]}
        onPress={() => router.push('/(app)/assets/new')}
        activeOpacity={0.85}
      >
        <Plus size={28} color={colors.bg} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: colors.text },

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.bgInput },
  toggleLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.textDim },
  toggleLabelActive: { color: colors.text },

  amountLarge: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 40,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  amountSecondaryLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  amountNormal: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 17,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  amountSecondary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },

  dayChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dayChangeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },

  card: {
    margin: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  rangeRow: { flexDirection: 'row', gap: 4 },
  rangeChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  rangeChipActive: { backgroundColor: colors.bgInput },
  rangeLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textDim },
  rangeLabelActive: { color: colors.text },
  chartWrap: { minHeight: 160 },
  updatedAt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 4,
  },

  holdingsSection: { paddingHorizontal: 16, gap: 0 },
  holdingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  holdingsTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sortRow: { flexDirection: 'row', gap: 12 },
  sortBtn: { paddingVertical: 4 },
  sortLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textDim },
  sortLabelActive: { color: colors.accent, fontFamily: 'Inter_500Medium' },

  holdingsList: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    overflow: 'hidden',
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  holdingLeft: { flex: 1, gap: 3 },
  holdingTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  holdingSymbol: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 18,
    color: colors.text,
  },
  typeBadge: {
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  holdingName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  holdingMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
  },
  holdingRight: { alignItems: 'flex-end', gap: 4, paddingTop: 2 },
  glRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  glText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryRight: { alignItems: 'flex-end' },
  summaryPct: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  summaryAbs: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.textMuted,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(97, 152, 142, 0.4)',
    elevation: 8,
  },
});
