import { useEffect, useState } from 'react';
import { limitToLast, onValue, query, ref, remove, update } from 'firebase/database';
import { MessageCircle, Trash2, UserRound } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import ConfirmButton from './ConfirmButton';

const toList = value => Object.entries(value || {}).map(([id, item]) => ({ id, ...item })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
const formatTime = time => (time ? new Date(time).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');

export default function CommunityPanel() {
  const { showToast } = useApp();
  const [avatars, setAvatars] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => onValue(ref(db, 'community/avatars'), snapshot => setAvatars(toList(snapshot.val())), () => {}), []);
  useEffect(() => onValue(query(ref(db, 'community/chat'), limitToLast(100)), snapshot => setMessages(toList(snapshot.val())), () => {}), []);

  const run = async (action, message) => {
    try {
      await action();
      showToast(message, 'success');
    } catch (error) {
      console.error(error);
      showToast('ลบไม่สำเร็จ (ตรวจสอบว่า publish database rules แล้ว)', 'error');
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-[15px] font-bold"><UserRound size={18} className="text-indigo-600" /> ตัวละครในลาน ({avatars.length})</h2>
        <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
          {avatars.length ? avatars.map(avatar => (
            <div key={avatar.id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-gray-900">{avatar.name}</div>
                <div className="truncate text-xs text-gray-500">{avatar.description} · {formatTime(avatar.createdAt)}</div>
              </div>
              <ConfirmButton onConfirm={() => run(() => remove(ref(db, `community/avatars/${avatar.id}`)), `ลบตัวละคร ${avatar.name} แล้ว`)} confirmLabel="ยืนยันลบ" className="shrink-0 rounded-lg bg-white p-2 text-red-500 ring-1 ring-red-100"><Trash2 size={14} /></ConfirmButton>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">ยังไม่มีตัวละคร</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[15px] font-bold"><MessageCircle size={18} className="text-emerald-600" /> แชทโลก ({messages.length})</h2>
          {messages.length > 0 && <ConfirmButton onConfirm={() => run(() => update(ref(db), Object.fromEntries(messages.map(message => [`community/chat/${message.id}`, null]))), 'ล้างแชททั้งหมดแล้ว')} confirmLabel="ล้างทั้งหมด?" className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">ล้างแชท</ConfirmButton>}
        </div>
        <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto">
          {messages.length ? messages.map(message => (
            <div key={message.id} className="flex items-start justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
              <div className="min-w-0 text-sm leading-6"><b className="text-sky-700">{message.sender}</b>: <span className="break-words text-gray-700">{message.text}</span><div className="text-[10px] text-gray-400">{formatTime(message.createdAt)}</div></div>
              <ConfirmButton onConfirm={() => run(() => remove(ref(db, `community/chat/${message.id}`)), 'ลบข้อความแล้ว')} confirmLabel="ลบ?" className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={13} /></ConfirmButton>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">ยังไม่มีข้อความ</div>}
        </div>
      </section>
    </div>
  );
}
