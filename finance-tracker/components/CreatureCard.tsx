import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Creature } from './Creature';
import { Petals } from './garden/Petals';
import { PlantDetailSheet } from './garden/PlantDetailSheet';
import { xpToStage, moodFromLastLogged, type UserProgress } from '@/hooks/useProgress';
import type { StreakInfo } from '@/hooks/useStreak';
import type { DailyCompletion } from '@/hooks/useDailyCompletions';
import type { SpeciesKey } from '@/lib/garden/species';

interface CreatureCardProps {
  progress: UserProgress;
  streak?: StreakInfo | null;
  completion?: DailyCompletion | null;
  showPetals?: boolean;
  onHarvest?: () => void;
}

export function CreatureCard({
  progress,
  streak,
  completion,
  showPetals = true,
  onHarvest,
}: CreatureCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const stage = xpToStage(progress.xp);
  const mood = moodFromLastLogged(progress.last_logged_date);
  const species = ((progress as any).active_plant_species ?? 'sprout') as SpeciesKey;

  const capture = completion?.capture_done ?? false;
  const awareness = completion?.awareness_done ?? false;
  const discipline = completion?.discipline_done ?? false;
  const allDone = capture && awareness && discipline;

  const streakCount = streak?.current ?? 0;
  const todayLogged = streak?.todayLogged ?? false;

  return (
    <>
      <TouchableOpacity onPress={() => setSheetOpen(true)} activeOpacity={0.85} style={styles.card}>
        <View style={styles.plantWrap}>
          <Creature stage={stage} mood={mood} size={110} species={species} />
          {showPetals && (
            <View style={styles.petalOverlay}>
              <Petals
                capture={capture}
                awareness={awareness}
                discipline={discipline}
                size={110}
                showGlow={allDone}
              />
            </View>
          )}
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
          <Text style={styles.moodLabel}>{moodLine(mood, todayLogged)}</Text>
          {showPetals && (
            <View style={styles.petalDots}>
              <View style={[styles.dot, capture && styles.dotFilled, { backgroundColor: capture ? colors.accent : undefined }]} />
              <View style={[styles.dot, awareness && styles.dotFilled, { backgroundColor: awareness ? '#9B8EC4' : undefined }]} />
              <View style={[styles.dot, discipline && styles.dotFilled, { backgroundColor: discipline ? colors.warning : undefined }]} />
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

function moodLine(mood: string, todayLogged: boolean): string {
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
    overflow: 'hidden',
    alignItems: 'center',
  },
  plantWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
  petalDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotFilled: {
    borderWidth: 0,
  },
});
