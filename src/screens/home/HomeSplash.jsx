import { useApp } from '../../context/AppContext';

export default function HomeSplash() {
  const {
    splashExiting,
  } = useApp();

  return (
    <div
      className={`splash-screen ${splashExiting ? 'splash-screen-exiting' : ''} fixed inset-0 z-[60] bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-950 flex items-center justify-center px-6 text-white overflow-hidden`}
    >
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="splash-content relative w-full text-center animate-in fade-in zoom-in-95 duration-500">
        <h1 className="splash-title text-3xl font-black tracking-[0.18em]">
          {'BADBEAOW'.split('').map((letter, index) => (
            <span className={`splash-letter ${letter === 'A' ? 'splash-a-glow' : ''}`} key={`${letter}-${index}`}>{letter}</span>
          ))}
        </h1>
        <p className="mt-2 text-sm text-purple-200">ระบบจัดการคิวตีแบด</p>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/60">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
          กำลังเตรียมระบบ...
        </div>
      </div>
    </div>
  );
}
