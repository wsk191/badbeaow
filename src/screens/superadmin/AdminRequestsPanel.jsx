import { useEffect, useMemo, useState } from 'react';
import { onValue, ref, remove, update } from 'firebase/database';
import { Check, Clock, Mail, ShieldCheck, UserMinus, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { COURTS } from '../../lib/appConfig';
import { isEmailNotifyConfigured } from '../../lib/emailNotify';
import { useApp } from '../../context/AppContext';
import ConfirmButton from './ConfirmButton';

const courtName = id => COURTS.find(court => court.id === id)?.name || id;
const formatTime = time => (time ? new Date(time).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const STATUS = {
  pending: ['รออนุมัติ', 'bg-amber-50 text-amber-700 ring-amber-200'],
  approved: ['อนุมัติแล้ว', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  rejected: ['ปฏิเสธ', 'bg-red-50 text-red-600 ring-red-200'],
  revoked: ['ถอดสิทธิ์แล้ว', 'bg-slate-100 text-slate-600 ring-slate-200'],
};

export default function AdminRequestsPanel() {
  const { showToast } = useApp();
  const [requests, setRequests] = useState({});
  const [admins, setAdmins] = useState({});
  const [busyId, setBusyId] = useState('');

  useEffect(() => onValue(ref(db, 'adminRequests'), snapshot => setRequests(snapshot.val() || {}), () => setRequests({})), []);
  useEffect(() => {
    const unsubscribers = COURTS.map(court => onValue(ref(db, `boardAdmins/${court.id}`), snapshot => {
      setAdmins(current => ({ ...current, [court.id]: snapshot.val() || {} }));
    }, () => {}));
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  const list = useMemo(() => Object.entries(requests)
    .map(([uid, request]) => ({ uid, ...request }))
    .sort((a, b) => (b.status === 'pending') - (a.status === 'pending') || (b.createdAt || 0) - (a.createdAt || 0)), [requests]);
  const pending = list.filter(request => request.status === 'pending');
  const history = list.filter(request => request.status !== 'pending');
  const emailByUid = uid => requests[uid]?.email;

  const run = async (uid, action, successMessage) => {
    setBusyId(uid);
    try {
      await action();
      showToast(successMessage, 'success');
    } catch (error) {
      console.error(error);
      showToast('ทำรายการไม่สำเร็จ (ตรวจสอบว่า publish database rules แล้ว)', 'error');
    }
    setBusyId('');
  };

  const approve = request => {
    const otherCourt = COURTS.find(court => court.id !== request.courtId && admins[court.id]?.[request.uid]);
    if (otherCourt) {
      showToast(`บัญชีนี้เป็นแอดมิน ${otherCourt.name} อยู่แล้ว (1 อีเมลดูแลได้ 1 สนาม)`, 'error');
      return;
    }
    run(request.uid, () => update(ref(db), {
      [`boardAdmins/${request.courtId}/${request.uid}`]: true,
      [`adminRequests/${request.uid}/status`]: 'approved',
      [`adminRequests/${request.uid}/decidedAt`]: Date.now(),
    }), `อนุมัติ ${request.email} เป็นแอดมิน ${courtName(request.courtId)} แล้ว`);
  };

  const reject = request => run(request.uid, () => update(ref(db, `adminRequests/${request.uid}`), { status: 'rejected', decidedAt: Date.now() }), 'ปฏิเสธคำขอแล้ว');

  const revoke = (courtId, uid) => run(uid, () => update(ref(db), {
    [`boardAdmins/${courtId}/${uid}`]: null,
    ...(requests[uid] ? { [`adminRequests/${uid}/status`]: 'revoked', [`adminRequests/${uid}/decidedAt`]: Date.now() } : {}),
  }), 'ถอดสิทธิ์แอดมินแล้ว');

  const deleteRequest = uid => run(uid, () => remove(ref(db, `adminRequests/${uid}`)), 'ลบคำขอแล้ว บัญชีนี้ส่งคำขอใหม่ได้');

  return (
    <div className="space-y-4">
      {!isEmailNotifyConfigured && (
        <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <Mail size={16} className="shrink-0" />
          <span>ยังไม่ได้ตั้งค่า EmailJS ระบบจึงยังไม่ส่งอีเมลแจ้งเตือน คำขอใหม่จะแสดงที่หน้านี้เท่านั้น (ดูวิธีตั้งค่าใน README)</span>
        </div>
      )}

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-[15px] font-bold"><Clock size={18} className="text-amber-500" /> คำขอรออนุมัติ ({pending.length})</h2>
        <div className="mt-3 space-y-2">
          {pending.length ? pending.map(request => (
            <div key={request.uid} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-gray-900">{request.email}</div>
                  <div className="text-xs text-gray-500">ขอดูแล <b className="text-purple-700">{courtName(request.courtId)}</b> · {formatTime(request.createdAt)}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={busyId === request.uid} onClick={() => approve(request)} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={14} /> อนุมัติ</button>
                  <ConfirmButton disabled={busyId === request.uid} onConfirm={() => reject(request)} confirmLabel="ยืนยันปฏิเสธ" className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"><X size={14} /> ปฏิเสธ</ConfirmButton>
                </div>
              </div>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">ไม่มีคำขอใหม่</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-[15px] font-bold"><ShieldCheck size={18} className="text-purple-600" /> แอดมินแต่ละสนาม</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {COURTS.map(court => {
            const uids = Object.keys(admins[court.id] || {}).filter(uid => admins[court.id][uid] === true);
            return (
              <div key={court.id} className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 text-sm font-black text-gray-800">{court.name} <span className="font-normal text-gray-400">({uids.length})</span></div>
                {uids.length ? uids.map(uid => (
                  <div key={uid} className="flex items-center justify-between gap-2 border-t border-slate-200/70 py-2 first:border-t-0">
                    <div className="min-w-0 truncate text-xs font-semibold text-gray-700" title={uid}>{emailByUid(uid) || `UID: ${uid.slice(0, 10)}…`}</div>
                    <ConfirmButton disabled={busyId === uid} onConfirm={() => revoke(court.id, uid)} confirmLabel="ยืนยันถอด" className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-red-500 ring-1 ring-red-100"><UserMinus size={12} /> ถอดสิทธิ์</ConfirmButton>
                  </div>
                )) : <div className="text-xs text-gray-400">ยังไม่มีแอดมิน</div>}
              </div>
            );
          })}
        </div>
      </section>

      {history.length > 0 && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-bold">ประวัติคำขอ</h2>
          <p className="mt-1 text-[11px] text-gray-500">ลบคำขอเมื่อต้องการให้อีเมลนั้นส่งคำขอใหม่ได้ (เช่น ขอเปลี่ยนสนาม)</p>
          <div className="mt-3 space-y-2">
            {history.map(request => {
              const [label, badge] = STATUS[request.status] || [request.status, 'bg-gray-100 text-gray-600 ring-gray-200'];
              return (
                <div key={request.uid} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-800">{request.email}</div>
                    <div className="text-[11px] text-gray-500">{courtName(request.courtId)} · ตัดสินเมื่อ {formatTime(request.decidedAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ring-1 ${badge}`}>{label}</span>
                    {request.status !== 'approved' && <ConfirmButton disabled={busyId === request.uid} onConfirm={() => deleteRequest(request.uid)} confirmLabel="ยืนยันลบ" className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">ลบคำขอ</ConfirmButton>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
