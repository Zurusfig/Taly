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

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Single thin stem */}
      <Path d={`M${cx},${base} L${cx},${base - 22}`} stroke="#7BB89A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* Left tiny leaf */}
      <Path d={`M${cx},${base - 14} Q${cx - 10},${base - 20} ${cx - 8},${base - 26} Q${cx - 2},${base - 18} ${cx},${base - 14} Z`} fill="#7BB89A" />
      {/* Right tiny leaf */}
      <Path d={`M${cx},${base - 18} Q${cx + 10},${base - 24} ${cx + 8},${base - 30} Q${cx + 2},${base - 22} ${cx},${base - 18} Z`} fill="#5A9478" />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Taller stem */}
      <Path d={`M${cx},${base} L${cx},${base - 40}`} stroke="#7BB89A" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Lower left leaf */}
      <Path d={`M${cx},${base - 16} Q${cx - 14},${base - 22} ${cx - 12},${base - 32} Q${cx - 2},${base - 24} ${cx},${base - 16} Z`} fill="#7BB89A" />
      {/* Lower right leaf */}
      <Path d={`M${cx},${base - 22} Q${cx + 14},${base - 28} ${cx + 12},${base - 38} Q${cx + 2},${base - 30} ${cx},${base - 22} Z`} fill="#5A9478" />
      {/* Upper left leaf */}
      <Path d={`M${cx},${base - 30} Q${cx - 12},${base - 36} ${cx - 10},${base - 46} Q${cx - 2},${base - 38} ${cx},${base - 30} Z`} fill="#7BB89A" />
      {/* Upper right leaf */}
      <Path d={`M${cx},${base - 35} Q${cx + 11},${base - 41} ${cx + 9},${base - 51} Q${cx + 2},${base - 43} ${cx},${base - 35} Z`} fill="#5A9478" />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Main stem */}
      <Path d={`M${cx},${base} L${cx},${base - 50}`} stroke="#7BB89A" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Left leaf */}
      <Path d={`M${cx},${base - 20} Q${cx - 15},${base - 26} ${cx - 13},${base - 38} Q${cx - 2},${base - 28} ${cx},${base - 20} Z`} fill="#7BB89A" />
      {/* Right leaf */}
      <Path d={`M${cx},${base - 30} Q${cx + 15},${base - 36} ${cx + 13},${base - 48} Q${cx + 2},${base - 38} ${cx},${base - 30} Z`} fill="#5A9478" />
      {/* Closed bud at top */}
      <Ellipse cx={cx} cy={base - 56} rx={6} ry={9} fill="#D4A574" />
      <Path d={`M${cx - 6},${base - 54} Q${cx},${base - 66} ${cx + 6},${base - 54}`} stroke="#C49060" strokeWidth={1} fill="none" />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  const bloomCy = base - 58;
  return (
    <G>
      {/* Main stem */}
      <Path d={`M${cx},${base} L${cx},${base - 52}`} stroke="#7BB89A" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      {/* Left leaf */}
      <Path d={`M${cx},${base - 22} Q${cx - 16},${base - 28} ${cx - 14},${base - 42} Q${cx - 2},${base - 30} ${cx},${base - 22} Z`} fill="#7BB89A" />
      {/* Right leaf */}
      <Path d={`M${cx},${base - 34} Q${cx + 16},${base - 40} ${cx + 14},${base - 54} Q${cx + 2},${base - 42} ${cx},${base - 34} Z`} fill="#5A9478" />
      {/* 6 petals bloom */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + Math.cos(rad) * 11;
        const py = bloomCy + Math.sin(rad) * 11;
        return (
          <Ellipse
            key={i}
            cx={px}
            cy={py}
            rx={5}
            ry={8}
            rotation={angle}
            origin={`${px},${py}`}
            fill="#D4A574"
          />
        );
      })}
      {/* Bloom center */}
      <Circle cx={cx} cy={bloomCy} r={7} fill="#E8C49A" />
      <Circle cx={cx} cy={bloomCy} r={3} fill="#C49060" />
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Main stem */}
      <Path d={`M${cx},${base} L${cx},${base - 58}`} stroke="#7BB89A" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      {/* Left side stem */}
      <Path d={`M${cx},${base - 30} Q${cx - 16},${base - 40} ${cx - 22},${base - 52}`} stroke="#7BB89A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* Right side stem */}
      <Path d={`M${cx},${base - 38} Q${cx + 16},${base - 48} ${cx + 22},${base - 56}`} stroke="#7BB89A" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {/* Main leaves */}
      <Path d={`M${cx},${base - 18} Q${cx - 15},${base - 24} ${cx - 13},${base - 36} Q${cx - 2},${base - 26} ${cx},${base - 18} Z`} fill="#7BB89A" />
      <Path d={`M${cx},${base - 26} Q${cx + 15},${base - 32} ${cx + 13},${base - 44} Q${cx + 2},${base - 34} ${cx},${base - 26} Z`} fill="#5A9478" />
      {/* Main top bloom */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const bloomCy = base - 64;
        const px = cx + Math.cos(rad) * 10;
        const py = bloomCy + Math.sin(rad) * 10;
        return (
          <Ellipse key={`m${i}`} cx={px} cy={py} rx={4.5} ry={7} rotation={angle} origin={`${px},${py}`} fill="#D4A574" />
        );
      })}
      <Circle cx={cx} cy={base - 64} r={6} fill="#E8C49A" />
      <Circle cx={cx} cy={base - 64} r={2.5} fill="#C49060" />
      {/* Left side bloom */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const bx = cx - 22; const by = base - 56;
        const px = bx + Math.cos(rad) * 7;
        const py = by + Math.sin(rad) * 7;
        return (
          <Ellipse key={`l${i}`} cx={px} cy={py} rx={3} ry={5} rotation={angle} origin={`${px},${py}`} fill="#D4A574" />
        );
      })}
      <Circle cx={cx - 22} cy={base - 56} r={4} fill="#E8C49A" />
      {/* Right side bloom */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const bx = cx + 22; const by = base - 60;
        const px = bx + Math.cos(rad) * 7;
        const py = by + Math.sin(rad) * 7;
        return (
          <Ellipse key={`r${i}`} cx={px} cy={py} rx={3} ry={5} rotation={angle} origin={`${px},${py}`} fill="#D4A574" />
        );
      })}
      <Circle cx={cx + 22} cy={base - 60} r={4} fill="#E8C49A" />
      {/* Sparkle dots */}
      <Circle cx={cx - 10} cy={base - 75} r={2} fill="#E8C49A" opacity={0.7} />
      <Circle cx={cx + 14} cy={base - 72} r={1.5} fill="#D4A574" opacity={0.6} />
      <Circle cx={cx + 4} cy={base - 80} r={1.5} fill="#E8C49A" opacity={0.5} />
    </G>
  );
}

export function PlantSprout({
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
