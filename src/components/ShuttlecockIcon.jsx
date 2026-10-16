// eslint-disable-next-line react/prop-types
export default function ShuttlecockIcon({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 3.5 Q12 1 20 3.5" />
      <path d="M4 3.5 L8.5 16 M20 3.5 L15.5 16 M9.5 2.6 L10.8 16 M14.5 2.6 L13.2 16" />
      <path d="M5.8 8.5 Q12 6.8 18.2 8.5" />
      <path d="M8.5 16 h7 v1 a3.5 3.5 0 0 1 -7 0 z" fill="currentColor" />
    </svg>
  );
}
