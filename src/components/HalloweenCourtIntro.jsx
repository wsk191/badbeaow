import { useEffect } from 'react';

// Halloween court-entry intro: a drone light show. Lights fly in and draw the two
// halves of a pumpkin, the halves snap together, and the camera sweeps in like a
// drone until it hovers straight above the pumpkin with "TRICK OR TREAT" below.

const INTRO_MS = 5600;
const BODY = '#fb923c';
const FACE = '#fde047';
const STEM = '#4ade80';

const arc = (cx, cy, rx, ry, from, to, steps = 40) => Array.from({ length: steps + 1 }, (_, i) => {
  const angle = from + ((to - from) * i) / steps;
  return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
});

const quad = ([x0, y0], [cx, cy], [x1, y1], steps = 12) => Array.from({ length: steps + 1 }, (_, i) => {
  const t = i / steps;
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
});

const mirror = points => points.map(([x, y]) => [-x, y]);
const FULL = Math.PI * 2;
const HALF = Math.PI / 2;

const leftMouth = [[0, 48], [-20, 62], [-35, 38], [-50, 50], [-70, 30], ...quad([-70, 30], [-40, 84], [0, 88]).slice(1)];

// Shapes in a -200..200 coordinate space, split into the two halves that fly together.
const HALVES = {
  left: [
    { color: BODY, points: arc(-92, 18, 62, 86, 0, FULL) },
    { color: BODY, points: arc(-48, 12, 58, 96, 0, FULL) },
    { color: BODY, points: arc(0, 10, 40, 100, HALF, HALF * 3) },
    { color: FACE, points: [[-64, -8], [-20, -8], [-42, -48], [-64, -8]] },
    { color: FACE, points: [[-10, 12], [0, -6], [0, 12], [-10, 12]] },
    { color: FACE, points: leftMouth },
  ],
  right: [
    { color: BODY, points: arc(92, 18, 62, 86, 0, FULL) },
    { color: BODY, points: arc(48, 12, 58, 96, 0, FULL) },
    { color: BODY, points: arc(0, 10, 40, 100, -HALF, HALF) },
    { color: FACE, points: mirror([[-64, -8], [-20, -8], [-42, -48], [-64, -8]]) },
    { color: FACE, points: [[10, 12], [0, -6], [0, 12], [10, 12]] },
    { color: FACE, points: mirror(leftMouth) },
    { color: STEM, points: [[-8, -88], [-6, -116], ...quad([-6, -116], [0, -138], [20, -138], 8).slice(1)] },
  ],
};

// Deterministic scatter so every visit looks the same.
const noise = seed => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const toPercent = value => `${(value + 200) / 4}%`;

function dotsFor(shapes, halfIndex) {
  const dots = [];
  shapes.forEach((shape, shapeIndex) => {
    shape.points.forEach(([x, y], pointIndex) => {
      if (pointIndex % 2) return;
      const seed = halfIndex * 1000 + shapeIndex * 100 + pointIndex;
      dots.push({
        key: `${shapeIndex}-${pointIndex}`,
        x, y, color: shape.color,
        sx: (noise(seed) - 0.5) * 700,
        sy: 220 + noise(seed + 0.5) * 320,
        sz: noise(seed + 0.25) * 260,
        delay: noise(seed + 0.75) * 0.6,
      });
    });
  });
  return dots;
}

const STARS = Array.from({ length: 40 }, (_, i) => ({
  left: `${noise(i + 0.1) * 100}%`,
  top: `${noise(i + 0.2) * 70}%`,
  size: 1 + noise(i + 0.3) * 2,
  delay: `${noise(i + 0.4) * 3}s`,
}));

/* eslint-disable react/prop-types */
function PumpkinHalf({ side, shapes, index }) {
  return (
    <div className={`hw-half hw-half-${side}`}>
      <svg viewBox="-200 -200 400 400" className="absolute inset-0 h-full w-full overflow-visible">
        {shapes.map((shape, shapeIndex) => (
          <polyline
            key={shapeIndex}
            className="hw-stroke"
            points={shape.points.map(point => point.join(',')).join(' ')}
            pathLength="1"
            stroke={shape.color}
            style={{ color: shape.color, animationDelay: `${1.5 + shapeIndex * 0.08}s` }}
          />
        ))}
      </svg>
      {dotsFor(shapes, index).map(dot => (
        <span
          key={dot.key}
          className="hw-drone"
          style={{
            left: toPercent(dot.x), top: toPercent(dot.y), color: dot.color, backgroundColor: dot.color,
            '--sx': `${dot.sx}px`, '--sy': `${dot.sy}px`, '--sz': `${dot.sz}px`, animationDelay: `${dot.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function HalloweenCourtIntro({ courtName, onDone }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => onDone(true), reduceMotion ? 1200 : INTRO_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="hw-intro pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_20%,#2a1238_0%,#12081a_55%,#06030a_100%)]" aria-hidden="true">
      {STARS.map((star, index) => (
        <span key={index} className="hw-star absolute rounded-full bg-white" style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />
      ))}
      <div className="absolute right-[12%] top-[8%] h-14 w-14 rounded-full bg-orange-100 shadow-[0_0_40px_12px_rgba(253,186,116,0.35)]" />

      <div className="hw-stage absolute inset-0 flex items-center justify-center">
        <div className="hw-hover">
          <div className="hw-camera">
            <div className="hw-ground" />
            <div className="hw-core" />
            <PumpkinHalf side="left" shapes={HALVES.left} index={0} />
            <PumpkinHalf side="right" shapes={HALVES.right} index={1} />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[16%] text-center">
        <div className="hw-title text-4xl font-black tracking-[0.12em] text-orange-400 md:text-6xl">TRICK OR TREAT</div>
        <p className="hw-subtitle mt-3 text-sm text-white/70">กำลังเข้าสู่ {courtName}</p>
      </div>
    </div>
  );
}
