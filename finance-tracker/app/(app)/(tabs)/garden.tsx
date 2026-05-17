import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Leaf, Package } from 'lucide-react-native';
import { isPast } from 'date-fns';
import { colors } from '@/theme/colors';
import { Creature } from '@/components/Creature';
import { useGardenPlants, useSeedPackets, usePlantSeedPacket, type GardenPlant, type SeedPacket } from '@/hooks/useGarden';
import { SPECIES_CONFIG, type SpeciesKey } from '@/lib/garden/species';

function plantStage(plant: GardenPlant): 1 | 2 | 3 | 4 | 5 {
  if (!plant.fully_grown_at) return 5;
  if (isPast(new Date(plant.fully_grown_at))) return 5;
  const total = 3 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(plant.planted_at).getTime();
  const pct = Math.min(elapsed / total, 1);
  if (pct >= 0.8) return 4;
  if (pct >= 0.55) return 3;
  if (pct >= 0.3) return 2;
  return 1;
}

function PlantCard({ plant, index, onPress }: { plant: GardenPlant; index: number; onPress: () => void }) {
  const stage = plantStage(plant);
  const species = plant.species as SpeciesKey;
  const config = SPECIES_CONFIG[species];

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()}>
      <TouchableOpacity style={styles.plantCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.plantCardIllustration}>
          <Creature stage={stage} mood="neutral" size={72} species={species} />
        </View>
        <Text style={styles.plantCardName}>{config?.name ?? species}</Text>
        <Text style={styles.plantCardOrigin} numberOfLines={2}>{plant.origin_label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SeedPacketCard({ packet, onPlant }: { packet: SeedPacket; onPlant: () => void }) {
  const config = SPECIES_CONFIG[packet.species as SpeciesKey];
  return (
    <TouchableOpacity style={styles.packetCard} onPress={onPlant} activeOpacity={0.8}>
      <Creature stage={1} mood="neutral" size={56} species={packet.species as SpeciesKey} />
      <Text style={styles.packetSpecies}>{config?.name ?? packet.species}</Text>
      <Text style={styles.packetFrom} numberOfLines={1}>{packet.earned_from}</Text>
    </TouchableOpacity>
  );
}

function PlantModal({ plant, onClose }: { plant: GardenPlant; onClose: () => void }) {
  const stage = plantStage(plant);
  const species = plant.species as SpeciesKey;
  const config = SPECIES_CONFIG[species];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalContent}>
            <Creature stage={stage} mood="happy" size={160} species={species} />
            <Text style={styles.modalName}>{config?.name ?? species}</Text>
            {config?.description && (
              <Text style={styles.modalDesc}>{config.description}</Text>
            )}
            <Text style={styles.modalOrigin}>{plant.origin_label}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GardenTab() {
  const insets = useSafeAreaInsets();
  const { data: plants, isLoading } = useGardenPlants();
  const { data: packets } = useSeedPackets();
  const plantSeed = usePlantSeedPacket();
  const [selectedPlant, setSelectedPlant] = useState<GardenPlant | null>(null);
  const [packetsExpanded, setPacketsExpanded] = useState(false);

  const unplantedPackets = (packets ?? []).filter((p) => !p.planted);

  function handlePlantSeed(packet: SeedPacket) {
    Alert.alert(
      `Plant ${SPECIES_CONFIG[packet.species as SpeciesKey]?.name ?? packet.species}?`,
      'It will grow over 3 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Plant it', onPress: () => plantSeed.mutate(packet.id) },
      ],
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Garden</Text>
        {(plants?.length ?? 0) > 0 && (
          <Text style={styles.subtitle}>{plants!.length} plant{plants!.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {unplantedPackets.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setPacketsExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Package size={16} color={colors.textMuted} />
              <Text style={styles.sectionTitle}>Seed packets</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unplantedPackets.length}</Text>
              </View>
            </TouchableOpacity>
            {packetsExpanded && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packetList}>
                {unplantedPackets.map((p) => (
                  <SeedPacketCard key={p.id} packet={p} onPlant={() => handlePlantSeed(p)} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (plants?.length ?? 0) === 0 ? (
          <View style={styles.empty}>
            <Leaf size={36} color={colors.textDim} />
            <Text style={styles.emptyTitle}>Your garden is empty</Text>
            <Text style={styles.emptyBody}>Your first harvest will appear here. Keep growing the plant on your home screen.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {(plants ?? []).map((plant, i) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                index={i}
                onPress={() => setSelectedPlant(plant)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {selectedPlant && (
        <PlantModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  screenTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  scroll: { paddingTop: 4 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.accent,
  },
  packetList: { paddingHorizontal: 12, gap: 10 },
  packetCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    width: 100,
  },
  packetSpecies: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  packetFrom: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  plantCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    width: 104,
  },
  plantCardIllustration: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantCardName: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  plantCardOrigin: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 13,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyTitle: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 8,
  },
  modalName: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
  },
  modalDesc: {
    fontFamily: 'InstrumentSerif_400Regular_Italic',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOrigin: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalClose: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: colors.bgInput,
    borderRadius: 12,
  },
  modalCloseText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.text,
  },
});
