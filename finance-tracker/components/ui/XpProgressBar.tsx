import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

interface XpProgressBarProps {
  xp: number;
  maxXp: number;
}

export function XpProgressBar({ xp, maxXp }: XpProgressBarProps) {
  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    const pct = maxXp > 0 ? Math.min(xp / maxXp, 1) : 1;

    progress.value = withTiming(pct, { duration: 400, easing: Easing.out(Easing.cubic) });

    // Brief pulse at 100%
    if (pct >= 1) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 400 }),
      );
    }
  }, [xp, maxXp]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.glow, glowStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    backgroundColor: colors.bgInput,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  glow: {
    backgroundColor: colors.accent,
    borderRadius: 2,
    opacity: 0,
  },
});
