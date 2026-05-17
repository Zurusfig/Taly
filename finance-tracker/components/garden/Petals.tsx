import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface PetalProps {
  filled: boolean;
  angle: number;  // degrees from center
  radius: number; // distance from plant center
  color: string;
}

function Petal({ filled, angle, radius, color }: PetalProps) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled]);

  const rad = (angle * Math.PI) / 180;
  const cx = 60 + Math.cos(rad) * radius;
  const cy = 60 + Math.sin(rad) * radius;
  const size = 9;

  // Petal shape: small teardrop pointing toward center
  const backRad = ((angle + 180) * Math.PI) / 180;
  const tipX = cx + Math.cos(backRad) * size * 1.4;
  const tipY = cy + Math.sin(backRad) * size * 1.4;
  const cp1x = cx + Math.cos(rad - Math.PI / 2) * size * 0.8;
  const cp1y = cy + Math.sin(rad - Math.PI / 2) * size * 0.8;
  const cp2x = cx + Math.cos(rad + Math.PI / 2) * size * 0.8;
  const cp2y = cy + Math.sin(rad + Math.PI / 2) * size * 0.8;

  const d = `M${cx},${cy} Q${cp1x},${cp1y} ${tipX},${tipY} Q${cp2x},${cp2y} ${cx},${cy} Z`;

  const animatedProps = useAnimatedProps(() => ({
    fillOpacity: progress.value,
    strokeOpacity: 0.6 + progress.value * 0.4,
  }));

  return (
    <G>
      <AnimatedPath
        d={d}
        fill={color}
        stroke={color}
        strokeWidth={1}
        animatedProps={animatedProps}
      />
    </G>
  );
}

interface PetalsProps {
  capture: boolean;
  awareness: boolean;
  discipline: boolean;
  size?: number;
  showGlow?: boolean;
}

export function Petals({ capture, awareness, discipline, size = 120, showGlow = false }: PetalsProps) {
  const glowOpacity = useSharedValue(showGlow ? 1 : 0);

  useEffect(() => {
    glowOpacity.value = withTiming(showGlow ? 1 : 0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [showGlow]);

  const scale = size / 120;
  const radius = 34 * scale;
  const cx = size / 2;

  return (
    <View style={{ width: size, height: size, position: 'absolute' }} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {showGlow && (
          <Circle
            cx={cx}
            cy={cx}
            r={40 * scale}
            fill={colors.accent}
            fillOpacity={0.12}
          />
        )}
        {/* Petal 1 (Capture) — left */}
        <Petal filled={capture} angle={200} radius={radius} color={colors.accent} />
        {/* Petal 2 (Awareness) — right */}
        <Petal filled={awareness} angle={340} radius={radius} color="#9B8EC4" />
        {/* Petal 3 (Discipline) — top */}
        <Petal filled={discipline} angle={270} radius={radius} color={colors.warning} />
      </Svg>
    </View>
  );
}

export const PETAL_DESCRIPTIONS = {
  capture: 'Log a transaction or mark today as a no-spend day',
  awareness: 'Visit your Summary, Portfolio, or Net Worth screen',
  discipline: 'Stay on pace with your budget, or fast-log 50%+ of today\'s transactions',
};
