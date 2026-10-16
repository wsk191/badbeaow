import { ArrowLeft, Lock, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CourtHeader() {
  const {
    handleLogout, isAdmin, isDesktop, selectedCourt, setSelectedCourtId, setShowLoginModal,
    userRole,
  } = useApp();

  return (
    <header className={`bg-white/80 backdrop-blur-md text-gray-800 ${isDesktop ? 'pt-5 px-8' : 'pt-10 px-6'} pb-3 sticky top-0 z-20 border-b border-gray-100 flex justify-between items-center`}>
      <div className="flex items-center gap-2">
        <button onClick={() => setSelectedCourtId(null)} className="p-1.5 -ml-2 text-gray-400 hover:text-purple-600 transition-colors" title="กลับไปเลือกคอร์ด">
          <ArrowLeft size={19} />
        </button>
        <div>
          <h1 className={`text-lg font-bold tracking-tight ${selectedCourt.text}`}>BADBEAOW</h1>
          <div className="text-[10px] text-gray-400 font-medium">{selectedCourt.name}</div>
        </div>
      </div>
      <div>
        {isAdmin ? (
          <button
            onClick={() => handleLogout(false)}
            className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-red-100 transition-colors"
          >
            <LogOut size={13} /> {userRole === 'superAdmin' ? 'SuperAdmin' : 'โหมดแอดมิน'}
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors"
          >
            <Lock size={13} /> เข้าสู่ระบบแอดมิน
          </button>
        )}
      </div>
    </header>
  );
}
