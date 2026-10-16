import { Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LeaderboardTab() {
  const {
    getPowerLevel, leaderboardPlayers, leaderboardScope, selectedCourt, setLeaderboardScope,
  } = useApp();

  return (
    <div className="p-4 space-y-5">
      <div className={`bg-gradient-to-br ${selectedCourt.accent} p-6 rounded-3xl shadow-lg text-white text-center relative overflow-hidden`}>
        <Trophy size={42} className="mx-auto mb-3 text-yellow-300 drop-shadow-md" />
        <h2 className="text-xl font-black mb-1 tracking-wide">ทำเนียบยอดฝีมือ</h2>
        <p className="text-purple-200 text-[12px] font-medium">ใครชนะบ่อย ค่าพลังยิ่งสูง อันดับยิ่งแรง!</p>
      </div>
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
        <button onClick={() => setLeaderboardScope('court')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${leaderboardScope === 'court' ? `${selectedCourt.solid} text-white shadow-sm` : 'text-gray-500'}`}>
          {selectedCourt.name}
        </button>
        <button onClick={() => setLeaderboardScope('all')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${leaderboardScope === 'all' ? `${selectedCourt.solid} text-white shadow-sm` : 'text-gray-500'}`}>
          รวม 4 คอร์ด
        </button>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {leaderboardPlayers.map((player, index) => (
          <div key={player.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border flex items-center justify-center font-black text-sm bg-gray-50 text-gray-700">{index + 1}</div>
              <div>
                <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  {player.name} {index === 0 && '👑'}
                </div>
                <div className="text-[11px] text-gray-500">ชนะทั้งหมด {player.wins || 0} แมตช์</div>
              </div>
            </div>
            <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${getPowerLevel(player.wins).color}`}>
              {getPowerLevel(player.wins).label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
