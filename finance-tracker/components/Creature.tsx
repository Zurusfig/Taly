import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Circle, Ellipse, Path, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import type { CreatureStage, CreatureMood } from '@/hooks/useProgress';
import { colors } from '@/theme/colors';

interface CreatureProps {
  stage: CreatureStage;
  mood: CreatureMood;
  size?: number;
}

const STEM = colors.accent;
const LEAF = '#7BB89A';
const LEAF_DARK = '#5A9478';
const PETAL = '#D4A574';
const PETAL_BRIGHT = '#E8C49A';
const POT = '#6B6B66';
const POT_LIGHT = '#8B8B86';
const SOIL = '#4A4A45';

function Pot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy - 4} rx={18} ry={5} fill={SOIL} />
      <Path
        d={`M${cx - 18},${cy - 4} L${cx - 14},${cy + 18} Q${cx},${cy + 22} ${cx + 14},${cy + 18} L${cx + 18},${cy - 4} Z`}
        fill={POT}
      />
      <Rect x={cx - 20} y={cy - 8} width={40} height={8} rx={4} fill={POT_LIGHT} />
    </G>
  );
}

function Stage1({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Pot cx={cx} cy={cy + 38} />
      {/* Stem */}
      <Path d={`M${cx},${cy + 38} L${cx},${cy + 10}`} stroke={STEM} strokeWidth={3} strokeLinecap="round" />
      {/* Left leaf */}
      <Path
        d={`M${cx},${cy + 24} Q${cx - 20},${cy + 14} ${cx - 16},${cy + 4}`}
        stroke={LEAF} strokeWidth={2.5} fill="none" strokeLinecap="round"
      />
      {/* Right leaf */}
      <Path
        d={`M${cx},${cy + 20} Q${cx + 20},${cy + 10} ${cx + 16},${cy}`}
        stroke={LEAF} strokeWidth={2.5} fill="none" strokeLinecap="round"
      />
      {/* Sprout tip */}
      <Circle cx={cx} cy={cy + 8} r={4} fill={LEAF} />
    </G>
  );
}

function Stage2({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Pot cx={cx} cy={cy + 38} />
      <Path d={`M${cx},${cy + 38} L${cx},${cy + 4}`} stroke={STEM} strokeWidth={3.5} strokeLinecap="round" />
      {/* 4 leaves */}
      <Path d={`M${cx},${cy + 30} Q${cx - 22},${cy + 18} ${cx - 18},${cy + 8}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 24} Q${cx + 22},${cy + 12} ${cx + 18},${cy + 2}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 18} Q${cx - 18},${cy + 8} ${cx - 14},${cy - 2}`} stroke={LEAF_DARK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 14} Q${cx + 18},${cy + 4} ${cx + 14},${cy - 6}`} stroke={LEAF_DARK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Circle cx={cx} cy={cy + 2} r={5} fill={LEAF} />
    </G>
  );
}

function Stage3({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Pot cx={cx} cy={cy + 38} />
      <Path d={`M${cx},${cy + 38} L${cx},${cy}`} stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      <Path d={`M${cx},${cy + 30} Q${cx - 24},${cy + 18} ${cx - 20},${cy + 6}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 24} Q${cx + 24},${cy + 12} ${cx + 20},${cy}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 16} Q${cx - 20},${cy + 6} ${cx - 16},${cy - 4}`} stroke={LEAF_DARK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 12} Q${cx + 20},${cy + 2} ${cx + 16},${cy - 8}`} stroke={LEAF_DARK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* Bud */}
      <Ellipse cx={cx} cy={cy - 4} rx={6} ry={9} fill={PETAL} />
      <Ellipse cx={cx} cy={cy - 6} rx={4} ry={6} fill={PETAL_BRIGHT} />
    </G>
  );
}

