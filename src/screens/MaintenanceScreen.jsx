import { Wrench } from 'lucide-react';
import LoginModal from './LoginModal';
import { useApp } from '../context/AppContext';

export default function MaintenanceScreen() {
  const {
    setShowLoginModal, showLoginModal,
  } = useApp();

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }} className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-center px-6">
      <div className="relative w-full text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-300/30 bg-amber-300/10 text-amber-300 shadow-[0_0_45px_rgba(251,191,36,0.18)]">
          <Wrench size={38} className="animate-pulse" />
        </div>
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" /> ระบบอยู่ระหว่างปรับปรุง
        </div>
        <h1 className="text-2xl font-black tracking-tight">กำลังปรับปรุงระบบ</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">ขณะนี้ระบบยังไม่เปิดให้ใช้งานชั่วคราว กรุณากลับมาใหม่ภายหลัง</p>
        <button onClick={() => setShowLoginModal(true)} className="mt-8 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white/80 hover:bg-white/15">
          เข้าสู่ระบบผู้ดูแล
        </button>
      </div>

      {showLoginModal && <LoginModal />}
    </div>
  );
}
