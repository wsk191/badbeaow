import { useEffect, useState } from 'react';
import { onValue, ref, set, update } from 'firebase/database';
import { ChevronDown, ListX, RotateCcw, Trash2, UserX, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { COURTS, getCourtRootPath } from '../../lib/appConfig';
import { useApp } from '../../context/AppContext';
import ConfirmButton from './ConfirmButton';

const toList = value => Object.entries(value || {}).map(([id, item]) => ({ id, ...item }));

export default function CourtsDataPanel() {
  const { showToast } = useApp();
  const [data, setData] = useState({});
  const [openCourt, setOpenCourt] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    const unsubscribers = COURTS.flatMap(court => ['players', 'queue', 'court'].map(part => onValue(ref(db, `${getCourtRootPath(court.id)}/${part}`), snapshot => {
      setData(current => ({ ...current, [court.id]: { ...current[court.id], [part]: snapshot.val() } }));
    }, () => {})));
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  const run = async (key, action, message) => {
    setBusy(key);
    try {
      await action();
      showToast(message, 'success');
    } catch (error) {
      console.error(error);
      showToast('ทำรายการไม่สำเร็จ', 'error');
    }
    setBusy('');
  };

  // Players are deleted one path at a time because the rules only grant writes per player.
  const playerUpdates = (courtId, value) => Object.fromEntries(Object.keys(data[courtId]?.players || {}).map(id => [`${getCourtRootPath(courtId)}/players/${id}${value === null ? '' : '/isPresent'}`, value]));

  return (
    <div className="space-y-3">
      {COURTS.map(court => {
        const root = getCourtRootPath(court.id);
        const players = toList(data[court.id]?.players).sort((a, b) => (b.debt || 0) - (a.debt || 0));
        const queueCount = Object.keys(data[court.id]?.queue || {}).length;
        const courtState = data[court.id]?.court || {};
        const playing = Boolean(courtState.teamA || courtState.teamB);
        const present = players.filter(player => player.isPresent).length;
        const debt = players.reduce((sum, player) => sum + (Number(player.debt) || 0), 0);
        const open = openCourt === court.id;
        return (
          <section key={court.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className={`bg-gradient-to-r ${court.accent} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black">{court.name}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${playing ? 'bg-emerald-400 text-emerald-950' : 'bg-white/20'}`}>{playing ? 'กำลังแข่ง' : 'สนามว่าง'}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[['ผู้เล่น', players.length], ['มาวันนี้', present], ['คู่รอ', queueCount], ['ค้าง ฿', debt.toFixed(0)]].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/15 py-1.5"><div className="text-lg font-black">{value}</div><div className="text-[10px] text-white/75">{label}</div></div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              <ConfirmButton disabled={busy === court.id + 'q' || !queueCount} onConfirm={() => run(court.id + 'q', () => set(ref(db, `${root}/queue`), null), `ล้างคิว ${court.name} แล้ว`)} className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"><ListX size={14} /> ล้างคิว</ConfirmButton>
              <ConfirmButton disabled={busy === court.id + 'c' || !playing} onConfirm={() => run(court.id + 'c', () => set(ref(db, `${root}/court`), { teamA: null, teamB: null }), `เคลียร์สนาม ${court.name} แล้ว`)} className="flex items-center gap-1 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"><RotateCcw size={14} /> เคลียร์สนาม</ConfirmButton>
              <ConfirmButton disabled={busy === court.id + 'p' || !present} onConfirm={() => run(court.id + 'p', () => update(ref(db), playerUpdates(court.id, false)), `รีเซ็ตเช็คชื่อ ${court.name} แล้ว`)} className="flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700"><UserX size={14} /> รีเซ็ตเช็คชื่อ</ConfirmButton>
              <ConfirmButton disabled={busy === court.id + 'x' || !players.length} confirmLabel="ลบผู้เล่นทุกคน?" onConfirm={() => run(court.id + 'x', async () => {
                await update(ref(db), playerUpdates(court.id, null));
                await set(ref(db, `${root}/queue`), null);
                await set(ref(db, `${root}/court`), { teamA: null, teamB: null });
              }, `ล้างข้อมูล ${court.name} ทั้งหมดแล้ว`)} className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600"><Trash2 size={14} /> ล้างข้อมูลทั้งหมด</ConfirmButton>
              <button type="button" onClick={() => setOpenCourt(open ? '' : court.id)} className="ml-auto flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600"><Users size={14} /> รายชื่อ <ChevronDown size={14} className={open ? 'rotate-180' : ''} /></button>
            </div>
            {open && (
              <div className="max-h-72 overflow-y-auto border-t border-gray-100 px-3 pb-3">
                {players.length ? players.map(player => (
                  <div key={player.id} className="flex items-center justify-between border-b border-gray-50 py-2 text-xs last:border-b-0">
                    <span className="flex items-center gap-2 font-semibold text-gray-800"><span className={`h-2 w-2 rounded-full ${player.isPresent ? 'bg-emerald-500' : 'bg-gray-300'}`} />{player.name}</span>
                    <span className="flex items-center gap-3 text-gray-500">ชนะ {player.wins || 0}{player.debt > 0 && <b className="text-red-500">{Number(player.debt).toFixed(0)} ฿</b>}</span>
                  </div>
                )) : <div className="py-4 text-center text-xs text-gray-400">ยังไม่มีผู้เล่น</div>}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
