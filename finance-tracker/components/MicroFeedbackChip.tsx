import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Zap, Flame, Star, Sun, Clock, TrendingDown } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { useMicroFeedbackStore, type MicroFact } from '@/stores/microFeedbackStore';
import { usePrefsStore } from '@/stores/prefsStore';

const ICON_MAP = {
  Zap,
  Flame,
  Star,
  Sun,
  Clock,
  TrendingDown,
} as const;

function ChipIcon({ name }: { name: MicroFact['icon'] }) {
  const Icon = ICON_MAP[name];
  return <Icon size={13} color={colors.accent} />;
}

export function MicroFeedbackChip() {
  const { pendingFact, clearFact } = useMicroFeedbackStore();
  const { minimalMode } = usePrefsStore();
  const translateY = useSharedValue(12);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingFact || minimalMode) return;

    // Slide in
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 200 });

    // Hold then fade out
    timerRef.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withDelay(100, withTiming(-8, { duration: 280 }));
      setTimeout(() => {
        clearFact();
        translateY.value = 12;
        opacity.value = 0;
      }, 420);
    }, 2200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingFact]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!pendingFact || minimalMode) return null;

  return (
    <Animated.View style={[styles.chip, animStyle]} pointerEvents="none">
      <ChipIcon name={pendingFact.icon} />
      <Text style={styles.text}>{pendingFact.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.text,
  },
});
