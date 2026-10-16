import { useApp } from '../../../context/AppContext';

export default function DeletePlayerModal() {
  const {
    confirmDeletePlayer, isProcessing, setPlayerToDelete,
  } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg md:max-w-xl shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">ลบผู้เล่นนี้ออก?</h3>
        <p className="text-sm text-gray-500 mb-6">รายชื่อนี้จะหายไปจากระบบถาวร</p>
        <div className="flex gap-3">
          <button onClick={() => setPlayerToDelete(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600">ยกเลิก</button>
          <button onClick={confirmDeletePlayer} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white">ลบผู้เล่น</button>
        </div>
      </div>
    </div>
  );
}
