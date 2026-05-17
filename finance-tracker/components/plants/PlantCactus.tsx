import Svg, { G, Circle, Ellipse, Path, Rect, Line } from 'react-native-svg';

function Pot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy - 4} rx={18} ry={5} fill="#4A4A45" />
      <Path d={`M${cx - 18},${cy - 4} L${cx - 14},${cy + 18} Q${cx},${cy + 22} ${cx + 14},${cy + 18} L${cx + 18},${cy - 4} Z`} fill="#6B6B66" />
      <Rect x={cx - 20} y={cy - 8} width={40} height={8} rx={4} fill="#8B8B86" />
    </G>
  );
}

// Vertical groove lines on a cactus body
function GrooveLines({ cx, top, bottom, count = 5 }: { cx: number; top: number; bottom: number; count?: number }) {
  const lines = [];
  for (let i = 1; i < count; i++) {
    const x = cx - 12 + (i * 24) / count;
    lines.push(
      <Line key={i} x1={x} y1={top + 4} x2={x} y2={bottom - 4} stroke="#4A7A70" strokeWidth={0.8} opacity={0.6} />
    );
  }
  return <G>{lines}</G>;
}

function Spines({ cx, y, width }: { cx: number; y: number; width: number }) {
  return (
    <G opacity={0.3}>
      <Line x1={cx - width * 0.7} y1={y} x2={cx - width * 0.7 - 4} y2={y - 3} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      <Line x1={cx - width * 0.3} y1={y} x2={cx - width * 0.3 - 4} y2={y - 3} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      <Line x1={cx + width * 0.3} y1={y} x2={cx + width * 0.3 + 4} y2={y - 3} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      <Line x1={cx + width * 0.7} y1={y} x2={cx + width * 0.7 + 4} y2={y - 3} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
    </G>
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const top = base - 24;
  return (
    <G>
      {/* Small round barrel cactus */}
      <Ellipse cx={cx} cy={(base + top) / 2} rx={13} ry={14} fill="#61988E" />
      <GrooveLines cx={cx} top={top} bottom={base} count={5} />
      <Spines cx={cx} y={(base + top) / 2} width={12} />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const top = base - 40;
  return (
    <G>
      {/* Short columnar cactus — wider at base */}
      <Path
        d={`M${cx - 11},${base} Q${cx - 13},${(base + top) / 2} ${cx - 10},${top} Q${cx},${top - 4} ${cx + 10},${top} Q${cx + 13},${(base + top) / 2} ${cx + 11},${base} Z`}
        fill="#61988E"
      />
      <GrooveLines cx={cx} top={top} bottom={base} count={6} />
      <Spines cx={cx} y={base - 12} width={11} />
      <Spines cx={cx} y={base - 28} width={10} />
      {/* Rounded top */}
      <Ellipse cx={cx} cy={top} rx={10} ry={5} fill="#4A7A70" />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const top = base - 52;
  return (
    <G>
      {/* Taller column */}
      <Path
        d={`M${cx - 11},${base} Q${cx - 13},${base - 26} ${cx - 10},${top} Q${cx},${top - 5} ${cx + 10},${top} Q${cx + 13},${base - 26} ${cx + 11},${base} Z`}
        fill="#61988E"
      />
      <GrooveLines cx={cx} top={top} bottom={base} count={6} />
      <Spines cx={cx} y={base - 14} width={11} />
      <Spines cx={cx} y={base - 30} width={10} />
      <Spines cx={cx} y={base - 46} width={10} />
      <Ellipse cx={cx} cy={top} rx={10} ry={5} fill="#4A7A70" />
      {/* Left arm stub */}
      <Path d={`M${cx - 11},${base - 28} Q${cx - 20},${base - 28} ${cx - 22},${base - 34}`} stroke="#61988E" strokeWidth={8} strokeLinecap="round" fill="none" />
      <Line x1={cx - 24} y1={base - 30} x2={cx - 27} y2={base - 33} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" opacity={0.3} />
      {/* Right arm stub */}
      <Path d={`M${cx + 11},${base - 34} Q${cx + 20},${base - 34} ${cx + 22},${base - 40}`} stroke="#61988E" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Line x1={cx + 24} y1={base - 36} x2={cx + 27} y2={base - 39} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" opacity={0.3} />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const top = base - 60;
  return (
    <G>
      {/* Full column */}
      <Path
        d={`M${cx - 11},${base} Q${cx - 13},${base - 30} ${cx - 10},${top} Q${cx},${top - 5} ${cx + 10},${top} Q${cx + 13},${base - 30} ${cx + 11},${base} Z`}
        fill="#61988E"
      />
      <GrooveLines cx={cx} top={top} bottom={base} count={6} />
      <Spines cx={cx} y={base - 14} width={11} />
      <Spines cx={cx} y={base - 32} width={10} />
      <Spines cx={cx} y={base - 50} width={10} />
      <Ellipse cx={cx} cy={top} rx={10} ry={5} fill="#4A7A70" />
      {/* Left arm — full upward curve */}
      <Path d={`M${cx - 11},${base - 28} Q${cx - 28},${base - 28} ${cx - 30},${base - 46}`} stroke="#61988E" strokeWidth={9} strokeLinecap="round" fill="none" />
      {/* Left arm ribbing */}
      <Path d={`M${cx - 15},${base - 30} Q${cx - 30},${base - 30} ${cx - 32},${base - 46}`} stroke="#4A7A70" strokeWidth={1} fill="none" opacity={0.5} />
      <Ellipse cx={cx - 30} cy={base - 47} rx={8} ry={4.5} fill="#4A7A70" />
      <G opacity={0.3}>
        <Line x1={cx - 35} y1={base - 44} x2={cx - 38} y2={base - 47} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
        <Line x1={cx - 26} y1={base - 50} x2={cx - 26} y2={base - 54} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      </G>
      {/* Right arm — full upward curve */}
      <Path d={`M${cx + 11},${base - 34} Q${cx + 28},${base - 34} ${cx + 30},${base - 52}`} stroke="#61988E" strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d={`M${cx + 15},${base - 36} Q${cx + 30},${base - 36} ${cx + 32},${base - 52}`} stroke="#4A7A70" strokeWidth={1} fill="none" opacity={0.5} />
      <Ellipse cx={cx + 30} cy={base - 53} rx={8} ry={4.5} fill="#4A7A70" />
      <G opacity={0.3}>
        <Line x1={cx + 35} y1={base - 50} x2={cx + 38} y2={base - 53} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
        <Line x1={cx + 26} y1={base - 56} x2={cx + 26} y2={base - 60} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      </G>
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const top = base - 62;
  return (
    <G>
      {/* Column */}
      <Path
        d={`M${cx - 11},${base} Q${cx - 13},${base - 30} ${cx - 10},${top} Q${cx},${top - 5} ${cx + 10},${top} Q${cx + 13},${base - 30} ${cx + 11},${base} Z`}
        fill="#61988E"
      />
      <GrooveLines cx={cx} top={top} bottom={base} count={6} />
      <Spines cx={cx} y={base - 14} width={11} />
      <Spines cx={cx} y={base - 32} width={10} />
      <Spines cx={cx} y={base - 50} width={10} />
      <Ellipse cx={cx} cy={top} rx={10} ry={5} fill="#4A7A70" />
      {/* Bloom on main top */}
      <Circle cx={cx} cy={top - 3} r={5} fill="#C97064" />
      <Circle cx={cx} cy={top - 3} r={2.5} fill="#E8A09A" />
      {/* Left arm */}
      <Path d={`M${cx - 11},${base - 28} Q${cx - 28},${base - 28} ${cx - 30},${base - 46}`} stroke="#61988E" strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d={`M${cx - 15},${base - 30} Q${cx - 30},${base - 30} ${cx - 32},${base - 46}`} stroke="#4A7A70" strokeWidth={1} fill="none" opacity={0.5} />
      <Ellipse cx={cx - 30} cy={base - 47} rx={8} ry={4.5} fill="#4A7A70" />
      {/* Left arm bloom */}
      <Circle cx={cx - 30} cy={base - 52} r={5} fill="#C97064" />
      <Circle cx={cx - 30} cy={base - 52} r={2.5} fill="#E8A09A" />
      <G opacity={0.3}>
        <Line x1={cx - 35} y1={base - 44} x2={cx - 38} y2={base - 47} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
        <Line x1={cx - 26} y1={base - 50} x2={cx - 26} y2={base - 54} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      </G>
      {/* Right arm */}
      <Path d={`M${cx + 11},${base - 34} Q${cx + 28},${base - 34} ${cx + 30},${base - 52}`} stroke="#61988E" strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d={`M${cx + 15},${base - 36} Q${cx + 30},${base - 36} ${cx + 32},${base - 52}`} stroke="#4A7A70" strokeWidth={1} fill="none" opacity={0.5} />
      <Ellipse cx={cx + 30} cy={base - 53} rx={8} ry={4.5} fill="#4A7A70" />
      {/* Right arm bloom */}
      <Circle cx={cx + 30} cy={base - 58} r={5} fill="#C97064" />
      <Circle cx={cx + 30} cy={base - 58} r={2.5} fill="#E8A09A" />
      <G opacity={0.3}>
        <Line x1={cx + 35} y1={base - 50} x2={cx + 38} y2={base - 53} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
        <Line x1={cx + 26} y1={base - 56} x2={cx + 26} y2={base - 60} stroke="#F5F5F0" strokeWidth={1} strokeLinecap="round" />
      </G>
    </G>
  );
}

export function PlantCactus({
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
