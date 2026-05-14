import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useSummary, type Period, type TrendPoint } from '@/hooks/useSummary';
import { useBudgets } from '@/hooks/useBudgets';

// ─── Period Selector ──────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 360) end = 359.999;
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

interface DonutProps {
  data: { color: string; percentage: number }[];
  size?: number;
  thickness?: number;
}

function DonutChart({ data, size = 160, thickness = 28 }: DonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  let current = 0;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r + thickness / 2} stroke={colors.bgElevated} strokeWidth={thickness} fill="none" />
      {data.map((slice, i) => {
        const start = current;
        const sweep = (slice.percentage / 100) * 360;
        current += sweep;
        if (sweep < 0.5) return null;
        return (
          <Path
            key={i}
            d={arcPath(cx, cy, r, start, start + sweep)}
            stroke={slice.color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="butt"
          />
        );
      })}
    </Svg>
  );
}

// ─── Budget Bar ───────────────────────────────────────────────────────────────

function BudgetBar({ name, color, spent, amount }: { name: string; color?: string | null; spent: number; amount: number }) {
  const pct = Math.min((spent / amount) * 100, 100);
  const over = spent > amount;
  const barColor = over ? colors.danger : color ?? colors.accent;

  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {color && <View style={[styles.budgetDot, { backgroundColor: color }]} />}
          <Text style={styles.budgetName}>{name}</Text>
        </View>
        <Text style={[styles.budgetAmount, over && { color: colors.danger }]}>
          ฿{formatAmount(spent)} / ฿{formatAmount(amount)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

// ─── Trend Bars ───────────────────────────────────────────────────────────────

function TrendBars({ trend }: { trend: TrendPoint[] }) {
  const maxVal = Math.max(...trend.map((p) => Math.max(p.income, p.expense)), 1);

  return (
    <View>
      <View style={styles.trendChart}>
        {trend.map((p) => (
          <View key={p.x} style={styles.trendCol}>
            <View style={styles.trendBars}>
              <View style={[styles.trendBar, { height: `${(p.expense / maxVal) * 100}%` as any, backgroundColor: colors.danger }]} />
              <View style={[styles.trendBar, { height: `${(p.income / maxVal) * 100}%` as any, backgroundColor: colors.accent }]} />
            </View>
            <Text style={styles.xLabel}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('month');
  const { data: summary, isLoading } = useSummary(period);
  const { data: budgets } = useBudgets();

  const top5 = summary?.categoryBreakdown.slice(0, 5) ?? [];
  const hasTrend = (summary?.trend ?? []).some((p) => p.income > 0 || p.expense > 0);
  const activeBudgets = (budgets ?? []).filter((b) => {
    const periodMatch = period === 'week' ? b.period === 'weekly'
      : period === 'month' ? b.period === 'monthly'
      : b.period === 'yearly';
    return periodMatch;
  });

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Summary</Text>
      </View>

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setPeriod(key)}
            style={[styles.periodChip, period === key && styles.periodChipActive]}
          >
            <Text style={[styles.periodLabel, period === key && styles.periodLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>฿{formatAmount(summary?.income ?? 0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Expense</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>฿{formatAmount(summary?.expense ?? 0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Net</Text>
              <Text style={[styles.statValue, { color: (summary?.net ?? 0) >= 0 ? colors.accent : colors.danger }]}>
                {(summary?.net ?? 0) >= 0 ? '+' : ''}฿{formatAmount(Math.abs(summary?.net ?? 0))}
              </Text>
            </View>
          </View>

          {/* Category donut */}
          {top5.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Spending by category</Text>
              <View style={styles.donutRow}>
                <DonutChart data={top5} />
                <View style={styles.legend}>
                  {top5.map((s) => (
                    <View key={s.categoryId ?? 'none'} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={styles.legendName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.legendPct}>{s.percentage.toFixed(0)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
              {top5.map((s) => (
                <View key={s.categoryId ?? 'none'} style={styles.catRow}>
                  <View style={[styles.catBar]}>
                    <View style={[styles.catFill, { width: `${s.percentage}%` as any, backgroundColor: s.color }]} />
                  </View>
                  <Text style={styles.catAmount}>฿{formatAmount(s.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Trend */}
          {hasTrend && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Trend</Text>
              <View style={styles.trendLabels}>
                <View style={styles.trendLegendItem}>
                  <View style={[styles.trendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.trendLegendText}>Expense</Text>
                </View>
                <View style={styles.trendLegendItem}>
                  <View style={[styles.trendDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.trendLegendText}>Income</Text>
                </View>
              </View>
              <TrendBars trend={summary!.trend} />
            </View>
          )}

          {/* Budget progress */}
          {activeBudgets.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Budgets</Text>
              {activeBudgets.map((b) => (
                <BudgetBar
                  key={b.id}
                  name={b.category_name ?? 'Total'}
                  color={b.category_color}
                  spent={b.spent ?? 0}
                  amount={b.amount}
                />
              ))}
            </View>
          )}

          {top5.length === 0 && !hasTrend && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions this {period}.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 28, color: colors.text },

  periodRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.bgElevated, borderRadius: 10, padding: 3 },
  periodChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  periodChipActive: { backgroundColor: colors.bgInput },
  periodLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.textMuted },
  periodLabelActive: { color: colors.text },

  content: { padding: 16, gap: 16 },

  statsRow: { flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 2 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 18, fontVariant: ['tabular-nums'] },

  card: { backgroundColor: colors.bgElevated, borderRadius: 14, padding: 16, gap: 12 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.text },
  legendPct: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catBar: { flex: 1, height: 4, backgroundColor: colors.bgInput, borderRadius: 2, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 2 },
  catAmount: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, width: 72, textAlign: 'right' },

  trendLabels: { flexDirection: 'row', gap: 16 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendLegendText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 },
  trendCol: { flex: 1, alignItems: 'center', gap: 4 },
  trendBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 1, width: '100%' },
  trendBar: { flex: 1, borderRadius: 2, minHeight: 2 },
  xLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, color: colors.textDim },

  budgetRow: { gap: 6 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetDot: { width: 8, height: 8, borderRadius: 4 },
  budgetName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.text },
  budgetAmount: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  track: { height: 6, backgroundColor: colors.bgInput, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textMuted },
});
