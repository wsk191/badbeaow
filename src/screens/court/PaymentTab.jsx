import { Coins, History, Plus, QrCode, Receipt, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PaymentTab() {
  const {
    handleAddFixedFee, handleClearAllDebt, handlePayDebt, handleQrUpload, handleSplitBill,
    isAdmin, isProcessing, paymentInputs, paymentQrCode, pendingRequests, players,
    presentPlayers, qrUploading, removeQrCode, setFinanceModalTab, setPaymentInputs,
    setPaymentPlayerId, setShowFinanceModal, setShowLoginModal, setShowPaymentForm,
    setTotalCourtBill, totalCourtBill,
  } = useApp();

  return (
    <div className="p-4 space-y-5">
      {/* แถบเครื่องมือการเงินเฉพาะ Admin */}
      {isAdmin && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setShowFinanceModal(true); setFinanceModalTab('slips'); }}
              className="relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-3.5 rounded-2xl font-bold text-xs flex items-center justify-between shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <Receipt size={18} />
                <span>ตรวจสลิปแจ้งโอน</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="bg-white text-orange-600 font-black px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setShowFinanceModal(true); setFinanceModalTab('history'); }}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <History size={18} className="text-purple-600" />
              <span>ประวัติการเงิน</span>
            </button>
          </div>

          {/* กล่องแจ้งเตือนสลิปใหม่แบบกะทัดรัด ไม่ดันหน้าจอ */}
          {pendingRequests.length > 0 && (
            <div
              onClick={() => { setShowFinanceModal(true); setFinanceModalTab('slips'); }}
              className="cursor-pointer bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                มีสลิปโอนเงินรอตรวจสอบ ({pendingRequests.length} รายการ)
              </div>
              <span className="text-[11px] text-amber-700 font-semibold underline">ตรวจสอบ</span>
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-800">โหมดดูข้อมูล (ระบบเงินล็อกอยู่)</div>
            <div className="text-[11px] text-amber-600">เฉพาะแอดมินเท่านั้นที่ใช้เครื่องมือคิดเงินได้</div>
          </div>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
          >
            ล็อกอินแอดมิน
          </button>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-bold text-gray-800"><QrCode size={18} className="text-emerald-600" /> QR พร้อมเพย์สนามนี้</h2>
                <p className="mt-1 text-[11px] text-emerald-700">แอดมินสนามสามารถเพิ่มหรือเปลี่ยนรูปได้</p>
              </div>
              {paymentQrCode && <img src={paymentQrCode} alt="ตัวอย่าง QR" className="h-12 w-12 rounded-lg bg-white object-contain border" />}
            </div>
            <div className="flex gap-2 mt-4">
              <label className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 ${qrUploading ? 'pointer-events-none opacity-60' : ''}`}>
                <QrCode size={16} /> {qrUploading ? 'กำลังอัปโหลด...' : paymentQrCode ? 'เปลี่ยนรูป QR' : 'เพิ่มรูป QR'}
                <input type="file" accept="image/*" onChange={handleQrUpload} disabled={qrUploading} className="sr-only" />
              </label>
              {paymentQrCode && (
                <button onClick={removeQrCode} disabled={qrUploading} className="px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold">
                  ลบ QR
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-lg text-white text-center">
            <h2 className="text-base font-bold mb-1 flex items-center justify-center gap-2">
              <Coins size={20} /> ค่าบำรุงประจำวัน
            </h2>
            <p className="text-emerald-50 text-[12px] mb-5">บวกหนี้ <span className="font-bold text-white">10 บาท</span> ให้กับทุกคนที่เช็คชื่อมาตีวันนี้</p>
            <button onClick={handleAddFixedFee} disabled={isProcessing || presentPlayers.length === 0} className="w-full bg-white text-emerald-600 hover:bg-emerald-50 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-70">
              <Plus size={18} /> เก็บทุกคนคนละ 10 บาท
            </button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-purple-500"/> หารค่าคอร์ต
            </h2>
            <input
              type="number"
              value={totalCourtBill}
              onChange={(e) => setTotalCourtBill(e.target.value)}
              placeholder="ยอดบิลรวมทั้งหมด (บาท)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm mb-3 focus:outline-none focus:border-purple-500"
            />
            <button onClick={handleSplitBill} disabled={isProcessing || !totalCourtBill} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-70">
              หาร {presentPlayers.length} คน (ตกคนละ {((parseFloat(totalCourtBill) || 0) / (presentPlayers.length || 1)).toFixed(2)} ฿)
            </button>
          </div>
        </>
      )}

      {/* รายการค้างจ่าย */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
              <ShieldCheck size={18} className="text-purple-500"/> ยอดค้างจ่ายทั้งหมด
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">สรุปยอดเงินผู้เล่นปัจจุบัน</p>
          </div>
          {isAdmin && (
            <button onClick={handleClearAllDebt} disabled={isProcessing} className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
              เคลียร์หนี้ทั้งหมด
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {players.filter(p => p.debt > 0).length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">ไม่มีคนค้างจ่ายเลย ยอดเยี่ยม! 🎉</div>
          ) : (
            players.filter(p => p.debt > 0).map((player) => (
              <div key={player.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-sm text-gray-800">{player.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-lg">{player.debt.toFixed(2)} ฿</div>
                    {!isAdmin && (
                      <button onClick={() => { setPaymentPlayerId(player.id); setShowPaymentForm(true); }} disabled={!paymentQrCode} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-300">
                        จ่ายเงิน
                      </button>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={paymentInputs[player.id] || ''}
                      onChange={(e) => setPaymentInputs({ ...paymentInputs, [player.id]: e.target.value })}
                      placeholder="ยอดที่จ่าย..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button onClick={() => handlePayDebt(player.id)} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm disabled:opacity-50">
                      จ่าย
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
