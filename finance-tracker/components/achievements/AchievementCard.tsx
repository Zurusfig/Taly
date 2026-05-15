import { ComponentType } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
} from 'lucide-react-native';
import { format } from 'date-fns';
import { colors } from '@/theme/colors';
import { ACHIEVEMENT_META, AchievementKey } from '@/hooks/useAchievements';

// ─── Icon map ──────────────────────────────────────────────────────────────────

export const ICON_MAP: Record<string, ComponentType<{ size: number; color: string }>> = {
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

// ─── Card width ────────────────────────────────────────────────────────────────

export const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AchievementCardProps {
  achievementKey: AchievementKey;
  unlockedAt?: string | null;
  onPress: () => void;
  index: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AchievementCard({
  achievementKey,
  unlockedAt,
  onPress,
  index,
}: AchievementCardProps) {
  const meta = ACHIEVEMENT_META[achievementKey];
  const unlocked = Boolean(unlockedAt);
  const IconComponent = ICON_MAP[meta?.icon ?? ''] ?? Trophy;

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
      <TouchableOpacity
        style={[
          styles.card,
          { width: CARD_WIDTH },
          !unlocked && styles.cardLocked,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <IconComponent
          size={32}
          color={unlocked ? colors.accent : colors.textDim}
        />

        <Text style={[styles.title, !unlocked && styles.titleLocked]} numberOfLines={2}>
          {meta?.title ?? achievementKey}
        </Text>

        <Text style={[styles.body, !unlocked && styles.bodyLocked]} numberOfLines={3}>
          {unlocked ? (meta?.description ?? '') : (meta?.hint ?? '')}
        </Text>

        {unlocked && unlockedAt ? (
          <Text style={styles.date}>
            {format(new Date(unlockedAt), 'MMM d, yyyy')}
          </Text>
        ) : (
          <Text style={styles.locked}>Locked</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardLocked: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 16,
    color: colors.text,
    lineHeight: 20,
  },
  titleLocked: {
    color: colors.textDim,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    flex: 1,
  },
  bodyLocked: {
    color: colors.textDim,
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.accent,
  },
  locked: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
  },
});
