import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import type { CreatureStage, CreatureMood } from '@/hooks/useProgress';
import type { SpeciesKey } from '@/lib/garden/species';

// Lazy-import species components. All live in components/plants/.
// Using require() inside a function avoids circular deps and keeps bundle splitting clean.
function getSpeciesComponent(species: SpeciesKey) {
  switch (species) {
    case 'fern': return require('@/components/plants/PlantFern').PlantFern;
    case 'sunflower': return require('@/components/plants/PlantSunflower').PlantSunflower;
    case 'cactus': return require('@/components/plants/PlantCactus').PlantCactus;
    case 'tulip': return require('@/components/plants/PlantTulip').PlantTulip;
    case 'bonsai': return require('@/components/plants/PlantBonsai').PlantBonsai;
    case 'lavender': return require('@/components/plants/PlantLavender').PlantLavender;
    case 'lotus': return require('@/components/plants/PlantLotus').PlantLotus;
    case 'sprout':
    default:
      return require('@/components/plants/PlantSprout').PlantSprout;
  }
}

interface CreatureProps {
  stage: CreatureStage;
  mood: CreatureMood;
  size?: number;
  species?: SpeciesKey;
}

export function Creature({ stage, mood, size = 120, species = 'sprout' }: CreatureProps) {
  const sway = useSharedValue(0);

  useEffect(() => {
    if (mood === 'happy') {
      sway.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(sway);
      sway.value = 0;
    }
  }, [mood]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 4 - 2}deg` }],
  }));

  const PlantComponent = getSpeciesComponent(species);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle, { transformOrigin: `${size / 2}px ${size - 10}px` }]}>
        <PlantComponent stage={stage} mood={mood} size={size} />
      </Animated.View>
    </View>
  );
}
