import { useState, useEffect } from 'react';
import { markAwarenessDoneToday } from '@/hooks/useDailyCompletions';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useSummary, type Period } from '@/hooks/useSummary';
import { useBudgets } from '@/hooks/useBudgets';
import { TrendChart } from '@/components/charts/TrendChart';

// ─── Period Selector ──────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

// ─── Segment Bar (spending by category) ──────────────────────────────────────

function SegmentBar({ data }: { data: { color: string; percentage: number }[] }) {
  return (
    <View style={styles.segmentBar}>
      {data.map((slice, i) => (
        <View key={i} style={{ flex: slice.percentage, backgroundColor: slice.color }} />
      ))}
    </View>
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('month');
  const { data: summary, isLoading } = useSummary(period);

  useEffect(() => { markAwarenessDoneToday().catch(() => {}); }, []);
  const { data: budgets } = useBudgets();

  const top5 = summary?.categoryBreakdown.slice(0, 5) ?? [];
  const activeBudgets = (budgets ?? []).filter((b) => {
    const match = period === 'week' ? b.period === 'weekly'
      : period === 'month' ? b.period === 'monthly'
      : b.period === 'yearly';
    return match;
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

          {/* Trend chart */}
          <View style={styles.card}>
            <View style={styles.trendHeader}>
              <Text style={styles.cardTitle}>Trend</Text>
              <View style={styles.trendLegend}>
                <View style={styles.trendLegendItem}>
                  <View style={[styles.trendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.trendLegendText}>Exp</Text>
                </View>
                <View style={styles.trendLegendItem}>
                  <View style={[styles.trendDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.trendLegendText}>Inc</Text>
                </View>
              </View>
            </View>
            <TrendChart trend={summary?.trend ?? []} isLoading={isLoading} />
          </View>

          {/* Spending by category */}
          {top5.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Spending by category</Text>
              <SegmentBar data={top5} />
              <View style={styles.legend}>
                {top5.map((s) => (
                  <View key={s.categoryId ?? 'none'} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{s.name}</Text>
                    <Text style={styles.legendPct}>{s.percentage.toFixed(0)}%</Text>
                    <Text style={styles.legendAmount}>฿{formatAmount(s.amount)}</Text>
                  </View>
                ))}
              </View>
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

          {top5.length === 0 && !summary?.trend.some((p) => p.income > 0 || p.expense > 0) && (
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

  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendLegend: { flexDirection: 'row', gap: 10 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendDot: { width: 7, height: 7, borderRadius: 3.5 },
  trendLegendText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted },

  segmentBar: { height: 12, flexDirection: 'row', borderRadius: 6, overflow: 'hidden', gap: 1 },
  legend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.text },
  legendPct: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  legendAmount: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, minWidth: 68, textAlign: 'right' },

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
