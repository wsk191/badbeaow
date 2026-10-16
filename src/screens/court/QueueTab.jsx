import { ArrowDown, ArrowUp, GripVertical, Plus, Search, Swords, Trash2, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function QueueTab() {
  const {
    availablePlayers, court, draftPair, filteredAvailablePlayers, getPlayerName,
    handleClearCourt, handleCreatePair, handleDeleteAllQueueClick, handleDraftSelect,
    handleDragEnd, handleDragEnter, handleDragOver, handleDragStart, handleDrop,
    handleMoveQueue, handleRandomOpponent, handleRandomPair, handleStartGame, handleWin,
    highlightedQueueId, isProcessing, isResultLocked, queue, resultLockTotalSeconds,
    searchDraftQuery, selectedCourt, setDraftPair, setQueueToDelete, setSearchDraftQuery,
  } = useApp();

  return (
    <div className="p-4 space-y-6">

      {/* Active Court Widget */}
      <div className={`bg-gradient-to-br ${selectedCourt.accent} rounded-3xl p-5 shadow-xl relative overflow-hidden text-white`}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Swords size={20} className="text-purple-300" /> สนามกำลังแข่ง
          </h2>
          <span className="bg-purple-900/50 text-[10px] font-semibold px-3 py-1 rounded-full text-purple-200 border border-purple-500/30">
            WINNER STAYS ON
          </span>
        </div>

        {!court.teamA && !court.teamB ? (
          <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/10">
            <div className="text-purple-300 mb-3 text-sm">สนามว่าง รอผู้เล่น</div>
            {queue.length >= 2 ? (
              <button onClick={handleStartGame} disabled={isProcessing} className="bg-white text-purple-800 px-6 py-2.5 rounded-full font-bold shadow-lg text-sm disabled:opacity-50">
                ดึงคิวที่ 1 & 2 ลงสนาม
              </button>
            ) : (
              <span className="text-xs text-white/50">จัดคิวให้ครบ 2 คู่เพื่อเริ่มเกม</span>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/20 rounded-2xl p-4 border border-white/10">
              <div className="w-[42%] text-center">
                <div className="text-[10px] text-purple-300 font-medium mb-1">ทีม A</div>
                <div className="font-semibold text-sm">{court.teamA ? court.teamA.map(p => p.name).join(' & ') : 'ว่าง'}</div>
              </div>
              <div className="text-sm font-black text-purple-300/50 italic">VS</div>
              <div className="w-[42%] text-center">
                <div className="text-[10px] text-purple-300 font-medium mb-1">ทีม B</div>
                <div className="font-semibold text-sm">{court.teamB ? court.teamB.map(p => p.name).join(' & ') : 'ว่าง'}</div>
              </div>
            </div>

            {court.teamA && court.teamB && (
              <div className="space-y-2">
                {isResultLocked && (
                  <div className="rounded-xl bg-red-500/20 border border-red-300/30 px-3 py-2 text-center text-xs font-semibold text-red-100">
                    ปุ่มบันทึกผลถูกล็อกอีก {Math.ceil(resultLockTotalSeconds / 60)} นาที เนื่องจากกดซ้ำเร็วเกินไป
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => handleWin('A')} disabled={isProcessing || isResultLocked} className="flex-1 bg-purple-500 hover:bg-purple-400 py-3 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50">
                    <Trophy size={16} className="inline mr-1"/> ทีม A ชนะ
                  </button>
                  <button onClick={() => handleWin('B')} disabled={isProcessing || isResultLocked} className="flex-1 bg-indigo-500 hover:bg-indigo-400 py-3 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50">
                    <Trophy size={16} className="inline mr-1"/> ทีม B ชนะ
                  </button>
                </div>
              </div>
            )}
            <div className="text-center pt-1">
              <button onClick={handleClearCourt} disabled={isProcessing} className="text-[11px] text-white/50 hover:text-white transition-colors">
                เคลียร์สนาม (ส่งผู้เล่นกลับคิวรอ)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* จับคู่เตรียมลงสนาม */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-gray-800">จับคู่เตรียมลงสนาม</h2>
            <span className="mt-1 inline-block text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {draftPair.filter(s => s !== null).length}/2 คน
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={handleRandomPair} disabled={isProcessing || availablePlayers.length < 2} className="rounded-xl bg-purple-600 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40" title="สุ่มผู้เล่น 2 คนเป็นคู่">
              สุ่มจับคู่
            </button>
            <button type="button" onClick={handleRandomOpponent} disabled={isProcessing || queue.length < 2 || Boolean(court.teamA || court.teamB)} className="rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40" title="สุ่ม 2 คู่จากคิวมาเจอกัน">
              สุ่มคู่แข่งในคิว
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          {[0, 1].map(idx => (
            <div
              key={idx}
              onClick={() => {
                const newDraft = [...draftPair];
                newDraft[idx] = null;
                setDraftPair(newDraft);
              }}
              className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center text-sm font-semibold cursor-pointer ${
                draftPair[idx] ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'
              }`}
            >
              {draftPair[idx] ? getPlayerName(draftPair[idx]) : '+ เลือกชื่อ'}
            </div>
          ))}
        </div>

        <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchDraftQuery}
              onChange={(e) => setSearchDraftQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้เล่น..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
        </div>

        <div className="flex flex-wrap gap-2 mb-5 max-h-40 overflow-y-auto p-1">
          {filteredAvailablePlayers.length === 0 ? (
            <div className="text-xs text-gray-400 py-3 w-full text-center bg-gray-50 rounded-xl">
                {searchDraftQuery ? 'ไม่พบชื่อที่ค้นหา' : 'ไม่มีผู้เล่นว่าง (กรุณาเช็คชื่อในแถบผู้เล่นก่อน)'}
            </div>
          ) : (
            filteredAvailablePlayers.map(player => (
              <button
                key={player.id}
                onClick={() => handleDraftSelect(player.id)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  draftPair.includes(player.id) ? 'bg-purple-600 text-white shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
                }`}
              >
                {player.name}
              </button>
            ))
          )}
        </div>

        <button
          onClick={handleCreatePair}
          disabled={draftPair.includes(null) || isProcessing}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            !draftPair.includes(null) ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus size={18} /> เพิ่มเข้าคิวรอ
        </button>
      </div>

      {/* รายการคิว */}
      <div>
        <h3 className="text-[15px] font-bold text-gray-800 mb-3 flex items-center justify-between">
          คิวรอสนาม <span className="text-[11px] font-medium text-gray-500">{queue.length} คู่</span>
        </h3>
        {queue.length === 0 ? (
          <div className="text-center py-8 bg-white border border-gray-100 rounded-3xl text-gray-400 text-[13px] shadow-sm">ยังไม่มีคิวรอ</div>
        ) : (
          <div className="space-y-3">
            {queue.map((q, idx) => (
              <div
                key={q.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all queue-item ${q.id === highlightedQueueId ? 'queue-highlight ' : ''} ${q.isMoved ? 'bg-fuchsia-50 border-fuchsia-400' : 'bg-white border-gray-100 shadow-sm'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-300 drag-handle"><GripVertical size={18} /></div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold ${q.isMoved ? 'bg-fuchsia-200 text-fuchsia-800' : 'bg-purple-50 text-purple-700'}`}>{idx + 1}</div>
                  <div>
                    <div className="font-semibold text-gray-700 text-sm">{q.pair ? q.pair.map(p => p.name).join(' & ') : ''}</div>
                    {q.isMoved && <div className="text-[10px] text-fuchsia-600 font-bold mt-0.5">{q.moveDirection === 'up' ? '🔼 เลื่อนขึ้น' : '🔽 เลื่อนลง'}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex flex-col gap-1 mr-2">
                    <button onClick={() => handleMoveQueue(idx, 'up')} disabled={idx === 0 || isProcessing} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button onClick={() => handleMoveQueue(idx, 'down')} disabled={idx === queue.length - 1 || isProcessing} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                  </div>
                  <button onClick={() => setQueueToDelete(q.id)} disabled={isProcessing} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleDeleteAllQueueClick}
          disabled={isProcessing || queue.length === 0}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} /> ลบคู่ในคิวทั้งหมด
        </button>
      </div>
    </div>
  );
}
