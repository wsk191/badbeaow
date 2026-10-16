import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MIN_GAMES_FOR_RATE = 5;
const record = player => {
  const wins = player.wins || 0;
  const losses = player.losses || 0;
  const played = wins + losses;
  return { wins, losses, played, rate: played ? wins / played : 0 };
};
const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardTab() {
  const {
    getPowerLevel, leaderboardPlayers, leaderboardScope, selectedCourt, setLeaderboardScope,
  } = useApp();
  const [sortBy, setSortBy] = useState('wins');

  const ranked = useMemo(() => {
    const list = leaderboardPlayers.map(player => ({ ...player, stats: record(player) }));
    if (sortBy === 'rate') {
      // Win rate only counts once a player has enough games; everyone else follows by wins.
      return list.sort((a, b) => {
        const aQualified = a.stats.played >= MIN_GAMES_FOR_RATE;
        const bQualified = b.stats.played >= MIN_GAMES_FOR_RATE;
        if (aQualified !== bQualified) return aQualified ? -1 : 1;
        return b.stats.rate - a.stats.rate || b.stats.wins - a.stats.wins;
      });
    }
    return list.sort((a, b) => b.stats.wins - a.stats.wins || a.stats.losses - b.stats.losses);
  }, [leaderboardPlayers, sortBy]);

  return (
    <div className="space-y-4 p-4">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${selectedCourt.accent} p-5 text-center text-white shadow-lg`}>
        <Trophy size={36} className="mx-auto mb-2 text-yellow-300 drop-shadow-md" />
        <h2 className="text-lg font-black tracking-wide">ทำเนียบยอดฝีมือ</h2>
        <p className="text-[12px] text-white/70">นับชนะ แพ้ และ % ชนะจากทุกเกมที่บันทึก</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
          {[['court', selectedCourt.name], ['all', 'รวม 4 คอร์ด']].map(([key, label]) => (
            <button key={key} onClick={() => setLeaderboardScope(key)} className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-colors ${leaderboardScope === key ? `${selectedCourt.solid} text-white shadow-sm` : 'text-gray-500'}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-1 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
          {[['wins', 'ชนะมากสุด'], ['rate', '% ชนะ']].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-colors ${sortBy === key ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500'}`}>{label}</button>
          ))}
        </div>
      </div>
      {sortBy === 'rate' && <p className="px-1 text-[11px] text-gray-500">% ชนะนับเฉพาะคนที่เล่นครบ {MIN_GAMES_FOR_RATE} เกมขึ้นไป</p>}

      <div className="divide-y divide-gray-50 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {ranked.length === 0 && <div className="p-8 text-center text-sm text-gray-400">ยังไม่มีผลการแข่ง</div>}
        {ranked.map((player, index) => {
          const { wins, losses, played, rate } = player.stats;
          const power = getPowerLevel(wins);
          return (
            <div key={player.id} className="flex items-center gap-3 p-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${index < 3 ? 'bg-amber-50 text-lg' : 'bg-gray-50 text-gray-600'}`}>{MEDALS[index] || index + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-gray-800">{player.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                  <span><b className="text-emerald-600">{wins}</b> ชนะ</span>
                  <span><b className="text-rose-500">{losses}</b> แพ้</span>
                  <span>{played ? `${Math.round(rate * 100)}%` : '-'}</span>
                </div>
                {played > 0 && <div className="mt-1 h-1 overflow-hidden rounded-full bg-rose-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate * 100}%` }} /></div>}
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${power.color}`}>{power.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
