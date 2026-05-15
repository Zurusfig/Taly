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

const PAD_COLOR = '#5A9478';
const PAD_DARK = '#3D7055';
const PETAL_OUTER = '#C9848A';
const PETAL_INNER = '#E8C49A';
const CENTER_COLOR = '#D4A574';
const STEM_COLOR = '#4A7A60';
const WATER_COLOR = '#61988E';

// Lily pad — rotated ellipse with a notch
function LilyPad({ cx, cy, rx, ry, rotation = 0 }: { cx: number; cy: number; rx: number; ry: number; rotation?: number }) {
  // Slight notch via arc path rather than plain ellipse for botanical look
  return (
    <G rotation={rotation} origin={`${cx},${cy}`}>
      <Path
        d={`M${cx},${cy} L${cx - rx * 0.15},${cy - ry} A${rx} ${ry} 0 1 1 ${cx + rx * 0.15},${cy - ry} Z`}
        fill={PAD_COLOR}
      />
      {/* Vein lines */}
      <Path d={`M${cx},${cy} L${cx},${cy - ry}`} stroke={PAD_DARK} strokeWidth={0.8} opacity={0.5} />
      <Path d={`M${cx},${cy} Q${cx + rx * 0.6},${cy - ry * 0.3} ${cx + rx * 0.85},${cy - ry * 0.5}`} stroke={PAD_DARK} strokeWidth={0.7} fill="none" opacity={0.5} />
      <Path d={`M${cx},${cy} Q${cx - rx * 0.6},${cy - ry * 0.3} ${cx - rx * 0.85},${cy - ry * 0.5}`} stroke={PAD_DARK} strokeWidth={0.7} fill="none" opacity={0.5} />
      <Path d={`M${cx},${cy} Q${cx + rx * 0.4},${cy - ry * 0.6} ${cx + rx * 0.5},${cy - ry * 0.9}`} stroke={PAD_DARK} strokeWidth={0.6} fill="none" opacity={0.4} />
      <Path d={`M${cx},${cy} Q${cx - rx * 0.4},${cy - ry * 0.6} ${cx - rx * 0.5},${cy - ry * 0.9}`} stroke={PAD_DARK} strokeWidth={0.6} fill="none" opacity={0.4} />
    </G>
  );
}

// Water ripple — thin arc
function WaterRipple({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <Path
      d={`M${cx - r},${cy} A${r} ${r * 0.3} 0 0 1 ${cx + r},${cy}`}
      stroke={WATER_COLOR}
      strokeWidth={0.8}
      fill="none"
      opacity={0.4}
    />
  );
}

// Lotus stem from pad surface upward
function LotusStem({ x, padY, height }: { x: number; padY: number; height: number }) {
  return (
    <Path
      d={`M${x},${padY} Q${x + 2},${padY - height * 0.5} ${x},${padY - height}`}
      stroke={STEM_COLOR}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
  );
}

// Closed bud — teardrop
function LotusBud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 7 * scale;
  const h = 14 * scale;
  return (
    <G>
      <Path
        d={`M${x},${y + h * 0.25} Q${x - w},${y} ${x - w * 0.5},${y - h * 0.6} Q${x},${y - h} ${x + w * 0.5},${y - h * 0.6} Q${x + w},${y} ${x},${y + h * 0.25} Z`}
        fill={PETAL_OUTER}
      />
      {/* Inner shading */}
      <Path
        d={`M${x},${y + h * 0.25} Q${x - w * 0.4},${y - h * 0.1} ${x},${y - h * 0.7}`}
        stroke={PETAL_INNER}
        strokeWidth={1.5}
        fill="none"
        opacity={0.5}
      />
    </G>
  );
}

