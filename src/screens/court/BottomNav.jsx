import { Dumbbell, MoreHorizontal, Swords, Trophy, Users, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BottomNav() {
  const {
    activeTab, isAdmin, isDesktop, pendingRequests, setActiveTab, setShowMoreMenu,
    showMoreMenu,
  } = useApp();

  return (
    <nav className={`fixed z-30 bg-white border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe ${isDesktop ? 'left-1/2 top-0 hidden w-full max-w-6xl -translate-x-1/2 border-b md:block' : 'bottom-0 w-full max-w-md border-t'}`}>
      <div className="flex justify-between px-2 py-3">
        <button onClick={() => setActiveTab('queue')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'queue' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
          <Swords size={22} />
          <span className="text-[10px]">คิวสนาม</span>
        </button>
        <button onClick={() => setActiveTab('players')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'players' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
          <Users size={22} />
          <span className="text-[10px]">รายชื่อ</span>
        </button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'leaderboard' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
          <Trophy size={22} />
          <span className="text-[10px]">จัดอันดับ</span>
        </button>
        <button onClick={() => setActiveTab('payment')} className={`flex flex-col items-center gap-1 flex-1 relative ${activeTab === 'payment' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
          <Wallet size={22} />
          <span className="text-[10px]">คิดเงิน</span>
          {isAdmin && pendingRequests.length > 0 && (
            <span className="absolute top-0 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
        <button onClick={() => setActiveTab('exercise')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'exercise' ? 'text-orange-600 font-bold' : 'text-gray-400'}`}>
          <Dumbbell size={22} />
          <span className="text-[10px]">ออกกำลัง</span>
        </button>
        <button onClick={() => setShowMoreMenu(prev => !prev)} className={`flex flex-col items-center gap-1 flex-1 ${showMoreMenu ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
          <MoreHorizontal size={22} />
          <span className="text-[10px]">เพิ่มเติม</span>
        </button>
      </div>
    </nav>
  );
}
