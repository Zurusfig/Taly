import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Creature } from './Creature';
import { xpToStage, nextStageXp, moodFromLastLogged, type UserProgress } from '@/hooks/useProgress';
import type { StreakInfo } from '@/hooks/useStreak';

const STAGE_LABELS: Record<number, string> = {
  1: 'Sprout',
  2: 'Seedling',
  3: 'Budding',
  4: 'Blooming',
  5: 'Flourishing',
};

interface CreatureCardProps {
  progress: UserProgress;
  streak?: StreakInfo | null;
  onPress?: () => void;
}

export function CreatureCard({ progress, streak, onPress }: CreatureCardProps) {
  const stage = xpToStage(progress.xp);
  const mood = moodFromLastLogged(progress.last_logged_date);
  const next = nextStageXp(progress.xp);
  const prevThreshold = [0, 0, 50, 200, 500, 1500][stage];
  const rangeSize = next ? next - prevThreshold : 1;
  const xpInRange = Math.min(progress.xp - prevThreshold, rangeSize);
  const pct = next ? xpInRange / rangeSize : 1;

  const streakCount = streak?.current ?? 0;
  const todayLogged = streak?.todayLogged ?? false;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.creatureWrap}>
        <Creature stage={stage} mood={mood} size={120} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.stageName}>{STAGE_LABELS[stage]}</Text>
          {streakCount > 0 && (
            <View style={styles.streak}>
              <Flame size={13} color={todayLogged ? colors.warning : colors.textDim} />
              <Text style={[styles.streakNum, { color: todayLogged ? colors.warning : colors.textDim }]}>
                {streakCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
        <Text style={styles.xpLabel}>
          {next
            ? `${progress.xp} / ${next} XP`
            : `${progress.xp} XP — max stage!`}
        </Text>
        <Text style={styles.moodLabel}>{moodLabel(mood)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function moodLabel(mood: string) {
  switch (mood) {
    case 'happy': return 'Thriving today!';
    case 'neutral': return 'Doing well';
    case 'sleepy': return 'Getting sleepy…';
    case 'hungry': return 'Needs your attention';
    default: return '';
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingRight: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  creatureWrap: {
    width: 120,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  info: {
    flex: 1,
    gap: 6,
    paddingVertical: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageName: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 20,
    color: colors.text,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakNum: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  xpBarBg: {
    height: 5,
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 5,
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  xpLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
  },
  moodLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
});
