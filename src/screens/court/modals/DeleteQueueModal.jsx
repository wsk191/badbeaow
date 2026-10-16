import { useApp } from '../../../context/AppContext';

export default function DeleteQueueModal() {
  const {
    confirmDeleteQueue, isProcessing, setQueueToDelete,
  } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg md:max-w-xl shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">ลบคิวนี้ใช่หรือไม่?</h3>
        <p className="text-sm text-gray-500 mb-6">รายชื่อคู่นี้จะถูกนำออกจากคิวรอ</p>
        <div className="flex gap-3">
          <button onClick={() => setQueueToDelete(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600">ยกเลิก</button>
          <button onClick={confirmDeleteQueue} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white shadow-md">ลบคิว</button>
        </div>
      </div>
    </div>
  );
}
