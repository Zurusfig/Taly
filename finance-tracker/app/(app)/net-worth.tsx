import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useState } from 'react';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useWallets } from '@/hooks/useWallets';
import { useAssets } from '@/hooks/useAssets';
import { usePortfolioStore } from '@/stores/portfolioStore';

// ─── Donut chart ──────────────────────────────────────────────────────────────

interface Segment {
  pct: number;
  color: string;
  label: string;
  valueThb: number;
}

function donutPath(
  cx: number, cy: number, R: number, r: number,
  startDeg: number, endDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = toRad(startDeg);
  const e = toRad(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const x1 = cx + R * Math.cos(s); const y1 = cy + R * Math.sin(s);
  const x2 = cx + R * Math.cos(e); const y2 = cy + R * Math.sin(e);
  const x3 = cx + r * Math.cos(e); const y3 = cy + r * Math.sin(e);
  const x4 = cx + r * Math.cos(s); const y4 = cy + r * Math.sin(s);
  return `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large},0 ${x4},${y4} Z`;
}

function DonutChart({ segments }: { segments: Segment[] }) {
  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 78;
  const r = 52;
  const GAP = 1.5;

  let start = 0;
  const paths = segments.map((seg) => {
    const sweep = seg.pct * 360;
    const path = donutPath(cx, cy, R, r, start + GAP / 2, start + sweep - GAP / 2);
    start += sweep;
    return { path, color: seg.color };
  });

  return (
    <Svg width={SIZE} height={SIZE}>
      {paths.map((p, i) => (
        <Path key={i} d={p.path} fill={p.color} />
      ))}
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const WALLET_COLORS: Record<string, string> = {
  cash: colors.accent,
  bank: '#7BA9A3',
  credit: colors.warning,
  other: colors.textMuted,
};

const ASSET_COLORS: Record<string, string> = {
  stock: colors.warning,
  etf: '#C4A35A',
  crypto: '#A8956E',
  gold: '#D4A574',
  other: colors.textDim,
};

export default function NetWorthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: wallets } = useWallets();
  const { data: assets } = useAssets();
  const { usdToThb } = usePortfolioStore();
  const [expanded, setExpanded] = useState(false);

  const walletsThb = (wallets ?? []).reduce((s, w) => s + w.balance, 0);
  const portfolioUsd = (assets ?? []).reduce((s, a) => {
    return s + a.quantity * (a.last_price ?? a.avg_cost_per_unit ?? 0);
  }, 0);
  const portfolioThb = portfolioUsd * usdToThb;
  const netWorthThb = walletsThb + portfolioThb;

  // Segments for donut
  const total = netWorthThb || 1;

  const simpleSegments: Segment[] = [
    { label: 'Wallets', pct: walletsThb / total, color: colors.accent, valueThb: walletsThb },
    { label: 'Portfolio', pct: portfolioThb / total, color: colors.warning, valueThb: portfolioThb },
  ].filter((s) => s.valueThb > 0);

  // Expanded: wallet types + asset types
  const walletByType = (wallets ?? []).reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + w.balance;
    return acc;
  }, {});
  const assetByType = (assets ?? []).reduce<Record<string, number>>((acc, a) => {
    const val = a.quantity * (a.last_price ?? a.avg_cost_per_unit ?? 0) * usdToThb;
    acc[a.type] = (acc[a.type] ?? 0) + val;
    return acc;
  }, {});

  const expandedSegments: Segment[] = [
    ...Object.entries(walletByType).map(([type, val]) => ({
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} wallet`,
      pct: val / total,
      color: WALLET_COLORS[type] ?? colors.textMuted,
      valueThb: val,
    })),
    ...Object.entries(assetByType).map(([type, val]) => ({
      label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      pct: val / total,
      color: ASSET_COLORS[type] ?? colors.textDim,
      valueThb: val,
    })),
  ].filter((s) => s.valueThb > 0);

  const segments = expanded ? expandedSegments : simpleSegments;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Net worth</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total net worth</Text>
          <Text style={styles.totalValue}>฿{formatAmount(netWorthThb)}</Text>
          <Text style={styles.totalUsd}>${formatAmount(netWorthThb / usdToThb)} USD est.</Text>
        </View>

        {/* Breakdown */}
        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={styles.bLabel}>Wallets</Text>
              <Text style={styles.bValue}>฿{formatAmount(walletsThb)}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <View style={[styles.dot, { backgroundColor: colors.warning }]} />
              <Text style={styles.bLabel}>Portfolio</Text>
              <Text style={styles.bValue}>฿{formatAmount(portfolioThb)}</Text>
            </View>
          </View>
        </View>

        {/* Donut */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Allocation</Text>
            <TouchableOpacity
              onPress={() => setExpanded((v) => !v)}
              style={styles.expandBtn}
            >
              <Text style={styles.expandLabel}>{expanded ? 'Simplified' : 'Show detail'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.donutWrap}>
            {segments.length >= 2 ? (
              <DonutChart segments={segments} />
            ) : (
              <View style={styles.donutPlaceholder} />
            )}
          </View>

          <View style={styles.legend}>
            {segments.map((s, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendLabel}>{s.label}</Text>
                <Text style={styles.legendPct}>{(s.pct * 100).toFixed(1)}%</Text>
                <Text style={styles.legendValue}>฿{formatAmount(s.valueThb)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navTitle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 20, color: colors.text },
  content: { padding: 16, gap: 16 },

  totalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  totalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 40,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  totalUsd: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },

  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  breakdownRow: { flexDirection: 'row', alignItems: 'center' },
  breakdownItem: { flex: 1, alignItems: 'center', gap: 6 },
  breakdownDivider: { width: 1, height: 40, backgroundColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  bValue: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 18,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expandBtn: {
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expandLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.accent },

  donutWrap: { alignItems: 'center' },
  donutPlaceholder: { width: 180, height: 180, borderRadius: 90, backgroundColor: colors.bgInput },

  legend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text },
  legendPct: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  legendValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    minWidth: 72,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
