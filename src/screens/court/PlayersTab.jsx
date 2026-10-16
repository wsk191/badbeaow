import { AlertTriangle, Edit2, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PlayersTab() {
  const {
    filteredPlayersList, getPowerLevel, handleAddIndividualFee, handleAddPlayer,
    handleDeleteAllPlayersClick, handleDeletePlayerClick, handleEditPlayerClick, isAdmin,
    isProcessing, newPlayerName, players, presentPlayers, searchPlayerQuery, setNewPlayerName,
    setSearchPlayerQuery, togglePresence,
  } = useApp();

  return (
    <div className="p-4 space-y-5">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-purple-500"/> เพิ่มผู้เล่นใหม่
        </h2>
        <form onSubmit={handleAddPlayer} className="flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="พิมพ์ชื่อเพื่อเพิ่ม..."
            disabled={isProcessing}
            className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
          />
          <button type="submit" disabled={isProcessing || !newPlayerName} className="bg-purple-600 text-white px-5 py-3.5 rounded-xl font-bold hover:bg-purple-700 shadow-md disabled:opacity-50">
            เพิ่ม
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[60vh]">
        <div className="p-4 border-b border-gray-50 flex flex-col gap-3 bg-gray-50/50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">รายชื่อทั้งหมด</h2>
              <p className="text-[11px] text-gray-500 mt-1">เช็คชื่อคนที่ <span className="font-semibold text-purple-600">มาตีวันนี้</span></p>
            </div>
            <div className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
              มา {presentPlayers.length} คน
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchPlayerQuery}
              onChange={(e) => setSearchPlayerQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้เล่น..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
          {filteredPlayersList.map((player) => (
            <div key={player.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50">
              <div className="flex flex-col items-start gap-1">
                <div className={`font-semibold text-sm ${player.isPresent ? 'text-gray-800' : 'text-gray-400'}`}>{player.name}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPowerLevel(player.wins).color}`}>
                  {getPowerLevel(player.wins).label} (ชนะ {player.wins || 0})
                </span>
                {player.debt > 0 && <div className="text-[11px] font-bold text-red-500">ค้างจ่าย: {player.debt.toFixed(2)} ฿</div>}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={() => handleAddIndividualFee(player.id, 10)} disabled={isProcessing} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Plus size={12} /> 10฿
                  </button>
                )}
                <button
                  onClick={() => togglePresence(player.id, player.isPresent)}
                  disabled={isProcessing}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${player.isPresent ? 'bg-purple-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${player.isPresent ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <div className="flex items-center gap-1 pl-1">
                  {isAdmin && (
                    <button onClick={() => handleEditPlayerClick(player)} disabled={isProcessing} className="text-blue-400 hover:text-blue-600 p-1.5 bg-blue-50 rounded-lg">
                      <Edit2 size={15} />
                    </button>
                  )}
                  <button onClick={() => handleDeletePlayerClick(player)} disabled={isProcessing} className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 rounded-lg">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isAdmin && (
        <button
          onClick={handleDeleteAllPlayersClick}
          disabled={isProcessing || players.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <AlertTriangle size={18} /> ล้างข้อมูลผู้เล่นทั้งหมด (รีเซ็ตระบบ)
        </button>
      )}
    </div>
  );
}