function Stage4({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Pot cx={cx} cy={cy + 38} />
      <Path d={`M${cx},${cy + 38} L${cx},${cy + 2}`} stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      <Path d={`M${cx},${cy + 30} Q${cx - 24},${cy + 18} ${cx - 20},${cy + 6}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 24} Q${cx + 24},${cy + 12} ${cx + 20},${cy}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 16} Q${cx - 20},${cy + 6} ${cx - 16},${cy - 4}`} stroke={LEAF_DARK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 12} Q${cx + 20},${cy + 2} ${cx + 16},${cy - 8}`} stroke={LEAF_DARK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* Full bloom: petals */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + Math.cos(rad) * 11;
        const py = cy - 6 + Math.sin(rad) * 11;
        return <Ellipse key={angle} cx={px} cy={py} rx={5} ry={7} fill={PETAL} transform={`rotate(${angle}, ${px}, ${py})`} />;
      })}
      <Circle cx={cx} cy={cy - 6} r={7} fill={PETAL_BRIGHT} />
    </G>
  );
}

function Stage5({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Pot cx={cx} cy={cy + 38} />
      <Path d={`M${cx},${cy + 38} L${cx},${cy + 2}`} stroke={STEM} strokeWidth={4} strokeLinecap="round" />
      {/* Secondary stems */}
      <Path d={`M${cx},${cy + 20} Q${cx - 28},${cy + 10} ${cx - 26},${cy - 4}`} stroke={STEM} strokeWidth={2.5} strokeLinecap="round" />
      <Path d={`M${cx},${cy + 16} Q${cx + 28},${cy + 6} ${cx + 26},${cy - 8}`} stroke={STEM} strokeWidth={2.5} strokeLinecap="round" />
      <Path d={`M${cx},${cy + 28} Q${cx - 22},${cy + 18} ${cx - 20},${cy + 8}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M${cx},${cy + 22} Q${cx + 22},${cy + 12} ${cx + 18},${cy + 2}`} stroke={LEAF} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* Main bloom */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + Math.cos(rad) * 11;
        const py = cy - 6 + Math.sin(rad) * 11;
        return <Ellipse key={angle} cx={px} cy={py} rx={5} ry={7} fill={PETAL} transform={`rotate(${angle}, ${px}, ${py})`} />;
      })}
      <Circle cx={cx} cy={cy - 6} r={7} fill={PETAL_BRIGHT} />
      {/* Side mini-blooms */}
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx - 26 + Math.cos(rad) * 7;
        const py = cy - 4 + Math.sin(rad) * 7;
        return <Ellipse key={`l${angle}`} cx={px} cy={py} rx={3} ry={4} fill={PETAL} transform={`rotate(${angle}, ${px}, ${py})`} />;
      })}
      <Circle cx={cx - 26} cy={cy - 4} r={4} fill={PETAL_BRIGHT} />
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + 26 + Math.cos(rad) * 7;
        const py = cy - 8 + Math.sin(rad) * 7;
        return <Ellipse key={`r${angle}`} cx={px} cy={py} rx={3} ry={4} fill={PETAL} transform={`rotate(${angle}, ${px}, ${py})`} />;
      })}
      <Circle cx={cx + 26} cy={cy - 8} r={4} fill={PETAL_BRIGHT} />
      {/* Sparkle particles */}
      <Circle cx={cx - 10} cy={cy - 28} r={2} fill={PETAL_BRIGHT} opacity={0.8} />
      <Circle cx={cx + 14} cy={cy - 32} r={1.5} fill={PETAL} opacity={0.7} />
      <Circle cx={cx + 30} cy={cy - 20} r={2} fill={PETAL_BRIGHT} opacity={0.6} />
      <Circle cx={cx - 32} cy={cy - 16} r={1.5} fill={PETAL} opacity={0.7} />
    </G>
  );
}

export function Creature({ stage, mood, size = 120 }: CreatureProps) {
  const sway = useSharedValue(0);
  const droopDeg = mood === 'sleepy' ? 5 : mood === 'hungry' ? 10 : 0;

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

  const cx = size / 2;
  const cy = size / 2 - 16;

  const StageComponent = [null, Stage1, Stage2, Stage3, Stage4, Stage5][stage] as React.ComponentType<{ cx: number; cy: number }>;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle, { transformOrigin: `${cx}px ${size - 10}px` }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation={droopDeg} origin={`${cx}, ${size - 10}`}>
            <StageComponent cx={cx} cy={cy} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
