import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line as SvgLine, Circle } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { colors } from '@/theme/colors';
import { formatAmount } from '@/lib/utils';
import type { Snapshot } from '@/hooks/usePortfolioSnapshot';
import type { CurrencyMode } from '@/stores/portfolioStore';

const H = 156;
const PT = 8;
const PB = 28;
const IH = H - PT - PB;

interface Props {
  snapshots: Snapshot[];
  mode: CurrencyMode;
  usdToThb: number;
  width: number;
}

function Skeleton({ width }: { width: number }) {
  return (
    <View style={[styles.skeleton, { width, height: H }]} />
  );
}

export function PortfolioChart({ snapshots, mode, usdToThb, width }: Props) {
  const [sel, setSel] = useState<number | null>(null);

  if (width === 0) return <Skeleton width={300} />;
  if (snapshots.length < 2) {
    return (
      <View style={[styles.empty, { height: H }]}>
        <Text style={styles.emptyText}>Building chart history…{'\n'}check back tomorrow</Text>
      </View>
    );
  }

  const vals = snapshots.map((s) =>
    mode === 'usd' ? s.total_value_usd : s.total_value_usd * usdToThb,
  );
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const padding = (rawMax - rawMin) * 0.1 || rawMax * 0.05 || 1;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = max - min;

  function xOf(i: number) { return (i / (snapshots.length - 1)) * width; }
  function yOf(v: number) { return PT + IH - ((v - min) / range) * IH; }

  const pts = snapshots.map((s, i) => ({ x: xOf(i), y: yOf(vals[i]) }));
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${lineD} L${pts[pts.length - 1].x.toFixed(1)},${(H - PB).toFixed(1)} L${pts[0].x.toFixed(1)},${(H - PB).toFixed(1)} Z`;

  const isUp = vals[vals.length - 1] >= vals[0];
  const lineColor = isUp ? colors.accent : colors.danger;

  const zoneW = width / snapshots.length;
  const selSnap = sel !== null ? snapshots[sel] : null;
  const selPt = sel !== null ? pts[sel] : null;
  const selVal = sel !== null ? vals[sel] : null;
  const symbol = mode === 'usd' ? '$' : '฿';

  return (
    <View>
      <Svg width={width} height={H}>
        <Defs>
          <LinearGradient id="pcgrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.28} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill="url(#pcgrad)" />
        <Path d={lineD} stroke={lineColor} strokeWidth={1.8} fill="none" />
        {selPt && (
          <>
            <SvgLine
              x1={selPt.x} y1={PT}
              x2={selPt.x} y2={H - PB}
              stroke={colors.border} strokeWidth={1} strokeDasharray="3,3"
            />
            <Circle cx={selPt.x} cy={selPt.y} r={5} fill={lineColor} />
            <Circle cx={selPt.x} cy={selPt.y} r={2.5} fill={colors.bgElevated} />
          </>
        )}
        {snapshots.map((_, i) => (
          <Path
            key={i}
            d={`M${(i * zoneW).toFixed(1)},0 h${zoneW.toFixed(1)} v${H} h${(-zoneW).toFixed(1)} Z`}
            fill="transparent"
            onPress={() => setSel(sel === i ? null : i)}
          />
        ))}
      </Svg>

      {/* X-axis + tooltip row */}
      <View style={styles.xRow}>
        <Text style={styles.xLabel}>
          {format(parseISO(snapshots[0].snapshot_date), 'MMM d')}
        </Text>
        {selSnap ? (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipDate}>
              {format(parseISO(selSnap.snapshot_date), 'MMM d, yyyy')}
            </Text>
            <Text style={[styles.tooltipVal, { color: lineColor }]}>
              {symbol}{formatAmount(selVal ?? 0)}
            </Text>
          </View>
        ) : null}
        <Text style={styles.xLabel}>
          {format(parseISO(snapshots[snapshots.length - 1].snapshot_date), 'MMM d')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    opacity: 0.5,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  xRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  xLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
  },
  tooltip: { alignItems: 'center' },
  tooltipDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  tooltipVal: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
});
