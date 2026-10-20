// Decorative Halloween layer: cobwebs, a moon, bats, ghosts, a dangling spider,
// pumpkins and falling candy. Purely visual and never blocks clicks.

const BATS = [
  { top: '12%', delay: '0s', duration: '14s', size: '1.6rem' },
  { top: '22%', delay: '5s', duration: '18s', size: '1.2rem' },
  { top: '8%', delay: '10s', duration: '16s', size: '1rem' },
];

const GHOSTS = [
  { left: '2%', top: '38%', delay: '0s', size: '2rem' },
  { right: '4%', top: '55%', delay: '1.8s', size: '2rem' },
  { left: '6%', top: '78%', delay: '3.2s', size: '1.6rem' },
];

const CANDY = ['🍬', '🍭', '🍫', '🍬', '🍭', '🍡', '🍬'].map((emoji, index) => ({
  emoji,
  left: `${8 + index * 13}%`,
  delay: `${index * 2.3}s`,
  duration: `${13 + (index % 3) * 4}s`,
}));

// eslint-disable-next-line react/prop-types
export default function HalloweenDecor({ aboveNav = false }) {
  const bottom = aboveNav ? 'bottom-[76px]' : 'bottom-2';

  return (
    <div aria-hidden="true" className="halloween-decor pointer-events-none fixed inset-0 z-[25] overflow-hidden select-none">
      <div className="absolute -top-28 right-[8%] h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="absolute -left-3 -top-3 text-7xl opacity-60 md:text-8xl">🕸️</div>
      <div className="absolute -right-3 -top-3 -scale-x-100 text-7xl opacity-60 md:text-8xl">🕸️</div>
      <div className="halloween-moon absolute right-[14%] top-5 text-4xl md:text-5xl">🌕</div>

      <div className="halloween-spider absolute left-[22%] top-0 flex flex-col items-center">
        <div className="h-24 w-px bg-white/40" />
        <div className="-mt-1 text-2xl">🕷️</div>
      </div>

      {BATS.map((bat, index) => (
        <div key={index} className="halloween-bat absolute -left-12" style={{ top: bat.top, fontSize: bat.size, animationDelay: bat.delay, animationDuration: bat.duration }}>🦇</div>
      ))}

      {GHOSTS.map((ghost, index) => (
        <div key={index} className="halloween-ghost absolute opacity-60" style={{ left: ghost.left, right: ghost.right, top: ghost.top, fontSize: ghost.size, animationDelay: ghost.delay }}>👻</div>
      ))}

      {CANDY.map((candy, index) => (
        <div key={index} className="halloween-candy absolute -top-10 text-xl" style={{ left: candy.left, animationDelay: candy.delay, animationDuration: candy.duration }}>{candy.emoji}</div>
      ))}

      <div className={`absolute ${bottom} left-2 flex items-end gap-1 opacity-90`}>
        <span className="halloween-pumpkin text-5xl md:text-6xl">🎃</span>
        <span className="halloween-pumpkin text-3xl md:text-4xl" style={{ animationDelay: '0.7s' }}>🎃</span>
      </div>
      <div className={`absolute ${bottom} right-2 flex items-end gap-1 opacity-90`}>
        <span className="text-3xl md:text-4xl">🍬</span>
        <span className="halloween-pumpkin text-5xl md:text-6xl" style={{ animationDelay: '1.4s' }}>🎃</span>
      </div>
    </div>
  );
}
