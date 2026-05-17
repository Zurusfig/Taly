import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Droplet } from 'lucide-react-native';
import { colors } from '@/theme/colors';

export const DROPLET_DESCRIPTIONS = {
  capture: 'Log a transaction or mark today as a no-spend day',
  awareness: 'Open Summary, Portfolio, or Net Worth',
  discipline: 'Stay on budget pace, or fast-log over half of today\'s transactions',
};

// ─── Single droplet ───────────────────────────────────────────────────────────

interface SingleDropletProps {
  filled: boolean;
  onTap: () => void;
}

function SingleDroplet({ filled, onTap }: SingleDropletProps) {
  const wasFilled = useRef(filled);
  const fillProgress = useSharedValue(filled ? 1 : 0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const justFilled = filled && !wasFilled.current;
    fillProgress.value = withTiming(filled ? 1 : 0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    if (justFilled) {
      pulseScale.value = withSequence(
        withSpring(1.45, { damping: 5, stiffness: 300 }),
        withSpring(1, { damping: 14, stiffness: 220 }),
      );
    }
    wasFilled.current = filled;
  }, [filled]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const filledStyle = useAnimatedStyle(() => ({ opacity: fillProgress.value }));
  const emptyStyle = useAnimatedStyle(() => ({ opacity: 1 - fillProgress.value }));

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.7} hitSlop={8}>
      <Animated.View style={containerStyle}>
        <View style={styles.iconBox}>
          <Animated.View style={[StyleSheet.absoluteFill, emptyStyle]}>
            <Droplet size={16} color={colors.textMuted} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, filledStyle]}>
            <Droplet size={16} color={colors.accent} fill={colors.accent} />
          </Animated.View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── WaterDroplets ────────────────────────────────────────────────────────────

interface WaterDropletsProps {
  capture: boolean;
  awareness: boolean;
  discipline: boolean;
  onAllFilled?: () => void;
}

const DROPLETS = [
  { key: 'capture' as const },
  { key: 'awareness' as const },
  { key: 'discipline' as const },
];

export function WaterDroplets({ capture, awareness, discipline, onAllFilled }: WaterDropletsProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const prevAllFilled = useRef(false);

  const rowY = useSharedValue(0);
  const rowOpacity = useSharedValue(1);
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rowY.value }],
    opacity: rowOpacity.value,
  }));

  const filled = [capture, awareness, discipline];
  const allFilled = capture && awareness && discipline;

  useEffect(() => {
    if (allFilled && !prevAllFilled.current) {
      const t = setTimeout(() => {
        onAllFilled?.();
        rowY.value = withTiming(22, { duration: 450, easing: Easing.in(Easing.quad) });
        rowOpacity.value = withTiming(0, { duration: 420 });
        setTimeout(() => {
          rowY.value = 0;
          rowOpacity.value = 1;
        }, 620);
      }, 200);
      return () => clearTimeout(t);
    }
    prevAllFilled.current = allFilled;
  }, [allFilled]);

  function tapDroplet(index: number) {
    if (activeTooltip === index) {
      setActiveTooltip(null);
      return;
    }
    setActiveTooltip(index);
    setTimeout(() => setActiveTooltip((prev) => (prev === index ? null : prev)), 2500);
  }

  return (
    <View style={styles.container}>
      {activeTooltip !== null && (
        <View style={styles.tooltip} pointerEvents="none">
          <Text style={styles.tooltipText}>{DROPLET_DESCRIPTIONS[DROPLETS[activeTooltip].key]}</Text>
        </View>
      )}
      <Animated.View style={[styles.row, rowStyle]}>
        {DROPLETS.map((d, i) => (
          <SingleDroplet
            key={d.key}
            filled={filled[i]}
            onTap={() => tapDroplet(i)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 16,
    height: 16,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: 4,
    zIndex: 10,
  },
  tooltipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
});
