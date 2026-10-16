import { AlertTriangle, Edit2, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PlayersTab() {
  const {
    courtSettings, filteredPlayersList, gamesToday, handleAddIndividualFee, handleAddPlayer,
    handleDeleteAllPlayersClick, handleDeletePlayerClick, handleEditPlayerClick, isAdmin,
    isProcessing, newPlayerName, players, presentPlayers, searchPlayerQuery, setNewPlayerName,
    setSearchPlayerQuery, togglePresence,
  } = useApp();
  const sortedPlayers = [...filteredPlayersList].sort((a, b) => Number(b.isPresent) - Number(a.isPresent) || a.name.localeCompare(b.name, 'th'));

  return (
    <div className="space-y-4 p-4">
      <form onSubmit={handleAddPlayer} className="flex gap-2 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="relative flex-1">
          <UserPlus size={16} className="absolute left-3 top-3.5 text-purple-400" />
          <input value={newPlayerName} onChange={event => setNewPlayerName(event.target.value)} placeholder="เพิ่มผู้เล่นใหม่..." disabled={isProcessing} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none" />
        </div>
        <button type="submit" disabled={isProcessing || !newPlayerName.trim()} className="rounded-xl bg-purple-600 px-5 text-sm font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50">เพิ่ม</button>
      </form>

      <section className="flex h-[62vh] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-3 border-b border-gray-50 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">รายชื่อ</h2>
              <p className="mt-0.5 text-[11px] text-gray-500">เปิดสวิตช์ = มาตีวันนี้</p>
            </div>
            <div className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-600">มา {presentPlayers.length}/{players.length} คน</div>
          </div>
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input value={searchPlayerQuery} onChange={event => setSearchPlayerQuery(event.target.value)} placeholder="ค้นหาชื่อ..." className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none" />
          </label>
        </div>

        <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
          {sortedPlayers.map(player => (
            <div key={player.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-semibold ${player.isPresent ? 'text-gray-800' : 'text-gray-400'}`}>{player.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500">
                  <span>ชนะ {player.wins || 0} · แพ้ {player.losses || 0}</span>
                  {player.isPresent && <span className="text-purple-600">วันนี้ {gamesToday(player)} เกม</span>}
                  {player.debt > 0 && <span className="font-bold text-red-500">ค้าง {Number(player.debt).toFixed(2)}฿</span>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  {courtSettings.feePerPerson > 0 && <button onClick={() => handleAddIndividualFee(player.id)} disabled={isProcessing} title={`บวกค่าบำรุง ${courtSettings.feePerPerson} บาท`} className="flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-100"><Plus size={11} />{courtSettings.feePerPerson}฿</button>}
                  <button onClick={() => handleEditPlayerClick(player)} disabled={isProcessing} aria-label="แก้ไขชื่อ" className="rounded-lg bg-blue-50 p-1.5 text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeletePlayerClick(player)} disabled={isProcessing} aria-label="ลบผู้เล่น" className="rounded-lg bg-red-50 p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              )}
              <button onClick={() => togglePresence(player.id, player.isPresent)} disabled={isProcessing} aria-label={player.isPresent ? 'ยกเลิกเช็คชื่อ' : 'เช็คชื่อ'} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${player.isPresent ? 'bg-purple-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${player.isPresent ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
          {sortedPlayers.length === 0 && <div className="p-8 text-center text-sm text-gray-400">{searchPlayerQuery ? 'ไม่พบชื่อที่ค้นหา' : 'ยังไม่มีผู้เล่น'}</div>}
        </div>
      </section>

      {isAdmin && (
        <button onClick={handleDeleteAllPlayersClick} disabled={isProcessing || players.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50">
          <AlertTriangle size={15} /> ล้างข้อมูลผู้เล่นทั้งหมด (รีเซ็ตระบบ)
        </button>
      )}
    </div>
  );
}
