import { BookOpen, Dumbbell, History, LayoutDashboard, Receipt, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MoreMenu() {
  const {
    activeTab, isAdmin, pendingRequests, setActiveTab, setFinanceModalTab, setShowAdminGuide,
    setShowFinanceModal, setShowGuide, setShowMoreMenu, userRole,
  } = useApp();

  return (
    <div className="fixed bottom-[74px] right-3 z-40 w-44 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 space-y-1">
      <button
        onClick={() => { setActiveTab('dashboard'); setShowMoreMenu(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${activeTab === 'dashboard' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <LayoutDashboard size={16} /> ภาพรวม
      </button>
      <button
        onClick={() => { setActiveTab('exercise'); setShowMoreMenu(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${activeTab === 'exercise' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <Dumbbell size={16} /> แผนออกกำลังกาย
      </button>
      {userRole === 'superAdmin' && (
        <button
          onClick={() => { setActiveTab('admins'); setShowMoreMenu(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${activeTab === 'admins' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <ShieldCheck size={16} /> ผู้ดูแล
        </button>
      )}
      {isAdmin && (
        <button
          onClick={() => { setShowFinanceModal(true); setFinanceModalTab('slips'); setShowMoreMenu(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50"
        >
          <Receipt size={16} /> ตรวจสลิป ({pendingRequests.length})
        </button>
      )}
      {isAdmin && (
        <button
          onClick={() => { setShowFinanceModal(true); setFinanceModalTab('history'); setShowMoreMenu(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-50"
        >
          <History size={16} /> ประวัติการเงิน
        </button>
      )}
      <button
        onClick={() => { setShowGuide(true); setShowMoreMenu(false); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
      >
        <BookOpen size={16} /> คู่มือการใช้งาน
      </button>
      {isAdmin && (
        <button
          onClick={() => { setShowAdminGuide(true); setShowMoreMenu(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          <ShieldCheck size={16} /> คู่มือแอดมิน
        </button>
      )}
    </div>
  );
}
