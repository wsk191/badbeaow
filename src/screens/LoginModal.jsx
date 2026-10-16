import { Key, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginModal() {
  const {
    handleAdminLogin, isProcessing, loginEmail, loginError, loginPassword, setLoginEmail,
    setLoginPassword, setShowLoginModal,
  } = useApp();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg md:max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-gray-800 mb-1">เข้าสู่ระบบผู้ดูแล</h3>
        <p className="text-xs text-gray-500 mb-4">ระบบจะจำการล็อกอินไว้ 1 ชั่วโมง</p>
        {loginError && <div className="mb-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">{loginError}</div>}
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
  );
}
