import Svg, { G, Circle, Ellipse, Path, Rect } from 'react-native-svg';

function Pot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy - 4} rx={18} ry={5} fill="#4A4A45" />
      <Path d={`M${cx - 18},${cy - 4} L${cx - 14},${cy + 18} Q${cx},${cy + 22} ${cx + 14},${cy + 18} L${cx + 18},${cy - 4} Z`} fill="#6B6B66" />
      <Rect x={cx - 20} y={cy - 8} width={40} height={8} rx={4} fill="#8B8B86" />
    </G>
  );
}

const STEM_COLOR = '#7BB89A';
const PURPLE_PRIMARY = '#9B8EC4';
const PURPLE_DARK = '#7B6EA4';

// Single lavender stem with spike head
function LavenderStem({
  x, base, stemHeight, budHeight, hasBuds, budColor,
}: {
  x: number; base: number; stemHeight: number; budHeight: number;
  hasBuds: boolean; budColor: string;
}) {
  const top = base - stemHeight;
  return (
    <G>
      {/* Stem */}
      <Path d={`M${x},${base} L${x},${top}`} stroke={STEM_COLOR} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      {hasBuds && (
        <G>
          {/* Lavender spike — stacked small ellipses */}
          {[0, 1, 2, 3].map((i) => (
            <Ellipse
              key={i}
              cx={x}
              cy={top + i * (budHeight / 4)}
              rx={3.5 - i * 0.3}
              ry={budHeight / 8 + 0.5}
              fill={i % 2 === 0 ? budColor : PURPLE_DARK}
            />
          ))}
        </G>
      )}
      {!hasBuds && (
        <Ellipse cx={x} cy={top - 3} rx={2.5} ry={3} fill={STEM_COLOR} />
      )}
    </G>
  );
}

// Small strap-like base leaf
function BaseleafLeft({ cx, base }: { cx: number; base: number }) {
  return (
    <Path
      d={`M${cx - 4},${base} Q${cx - 18},${base - 8} ${cx - 14},${base - 18} Q${cx - 6},${base - 10} ${cx - 4},${base} Z`}
      fill={STEM_COLOR}
    />
  );
}
function BaseleafRight({ cx, base }: { cx: number; base: number }) {
  return (
    <Path
      d={`M${cx + 4},${base} Q${cx + 18},${base - 8} ${cx + 14},${base - 18} Q${cx + 6},${base - 10} ${cx + 4},${base} Z`}
      fill={STEM_COLOR}
    />
  );
}

// Butterfly silhouette (simple path)
function Butterfly({ x, y, opacity = 0.4 }: { x: number; y: number; opacity?: number }) {
  return (
    <G opacity={opacity}>
      {/* Left wings */}
      <Path d={`M${x},${y} Q${x - 10},${y - 6} ${x - 8},${y + 2} Q${x - 4},${y + 4} ${x},${y} Z`} fill={PURPLE_DARK} />
      <Path d={`M${x},${y} Q${x - 7},${y + 3} ${x - 5},${y + 8} Q${x - 2},${y + 6} ${x},${y} Z`} fill={PURPLE_DARK} />
      {/* Right wings */}
      <Path d={`M${x},${y} Q${x + 10},${y - 6} ${x + 8},${y + 2} Q${x + 4},${y + 4} ${x},${y} Z`} fill={PURPLE_PRIMARY} />
      <Path d={`M${x},${y} Q${x + 7},${y + 3} ${x + 5},${y + 8} Q${x + 2},${y + 6} ${x},${y} Z`} fill={PURPLE_PRIMARY} />
      {/* Body */}
      <Path d={`M${x},${y - 2} L${x},${y + 8}`} stroke="#3D3550" strokeWidth={1} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      <LavenderStem x={cx - 5} base={base} stemHeight={28} budHeight={8} hasBuds={false} budColor={PURPLE_PRIMARY} />
      <LavenderStem x={cx + 5} base={base} stemHeight={24} budHeight={8} hasBuds={false} budColor={PURPLE_PRIMARY} />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {[-12, -4, 4, 12].map((offset, i) => (
        <LavenderStem
          key={i}
          x={cx + offset}
          base={base}
          stemHeight={28 + i * 3}
          budHeight={10}
          hasBuds
          budColor={PURPLE_PRIMARY}
        />
      ))}
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const stems = [-16, -9, -2, 5, 12, 19];
  const heights = [34, 40, 46, 44, 38, 32];
  return (
    <G>
      {stems.map((offset, i) => (
        <LavenderStem
          key={i}
          x={cx + offset}
          base={base}
          stemHeight={heights[i]}
          budHeight={12}
          hasBuds
          budColor={PURPLE_PRIMARY}
        />
      ))}
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const stems = [-20, -13, -6, 1, 8, 15, 22, 29];
  const heights = [38, 46, 52, 56, 54, 50, 44, 36];
  return (
    <G>
      <BaseleafLeft cx={cx} base={base} />
      <BaseleafRight cx={cx} base={base} />
      {stems.map((offset, i) => (
        <LavenderStem
          key={i}
          x={cx - 4 + offset}
          base={base}
          stemHeight={heights[i]}
          budHeight={14}
          hasBuds
          budColor={i % 2 === 0 ? PURPLE_PRIMARY : PURPLE_DARK}
        />
      ))}
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  // 10+ stems fanning wider
  const stems = [-26, -20, -13, -6, 0, 7, 14, 21, 28, 35];
  const heights = [36, 44, 52, 56, 60, 58, 54, 48, 42, 34];
  return (
    <G>
      <BaseleafLeft cx={cx} base={base} />
      <BaseleafRight cx={cx} base={base} />
      {stems.map((offset, i) => (
        <LavenderStem
          key={i}
          x={cx - 5 + offset}
          base={base}
          stemHeight={heights[i]}
          budHeight={16}
          hasBuds
          budColor={i % 3 === 0 ? PURPLE_DARK : PURPLE_PRIMARY}
        />
      ))}
      {/* Butterflies */}
      <Butterfly x={cx - 24} y={base - 62} opacity={0.4} />
      <Butterfly x={cx + 22} y={base - 58} opacity={0.35} />
      <Butterfly x={cx + 4} y={base - 70} opacity={0.3} />
    </G>
  );
}

export function PlantLavender({
  stage,
  mood,
  size = 120,
}: {
  stage: 1 | 2 | 3 | 4 | 5;
  mood: 'happy' | 'neutral' | 'sleepy' | 'hungry';
  size?: number;
}) {
  const cx = size / 2;
  const potY = size - 22;
  const droopDeg = mood === 'sleepy' ? 5 : mood === 'hungry' ? 10 : 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Pot cx={cx} cy={potY} />
      <G rotation={droopDeg} origin={`${cx}, ${potY - 4}`}>
        {stage === 1 && <Stage1 cx={cx} potY={potY} />}
        {stage === 2 && <Stage2 cx={cx} potY={potY} />}
        {stage === 3 && <Stage3 cx={cx} potY={potY} />}
        {stage === 4 && <Stage4 cx={cx} potY={potY} />}
        {stage === 5 && <Stage5 cx={cx} potY={potY} />}
      </G>
    </Svg>
  );
}
