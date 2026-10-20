import { useId } from 'react';

// Bold letter "A" drawn as an upside-down shuttlecock: the cork is the apex,
// the legs are feathers with scalloped tips, and the crossbar is the thread band.
// eslint-disable-next-line react/prop-types
export default function ShuttlecockLetterA({ className = '' }) {
  const id = useId().replace(/:/g, '');
  const fill = `url(#${id}-fill)`;

  return (
    <svg viewBox="0 -2 100 108" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'rgb(var(--c-purple-600))' }} />
          <stop offset="100%" style={{ stopColor: 'rgb(var(--wordmark-to))' }} />
        </linearGradient>
      </defs>

      {/* Feathers (the two legs), with scalloped tips on the baseline */}
      <path
        fill={fill}
        d="M37 20 L63 20 L100 100 Q96.75 105 93.5 100 Q90.25 105 87 100 Q83.75 105 80.5 100 Q77.25 105 74 100 L50 46.7 L26 100 Q22.75 105 19.5 100 Q16.25 105 13 100 Q9.75 105 6.5 100 Q3.25 105 0 100 Z"
      />
      {/* Feather shafts */}
      <path d="M43.5 21 L13 100 M56.5 21 L87 100" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />

      {/* Thread band = crossbar */}
      <path fill={fill} d="M41 66 L59 66 L63.5 76 L36.5 76 Z" />
      <path d="M16 69 L84 69 M14.5 73 L85.5 73" stroke="#fb7185" strokeWidth="1.8" strokeLinecap="round" />

      {/* Cork = apex */}
      <path fill={fill} d="M34 21 Q34 0 50 0 Q66 0 66 21 Z" />
      <path d="M35 13 L65 13" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.4" />
      <path d="M35.5 17 L64.5 17" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" />
    </svg>
  );
}
