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

function SunflowerHead({ x, y, petalR, diskR }: { x: number; y: number; petalR: number; diskR: number }) {
  return (
    <G>
      {/* 8 elongated petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const px = x + Math.cos(rad) * (petalR + diskR * 0.5);
        const py = y + Math.sin(rad) * (petalR + diskR * 0.5);
        return (
          <Ellipse
            key={i}
            cx={px}
            cy={py}
            rx={petalR * 0.35}
            ry={petalR}
            rotation={angle}
            origin={`${px},${py}`}
            fill="#D4A574"
          />
        );
      })}
      {/* Dark brown disk */}
      <Circle cx={x} cy={y} r={diskR} fill="#5A4535" />
      {/* Disk texture dots */}
      <Circle cx={x - diskR * 0.3} cy={y - diskR * 0.3} r={diskR * 0.18} fill="#3D2E22" />
      <Circle cx={x + diskR * 0.3} cy={y - diskR * 0.2} r={diskR * 0.16} fill="#3D2E22" />
      <Circle cx={x} cy={y + diskR * 0.35} r={diskR * 0.18} fill="#3D2E22" />
      <Circle cx={x + diskR * 0.25} cy={y + diskR * 0.1} r={diskR * 0.14} fill="#3D2E22" />
      <Circle cx={x - diskR * 0.2} cy={y + diskR * 0.15} r={diskR * 0.14} fill="#3D2E22" />
    </G>
  );
}

function StemLeaf({ x, y, side }: { x: number; y: number; side: 'left' | 'right' }) {
  const dx = side === 'left' ? -1 : 1;
  return (
    <Path
      d={`M${x},${y} Q${x + dx * 18},${y - 6} ${x + dx * 14},${y - 18} Q${x + dx * 4},${y - 8} ${x},${y} Z`}
      fill="#7BB89A"
    />
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Soil mound hint */}
      <Ellipse cx={cx} cy={base + 2} rx={14} ry={5} fill="#4A4A3A" />
      {/* Two tiny seed-leaf sprouts */}
      <Path d={`M${cx - 6},${base} L${cx - 5},${base - 14}`} stroke="#7BB89A" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Ellipse cx={cx - 5} cy={base - 18} rx={5} ry={4} fill="#7BB89A" />
      <Path d={`M${cx + 6},${base} L${cx + 5},${base - 12}`} stroke="#7BB89A" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Ellipse cx={cx + 5} cy={base - 16} rx={5} ry={4} fill="#5A9478" />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Stem */}
      <Path d={`M${cx},${base} L${cx},${base - 38}`} stroke="#7BB89A" strokeWidth={3.5} strokeLinecap="round" fill="none" />
      {/* 2 large oval leaves */}
      <StemLeaf x={cx} y={base - 18} side="left" />
      <StemLeaf x={cx} y={base - 28} side="right" />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Tall stem */}
      <Path d={`M${cx},${base} L${cx},${base - 52}`} stroke="#7BB89A" strokeWidth={4} strokeLinecap="round" fill="none" />
      <StemLeaf x={cx} y={base - 20} side="left" />
      <StemLeaf x={cx} y={base - 34} side="right" />
      {/* Green round bud at top */}
      <Circle cx={cx} cy={base - 58} r={10} fill="#5A9478" />
      <Circle cx={cx} cy={base - 58} r={7} fill="#3D7055" />
      {/* Hint of yellow just showing */}
      <Path d={`M${cx - 4},${base - 58} Q${cx},${base - 66} ${cx + 4},${base - 58}`} stroke="#D4A574" strokeWidth={1.5} fill="none" />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Tall stem with slight lean */}
      <Path d={`M${cx},${base} Q${cx + 2},${base - 30} ${cx},${base - 56}`} stroke="#7BB89A" strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <StemLeaf x={cx} y={base - 22} side="left" />
      <StemLeaf x={cx} y={base - 38} side="right" />
      {/* Single large sunflower */}
      <SunflowerHead x={cx} y={base - 62} petalR={12} diskR={9} />
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 8;
  return (
    <G>
      {/* Main central stem */}
      <Path d={`M${cx},${base} Q${cx + 3},${base - 28} ${cx},${base - 58}`} stroke="#7BB89A" strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* Left side stem branching early */}
      <Path d={`M${cx},${base - 30} Q${cx - 14},${base - 44} ${cx - 20},${base - 56}`} stroke="#7BB89A" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Right side stem */}
      <Path d={`M${cx},${base - 38} Q${cx + 14},${base - 50} ${cx + 18},${base - 60}`} stroke="#7BB89A" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Leaves on main stem */}
      <StemLeaf x={cx} y={base - 20} side="left" />
      <StemLeaf x={cx} y={base - 34} side="right" />
      {/* Main flower — largest, top center */}
      <SunflowerHead x={cx} y={base - 65} petalR={12} diskR={9} />
      {/* Left flower — medium */}
      <SunflowerHead x={cx - 20} y={base - 62} petalR={9} diskR={7} />
      {/* Right flower — slightly smaller */}
      <SunflowerHead x={cx + 18} y={base - 66} petalR={9} diskR={7} />
    </G>
  );
}

export function PlantSunflower({
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
