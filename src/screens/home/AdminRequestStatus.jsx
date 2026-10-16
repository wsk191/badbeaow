import { useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COURTS } from '../../lib/appConfig';
import { submitAdminRequest } from '../../lib/adminRequests';

// สถานะคำขอแอดมินของบัญชีอีเมลที่ยังไม่มีสิทธิ์สนามไหน
export default function AdminRequestStatus() {
  const { myAdminRequest, showToast, user } = useApp();
  const [courtId, setCourtId] = useState('');
  const [busy, setBusy] = useState(false);
  const courtName = id => COURTS.find(court => court.id === id)?.name || id;

  if (myAdminRequest === undefined) return null;

  if (myAdminRequest === null) {
    const send = async () => {
      setBusy(true);
      try {
        await submitAdminRequest(user, courtId);
        showToast('ส่งคำขอแล้ว รอ SuperAdmin อนุมัติ', 'success');
      } catch {
        showToast('ส่งคำขอไม่สำเร็จ', 'error');
      }
      setBusy(false);
    };
    return (
      <div className="mt-5 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-gray-900"><ShieldCheck size={18} className="text-purple-600" /> บัญชีนี้ยังไม่ได้ขอสิทธิ์แอดมิน</div>
        <p className="mt-1 text-xs text-gray-500">{user.email} · เลือกได้ 1 สนามและเปลี่ยนภายหลังไม่ได้</p>
        <div className="mt-3 flex gap-2">
          <select value={courtId} onChange={event => setCourtId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
            <option value="">เลือกสนาม</option>
            {COURTS.map(court => <option key={court.id} value={court.id}>{court.name}</option>)}
          </select>
          <button type="button" onClick={send} disabled={!courtId || busy} className="rounded-xl bg-purple-600 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? 'กำลังส่ง...' : 'ส่งคำขอ'}</button>
        </div>
      </div>
    );
  }

  const styles = {
    pending: { icon: Clock, box: 'border-amber-200 bg-amber-50 text-amber-800', title: `คำขอเป็นแอดมิน ${courtName(myAdminRequest.courtId)} กำลังรออนุมัติ`, detail: 'เมื่อ SuperAdmin อนุมัติ จะใช้งานได้ทันทีโดยไม่ต้องล็อกอินใหม่' },
    rejected: { icon: XCircle, box: 'border-red-200 bg-red-50 text-red-700', title: `คำขอเป็นแอดมิน ${courtName(myAdminRequest.courtId)} ไม่ได้รับอนุมัติ`, detail: 'หากคิดว่าผิดพลาด กรุณาติดต่อ SuperAdmin' },
    revoked: { icon: XCircle, box: 'border-slate-200 bg-slate-50 text-slate-700', title: `สิทธิ์แอดมิน ${courtName(myAdminRequest.courtId)} ถูกถอนแล้ว`, detail: 'หากต้องการสิทธิ์อีกครั้ง กรุณาติดต่อ SuperAdmin' },
    approved: { icon: CheckCircle2, box: 'border-emerald-200 bg-emerald-50 text-emerald-700', title: `อนุมัติแล้ว: แอดมิน ${courtName(myAdminRequest.courtId)}`, detail: 'กำลังเปิดสิทธิ์ให้...' },
  }[myAdminRequest.status];
  if (!styles) return null;
  const Icon = styles.icon;
  return (
    <div className={`mt-5 flex gap-3 rounded-2xl border p-4 ${styles.box}`}>
      <Icon size={22} className="shrink-0" />
      <div>
        <div className="text-sm font-black">{styles.title}</div>
        <div className="mt-0.5 text-xs opacity-80">{user.email} · {styles.detail}</div>
      </div>
    </div>
  );
}
