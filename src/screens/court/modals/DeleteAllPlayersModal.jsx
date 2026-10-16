import { AlertTriangle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function DeleteAllPlayersModal() {
  const {
    confirmDeleteAllPlayers, isProcessing, setShowDeleteAllPlayersModal,
  } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg md:max-w-xl shadow-2xl border-2 border-red-500">
        <div className="flex items-center gap-3 mb-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-black">อันตราย! ล้างระบบทั้งหมด?</h3>
        </div>
        <p className="text-xs text-gray-600 mb-6">จะลบรายชื่อผู้เล่นทุกคน คิวรอ และสถานะสนามปัจจุบัน</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteAllPlayersModal(false)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700">ยกเลิก</button>
          <button onClick={confirmDeleteAllPlayers} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-black bg-red-600 text-white">ล้างระบบ</button>
        </div>
      </div>
    </div>
  );
}
