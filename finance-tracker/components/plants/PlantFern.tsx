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

// A frond: a curved spine with small teardrop leaflets along it
function Frond({
  x, y, angle, length, leafCount, primary, dark,
}: {
  x: number; y: number; angle: number; length: number;
  leafCount: number; primary: string; dark: string;
}) {
  const rad = (angle * Math.PI) / 180;
  // Control point bends the frond gently
  const cpx = x + Math.cos(rad - 0.4) * length * 0.55;
  const cpy = y + Math.sin(rad - 0.4) * length * 0.55;
  const ex = x + Math.cos(rad) * length;
  const ey = y + Math.sin(rad) * length;
  const spine = `M${x},${y} Q${cpx},${cpy} ${ex},${ey}`;

  // Place leaflets evenly along the quadratic bezier
  const leaflets = [];
  for (let i = 1; i <= leafCount; i++) {
    const t = i / (leafCount + 1);
    const lx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * cpx + t * t * ex;
    const ly = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cpy + t * t * ey;
    // tangent direction
    const tx2 = 2 * (1 - t) * (cpx - x) + 2 * t * (ex - cpx);
    const ty2 = 2 * (1 - t) * (cpy - y) + 2 * t * (ey - cpy);
    const tangAngle = (Math.atan2(ty2, tx2) * 180) / Math.PI;
    const leafSize = 3.5 + t * 2;
    const fill = i % 2 === 0 ? primary : dark;
    leaflets.push(
      <Ellipse
        key={`lf${i}`}
        cx={lx}
        cy={ly}
        rx={leafSize * 0.55}
        ry={leafSize}
        rotation={tangAngle + 90}
        origin={`${lx},${ly}`}
        fill={fill}
      />
    );
    leaflets.push(
      <Ellipse
        key={`lr${i}`}
        cx={lx}
        cy={ly}
        rx={leafSize * 0.55}
        ry={leafSize}
        rotation={tangAngle - 90}
        origin={`${lx},${ly}`}
        fill={fill}
      />
    );
  }

  return (
    <G>
      <Path d={spine} stroke={dark} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      {leaflets}
    </G>
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 10;
  return (
    <G>
      <Frond x={cx} y={base} angle={-80} length={36} leafCount={3} primary="#5A9870" dark="#3D7055" />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 10;
  return (
    <G>
      <Frond x={cx} y={base} angle={-100} length={40} leafCount={4} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-80} length={40} leafCount={4} primary="#5A9870" dark="#3D7055" />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 10;
  return (
    <G>
      <Frond x={cx} y={base} angle={-110} length={44} leafCount={5} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-90} length={50} leafCount={6} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-70} length={44} leafCount={5} primary="#5A9870" dark="#3D7055" />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 10;
  return (
    <G>
      <Frond x={cx} y={base} angle={-130} length={42} leafCount={5} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-108} length={48} leafCount={6} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-90} length={54} leafCount={7} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-72} length={48} leafCount={6} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-50} length={42} leafCount={5} primary="#5A9870" dark="#3D7055" />
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const base = potY - 10;
  return (
    <G>
      {/* 7 fronds fanning wide, outer ones gracefully drooping */}
      <Frond x={cx} y={base} angle={-150} length={38} leafCount={4} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-126} length={46} leafCount={6} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-108} length={52} leafCount={7} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-90} length={58} leafCount={8} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-72} length={52} leafCount={7} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-54} length={46} leafCount={6} primary="#5A9870" dark="#3D7055" />
      <Frond x={cx} y={base} angle={-30} length={38} leafCount={4} primary="#5A9870" dark="#3D7055" />
    </G>
  );
}

export function PlantFern({
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
