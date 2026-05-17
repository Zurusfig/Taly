import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, X } from 'lucide-react-native';
import { format } from 'date-fns';
import { colors } from '@/theme/colors';
import {
  useUnlockedAchievements,
  ACHIEVEMENT_META,
  ACHIEVEMENT_CATEGORIES,
  AchievementKey,
  AchievementCategory,
} from '@/hooks/useAchievements';
import { AchievementCard, ICON_MAP, CARD_WIDTH } from '@/components/achievements/AchievementCard';

// ─── All achievement keys ordered by category ─────────────────────────────────

const KEYS_BY_CATEGORY: Record<AchievementCategory, AchievementKey[]> = {
  Logging: ['first_log', 'log_100', 'log_1000'],
  Streaks: ['streak_7', 'streak_30', 'streak_100'],
  Speed: ['fast_100'],
  Quests: ['first_quest', 'quests_10'],
  Garden: ['first_harvest', 'garden_10'],
  Budgets: ['under_budget_month'],
};

const TOTAL_ACHIEVEMENTS = 12;

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  achievementKey: AchievementKey | null;
  unlockedAt: string | null;
  onClose: () => void;
}

function DetailModal({ achievementKey, unlockedAt, onClose }: DetailModalProps) {
  if (!achievementKey) return null;

  const meta = ACHIEVEMENT_META[achievementKey];
  const unlocked = Boolean(unlockedAt);
  const IconComponent = ICON_MAP[meta?.icon ?? ''] ?? Trophy;

  return (
    <Modal
      visible={Boolean(achievementKey)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />

          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} hitSlop={8}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={modalStyles.content}>
            <View style={modalStyles.iconCircle}>
              <IconComponent
                size={48}
                color={unlocked ? colors.accent : colors.textDim}
              />
            </View>

            <Text style={modalStyles.title}>{meta?.title ?? achievementKey}</Text>

            <Text style={modalStyles.description}>
              {unlocked ? (meta?.description ?? '') : (meta?.hint ?? '')}
            </Text>

            <View style={modalStyles.xpBadge}>
              <Text style={modalStyles.xpText}>+{meta?.xp ?? 0} XP</Text>
            </View>

            {unlocked && unlockedAt ? (
              <Text style={modalStyles.dateText}>
                Unlocked {format(new Date(unlockedAt), 'MMM d, yyyy')}
              </Text>
            ) : (
              <Text style={modalStyles.lockedText}>Not yet unlocked</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: unlockedList } = useUnlockedAchievements();

  const [selectedKey, setSelectedKey] = useState<AchievementKey | null>(null);

  // Build lookup: key → unlocked_at
  const unlockedMap = new Map<string, string>();
  for (const item of unlockedList ?? []) {
    unlockedMap.set(item.key, item.unlocked_at);
  }

  const unlockedCount = unlockedMap.size;
  const progressPct = unlockedCount / TOTAL_ACHIEVEMENTS;

  const selectedUnlockedAt = selectedKey ? (unlockedMap.get(selectedKey) ?? null) : null;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Achievements</Text>
          <Text style={styles.subheading}>
            {unlockedCount} of {TOTAL_ACHIEVEMENTS} unlocked
          </Text>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
        </View>

        {/* Sections */}
        {ACHIEVEMENT_CATEGORIES.map((category) => {
          const keys = KEYS_BY_CATEGORY[category] ?? [];
          const categoryUnlocked = keys.filter((k) => unlockedMap.has(k)).length;

          return (
            <View key={category} style={styles.section}>
              {/* Section header */}
              <Text style={styles.sectionTitle}>
                {category.toUpperCase()} · {categoryUnlocked} of {keys.length}
              </Text>

              {/* 2-column grid */}
              <View style={styles.grid}>
                {keys.map((key, index) => (
                  <AchievementCard
                    key={key}
                    achievementKey={key}
                    unlockedAt={unlockedMap.get(key) ?? null}
                    index={index}
                    onPress={() => setSelectedKey(key)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Detail modal */}
      <DetailModal
        achievementKey={selectedKey}
        unlockedAt={selectedUnlockedAt}
        onClose={() => setSelectedKey(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  header: {
    marginBottom: 28,
    gap: 6,
  },
  heading: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.text,
  },
  subheading: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.bgInput,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  section: {
    marginBottom: 24,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textDim,
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    gap: 10,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 26,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  xpBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  xpText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.accent,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  lockedText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
});
