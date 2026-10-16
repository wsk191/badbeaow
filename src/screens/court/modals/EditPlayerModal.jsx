import { useApp } from '../../../context/AppContext';

export default function EditPlayerModal() {
  const {
    confirmEditPlayer, editPlayerName, isProcessing, setEditPlayerName, setPlayerToEdit,
  } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg md:max-w-xl shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">แก้ไขชื่อผู้เล่น</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={editPlayerName}
            onChange={(e) => setEditPlayerName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-3">
            <button onClick={() => setPlayerToEdit(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600">ยกเลิก</button>
            <button onClick={confirmEditPlayer} disabled={isProcessing || !editPlayerName.trim()} className="flex-1 py-3 rounded-xl font-semibold bg-blue-500 text-white">บันทึกชื่อ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
