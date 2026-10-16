import { useEffect, useMemo, useState } from 'react';
import { endAt, get, onValue, orderByKey, query, ref, update } from 'firebase/database';
import { ChevronLeft, ChevronRight, Laptop, Search, Smartphone, Tablet } from 'lucide-react';
import { db } from '../../lib/firebase';
import { COURTS, getTodayKey } from '../../lib/appConfig';
import { ACCESS_LOG_RETENTION_DAYS } from '../../lib/accessLog';

const DEVICE_ICONS = { 'มือถือ': Smartphone, 'แท็บเล็ต': Tablet, 'คอมพิวเตอร์': Laptop };
const shiftDay = (dayKey, delta) => {
  const date = new Date(`${dayKey}T12:00:00+07:00`);
  date.setUTCDate(date.getUTCDate() + delta);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(date);
};
const courtName = id => COURTS.find(court => court.id === id)?.name || '';
const countBy = (items, key) => Object.entries(items.reduce((acc, item) => ({ ...acc, [item[key] || 'ไม่ทราบ']: (acc[item[key] || 'ไม่ทราบ'] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

export default function AccessLogPanel() {
  const today = getTodayKey();
  const [day, setDay] = useState(today);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ทั้งหมด');
  const [search, setSearch] = useState('');

  useEffect(() => onValue(ref(db, `accessLogs/${day}`), snapshot => {
    setLogs(Object.entries(snapshot.val() || {}).map(([id, log]) => ({ id, ...log })).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)));
  }, () => setLogs([])), [day]);

  // ลบ log ที่เก่ากว่า 30 วัน
  useEffect(() => {
    const cutoff = shiftDay(today, -ACCESS_LOG_RETENTION_DAYS);
    get(query(ref(db, 'accessLogs'), orderByKey(), endAt(cutoff)))
      .then(snapshot => {
        const oldDays = Object.keys(snapshot.val() || {});
        if (oldDays.length) return update(ref(db, 'accessLogs'), Object.fromEntries(oldDays.map(key => [key, null])));
        return undefined;
      })
      .catch(() => {});
  }, [today]);

  const shown = useMemo(() => logs.filter(log => (filter === 'ทั้งหมด' || log.deviceType === filter)
    && (!search || [log.model, log.os, log.browser, log.email].join(' ').toLowerCase().includes(search.toLowerCase()))), [logs, filter, search]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setDay(shiftDay(day, -1))} disabled={day <= shiftDay(today, -ACCESS_LOG_RETENTION_DAYS + 1)} className="rounded-xl bg-gray-100 p-2 disabled:opacity-30" aria-label="วันก่อนหน้า"><ChevronLeft size={18} /></button>
          <div className="text-center">
            <div className="text-[15px] font-black text-gray-900">{new Date(`${day}T12:00:00+07:00`).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="text-xs text-gray-500">{logs.length} อุปกรณ์ · {logs.reduce((sum, log) => sum + (log.visits || 0), 0)} ครั้งที่เข้าใช้ · เก็บย้อนหลัง {ACCESS_LOG_RETENTION_DAYS} วัน</div>
          </div>
          <button type="button" onClick={() => setDay(shiftDay(day, 1))} disabled={day >= today} className="rounded-xl bg-gray-100 p-2 disabled:opacity-30" aria-label="วันถัดไป"><ChevronRight size={18} /></button>
        </div>
        {logs.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[['ประเภท', 'deviceType'], ['ระบบ', 'os'], ['เบราว์เซอร์', 'browser']].map(([label, key]) => (
              <div key={key} className="rounded-2xl bg-slate-50 p-3">
                <div className="text-[11px] font-bold text-gray-400">{label}</div>
                {countBy(logs, key).slice(0, 4).map(([name, count]) => (
                  <div key={name} className="mt-1 flex items-center gap-2 text-xs">
                    <span className="w-24 truncate font-semibold text-gray-700">{name}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200"><span className="block h-full rounded-full bg-indigo-500" style={{ width: `${(count / logs.length) * 100}%` }} /></span>
                    <span className="w-6 text-right font-bold text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['ทั้งหมด', 'มือถือ', 'แท็บเล็ต', 'คอมพิวเตอร์'].map(type => (
            <button key={type} type="button" onClick={() => setFilter(type)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === type ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{type}</button>
          ))}
          <label className="relative ml-auto min-w-[160px] flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหารุ่น / อีเมล" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs" />
          </label>
        </div>
        <div className="mt-3 space-y-2">
          {shown.length ? shown.map(log => {
            const Icon = DEVICE_ICONS[log.deviceType] || Laptop;
            return (
              <div key={log.id} className="flex gap-3 rounded-2xl border border-gray-100 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={20} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm font-bold text-gray-900">
                    {log.model || log.deviceType}
                    <span className="text-xs font-normal text-gray-500">{log.os} {log.osVersion} · {log.browser}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {log.email ? <b className="text-purple-700">{log.email}</b> : 'ผู้ใช้ทั่วไป'}
                    {log.lastCourt && ` · ${courtName(log.lastCourt)}`} · จอ {log.screen}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[11px] text-gray-500">
                  <div className="font-bold text-gray-700">{new Date(log.lastSeen).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>{log.visits || 1} ครั้ง</div>
                </div>
              </div>
            );
          }) : <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">ไม่มีข้อมูลการเข้าใช้งานในวันนี้</div>}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-gray-400">รุ่นเครื่องแสดงได้เฉพาะ Android ที่ใช้ Chrome/Edge/Samsung Internet · iPhone, iPad, Mac และ Windows เบราว์เซอร์ไม่เปิดเผยรุ่น จึงแสดงเป็นชื่อกลาง</p>
      </section>
    </div>
  );
}
