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

// A narrow upward-pointing oval leaf
function TulipLeaf({ x, stemY, height, lean }: { x: number; stemY: number; height: number; lean: number }) {
  return (
    <Path
      d={`M${x},${stemY} Q${x + lean * 10},${stemY - height * 0.5} ${x + lean * 4},${stemY - height} Q${x},${stemY - height * 0.8} ${x - lean * 3},${stemY - height * 0.6} Q${x - lean * 2},${stemY - height * 0.3} ${x},${stemY} Z`}
      fill="#7BB89A"
    />
  );
}

// Closed tulip bud — teardrop
function TulipBud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 9 * scale;
  const h = 16 * scale;
  return (
    <G>
      {/* Bud body */}
      <Path
        d={`M${x},${y + h * 0.3} Q${x - w},${y} ${x - w * 0.6},${y - h * 0.5} Q${x},${y - h} ${x + w * 0.6},${y - h * 0.5} Q${x + w},${y} ${x},${y + h * 0.3} Z`}
        fill="#C9848A"
      />
      {/* Sepal lines */}
      <Path d={`M${x},${y + h * 0.3} Q${x - w * 0.3},${y - h * 0.1} ${x - w * 0.15},${y - h * 0.55}`} stroke="#A86068" strokeWidth={0.8} fill="none" />
      <Path d={`M${x},${y + h * 0.3} Q${x + w * 0.3},${y - h * 0.1} ${x + w * 0.15},${y - h * 0.55}`} stroke="#A86068" strokeWidth={0.8} fill="none" />
    </G>
  );
}

// Open tulip — 5 curved cup petals
function TulipOpen({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 13 * scale;
  const h = 16 * scale;
  const inner = "#E8B4B8";
  const outer = "#C9848A";
  const dark = "#A86068";
  return (
    <G>
      {/* Back 2 petals slightly lower */}
      <Path d={`M${x - w * 0.15},${y} Q${x - w * 1.1},${y - h * 0.5} ${x - w * 0.5},${y - h} Q${x - w * 0.1},${y - h * 0.6} ${x},${y} Z`} fill={dark} />
      <Path d={`M${x + w * 0.15},${y} Q${x + w * 1.1},${y - h * 0.5} ${x + w * 0.5},${y - h} Q${x + w * 0.1},${y - h * 0.6} ${x},${y} Z`} fill={dark} />
      {/* Front 3 petals */}
      <Path d={`M${x - w * 0.6},${y + h * 0.1} Q${x - w * 1.2},${y - h * 0.4} ${x - w * 0.4},${y - h * 0.9} Q${x - w * 0.05},${y - h * 0.4} ${x},${y + h * 0.15} Z`} fill={outer} />
      <Path d={`M${x},${y + h * 0.2} Q${x - w * 0.3},${y - h * 0.2} ${x},${y - h * 0.9} Q${x + w * 0.3},${y - h * 0.2} ${x},${y + h * 0.2} Z`} fill={outer} />
      <Path d={`M${x + w * 0.6},${y + h * 0.1} Q${x + w * 1.2},${y - h * 0.4} ${x + w * 0.4},${y - h * 0.9} Q${x + w * 0.05},${y - h * 0.4} ${x},${y + h * 0.15} Z`} fill={outer} />
      {/* Inner glow */}
      <Ellipse cx={x} cy={y - h * 0.3} rx={w * 0.4} ry={h * 0.25} fill={inner} opacity={0.6} />
    </G>
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* 2 narrow oval leaves emerging from soil */}
      <TulipLeaf x={cx - 6} stemY={base} height={30} lean={-1} />
      <TulipLeaf x={cx + 6} stemY={base} height={28} lean={1} />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Taller leaves */}
      <TulipLeaf x={cx - 7} stemY={base} height={42} lean={-1} />
      <TulipLeaf x={cx + 7} stemY={base} height={40} lean={1} />
      {/* Short stem rising between */}
      <Path d={`M${cx},${base} L${cx},${base - 28}`} stroke="#7BB89A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      <TulipLeaf x={cx - 8} stemY={base} height={46} lean={-1} />
      <TulipLeaf x={cx + 8} stemY={base} height={44} lean={1} />
      {/* Tall stem */}
      <Path d={`M${cx},${base} L${cx},${base - 52}`} stroke="#7BB89A" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Closed bud at top */}
      <TulipBud x={cx} y={base - 52} scale={1} />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      <TulipLeaf x={cx - 9} stemY={base} height={50} lean={-1} />
      <TulipLeaf x={cx + 9} stemY={base} height={48} lean={1} />
      {/* Tall stem */}
      <Path d={`M${cx},${base} L${cx},${base - 54}`} stroke="#7BB89A" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      {/* Fully open tulip */}
      <TulipOpen x={cx} y={base - 54} scale={1} />
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Base leaves */}
      <TulipLeaf x={cx - 10} stemY={base} height={52} lean={-1} />
      <TulipLeaf x={cx + 10} stemY={base} height={50} lean={1} />
      {/* 3 tulip stems at different heights */}
      {/* Center stem — tallest */}
      <Path d={`M${cx},${base} L${cx},${base - 60}`} stroke="#7BB89A" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Left stem */}
      <Path d={`M${cx - 6},${base} Q${cx - 14},${base - 30} ${cx - 16},${base - 52}`} stroke="#7BB89A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* Right stem */}
      <Path d={`M${cx + 6},${base} Q${cx + 12},${base - 25} ${cx + 14},${base - 46}`} stroke="#7BB89A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* Center — open */}
      <TulipOpen x={cx} y={base - 60} scale={0.95} />
      {/* Left — open smaller */}
      <TulipOpen x={cx - 16} y={base - 52} scale={0.8} />
      {/* Right — closed bud */}
      <TulipBud x={cx + 14} y={base - 46} scale={0.85} />
    </G>
  );
}

export function PlantTulip({
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
