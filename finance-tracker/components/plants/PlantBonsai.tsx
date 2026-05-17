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

const TRUNK = '#8B6340';
const TRUNK_DARK = '#6B4A28';
const FOLIAGE = '#5A9478';
const FOLIAGE_DARK = '#3D7055';

// Draw a tapered trunk/branch path
function Trunk({ path, width }: { path: string; width: number }) {
  return <Path d={path} stroke={TRUNK} strokeWidth={width} strokeLinecap="round" fill="none" />;
}

// A foliage cloud (slightly irregular ellipse)
function FoliageCloud({ cx, cy, rx, ry, rotation = 0 }: { cx: number; cy: number; rx: number; ry: number; rotation?: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} rotation={rotation} origin={`${cx},${cy}`} fill={FOLIAGE} />
      {/* Slight texture overlay */}
      <Ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.25} rx={rx * 0.55} ry={ry * 0.45} fill={FOLIAGE_DARK} opacity={0.35} />
    </G>
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Short thick trunk */}
      <Path d={`M${cx},${base} Q${cx + 2},${base - 16} ${cx},${base - 26}`} stroke={TRUNK} strokeWidth={10} strokeLinecap="round" fill="none" />
      <Path d={`M${cx},${base} Q${cx + 2},${base - 16} ${cx},${base - 26}`} stroke={TRUNK_DARK} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.4} />
      {/* 1 small round foliage cloud */}
      <FoliageCloud cx={cx} cy={base - 34} rx={16} ry={12} />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Trunk */}
      <Path d={`M${cx},${base} Q${cx + 3},${base - 22} ${cx + 2},${base - 38}`} stroke={TRUNK} strokeWidth={11} strokeLinecap="round" fill="none" />
      <Path d={`M${cx},${base} Q${cx + 3},${base - 22} ${cx + 2},${base - 38}`} stroke={TRUNK_DARK} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.4} />
      {/* Left branch */}
      <Path d={`M${cx + 2},${base - 28} Q${cx - 12},${base - 32} ${cx - 18},${base - 36}`} stroke={TRUNK} strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* Right branch stub */}
      <Path d={`M${cx + 2},${base - 34} Q${cx + 14},${base - 38} ${cx + 18},${base - 42}`} stroke={TRUNK} strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* Left foliage cloud */}
      <FoliageCloud cx={cx - 18} cy={base - 42} rx={14} ry={10} rotation={-10} />
      {/* Right foliage cloud */}
      <FoliageCloud cx={cx + 18} cy={base - 48} rx={12} ry={9} rotation={8} />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  // Trunk leans slightly left (asymmetric bonsai style)
  return (
    <G>
      {/* Trunk leans left */}
      <Path d={`M${cx},${base} Q${cx - 4},${base - 24} ${cx - 6},${base - 46}`} stroke={TRUNK} strokeWidth={12} strokeLinecap="round" fill="none" />
      <Path d={`M${cx},${base} Q${cx - 4},${base - 24} ${cx - 6},${base - 46}`} stroke={TRUNK_DARK} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.4} />
      {/* Left branch */}
      <Path d={`M${cx - 4},${base - 28} Q${cx - 18},${base - 30} ${cx - 24},${base - 34}`} stroke={TRUNK} strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* Right branch */}
      <Path d={`M${cx - 5},${base - 36} Q${cx + 10},${base - 38} ${cx + 16},${base - 40}`} stroke={TRUNK} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      {/* Left foliage — large */}
      <FoliageCloud cx={cx - 24} cy={base - 42} rx={16} ry={11} rotation={-8} />
      {/* Right foliage — medium */}
      <FoliageCloud cx={cx + 16} cy={base - 46} rx={13} ry={10} rotation={5} />
      {/* Top foliage — small */}
      <FoliageCloud cx={cx - 7} cy={base - 54} rx={11} ry={8} rotation={-3} />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Thick trunk, slight S-curve */}
      <Path d={`M${cx},${base} Q${cx - 5},${base - 20} ${cx - 2},${base - 40} Q${cx + 2},${base - 52} ${cx - 4},${base - 60}`} stroke={TRUNK} strokeWidth={13} strokeLinecap="round" fill="none" />
      <Path d={`M${cx},${base} Q${cx - 5},${base - 20} ${cx - 2},${base - 40} Q${cx + 2},${base - 52} ${cx - 4},${base - 60}`} stroke={TRUNK_DARK} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.4} />
      {/* Left main branch */}
      <Path d={`M${cx - 2},${base - 32} Q${cx - 18},${base - 32} ${cx - 28},${base - 36}`} stroke={TRUNK} strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* Right main branch */}
      <Path d={`M${cx - 1},${base - 44} Q${cx + 16},${base - 44} ${cx + 24},${base - 46}`} stroke={TRUNK} strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* Right upper branch */}
      <Path d={`M${cx - 2},${base - 54} Q${cx + 10},${base - 58} ${cx + 14},${base - 62}`} stroke={TRUNK} strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* 4 foliage clouds — classic flat-top shape */}
      <FoliageCloud cx={cx - 28} cy={base - 46} rx={16} ry={10} rotation={-12} />
      <FoliageCloud cx={cx + 22} cy={base - 54} rx={15} ry={10} rotation={8} />
      <FoliageCloud cx={cx + 12} cy={base - 68} rx={12} ry={9} rotation={5} />
      <FoliageCloud cx={cx - 10} cy={base - 66} rx={13} ry={9} rotation={-5} />
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Full trunk */}
      <Path d={`M${cx},${base} Q${cx - 5},${base - 20} ${cx - 2},${base - 40} Q${cx + 2},${base - 52} ${cx - 4},${base - 62}`} stroke={TRUNK} strokeWidth={13} strokeLinecap="round" fill="none" />
      <Path d={`M${cx},${base} Q${cx - 5},${base - 20} ${cx - 2},${base - 40} Q${cx + 2},${base - 52} ${cx - 4},${base - 62}`} stroke={TRUNK_DARK} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.4} />
      {/* Branches */}
      <Path d={`M${cx - 2},${base - 32} Q${cx - 18},${base - 32} ${cx - 28},${base - 36}`} stroke={TRUNK} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d={`M${cx - 1},${base - 44} Q${cx + 16},${base - 44} ${cx + 24},${base - 46}`} stroke={TRUNK} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Path d={`M${cx - 2},${base - 54} Q${cx + 10},${base - 58} ${cx + 14},${base - 62}`} stroke={TRUNK} strokeWidth={4} strokeLinecap="round" fill="none" />
      {/* 4 foliage clouds */}
      <FoliageCloud cx={cx - 28} cy={base - 46} rx={16} ry={10} rotation={-12} />
      <FoliageCloud cx={cx + 22} cy={base - 54} rx={15} ry={10} rotation={8} />
      <FoliageCloud cx={cx + 12} cy={base - 68} rx={12} ry={9} rotation={5} />
      <FoliageCloud cx={cx - 10} cy={base - 66} rx={13} ry={9} rotation={-5} />
      {/* Pink flower dots scattered in foliage */}
      <Circle cx={cx - 30} cy={base - 50} r={2} fill="#C9848A" />
      <Circle cx={cx - 20} cy={base - 44} r={2} fill="#C9848A" />
      <Circle cx={cx + 26} cy={base - 56} r={2} fill="#C9848A" />
      <Circle cx={cx + 14} cy={base - 72} r={2} fill="#C9848A" />
      <Circle cx={cx - 16} cy={base - 62} r={2} fill="#C9848A" />
      <Circle cx={cx - 6} cy={base - 70} r={2} fill="#C9848A" />
      <Circle cx={cx + 6} cy={base - 64} r={2} fill="#C9848A" />
      <Circle cx={cx + 20} cy={base - 48} r={2} fill="#C9848A" />
    </G>
  );
}

export function PlantBonsai({
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
