import { Key, Mail, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MaintenanceScreen() {
  const {
    handleAdminLogin, isProcessing, loginEmail, loginError, loginPassword, setLoginEmail,
    setLoginPassword, setShowLoginModal, showLoginModal,
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

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg md:max-w-xl rounded-3xl bg-white p-6 text-left text-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="mb-1 text-lg font-bold">เข้าสู่ระบบผู้ดูแล</h3>
            <p className="mb-4 text-xs text-gray-500">สำหรับ SuperAdmin เพื่อเปิดระบบกลับมาใช้งาน</p>
            {loginError && <div className="mb-3 rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-red-600">{loginError}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="อีเมล" required className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="รหัสผ่าน" required className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white text-sm disabled:opacity-50 transition-colors">เข้าสู่ระบบ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
