import { ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AdminsTab() {
  const {
    adminUidInput, handleAddCourtAdmin, handleRemoveCourtAdmin, isProcessing, managedAdminIds,
    selectedCourt, setAdminUidInput,
  } = useApp();

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={21} />
          <h2 className="text-lg font-bold">SuperAdmin</h2>
        </div>
        <p className="text-xs text-white/70">จัดการผู้ดูแลของ {selectedCourt.name}</p>
      </div>

      <form onSubmit={handleAddCourtAdmin} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">เพิ่ม Admin ให้คอร์ดนี้</h3>
          <p className="text-[11px] text-gray-500 mt-1">ใส่ Firebase Auth UID ของผู้ดูแล</p>
        </div>
        <input
          value={adminUidInput}
          onChange={(e) => setAdminUidInput(e.target.value)}
          placeholder="เช่น abc123..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
        />
        <button type="submit" disabled={isProcessing || !adminUidInput.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50">
          เพิ่มสิทธิ์ Admin
        </button>
      </form>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-800 mb-3">Admin ของ {selectedCourt.name}</h3>
        {Object.keys(managedAdminIds).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มี Admin ประจำคอร์ดนี้</p>
        ) : (
          <div className="space-y-2">
            {Object.keys(managedAdminIds).map((adminUid) => (
              <div key={adminUid} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-xs text-gray-600 break-all">{adminUid}</span>
                <button onClick={() => handleRemoveCourtAdmin(adminUid)} disabled={isProcessing} className="shrink-0 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50">
                  ถอดสิทธิ์
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
