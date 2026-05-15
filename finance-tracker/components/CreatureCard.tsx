import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { Creature } from './Creature';
import { WaterDroplets } from './garden/WaterDroplets';
import { PlantDetailSheet } from './garden/PlantDetailSheet';
import { XpProgressBar } from './ui/XpProgressBar';
import { xpToStage, nextStageXp, moodFromLastLogged, type UserProgress } from '@/hooks/useProgress';
import type { StreakInfo } from '@/hooks/useStreak';
import type { DailyCompletion } from '@/hooks/useDailyCompletions';
import type { SpeciesKey } from '@/lib/garden/species';

interface CreatureCardProps {
  progress: UserProgress;
  streak?: StreakInfo | null;
  completion?: DailyCompletion | null;
  onHarvest?: () => void;
}

export function CreatureCard({ progress, streak, completion, onHarvest }: CreatureCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showWateredToast, setShowWateredToast] = useState(false);

  const stage = xpToStage(progress.xp);
  const mood = moodFromLastLogged(progress.last_logged_date);
  const species = ((progress as any).active_plant_species ?? 'sprout') as SpeciesKey;

  const maxXp = nextStageXp(progress.xp);
  const prevThreshold = [0, 50, 200, 500, 1500].reverse().find((t) => progress.xp >= t) ?? 0;
  const xpInStage = progress.xp - prevThreshold;
  const xpForStage = maxXp !== null ? maxXp - prevThreshold : 1;

  const capture = completion?.capture_done ?? false;
  const awareness = completion?.awareness_done ?? false;
  const discipline = completion?.discipline_done ?? false;

  const streakCount = streak?.current ?? 0;
  const todayLogged = streak?.todayLogged ?? false;

  // Plant celebration animations
  const plantScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  function handleAllFilled() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    plantScale.value = withSequence(
      withSpring(1.1, { damping: 5, stiffness: 280 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    glowOpacity.value = withSequence(
      withTiming(0.35, { duration: 280 }),
      withTiming(0, { duration: 600 }),
    );
    setShowWateredToast(true);
    setTimeout(() => setShowWateredToast(false), 2000);
  }

  const plantBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plantScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <>
      <TouchableOpacity onPress={() => setSheetOpen(true)} activeOpacity={0.85} style={styles.card}>
        <View style={styles.plantColumn}>
          {showWateredToast && (
            <Text style={styles.wateredToast}>Your plant has been watered</Text>
          )}
          <WaterDroplets
            capture={capture}
            awareness={awareness}
            discipline={discipline}
            onAllFilled={handleAllFilled}
          />
          <View style={styles.creatureWrap}>
            <Animated.View style={plantBounceStyle}>
              <Creature stage={stage} mood={mood} size={90} species={species} />
            </Animated.View>
            <Animated.View style={[styles.glowHalo, glowStyle]} pointerEvents="none" />
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.speciesName}>{capitalize(species)}</Text>
            {streakCount > 0 && (
              <View style={styles.streak}>
                <Flame size={13} color={todayLogged ? colors.warning : colors.textDim} />
                <Text style={[styles.streakNum, { color: todayLogged ? colors.warning : colors.textDim }]}>
                  {streakCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.moodLabel}>{moodLine(mood)}</Text>
          {maxXp !== null && (
            <View style={styles.xpBar}>
              <XpProgressBar xp={xpInStage} maxXp={xpForStage} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <PlantDetailSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        progress={progress}
        completion={completion ?? null}
        streak={streak}
        onHarvest={() => {
          setSheetOpen(false);
          onHarvest?.();
        }}
      />
    </>
  );
}

function moodLine(mood: string): string {
  if (mood === 'happy') return 'Thriving today';
  if (mood === 'neutral') return 'Doing well';
  if (mood === 'sleepy') return 'Getting sleepy…';
  return 'Needs your attention';
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingRight: 20,
    overflow: 'visible',
    alignItems: 'center',
  },
  plantColumn: {
    width: 110,
    alignItems: 'center',
    paddingVertical: 8,
  },
  creatureWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowHalo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.accent,
    opacity: 0,
  },
  wateredToast: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 2,
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
  speciesName: {
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
  moodLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  xpBar: {
    marginTop: 4,
    marginRight: 4,
  },
});
