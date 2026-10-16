import { Check, Clock, Eye, History, Receipt, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function FinanceModal() {
  const {
    financeModalTab, historyFilter, historyRequests, isProcessing, paymentReviewAmounts,
    pendingRequests, setFinanceModalTab, setHistoryFilter, setPaymentReviewAmounts,
    setPreviewSlipImage, setShowFinanceModal, updatePaymentRequest,
  } = useApp();

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="text-amber-400" size={20} />
            <h3 className="font-bold text-base">ศูนย์จัดการการเงิน & ตรวจสลิป</h3>
          </div>
          <button onClick={() => setShowFinanceModal(false)} className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={() => setFinanceModalTab('slips')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${financeModalTab === 'slips' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
          >
            <Receipt size={15} />
            <span>รอตรวจสอบสลิป</span>
            {pendingRequests.length > 0 && (
              <span className="bg-orange-600 text-white text-[10px] px-2 py-0.2 rounded-full font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFinanceModalTab('history')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${financeModalTab === 'history' ? 'border-purple-600 text-purple-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
          >
            <History size={15} />
            <span>ประวัติการจ่ายเงิน</span>
            <span className="text-gray-400 font-normal">({historyRequests.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {financeModalTab === 'slips' && (
            <div>
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Check size={28} />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">ไม่มีสลิปที่รอตรวจสอบ</p>
                  <p className="text-xs text-gray-400 mt-1">เมื่อมีผู้เล่นแนบสลิป จะมาแสดงที่นี่ทันที</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm text-gray-800 block">{request.playerName}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {new Date(request.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          รอตรวจสลิป
                        </span>
                      </div>

                      {request.slipImage && (
                        <div className="relative group cursor-pointer" onClick={() => setPreviewSlipImage(request.slipImage)}>
                          <img
                            src={request.slipImage}
                            alt={`สลิปของ ${request.playerName}`}
                            className="max-h-52 w-full rounded-xl border object-contain bg-gray-50 group-hover:opacity-90 transition-opacity"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                            <Eye size={12} /> กดเพื่อขยาย
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-gray-700">ระบุยอดที่ได้รับจริง (บาท):</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={paymentReviewAmounts[request.id] ?? ''}
                          onChange={event => setPaymentReviewAmounts(previous => ({ ...previous, [request.id]: event.target.value }))}
                          placeholder="เช่น 50"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePaymentRequest(request, 'confirmed')}
                          disabled={isProcessing}
                          className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <Check size={15} /> ยืนยันได้รับเงิน
                        </button>
                        <button
                          onClick={() => updatePaymentRequest(request, 'rejected')}
                          disabled={isProcessing}
                          className="rounded-xl bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-600 disabled:opacity-50"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {financeModalTab === 'history' && (
            <div className="space-y-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                <button onClick={() => setHistoryFilter('all')} className={`flex-1 py-1.5 rounded-lg ${historyFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>ทั้งหมด</button>
                <button onClick={() => setHistoryFilter('confirmed')} className={`flex-1 py-1.5 rounded-lg ${historyFilter === 'confirmed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500'}`}>สำเร็จ</button>
                <button onClick={() => setHistoryFilter('rejected')} className={`flex-1 py-1.5 rounded-lg ${historyFilter === 'rejected' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500'}`}>ปฏิเสธ</button>
              </div>

              {historyRequests.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-xs">
                  ยังไม่มีประวัติการทำรายการ
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyRequests.map(req => {
                    const isSuccess = req.status === 'confirmed';
                    return (
                      <div key={req.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {req.slipImage ? (
                            <img
                              src={req.slipImage}
                              alt="สลิป"
                              onClick={() => setPreviewSlipImage(req.slipImage)}
                              className="w-12 h-12 rounded-xl object-cover cursor-pointer border hover:opacity-80 transition-opacity shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                          <div>
                            <div className="font-bold text-xs text-gray-800">{req.playerName}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {req.reviewedAt ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(req.reviewedAt)) : '-'}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">ผู้ตรวจ: {req.reviewedBy || 'Admin'}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {isSuccess ? (
                            <>
                              <span className="block font-black text-sm text-emerald-600">+{Number(req.receivedAmount || 0).toFixed(2)} ฿</span>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">ยืนยันแล้ว</span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-md">ปฏิเสธ</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