// Half-open lotus — 3 petals showing
function LotusHalfOpen({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const pw = 9 * scale;
  const ph = 16 * scale;
  return (
    <G>
      {/* Center petal */}
      <Path d={`M${x},${y} Q${x - pw * 0.5},${y - ph * 0.5} ${x},${y - ph} Q${x + pw * 0.5},${y - ph * 0.5} ${x},${y} Z`} fill={PETAL_OUTER} />
      {/* Left petal */}
      <Path d={`M${x},${y} Q${x - pw * 1.1},${y - ph * 0.4} ${x - pw * 0.7},${y - ph * 0.85} Q${x - pw * 0.1},${y - ph * 0.5} ${x},${y} Z`} fill={PETAL_OUTER} />
      {/* Right petal */}
      <Path d={`M${x},${y} Q${x + pw * 1.1},${y - ph * 0.4} ${x + pw * 0.7},${y - ph * 0.85} Q${x + pw * 0.1},${y - ph * 0.5} ${x},${y} Z`} fill={PETAL_OUTER} />
      {/* Inner highlight */}
      <Ellipse cx={x} cy={y - ph * 0.3} rx={pw * 0.35} ry={ph * 0.22} fill={PETAL_INNER} opacity={0.5} />
    </G>
  );
}

// Fully open lotus — 8 petals, layered
function LotusOpen({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const outerR = 14 * scale;
  const innerR = 9 * scale;
  const ph = 14 * scale;
  return (
    <G>
      {/* Outer 8 petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const px = x + Math.cos(rad) * outerR * 0.6;
        const py = y + Math.sin(rad) * outerR * 0.3;
        return (
          <Path
            key={`op${i}`}
            d={`M${x},${y} Q${x + Math.cos(rad) * outerR * 1.1},${y + Math.sin(rad) * outerR * 0.55 - ph * 0.4} ${x + Math.cos(rad) * outerR * 0.7},${y + Math.sin(rad) * outerR * 0.35 - ph * 0.85} Q${x + Math.cos(rad) * outerR * 0.15},${y - ph * 0.5} ${x},${y} Z`}
            fill={PETAL_OUTER}
          />
        );
      })}
      {/* Inner 8 petals, slightly shorter */}
      {[22, 67, 112, 157, 202, 247, 292, 337].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <Path
            key={`ip${i}`}
            d={`M${x},${y} Q${x + Math.cos(rad) * innerR * 1.05},${y + Math.sin(rad) * innerR * 0.5 - ph * 0.3} ${x + Math.cos(rad) * innerR * 0.6},${y + Math.sin(rad) * innerR * 0.3 - ph * 0.7} Q${x + Math.cos(rad) * 0.1},${y - ph * 0.4} ${x},${y} Z`}
            fill={PETAL_INNER}
          />
        );
      })}
      {/* Center */}
      <Circle cx={x} cy={y - ph * 0.15} r={5 * scale} fill={CENTER_COLOR} />
      <Circle cx={x} cy={y - ph * 0.15} r={2.5 * scale} fill="#E8C49A" />
    </G>
  );
}

function Stage1({ cx, potY }: { cx: number; potY: number }) {
  const padY = potY - 10;
  return (
    <G>
      {/* Single lily pad */}
      <LilyPad cx={cx} cy={padY} rx={18} ry={10} rotation={-5} />
      {/* Ripple */}
      <WaterRipple cx={cx + 8} cy={padY + 4} r={10} />
    </G>
  );
}

function Stage2({ cx, potY }: { cx: number; potY: number }) {
  const padY = potY - 10;
  return (
    <G>
      {/* 2 lily pads */}
      <LilyPad cx={cx - 10} cy={padY + 2} rx={15} ry={8} rotation={-15} />
      <LilyPad cx={cx + 8} cy={padY} rx={16} ry={9} rotation={10} />
      {/* Small closed bud emerging */}
      <LotusStem x={cx - 2} padY={padY - 2} height={20} />
      <LotusBud x={cx - 2} y={padY - 22} scale={0.7} />
    </G>
  );
}

function Stage3({ cx, potY }: { cx: number; potY: number }) {
  const padY = potY - 10;
  return (
    <G>
      <LilyPad cx={cx - 12} cy={padY + 2} rx={16} ry={9} rotation={-18} />
      <LilyPad cx={cx + 10} cy={padY} rx={16} ry={9} rotation={12} />
      {/* Tall stem + half-open lotus */}
      <LotusStem x={cx} padY={padY - 3} height={38} />
      <LotusHalfOpen x={cx} y={padY - 41} scale={0.9} />
    </G>
  );
}

function Stage4({ cx, potY }: { cx: number; potY: number }) {
  const padY = potY - 10;
  return (
    <G>
      <LilyPad cx={cx - 14} cy={padY + 2} rx={17} ry={10} rotation={-20} />
      <LilyPad cx={cx + 12} cy={padY} rx={17} ry={10} rotation={15} />
      {/* Tall stem + fully open lotus */}
      <LotusStem x={cx} padY={padY - 3} height={42} />
      <LotusOpen x={cx} y={padY - 45} scale={1} />
    </G>
  );
}

function Stage5({ cx, potY }: { cx: number; potY: number }) {
  const padY = potY - 10;
  return (
    <G>
      {/* 2 large pads */}
      <LilyPad cx={cx - 16} cy={padY + 3} rx={18} ry={11} rotation={-22} />
      <LilyPad cx={cx + 14} cy={padY} rx={18} ry={11} rotation={18} />
      {/* Main tall lotus — center */}
      <LotusStem x={cx} padY={padY - 3} height={48} />
      <LotusOpen x={cx} y={padY - 51} scale={1} />
      {/* Left smaller lotus */}
      <LotusStem x={cx - 16} padY={padY} height={36} />
      <LotusOpen x={cx - 16} y={padY - 39} scale={0.7} />
      {/* Right smaller lotus (bud still opening) */}
      <LotusStem x={cx + 14} padY={padY - 2} height={32} />
      <LotusHalfOpen x={cx + 14} y={padY - 34} scale={0.75} />
      {/* Water ripple lines */}
      <WaterRipple cx={cx - 6} cy={padY + 6} r={14} />
      <WaterRipple cx={cx + 4} cy={padY + 8} r={10} />
      <WaterRipple cx={cx - 2} cy={padY + 10} r={7} />
    </G>
  );
}

export function PlantLotus({
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
