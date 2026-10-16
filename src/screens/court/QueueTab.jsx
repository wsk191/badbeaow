import { useState } from 'react';
import { ArrowDown, ArrowUp, Bell, BellRing, ChevronDown, GripVertical, History, Minus, Plus, Search, Shuffle, Swords, Trash2, Trophy, Undo2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const names = team => (Array.isArray(team) ? team.map(player => player?.name).filter(Boolean) : []);
const timeAgo = (at, now) => {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  return new Date(at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

// eslint-disable-next-line react/prop-types
function TeamBox({ label, team }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3 text-center">
      <div className="text-[10px] font-bold text-white/60">ทีม {label}</div>
      {names(team).length ? names(team).map(name => <div key={name} className="truncate text-sm font-bold">{name}</div>) : <div className="text-sm text-white/50">ว่าง</div>}
    </div>
  );
}

function CourtCard() {
  const {
    canUndoResult, court, courtSettings, handleClearCourt, handleStartGame, handleUndoResult, handleWin,
    isAdmin, isProcessing, isResultLocked, lastResult, nowTick, queue, resultLockTotalSeconds, selectedCourt,
    setShuttlesUsed, shuttlesUsed,
  } = useApp();
  const playing = Boolean(court.teamA && court.teamB);
  const charging = isAdmin && courtSettings.shuttlePrice > 0;
  const perPerson = charging ? (shuttlesUsed * courtSettings.shuttlePrice) / 4 : 0;

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${selectedCourt.accent} p-5 text-white shadow-xl`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-black"><Swords size={18} className="text-white/70" /> สนาม</h2>
        <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/80">ผู้ชนะอยู่ต่อ</span>
      </div>

      {!court.teamA && !court.teamB ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 py-7 text-center">
          <div className="mb-3 text-sm text-white/70">สนามว่าง</div>
          {queue.length >= 2
            ? <button onClick={handleStartGame} disabled={isProcessing} className="rounded-full bg-white px-6 py-2.5 text-sm font-black text-slate-900 shadow-lg disabled:opacity-50">ดึงคิวที่ 1 และ 2 ลงสนาม</button>
            : <span className="text-xs text-white/50">ต้องมีคิวอย่างน้อย 2 คู่</span>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
            <TeamBox label="A" team={court.teamA} />
            <div className="flex items-center text-sm font-black italic text-white/40">VS</div>
            <TeamBox label="B" team={court.teamB} />
          </div>

          {playing && (
            <>
              {isResultLocked && <div className="rounded-xl border border-red-300/30 bg-red-500/20 px-3 py-2 text-center text-xs font-semibold text-red-100">ปุ่มบันทึกผลล็อกอีก {Math.ceil(resultLockTotalSeconds / 60)} นาที เพราะกดซ้ำเร็วเกินไป</div>}
              {charging && (
                <div className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2 text-xs">
                  <span className="font-semibold text-white/80">ลูกที่ใช้เกมนี้</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShuttlesUsed(Math.max(0, shuttlesUsed - 1))} aria-label="ลดจำนวนลูก" className="rounded-lg bg-white/15 p-1.5"><Minus size={14} /></button>
                    <span className="w-6 text-center text-base font-black">{shuttlesUsed}</span>
                    <button type="button" onClick={() => setShuttlesUsed(shuttlesUsed + 1)} aria-label="เพิ่มจำนวนลูก" className="rounded-lg bg-white/15 p-1.5"><Plus size={14} /></button>
                    <span className="ml-1 text-white/70">คนละ {perPerson.toFixed(2)}฿</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B'].map(team => (
                  <button key={team} onClick={() => handleWin(team)} disabled={isProcessing || isResultLocked} className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-3 text-sm font-black text-slate-900 shadow-lg transition hover:bg-white/90 disabled:opacity-50">
                    <Trophy size={16} className="text-amber-500" /> ทีม {team} ชนะ
                  </button>
                ))}
              </div>
            </>
          )}
          <button onClick={handleClearCourt} disabled={isProcessing} className="block w-full text-center text-[11px] text-white/50 transition-colors hover:text-white">เคลียร์สนาม (ส่งผู้เล่นกลับคิว)</button>
        </div>
      )}

      {lastResult && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs">
          <span className="min-w-0 truncate text-white/80">ล่าสุด: <b className="text-white">ทีม {lastResult.winner} ชนะ</b> · {timeAgo(lastResult.at, nowTick)}{lastResult.charge ? ` · ค่าลูกคนละ ${lastResult.charge}฿` : ''}</span>
          {canUndoResult && <button type="button" onClick={handleUndoResult} disabled={isProcessing} className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 font-bold text-slate-900 disabled:opacity-50"><Undo2 size={13} /> ย้อนผล</button>}
        </div>
      )}
    </section>
  );
}

function FollowCard() {
  const { followPlayerId, followStatus, presentPlayers, players, setFollowPlayerId } = useApp();
  const options = presentPlayers.length ? presentPlayers : players;
  const status = !followStatus ? null
    : followStatus.state === 'playing' ? { text: 'กำลังเล่นอยู่บนสนาม', tone: 'text-emerald-600' }
      : followStatus.state === 'next' ? { text: 'คิวถัดไป เตรียมตัว!', tone: 'text-amber-600' }
        : followStatus.state === 'waiting' ? { text: `คิวที่ ${followStatus.position} · รออีกประมาณ ${followStatus.position - 1} เกม`, tone: 'text-indigo-600' }
          : { text: 'ยังไม่ได้อยู่ในคิว', tone: 'text-gray-500' };
  return (
    <section className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${followPlayerId ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>{followPlayerId ? <BellRing size={18} /> : <Bell size={18} />}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-gray-800">แจ้งเตือนเมื่อใกล้ถึงคิว</div>
        {status ? <div className={`truncate text-[11px] font-semibold ${status.tone}`}>{status.text}</div> : <div className="text-[11px] text-gray-500">เลือกชื่อคุณ แล้วเครื่องจะสั่นและมีเสียงเมื่อถึงคิว</div>}
      </div>
      <select value={followPlayerId} onChange={event => setFollowPlayerId(event.target.value)} className="max-w-[45%] rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold">
        <option value="">ไม่แจ้งเตือน</option>
        {options.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
      </select>
    </section>
  );
}

function PairBuilder() {
  const {
    availablePlayers, court, draftPair, filteredAvailablePlayers, gamesToday, getPlayerName, handleCreatePair,
    handleDraftSelect, handleRandomOpponent, handleRandomPair, isProcessing, queue, searchDraftQuery, setDraftPair,
    setSearchDraftQuery,
  } = useApp();
  const sorted = [...filteredAvailablePlayers].sort((a, b) => gamesToday(a) - gamesToday(b) || a.name.localeCompare(b.name, 'th'));
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-gray-800">จับคู่เข้าคิว</h2>
        <div className="flex gap-1.5">
          <button type="button" onClick={handleRandomPair} disabled={isProcessing || availablePlayers.length < 2} title="สุ่มจากคนที่ได้เล่นน้อยที่สุดก่อน" className="flex items-center gap-1 rounded-xl bg-purple-50 px-2.5 py-1.5 text-[11px] font-bold text-purple-700 disabled:opacity-40"><Shuffle size={13} /> สุ่มคู่</button>
          <button type="button" onClick={handleRandomOpponent} disabled={isProcessing || queue.length < 2 || Boolean(court.teamA || court.teamB)} title="สุ่ม 2 คู่จากคิวลงสนาม" className="flex items-center gap-1 rounded-xl bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-700 disabled:opacity-40"><Swords size={13} /> สุ่มคู่แข่ง</button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {[0, 1].map(index => (
          <button key={index} type="button" onClick={() => setDraftPair(draftPair.map((id, slot) => (slot === index ? null : id)))} className={`h-12 truncate rounded-2xl border-2 px-2 text-sm font-semibold ${draftPair[index] ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-dashed border-gray-200 bg-gray-50 text-gray-400'}`}>
            {draftPair[index] ? getPlayerName(draftPair[index]) : `คนที่ ${index + 1}`}
          </button>
        ))}
      </div>

      <label className="relative mb-3 block">
        <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        <input value={searchDraftQuery} onChange={event => setSearchDraftQuery(event.target.value)} placeholder="ค้นหาชื่อ..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none" />
      </label>

      <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400"><span>คนว่าง {sorted.length} คน · เรียงจากเล่นน้อยไปมาก</span><span>ตัวเลข = เกมวันนี้</span></div>
      <div className="mb-4 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto p-0.5">
        {sorted.length === 0 ? (
          <div className="w-full rounded-xl bg-gray-50 py-3 text-center text-xs text-gray-400">{searchDraftQuery ? 'ไม่พบชื่อที่ค้นหา' : 'ไม่มีผู้เล่นว่าง (เช็คชื่อที่แท็บรายชื่อก่อน)'}</div>
        ) : sorted.map(player => {
          const selected = draftPair.includes(player.id);
          return (
            <button key={player.id} type="button" onClick={() => handleDraftSelect(player.id)} className={`flex items-center gap-1.5 rounded-xl py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition ${selected ? 'bg-purple-600 text-white shadow' : 'border border-gray-200 bg-white text-gray-700 hover:bg-purple-50'}`}>
              {player.name}
              <span className={`min-w-5 rounded-md px-1 text-center text-[10px] font-bold ${selected ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{gamesToday(player)}</span>
            </button>
          );
        })}
      </div>

      <button onClick={handleCreatePair} disabled={draftPair.includes(null) || isProcessing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-purple-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none">
        <Plus size={17} /> เพิ่มเข้าคิว
      </button>
    </section>
  );
}

function QueueList() {
  const {
    followPlayerId, handleDeleteAllQueueClick, handleDragEnd, handleDragEnter, handleDragOver, handleDragStart, handleDrop,
    handleMoveQueue, highlightedQueueId, isAdmin, isProcessing, queue, setQueueToDelete,
  } = useApp();
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[15px] font-bold text-gray-800">คิวรอ</h3>
        <span className="text-[11px] font-medium text-gray-500">{queue.length} คู่</span>
      </div>
      {queue.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white py-8 text-center text-[13px] text-gray-400 shadow-sm">ยังไม่มีคิว</div>
      ) : (
        <div className="space-y-2">
          {queue.map((item, index) => {
            const mine = followPlayerId && item.pair?.some(player => player.id === followPlayerId);
            return (
              <div
                key={item.id}
                draggable={isAdmin}
                onDragStart={event => handleDragStart(event, index)}
                onDragEnter={event => handleDragEnter(event, index)}
                onDragOver={event => handleDragOver(event, index)}
                onDrop={event => handleDrop(event, index)}
                onDragEnd={handleDragEnd}
                className={`queue-item flex items-center gap-3 rounded-2xl border p-3 transition-all ${item.id === highlightedQueueId ? 'queue-highlight ' : ''}${item.isMoved ? 'border-fuchsia-300 bg-fuchsia-50' : mine ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-white shadow-sm'}`}
              >
                {isAdmin && <div className="drag-handle hidden text-gray-300 sm:block"><GripVertical size={16} /></div>}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[13px] font-black ${index === 0 ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700'}`}>{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-800">{names(item.pair).join(' & ')}</div>
                  {index === 0 && <div className="text-[10px] font-bold text-purple-600">ลงสนามคู่ถัดไป</div>}
                  {item.isMoved && index !== 0 && <div className="text-[10px] font-bold text-fuchsia-600">{item.moveDirection === 'up' ? 'ถูกเลื่อนขึ้น' : 'ถูกเลื่อนลง'}</div>}
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 items-center">
                    <button onClick={() => handleMoveQueue(index, 'up')} disabled={index === 0 || isProcessing} aria-label="เลื่อนขึ้น" className="p-1.5 text-gray-400 hover:text-purple-600 disabled:opacity-25"><ArrowUp size={15} /></button>
                    <button onClick={() => handleMoveQueue(index, 'down')} disabled={index === queue.length - 1 || isProcessing} aria-label="เลื่อนลง" className="p-1.5 text-gray-400 hover:text-purple-600 disabled:opacity-25"><ArrowDown size={15} /></button>
                    <button onClick={() => setQueueToDelete(item.id)} disabled={isProcessing} aria-label="ลบคู่นี้" className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {isAdmin && queue.length > 0 && (
        <button onClick={handleDeleteAllQueueClick} disabled={isProcessing} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
          <Trash2 size={14} /> ลบคิวทั้งหมด
        </button>
      )}
    </section>
  );
}

function TodayMatches() {
  const { todayMatches } = useApp();
  const [open, setOpen] = useState(false);
  if (!todayMatches.length) return null;
  const shown = open ? todayMatches : todayMatches.slice(0, 3);
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-gray-800"><History size={16} className="text-purple-500" /> ผลการแข่งวันนี้</h3>
        <span className="text-[11px] text-gray-500">{todayMatches.length} เกม</span>
      </div>
      <div className="divide-y divide-gray-50">
        {shown.map(match => (
          <div key={match.id} className="flex items-center gap-2 py-2 text-xs">
            <span className="w-11 shrink-0 text-gray-400">{new Date(match.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className={`min-w-0 flex-1 truncate ${match.winner === 'A' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{match.winner === 'A' && '🏆 '}{names(match.teamA).join(' & ')}</span>
            <span className="text-[10px] text-gray-300">vs</span>
            <span className={`min-w-0 flex-1 truncate text-right ${match.winner === 'B' ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{names(match.teamB).join(' & ')}{match.winner === 'B' && ' 🏆'}</span>
          </div>
        ))}
      </div>
      {todayMatches.length > 3 && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-1 flex w-full items-center justify-center gap-1 pt-1 text-[11px] font-bold text-purple-600">
          {open ? 'ย่อ' : `ดูทั้งหมด ${todayMatches.length} เกม`} <ChevronDown size={13} className={open ? 'rotate-180' : ''} />
        </button>
      )}
    </section>
  );
}

export default function QueueTab() {
  return (
    <div className="space-y-4 p-4">
      <CourtCard />
      <FollowCard />
      <PairBuilder />
      <QueueList />
      <TodayMatches />
    </div>
  );
}
