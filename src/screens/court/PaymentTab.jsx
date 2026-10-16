import { useEffect, useState } from 'react';
import { Coins, History, Plus, QrCode, Receipt, Settings2, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

function PriceSettings() {
  const { courtSettings, saveCourtSettings } = useApp();
  const [draft, setDraft] = useState(courtSettings);
  useEffect(() => { setDraft(courtSettings); }, [courtSettings]);
  const changed = Number(draft.feePerPerson) !== courtSettings.feePerPerson || Number(draft.shuttlePrice) !== courtSettings.shuttlePrice;
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-gray-800"><Settings2 size={17} className="text-purple-500" /> ตั้งราคาสนามนี้</h2>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-semibold text-gray-500">ค่าบำรุงต่อคน (บาท)
          <input type="number" min="0" inputMode="decimal" value={draft.feePerPerson} onChange={event => setDraft(current => ({ ...current, feePerPerson: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-800 focus:border-purple-500 focus:outline-none" />
        </label>
        <label className="text-[11px] font-semibold text-gray-500">ราคาลูกขนไก่ต่อลูก (บาท)
          <input type="number" min="0" inputMode="decimal" value={draft.shuttlePrice} onChange={event => setDraft(current => ({ ...current, shuttlePrice: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-800 focus:border-purple-500 focus:outline-none" />
        </label>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-gray-500">ใส่ราคาลูกแล้ว ตอนแอดมินกดผลจะเลือกจำนวนลูกที่ใช้ได้ ระบบหารให้ 4 คนที่ลงเล่นอัตโนมัติ (ใส่ 0 = ไม่คิดค่าลูก)</p>
      {changed && <button type="button" onClick={() => saveCourtSettings(draft)} className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white">บันทึกราคา</button>}
    </section>
  );
}

function CollectMoney() {
  const { courtSettings, handleAddFixedFee, handleSplitBill, isProcessing, presentPlayers, setTotalCourtBill, totalCourtBill } = useApp();
  const perPerson = (parseFloat(totalCourtBill) || 0) / (presentPlayers.length || 1);
  return (
    <section className="space-y-3 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-lg">
      <h2 className="flex items-center gap-2 text-[15px] font-bold"><Coins size={18} /> เก็บเงินวันนี้ <span className="text-[11px] font-normal text-white/75">({presentPlayers.length} คนที่เช็คชื่อ)</span></h2>
      <button onClick={handleAddFixedFee} disabled={isProcessing || presentPlayers.length === 0 || !courtSettings.feePerPerson} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-emerald-700 shadow disabled:opacity-60">
        <Plus size={17} /> เก็บค่าบำรุงคนละ {courtSettings.feePerPerson} บาท
      </button>
      <div className="flex gap-2">
        <input type="number" min="0" inputMode="decimal" value={totalCourtBill} onChange={event => setTotalCourtBill(event.target.value)} placeholder="ยอดค่าคอร์ตรวม (บาท)" className="min-w-0 flex-1 rounded-xl border-0 bg-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/60 focus:bg-white/25 focus:outline-none" />
        <button onClick={handleSplitBill} disabled={isProcessing || !totalCourtBill || !presentPlayers.length} className="shrink-0 rounded-xl bg-slate-900/80 px-3 text-xs font-bold disabled:opacity-50">หารคนละ {perPerson.toFixed(2)}฿</button>
      </div>
    </section>
  );
}

function QrSettings() {
  const { handleQrUpload, paymentQrCode, qrUploading, removeQrCode } = useApp();
  return (
    <section className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      {paymentQrCode
        ? <img src={paymentQrCode} alt="QR พร้อมเพย์" className="h-14 w-14 shrink-0 rounded-xl border bg-white object-contain" />
        : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300"><QrCode size={24} /></div>}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-gray-800">QR พร้อมเพย์</div>
        <div className="text-[11px] text-gray-500">{paymentQrCode ? 'ผู้เล่นเห็น QR นี้ตอนกดจ่ายเงิน' : 'ยังไม่มี QR ผู้เล่นจะโอนผ่านเว็บไม่ได้'}</div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <label className={`cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-center text-[11px] font-bold text-white ${qrUploading ? 'pointer-events-none opacity-60' : ''}`}>
          {qrUploading ? 'กำลังอัปโหลด' : paymentQrCode ? 'เปลี่ยน' : 'เพิ่ม QR'}
          <input type="file" accept="image/*" onChange={handleQrUpload} disabled={qrUploading} className="sr-only" />
        </label>
        {paymentQrCode && <button onClick={removeQrCode} disabled={qrUploading} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600">ลบ</button>}
      </div>
    </section>
  );
}

export default function PaymentTab() {
  const {
    handleClearAllDebt, handlePayDebt, isAdmin, isProcessing, paymentInputs, paymentQrCode, pendingRequests, players,
    setFinanceModalTab, setPaymentInputs, setPaymentPlayerId, setShowFinanceModal, setShowLoginModal, setShowPaymentForm,
  } = useApp();
  const debtors = players.filter(player => player.debt > 0).sort((a, b) => b.debt - a.debt);
  const totalDebt = debtors.reduce((sum, player) => sum + Number(player.debt), 0);
  const openFinance = tab => { setShowFinanceModal(true); setFinanceModalTab(tab); };

  return (
    <div className="space-y-4 p-4">
      {isAdmin ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => openFinance('slips')} className={`relative flex items-center justify-center gap-2 rounded-2xl p-3.5 text-xs font-bold shadow-sm transition ${pendingRequests.length ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}>
              <Receipt size={17} /> ตรวจสลิปแจ้งโอน
              {pendingRequests.length > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">{pendingRequests.length}</span>}
            </button>
            <button onClick={() => openFinance('history')} className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white p-3.5 text-xs font-bold text-gray-700 shadow-sm">
              <History size={17} className="text-purple-600" /> ประวัติการเงิน
            </button>
          </div>
          <CollectMoney />
          <PriceSettings />
          <QrSettings />
        </>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <div className="text-xs font-bold text-amber-800">ดูยอดค้างได้ · กดปุ่มจ่ายเงินเพื่อโอนผ่าน QR</div>
            <div className="text-[11px] text-amber-600">เครื่องมือคิดเงินใช้ได้เฉพาะแอดมิน</div>
          </div>
          <button onClick={() => setShowLoginModal(true)} className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white">ล็อกอินแอดมิน</button>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/60 p-4">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-gray-800"><ShieldCheck size={17} className="text-purple-500" /> ยอดค้างจ่าย</h2>
            <p className="mt-0.5 text-[11px] text-gray-500">{debtors.length ? `${debtors.length} คน รวม ${totalDebt.toFixed(2)} บาท` : 'ไม่มีใครค้าง'}</p>
          </div>
          {isAdmin && debtors.length > 0 && <button onClick={handleClearAllDebt} disabled={isProcessing} className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 disabled:opacity-50">เคลียร์ทั้งหมด</button>}
        </div>
        <div className="divide-y divide-gray-50">
          {debtors.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">ไม่มีคนค้างจ่ายเลย ยอดเยี่ยม! 🎉</div>
          ) : debtors.map(player => (
            <div key={player.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-semibold text-gray-800">{player.name}</div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-sm font-bold text-red-500">{Number(player.debt).toFixed(2)} ฿</div>
                  {!isAdmin && <button onClick={() => { setPaymentPlayerId(player.id); setShowPaymentForm(true); }} disabled={!paymentQrCode} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm disabled:bg-gray-300">จ่ายเงิน</button>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <input type="number" min="0" inputMode="decimal" value={paymentInputs[player.id] || ''} onChange={event => setPaymentInputs({ ...paymentInputs, [player.id]: event.target.value })} placeholder="รับเงินสด (บาท)" className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none" />
                  <button type="button" onClick={() => setPaymentInputs({ ...paymentInputs, [player.id]: String(Number(player.debt)) })} className="shrink-0 rounded-xl bg-gray-100 px-3 text-[11px] font-bold text-gray-600">เต็มจำนวน</button>
                  <button onClick={() => handlePayDebt(player.id)} disabled={isProcessing || !paymentInputs[player.id]} className="shrink-0 rounded-xl bg-purple-600 px-4 text-sm font-bold text-white disabled:opacity-50">รับเงิน</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
