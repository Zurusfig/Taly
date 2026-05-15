import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { X, Leaf, Trophy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { differenceInDays } from 'date-fns';
import { colors } from '@/theme/colors';
import { Creature } from '@/components/Creature';
import { DROPLET_DESCRIPTIONS } from './WaterDroplets';
import { xpToStage, nextStageXp, moodFromLastLogged, type UserProgress } from '@/hooks/useProgress';
import type { DailyCompletion } from '@/hooks/useDailyCompletions';
import type { StreakInfo } from '@/hooks/useStreak';

interface PlantDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  progress: UserProgress;
  completion: DailyCompletion | null;
  streak?: StreakInfo | null;
  onHarvest: () => void;
}

export function PlantDetailSheet({
  visible, onClose, progress, completion, streak, onHarvest,
}: PlantDetailSheetProps) {
  const router = useRouter();
  const stage = xpToStage(progress.xp);
  const mood = moodFromLastLogged(progress.last_logged_date);
  const next = nextStageXp(progress.xp);
  const prevXp = [0, 0, 50, 200, 500, 1500][stage];
  const rangeSize = next ? next - prevXp : 1;
  const pct = next ? Math.min((progress.xp - prevXp) / rangeSize, 1) : 1;
  const species = (progress as any).active_plant_species ?? 'sprout';
  const plantedAt = (progress as any).active_plant_planted_at ?? progress.created_at;
  const daysGrowing = differenceInDays(new Date(), new Date(plantedAt));
  const canHarvest = stage >= 5;

  const moodText: Record<string, string> = {
    happy: 'Your plant is happy — you logged today.',
    neutral: 'Your plant is calm — logged yesterday.',
    sleepy: 'Your plant is sleepy — it\'s been 2 days.',
    hungry: 'Your plant needs attention — log something.',
  };

  async function handleHarvest() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onHarvest();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.plantWrap}>
              <Creature stage={stage} mood={mood} size={160} species={species} />
            </View>

            <Text style={styles.speciesName}>{capitalize(species)}</Text>
            <Text style={styles.dayLabel}>Day {daysGrowing} of growth</Text>

            <View style={styles.growthBarBg}>
              <View style={[styles.growthBarFill, { width: `${Math.round(pct * 100)}%` }]} />
            </View>

            <Text style={styles.moodText}>{moodText[mood]}</Text>

            {/* Watering status */}
            <View style={styles.dropletSection}>
              <Text style={styles.dropletTitle}>Today's watering</Text>
              <DropletRow
                label="Capture"
                done={completion?.capture_done ?? false}
                description={DROPLET_DESCRIPTIONS.capture}
              />
              <DropletRow
                label="Awareness"
                done={completion?.awareness_done ?? false}
                description={DROPLET_DESCRIPTIONS.awareness}
              />
              <DropletRow
                label="Discipline"
                done={completion?.discipline_done ?? false}
                description={DROPLET_DESCRIPTIONS.discipline}
              />
            </View>

            {(streak?.current ?? 0) > 0 && (
              <View style={styles.streakRow}>
                <Text style={styles.streakLabel}>
                  {streak!.current}-day streak · best: {streak!.longest}
                </Text>
              </View>
            )}

            {canHarvest && (
              <TouchableOpacity style={styles.harvestBtn} onPress={handleHarvest} activeOpacity={0.8}>
                <Leaf size={16} color={colors.bg} />
                <Text style={styles.harvestBtnText}>Harvest to garden</Text>
              </TouchableOpacity>
            )}
            {!canHarvest && (
              <Text style={styles.gardenHint}>Reach Stage 5 to harvest into your garden.</Text>
            )}

            <TouchableOpacity
              style={styles.achievementsLink}
              onPress={() => { onClose(); router.push('/(app)/achievements'); }}
              activeOpacity={0.7}
            >
              <Trophy size={14} color={colors.textDim} />
              <Text style={styles.achievementsLinkText}>View achievements</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DropletRow({ label, done, description }: { label: string; done: boolean; description: string }) {
  return (
    <View style={styles.dropletRow}>
      <View style={[styles.dropletDot, done && styles.dropletDotDone]} />
      <View style={styles.dropletRowText}>
        <Text style={[styles.dropletRowLabel, done && styles.dropletRowDone]}>{label}</Text>
        <Text style={styles.dropletRowDesc}>{description}</Text>
      </View>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
  },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginRight: -8,
    marginTop: 4,
  },
  plantWrap: { alignItems: 'center', marginVertical: 8 },
  speciesName: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  dayLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  growthBarBg: {
    height: 4,
    backgroundColor: colors.bgInput,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  growthBarFill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  moodText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  dropletSection: { gap: 12, marginBottom: 24 },
  dropletTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dropletDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
    marginTop: 3,
  },
  dropletDotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dropletRowText: { flex: 1, gap: 2 },
  dropletRowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  dropletRowDone: { color: colors.text },
  dropletRowDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
    lineHeight: 17,
  },
  streakRow: { marginBottom: 16 },
  streakLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
  },
  harvestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  harvestBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.bg,
  },
  gardenHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 8,
  },
  achievementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  achievementsLinkText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textDim,
  },
});
