import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Path, Line as SvgLine, Circle, Rect,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BarChart2 } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import { useChartStore } from '@/stores/chartStore';
import type { TrendPoint } from '@/hooks/useSummary';

export type { ChartVariant } from '@/stores/chartStore';

// ─── Layout ───────────────────────────────────────────────────────────────────

const CHART_H = 148;
const PAD_TOP = 10;
const X_H = 20;
const Y_W = 36;

// ─── Utilities ───────────────────────────────────────────────────────────────

function abbrev(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

function niceMax(v: number): number {
  if (v <= 0) return 1000;
  const exp = Math.floor(Math.log10(v));
  const mag = Math.pow(10, exp);
  const frac = v / mag;
  if (frac <= 1) return mag;
  if (frac <= 2) return 2 * mag;
  if (frac <= 5) return 5 * mag;
  return 10 * mag;
}

function xStep(count: number): number {
  if (count <= 7) return 1;
  if (count <= 14) return 2;
  if (count <= 31) return 5;
  return 3;
}

// ─── Variant Toggle ───────────────────────────────────────────────────────────

const VARIANTS = [
  { key: 'line' as const, label: 'Line' },
  { key: 'bar' as const, label: 'Bar' },
  { key: 'stacked' as const, label: 'Stack' },
  { key: 'area' as const, label: 'Area' },
];

function VariantToggle() {
  const { variant, setVariant } = useChartStore();
  return (
    <View style={styles.toggle}>
      {VARIANTS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.toggleBtn, variant === key && styles.toggleBtnActive]}
          onPress={() => setVariant(key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, variant === key && styles.toggleTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Y Axis ──────────────────────────────────────────────────────────────────

function YAxis({ maxVal, mirrored }: { maxVal: number; mirrored: boolean }) {
  const ticks = mirrored
    ? [
        { frac: 1, label: abbrev(maxVal) },
        { frac: 0.75, label: abbrev(maxVal * 0.5) },
        { frac: 0.5, label: '0' },
        { frac: 0.25, label: abbrev(maxVal * 0.5) },
        { frac: 0, label: abbrev(maxVal) },
      ]
    : [
        { frac: 1, label: abbrev(maxVal) },
        { frac: 0.75, label: abbrev(maxVal * 0.75) },
        { frac: 0.5, label: abbrev(maxVal * 0.5) },
        { frac: 0.25, label: abbrev(maxVal * 0.25) },
        { frac: 0, label: '0' },
      ];

  return (
    <View style={{ width: Y_W, height: CHART_H + PAD_TOP }}>
      {ticks.map(({ frac, label }) => (
        <Text
          key={frac}
          style={[
            styles.yLabel,
            { position: 'absolute', top: PAD_TOP + (1 - frac) * CHART_H - 7, right: 3 },
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function TooltipCard({
  point,
  leftSide,
  onDismiss,
}: {
  point: TrendPoint;
  leftSide: boolean;
  onDismiss: () => void;
}) {
  const net = point.income - point.expense;
  return (
    <View
      style={[styles.tooltip, leftSide ? { left: 0 } : { right: 0 }]}
      pointerEvents="box-none"
    >
      <View style={styles.tooltipHeader}>
        <Text style={styles.tooltipPeriod}>{point.label}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={10} style={styles.tooltipClose}>
          <Text style={styles.tooltipCloseText}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tooltipRow}>
        <View style={[styles.tooltipDot, { backgroundColor: colors.accent }]} />
        <Text style={styles.tooltipKey}>Income</Text>
        <Text style={[styles.tooltipVal, { color: colors.accent }]}>฿{formatAmount(point.income)}</Text>
      </View>
      <View style={styles.tooltipRow}>
        <View style={[styles.tooltipDot, { backgroundColor: colors.danger }]} />
        <Text style={styles.tooltipKey}>Expense</Text>
        <Text style={[styles.tooltipVal, { color: colors.danger }]}>฿{formatAmount(point.expense)}</Text>
      </View>
      <View style={styles.tooltipSep} />
      <View style={styles.tooltipRow}>
        <Text style={[styles.tooltipKey, { flex: 1 }]}>Net</Text>
        <Text style={[styles.tooltipVal, { color: net >= 0 ? colors.accent : colors.danger }]}>
          {net >= 0 ? '+' : ''}฿{formatAmount(Math.abs(net))}
        </Text>
      </View>
      {point.count > 0 && (
        <Text style={styles.tooltipCount}>{point.count} transactions</Text>
      )}
    </View>
  );
}

// ─── Shared chart props ───────────────────────────────────────────────────────

interface ChartProps {
  trend: TrendPoint[];
  maxVal: number;
  selected: number | null;
  onSelect: (i: number) => void;
  w: number;
}

// ─── SVG Grid Lines ───────────────────────────────────────────────────────────

function SvgGrid({ w, mirrored }: { w: number; mirrored: boolean }) {
  const ticks = mirrored ? [0.25, 0.5, 0.75] : [0.25, 0.5, 0.75, 1];
  return (
    <>
      <SvgLine
        x1={0} y1={PAD_TOP + CHART_H}
        x2={w} y2={PAD_TOP + CHART_H}
        stroke={colors.border} strokeWidth={0.5}
      />
      {ticks.map((f) => (
        <SvgLine
          key={f}
          x1={0} y1={PAD_TOP + (1 - f) * CHART_H}
          x2={w} y2={PAD_TOP + (1 - f) * CHART_H}
          stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4" opacity={0.6}
        />
      ))}
    </>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChart({ trend, w, maxVal, selected, onSelect }: ChartProps) {
  const n = trend.length;
  const sw = w / n;
  const cx = (i: number) => sw * i + sw / 2;
  const cy = (v: number) => PAD_TOP + (1 - Math.min(Math.max(v, 0), maxVal) / maxVal) * CHART_H;

  const mkPath = (key: 'income' | 'expense') =>
    trend.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cy(p[key]).toFixed(1)}`).join(' ');

  const h = PAD_TOP + CHART_H;

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <SvgGrid w={w} mirrored={false} />
      <Path d={mkPath('income')} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={mkPath('expense')} stroke={colors.danger} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {trend.map((p, i) => (
        <React.Fragment key={i}>
          {selected === i && (
            <SvgLine
              x1={cx(i)} y1={PAD_TOP}
              x2={cx(i)} y2={h}
              stroke={colors.textDim} strokeWidth={1} strokeDasharray="3,4"
            />
          )}
          <Circle cx={cx(i)} cy={cy(p.income)} r={selected === i ? 5.5 : 3.5} fill={colors.accent} />
          <Circle cx={cx(i)} cy={cy(p.expense)} r={selected === i ? 5.5 : 3.5} fill={colors.danger} />
          <Rect x={cx(i) - sw / 2} y={0} width={sw} height={h} fill="transparent" onPress={() => onSelect(i)} />
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ─── Area Chart ───────────────────────────────────────────────────────────────

function AreaChart({ trend, w, maxVal, selected, onSelect }: ChartProps) {
  const n = trend.length;
  const sw = w / n;
  const cx = (i: number) => sw * i + sw / 2;
  const halfH = CHART_H / 2;
  const zeroY = PAD_TOP + halfH;

  const cyInc = (v: number) => zeroY - (Math.min(Math.max(v, 0), maxVal) / maxVal) * halfH;
  const cyExp = (v: number) => zeroY + (Math.min(Math.max(v, 0), maxVal) / maxVal) * halfH;

  const first = cx(0);
  const last = cx(n - 1);

  const incomeArea = [
    ...trend.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cyInc(p.income).toFixed(1)}`),
    `L${last.toFixed(1)},${zeroY} L${first.toFixed(1)},${zeroY} Z`,
  ].join(' ');

  const expenseArea = [
    ...trend.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cyExp(p.expense).toFixed(1)}`),
    `L${last.toFixed(1)},${zeroY} L${first.toFixed(1)},${zeroY} Z`,
  ].join(' ');

  const incomeLine = trend.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cyInc(p.income).toFixed(1)}`).join(' ');
  const expenseLine = trend.map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cyExp(p.expense).toFixed(1)}`).join(' ');

  const h = PAD_TOP + CHART_H;

  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      {/* Boundary lines */}
      <SvgLine x1={0} y1={PAD_TOP} x2={w} y2={PAD_TOP} stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4" opacity={0.5} />
      <SvgLine x1={0} y1={zeroY} x2={w} y2={zeroY} stroke={colors.border} strokeWidth={1} />
      <SvgLine x1={0} y1={h} x2={w} y2={h} stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4" opacity={0.5} />

      {/* Fill */}
      <Path d={incomeArea} fill={colors.accent} opacity={0.18} />
      <Path d={expenseArea} fill={colors.danger} opacity={0.18} />

      {/* Lines */}
      <Path d={incomeLine} stroke={colors.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d={expenseLine} stroke={colors.danger} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {trend.map((p, i) => (
        <React.Fragment key={i}>
          {selected === i && (
            <SvgLine
              x1={cx(i)} y1={PAD_TOP}
              x2={cx(i)} y2={h}
              stroke={colors.textDim} strokeWidth={1} strokeDasharray="3,4"
            />
          )}
          <Circle cx={cx(i)} cy={cyInc(p.income)} r={selected === i ? 5 : 3} fill={colors.accent} />
          <Circle cx={cx(i)} cy={cyExp(p.expense)} r={selected === i ? 5 : 3} fill={colors.danger} />
          <Rect x={cx(i) - sw / 2} y={0} width={sw} height={h} fill="transparent" onPress={() => onSelect(i)} />
        </React.Fragment>
      ))}
    </Svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ trend, maxVal, selected, onSelect }: Omit<ChartProps, 'w'>) {
  return (
    <View style={styles.barContainer}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <View key={f} style={[styles.gridLine, { bottom: f * CHART_H }]} />
      ))}
      {trend.map((p, i) => {
        const ih = maxVal > 0 ? Math.max(2, (p.income / maxVal) * CHART_H) : 0;
        const eh = maxVal > 0 ? Math.max(2, (p.expense / maxVal) * CHART_H) : 0;
        const sel = selected === i;
        return (
          <TouchableOpacity
            key={i}
            style={styles.barSlot}
            onPress={() => onSelect(i)}
            activeOpacity={0.85}
          >
            <View style={[styles.bar, { height: ih, backgroundColor: colors.accent, opacity: sel ? 1 : 0.72 }]} />
            <View style={[styles.bar, { height: eh, backgroundColor: colors.danger, opacity: sel ? 1 : 0.72 }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Stacked Bar Chart ────────────────────────────────────────────────────────

function StackedChart({ trend, maxVal, selected, onSelect }: Omit<ChartProps, 'w'>) {
  return (
    <View style={styles.barContainer}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <View key={f} style={[styles.gridLine, { bottom: f * CHART_H }]} />
      ))}
      {trend.map((p, i) => {
        const expH = maxVal > 0 ? Math.max(2, (p.expense / maxVal) * CHART_H) : 0;
        const incH = maxVal > 0 ? Math.max(2, (p.income / maxVal) * CHART_H) : 0;
        const sel = selected === i;
        const cats = p.categories.filter((c) => c.amount > 0);
        const totalExp = p.expense;

        return (
          <TouchableOpacity
            key={i}
            style={styles.barSlot}
            onPress={() => onSelect(i)}
            activeOpacity={0.85}
          >
            {/* Stacked expense by category (column-reverse so largest is at bottom) */}
            <View
              style={{
                flex: 1,
                height: expH,
                overflow: 'hidden',
                flexDirection: 'column-reverse',
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                opacity: sel ? 1 : 0.78,
              }}
            >
              {cats.length > 0
                ? cats.map((cat, ci) => (
                    <View
                      key={ci}
                      style={{
                        height: totalExp > 0 ? (cat.amount / totalExp) * expH : 0,
                        backgroundColor: cat.color,
                      }}
                    />
                  ))
                : <View style={{ flex: 1, backgroundColor: colors.danger }} />
              }
            </View>
            {/* Income */}
            <View
              style={{
                flex: 1,
                height: incH,
                backgroundColor: colors.accent,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                opacity: sel ? 1 : 0.72,
              }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Loading / Empty ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <View style={[styles.placeholder, { gap: 8, justifyContent: 'center' }]}>
      <View style={{ height: 10, width: '80%', backgroundColor: colors.bgInput, borderRadius: 5 }} />
      <View style={{ height: 10, width: '60%', backgroundColor: colors.bgInput, borderRadius: 5 }} />
      <View style={{ height: 10, width: '70%', backgroundColor: colors.bgInput, borderRadius: 5 }} />
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.placeholder}>
      <BarChart2 size={28} color={colors.textDim} />
      <Text style={styles.emptyText}>No transactions this period</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface TrendChartProps {
  trend: TrendPoint[];
  isLoading?: boolean;
}

export function TrendChart({ trend, isLoading }: TrendChartProps) {
  const { variant } = useChartStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [innerW, setInnerW] = useState(0);

  const onSelect = (i: number) => {
    if (selected !== i) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => (prev === i ? null : i));
  };

  const maxVal = useMemo(() => {
    if (!trend.length) return 1000;
    return niceMax(Math.max(...trend.map((p) => Math.max(p.income, p.expense))));
  }, [trend]);

  const isEmpty = !trend.length || trend.every((p) => p.income === 0 && p.expense === 0);
  const step = xStep(trend.length);
  const isArea = variant === 'area';
  const isSvg = variant === 'line' || variant === 'area';

  // Which side the tooltip opens on (avoid edge overlap)
  const leftSide = selected !== null ? (selected + 0.5) / trend.length < 0.5 : true;

  if (isLoading) return <View style={styles.wrapper}><VariantToggle /><Skeleton /></View>;
  if (isEmpty) return <View style={styles.wrapper}><VariantToggle /><EmptyState /></View>;

  return (
    <View style={styles.wrapper}>
      <VariantToggle />
      <View style={{ flexDirection: 'row' }}>
        {/* Y axis labels */}
        <YAxis maxVal={maxVal} mirrored={isArea} />

        {/* Chart body */}
        <View
          style={{ flex: 1 }}
          onLayout={(e: LayoutChangeEvent) => {
            const w = Math.floor(e.nativeEvent.layout.width);
            if (w !== innerW) setInnerW(w);
          }}
        >
          {innerW > 0 && (
            <>
              {/* Drawing area */}
              <View style={{ height: PAD_TOP + CHART_H, overflow: 'visible' }}>
                {isSvg ? (
                  variant === 'line'
                    ? <LineChart trend={trend} w={innerW} maxVal={maxVal} selected={selected} onSelect={onSelect} />
                    : <AreaChart trend={trend} w={innerW} maxVal={maxVal} selected={selected} onSelect={onSelect} />
                ) : (
                  variant === 'bar'
                    ? <BarChart trend={trend} maxVal={maxVal} selected={selected} onSelect={onSelect} w={innerW} />
                    : <StackedChart trend={trend} maxVal={maxVal} selected={selected} onSelect={onSelect} w={innerW} />
                )}

                {/* Tooltip */}
                {selected !== null && (
                  <TooltipCard
                    point={trend[selected]}
                    leftSide={leftSide}
                    onDismiss={() => setSelected(null)}
                  />
                )}
              </View>

              {/* X axis */}
              <View style={{ height: X_H, flexDirection: 'row', marginTop: 2 }}>
                {trend.map((p, i) => (
                  <Text
                    key={i}
                    style={[styles.xLabel, { flex: 1, opacity: i % step === 0 ? 1 : 0 }]}
                    numberOfLines={1}
                  >
                    {p.label}
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { gap: 10 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
    gap: 2,
  },
  toggleBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.bgElevated },
  toggleText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  toggleTextActive: { color: colors.text },

  yLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: colors.textDim,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },

  barContainer: {
    flex: 1,
    height: CHART_H + PAD_TOP,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingTop: PAD_TOP,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  barSlot: {
    flex: 1,
    height: CHART_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
  },
  bar: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  xLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: colors.textDim,
    textAlign: 'center',
  },

  tooltip: {
    position: 'absolute',
    top: 4,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 20,
    elevation: 20,
    minWidth: 150,
    maxWidth: '58%',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.25)',
  },
  tooltipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tooltipPeriod: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.text },
  tooltipClose: { padding: 2 },
  tooltipCloseText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textDim },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  tooltipDot: { width: 6, height: 6, borderRadius: 3 },
  tooltipKey: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted, flex: 1 },
  tooltipVal: { fontFamily: 'Inter_500Medium', fontSize: 11, fontVariant: ['tabular-nums'] },
  tooltipSep: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  tooltipCount: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.textDim, marginTop: 4, textAlign: 'right' },

  placeholder: {
    height: CHART_H + PAD_TOP + X_H,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textDim },
});
