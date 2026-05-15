import { useEffect, useRef, ComponentType } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  PenLine,
  ListChecks,
  Award,
  Flame,
  Zap,
  MapPin,
  Sprout,
  Flower2,
  Target,
  Trophy,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { useToastStore } from '@/stores/toastStore';
import { ACHIEVEMENT_META, AchievementKey } from '@/hooks/useAchievements';

// ─── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, ComponentType<{ size: number; color: string }>> = {
  PenLine,
  ListChecks,
  Award,
  Flame,
  Zap,
  MapPin,
  Sprout,
  Flower2,
  Target,
  Trophy,
};

// ─── Internal Toast ────────────────────────────────────────────────────────────

interface ToastProps {
  id: string;
  achievementKey: AchievementKey;
  onDismiss: () => void;
}

function Toast({ id, achievementKey, onDismiss }: ToastProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const dismissedRef = useRef(false);

  const meta = ACHIEVEMENT_META[achievementKey];
  const IconComponent = ICON_MAP[meta?.icon ?? ''] ?? Trophy;

  function triggerDismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    translateY.value = withTiming(-100, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
    // Ensure onDismiss fires even if animation is cut short
    setTimeout(onDismiss, 280);
  }

  useEffect(() => {
    // Slide in
    translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    // Haptic on appear
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Auto-dismiss after 4s
    const timer = setTimeout(() => {
      triggerDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const pan = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationY < -40) {
        runOnJS(triggerDismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    })
    .onChange((event) => {
      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function handlePress() {
    triggerDismiss();
    router.push('/(app)/achievements');
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.container,
          { top: insets.top + 8 },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          style={styles.row}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrap}>
            <IconComponent size={20} color={colors.accent} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {meta?.title ?? achievementKey}
            </Text>
            <Text style={styles.subtitle}>Achievement unlocked</Text>
          </View>
          <ChevronRight size={16} color={colors.textDim} />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Queue renderer ────────────────────────────────────────────────────────────

export function AchievementToastQueue() {
  const { queue, dismiss } = useToastStore();

  const first = queue[0];
  if (!first) return null;

  // The key prop ensures Toast remounts when the queued item changes
  return (
    <Toast
      key={first.id}
      id={first.id}
      achievementKey={first.key as AchievementKey}
      onDismiss={() => dismiss(first.id)}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
