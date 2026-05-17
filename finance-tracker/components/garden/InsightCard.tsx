import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { X, BarChart2, TrendingDown, Zap, Calendar, Repeat, Leaf, TrendingUp } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import type { WeeklyInsight } from '@/hooks/useWeeklyInsights';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  BarChart2,
  TrendingDown,
  Zap,
  Calendar,
  Repeat,
  Leaf,
  TrendingUp,
};

interface InsightCardProps {
  insight: WeeklyInsight;
  onDismiss: () => void;
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const { title, description, icon } = insight.insight_body;
  const Icon = ICON_MAP[icon] ?? BarChart2;

  return (
    <Animated.View style={[styles.card, animStyle]}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={colors.accent} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{description}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={12} style={styles.close}>
        <X size={16} color={colors.textDim} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    gap: 12,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 16, color: colors.text },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  close: { padding: 4 },
});
