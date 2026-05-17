import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Gem, Bitcoin, Package, BarChart2 } from 'lucide-react-native';
import { format, formatDistanceToNow } from 'date-fns';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useAssets, useRefreshPrices, type Asset } from '@/hooks/useAssets';
import { usePortfolioStore } from '@/stores/portfolioStore';

function assetIcon(type: Asset['type'], size = 18) {
  const color = colors.textMuted;
  if (type === 'stock' || type === 'etf') return <TrendingUp size={size} color={color} />;
  if (type === 'crypto') return <Bitcoin size={size} color={color} />;
  if (type === 'gold') return <Gem size={size} color={color} />;
  return <Package size={size} color={color} />;
}

function typeLabel(type: Asset['type']): string {
  return type.toUpperCase();
}

function currentValue(a: Asset): number {
  const price = a.last_price ?? a.avg_cost_per_unit ?? 0;
  return a.quantity * price;
}

function costBasis(a: Asset): number {
  return a.quantity * (a.avg_cost_per_unit ?? 0);
}

function gainLoss(a: Asset): number {
  if (a.avg_cost_per_unit == null || a.last_price == null) return 0;
  return currentValue(a) - costBasis(a);
}

function gainLossPct(a: Asset): number | null {
  const cost = costBasis(a);
  if (cost === 0 || a.avg_cost_per_unit == null || a.last_price == null) return null;
  return (gainLoss(a) / cost) * 100;
}

export default function AssetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: assets, isLoading } = useAssets();
  const refresh = useRefreshPrices();
  const { usdToThb, lastRefreshed } = usePortfolioStore();

  const totalValueUsd = (assets ?? []).reduce((s, a) => s + currentValue(a), 0);
  const totalCostUsd = (assets ?? []).reduce((s, a) => s + costBasis(a), 0);
  const totalGain = totalValueUsd - totalCostUsd;
  const totalGainPct = totalCostUsd > 0 ? (totalGain / totalCostUsd) * 100 : null;
  const totalValueThb = totalValueUsd * usdToThb;

  function handleRefresh() {
    if (!assets?.length) return;
    const hasSymbols = assets.some((a) => a.symbol);
    if (!hasSymbols) {
      Alert.alert('No symbols', 'Add a ticker symbol to assets to fetch live prices.');
      return;
    }
    refresh.mutate(assets, {
      onError: (e: any) => Alert.alert('Refresh failed', e.message),
    });
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refresh.isPending}
          style={styles.refreshBtn}
          hitSlop={8}
        >
          {refresh.isPending
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <RefreshCw size={18} color={colors.accent} />
          }
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>

          {/* Portfolio summary card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total portfolio value</Text>
            <Text style={styles.summaryValue}>฿{formatAmount(totalValueThb)}</Text>
            <Text style={styles.summaryUsd}>${formatAmount(totalValueUsd)} USD</Text>
            {totalGainPct !== null && (
              <View style={styles.gainRow}>
                {totalGain >= 0
                  ? <TrendingUp size={14} color={colors.accent} />
                  : <TrendingDown size={14} color={colors.danger} />
                }
                <Text style={[styles.gainText, { color: totalGain >= 0 ? colors.accent : colors.danger }]}>
                  {totalGain >= 0 ? '+' : ''}{formatAmount(Math.abs(totalGain))} ({totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%)
                </Text>
              </View>
            )}
            {lastRefreshed && (
              <Text style={styles.refreshedAt}>
                Updated {formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}
              </Text>
            )}
            <Text style={styles.rateNote}>Rate: 1 USD = {usdToThb} THB</Text>
          </View>

          {/* Assets list */}
          {(assets ?? []).length === 0 ? (
            <View style={styles.empty}>
              <BarChart2 size={40} color={colors.textDim} />
              <Text style={styles.emptyTitle}>No assets yet</Text>
              <Text style={styles.emptyBody}>Track stocks, ETFs, crypto, gold, and more.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {assets!.map((a) => {
                const val = currentValue(a);
                const gl = gainLoss(a);
                const glPct = gainLossPct(a);
                const hasPrice = a.last_price != null;
                const isPositive = gl >= 0;

                return (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.row}
                    onPress={() => router.push(`/(app)/assets/${a.id}`)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.iconWrap}>
                      {assetIcon(a.type)}
                    </View>
                    <View style={styles.rowMain}>
                      <View style={styles.rowTop}>
                        <Text style={styles.assetName} numberOfLines={1}>{a.name}</Text>
                        <Text style={styles.assetValue}>${formatAmount(val)}</Text>
                      </View>
                      <View style={styles.rowBottom}>
                        <View style={styles.metaRow}>
                          <View style={styles.typeBadge}>
                            <Text style={styles.typeLabel}>{typeLabel(a.type)}</Text>
                          </View>
                          {a.symbol && <Text style={styles.symbol}>{a.symbol}</Text>}
                          <Text style={styles.qty}>{a.quantity.toLocaleString()} units</Text>
                        </View>
                        {glPct !== null && hasPrice && (
                          <Text style={[styles.glText, { color: isPositive ? colors.accent : colors.danger }]}>
                            {isPositive ? '+' : ''}{glPct.toFixed(2)}%
                          </Text>
                        )}
                      </View>
                      {hasPrice && a.last_price != null && (
                        <Text style={styles.priceRow}>
                          ${formatAmount(a.last_price)} / unit
                          {a.last_price_updated_at && (
                            <Text style={styles.priceAge}>
                              {' '}· {format(new Date(a.last_price_updated_at), 'MMM d')}
                            </Text>
                          )}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: colors.text },
  refreshBtn: { padding: 4 },

  content: { padding: 16, gap: 16 },

  summaryCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 36,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  summaryUsd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  gainRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  gainText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  refreshedAt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    marginTop: 8,
  },
  rateNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
  },

  list: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowMain: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.text,
    marginRight: 8,
  },
  assetValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: {
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  symbol: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.accent },
  qty: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  glText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  priceRow: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
  },
  priceAge: { color: colors.textDim },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
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
