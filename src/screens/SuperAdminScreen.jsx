import { Activity, ArrowLeft, CalendarDays, Dumbbell, LogOut, Sparkles, Swords, Target, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import ExercisePlanner from '../components/ExercisePlanner';
import AdminRequestsPanel from './superadmin/AdminRequestsPanel';
import CourtsDataPanel from './superadmin/CourtsDataPanel';
import CommunityPanel from './superadmin/CommunityPanel';
import AccessLogPanel from './superadmin/AccessLogPanel';
import { db } from '../lib/firebase';
import { COURTS, WORKOUT_TYPES } from '../lib/appConfig';
import { useApp } from '../context/AppContext';

export default function SuperAdminScreen() {
  const {
    adminUidInput, dashboardSummary, effectiveMaintenanceMode, exerciseBmi, exerciseDays,
    exerciseMonth, exerciseProfile, exerciseReady, exerciseToday, handleAddCourtAdmin,
    handleLogout, isProcessing, maintenanceMode, maintenanceSchedule, maintenanceUpdating,
    saveMaintenanceSchedule, scheduleEndTime, scheduleStartTime, scheduleUpdating,
    scheduledMaintenanceMode, selectCourt, setAdminUidInput, setExerciseProfile,
    setMaintenanceSchedule, setScheduleEndTime, setScheduleStartTime, setSuperAdminCourtId,
    setSuperAdminSection, setSuperAdminShowHome, superAdminCourt, superAdminCourtId,
    superAdminSection, toast, todayKey, toggleMaintenanceMode,
  } = useApp();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  useEffect(() => onValue(ref(db, 'adminRequests'), snapshot => {
    setPendingRequestCount(Object.values(snapshot.val() || {}).filter(request => request.status === 'pending').length);
  }, () => setPendingRequestCount(0)), []);
  const tabs = [
    ['dashboard', 'ภาพรวม'],
    ['admins', 'แอดมิน', pendingRequestCount],
    ['courts', 'ข้อมูลสนาม'],
    ['community', 'ลานชุมชน'],
    ['logs', 'Log อุปกรณ์'],
    ['exercise', 'AI ออกกำลัง'],
  ];

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }} className="min-h-screen w-full bg-slate-50 text-gray-800 relative overflow-x-hidden pb-6">
      <div className={`fixed left-1/2 top-6 z-[80] transition-all duration-300 ease-out ${toast.message ? 'pointer-events-auto translate-x-[-50%] scale-100 opacity-100' : 'pointer-events-none translate-x-[-50%] -translate-y-3 scale-95 opacity-0'}`}>
        <div className={`whitespace-nowrap rounded-full px-5 py-3 text-xs font-semibold text-white shadow-xl ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.message}
        </div>
      </div>
      <header className="bg-slate-950 text-white px-5 pt-10 pb-5 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-indigo-300 font-semibold tracking-wide">BADBEAOW CONTROL CENTER</div>
            <div className="text-sm font-bold text-white">ศูนย์ควบคุมระบบกลาง (SuperAdmin)</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSuperAdminShowHome(true)} className="bg-white/10 hover:bg-white/20 px-3 py-2.5 rounded-xl text-xs font-bold text-white" title="ดูหน้าแรก">
              หน้าแรก
            </button>
            <button onClick={() => handleLogout(false)} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white" title="ออกจากระบบ">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {tabs.map(([key, label, badge]) => (
            <button key={key} onClick={() => setSuperAdminSection(key)} className={`relative shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold ${superAdminSection === key ? (key === 'exercise' ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-900') : 'bg-white/10 text-white/70'}`}>
              {label}
              {badge > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-950">{badge}</span>}
            </button>
          ))}
        </div>
      </header>

      {superAdminSection === 'dashboard' ? (
        <main className="mx-auto max-w-7xl p-4 space-y-4 md:p-8">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ผู้เล่นทั้งหมด', value: dashboardSummary.playerCount, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'มาเล่นวันนี้', value: dashboardSummary.presentCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'คู่รอสนาม', value: dashboardSummary.queueCount, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'สนามกำลังแข่ง', value: dashboardSummary.playingCount, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(metric => (
              <div key={metric.label} className={`${metric.bg} rounded-2xl p-4 shadow-sm`}>
                <div className="text-[11px] text-gray-500">{metric.label}</div>
                <div className={`text-2xl font-black mt-1 ${metric.color}`}>{metric.value}</div>
              </div>
            ))}
          </div>

          {/* ปุ่มเลือกเข้าคอร์ดด่วนสำหรับ SuperAdmin */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2 text-gray-800">
              <Swords size={18} className="text-purple-600" /> เข้าจัดการสนาม
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {COURTS.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCourt(c.id)}
                  className={`bg-gradient-to-r ${c.accent} text-white font-bold p-3 rounded-xl text-xs flex items-center justify-between shadow-sm hover:opacity-95 transition-opacity`}
                >
                  <span>{c.name}</span>
                  <ArrowLeft size={14} className="rotate-180" />
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-3xl border p-5 shadow-sm ${effectiveMaintenanceMode ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-gray-800"><Wrench size={18} /> สถานะการเปิดระบบ</div>
                <p className={`mt-1 text-xs ${effectiveMaintenanceMode ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {scheduledMaintenanceMode ? 'ระบบกำลังปิดตามเวลาที่ตั้งไว้' : effectiveMaintenanceMode ? 'ผู้ใช้ทั่วไปจะเห็นหน้าระบบกำลังปรับปรุง' : 'ผู้ใช้ทั่วไปสามารถเข้าใช้งานระบบได้ตามปกติ'}
                </p>
              </div>
              <button onClick={toggleMaintenanceMode} disabled={maintenanceUpdating} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 ${maintenanceMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                {maintenanceUpdating ? 'กำลังบันทึก...' : maintenanceMode ? 'เปิดระบบ' : 'ปิดระบบ'}
              </button>
            </div>
          </div>

          {/* นำส่วนเปิดปิดอัตโนมัติที่หายไปกลับมา */}
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-bold text-gray-800"><Wrench size={18} /> เปิด-ปิดระบบอัตโนมัติ</div>
                <p className="mt-1 text-xs text-indigo-700">ใช้เวลาไทย และระบบจะปิดรับผู้ใช้ทั่วไปในช่วงเวลานี้</p>
              </div>
              <label className="shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceSchedule.enabled}
                  onChange={event => setMaintenanceSchedule(schedule => ({ ...schedule, enabled: event.target.checked }))}
                  className="peer sr-only"
                />
                <span className="relative block h-7 w-12 rounded-full bg-gray-300 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-indigo-600 peer-checked:after:translate-x-5" />
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-gray-600">
                เวลาเริ่มปิด
                <input type="time" value={scheduleStartTime} onChange={event => setScheduleStartTime(event.target.value)} className="mt-1 w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-indigo-500" />
              </label>
              <label className="text-xs font-semibold text-gray-600">
                เวลาเปิดกลับ
                <input type="time" value={scheduleEndTime} onChange={event => setScheduleEndTime(event.target.value)} className="mt-1 w-full rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-indigo-500" />
              </label>
            </div>
            <button onClick={saveMaintenanceSchedule} disabled={scheduleUpdating} aria-busy={scheduleUpdating} className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70">
              {scheduleUpdating ? 'กำลังบันทึก...' : 'บันทึกตารางเวลา'}
            </button>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold">สถานะทุกคอร์ด</h2>
              <span className="text-xs font-bold text-red-500">หนี้รวม {dashboardSummary.debtTotal.toFixed(2)} ฿</span>
            </div>
            <div className="space-y-3">
              {dashboardSummary.courts.map(courtItem => (
                <div key={courtItem.id} className="border border-gray-100 rounded-2xl overflow-hidden p-4">
                  <div className="flex justify-between items-center mb-2">
                    <button onClick={() => selectCourt(courtItem.id)} className={`font-bold ${courtItem.text} hover:underline`}>
                      {courtItem.name} 🏸
                    </button>
                    <span className={`text-[10px] rounded-full px-2 py-1 font-bold ${courtItem.isPlaying ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{courtItem.isPlaying ? 'กำลังแข่ง' : 'สนามว่าง'}</span>
                  </div>
                  <div className="grid grid-cols-4 text-center">
                    <div><b>{courtItem.playerCount}</b><small className="block text-[9px] text-gray-400">ผู้เล่น</small></div>
                    <div><b className="text-emerald-600">{courtItem.presentCount}</b><small className="block text-[9px] text-gray-400">มาวันนี้</small></div>
                    <div><b className="text-amber-600">{courtItem.queueCount}</b><small className="block text-[9px] text-gray-400">คู่รอ</small></div>
                    <div><b className="text-red-500">{courtItem.debtTotal.toFixed(0)}</b><small className="block text-[9px] text-gray-400">หนี้ ฿</small></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : superAdminSection === 'exercise' ? (
        <>
          <div className="mx-auto max-w-7xl p-4 md:p-8"><ExercisePlanner isAdmin /></div>
          <div className="hidden">
        <main className="mx-auto max-w-7xl p-4 space-y-4 md:p-8">
          <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold"><Sparkles size={15} /> BADBEAOW AI COACH</div>
                <h1 className="mt-2 text-xl font-black">แผนฝึกแบดมินตันเฉพาะบุคคล</h1>
                <p className="mt-1 text-xs leading-5 text-white/65">กรอกข้อมูลนักกีฬา แล้วให้ AI จัดสมดุลฟุตเวิร์ก ความฟิต และการพักฟื้น</p>
              </div>
              <Dumbbell size={27} className="shrink-0 text-amber-300" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 p-2"><div className="text-lg font-black">{exerciseDays.length}</div><div className="text-[9px] text-white/60">วันในแผน</div></div>
              <div className="rounded-2xl bg-white/10 p-2"><div className="text-lg font-black">4</div><div className="text-[9px] text-white/60">วันฝึก/สัปดาห์</div></div>
              <div className="rounded-2xl bg-white/10 p-2"><div className="text-lg font-black">AI</div><div className="text-[9px] text-white/60">ปรับตามข้อมูล</div></div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-orange-500" />
              <div><h2 className="text-[15px] font-bold">ข้อมูลนักกีฬา</h2><p className="text-[11px] text-gray-500">ใช้สำหรับประเมินความหนักของการฝึก</p></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { key: 'age', label: 'อายุ', unit: 'ปี', placeholder: 'เช่น 25' },
                { key: 'weight', label: 'น้ำหนัก', unit: 'กก.', placeholder: 'เช่น 65' },
                { key: 'height', label: 'ส่วนสูง', unit: 'ซม.', placeholder: 'เช่น 170' },
              ].map(field => (
                <label key={field.key} className="text-[11px] font-bold text-gray-600">
                  {field.label}
                  <div className="relative mt-1"><input type="number" min="1" value={exerciseProfile[field.key]} onChange={event => setExerciseProfile(profile => ({ ...profile, [field.key]: event.target.value }))} placeholder={field.placeholder} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2.5 pr-9 text-sm font-bold text-gray-800 outline-none focus:border-orange-400" /><span className="absolute right-2 top-3 text-[9px] font-normal text-gray-400">{field.unit}</span></div>
                </label>
              ))}
            </div>
            <label className="mt-3 block text-[11px] font-bold text-gray-600">ระดับการเล่น
              <select value={exerciseProfile.level} onChange={event => setExerciseProfile(profile => ({ ...profile, level: event.target.value }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-orange-400">
                <option>มือใหม่</option><option>เล่นเป็นประจำ</option><option>นักกีฬาแข่งขัน</option>
              </select>
            </label>
          </section>

          {exerciseReady ? (
            <section className="rounded-3xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white"><Sparkles size={20} /></div><div><div className="text-xs font-bold text-orange-700">AI วิเคราะห์ให้แล้ว</div><h2 className="mt-1 text-base font-black text-gray-900">แผนสมดุลสำหรับนักแบดมินตัน</h2></div></div>
              <p className="mt-3 text-xs leading-5 text-gray-700">จากข้อมูล {exerciseProfile.age} ปี, {exerciseProfile.weight} กก., {exerciseProfile.height} ซม. (BMI {exerciseBmi.toFixed(1)}) แนะนำให้เน้น <b>ฟุตเวิร์กและแกนกลางลำตัว</b> เพื่อเคลื่อนที่เข้าหาลูกได้ไวขึ้น พร้อมพักฟื้นอย่างน้อย 2 วันต่อสัปดาห์</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded-xl bg-white/70 p-3"><b className="block text-orange-700">วันนี้</b><span>{WORKOUT_TYPES.find(type => type.key === exerciseToday.plan.typeKey)?.label} {exerciseToday.plan.duration ? `${exerciseToday.plan.duration} นาที` : ''}</span></div><div className="rounded-xl bg-white/70 p-3"><b className="block text-orange-700">ความหนัก</b><span>{exerciseToday.plan.intensity}</span></div></div>
            </section>
          ) : <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">กรอกอายุ น้ำหนัก และส่วนสูง เพื่อดูคำแนะนำจาก AI</div>}

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><CalendarDays size={17} className="text-orange-500" /><h2 className="text-[15px] font-bold">ตารางฝึกประจำเดือน</h2></div><p className="mt-1 text-[11px] text-gray-500">{exerciseMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })} · วันนี้เน้นรายการสีส้ม</p></div><Activity size={19} className="text-gray-300" /></div>
            <div className="mt-4 space-y-2">
              {exerciseDays.map(({ date, plan }) => {
                const workout = WORKOUT_TYPES.find(type => type.key === plan.typeKey);
                const isToday = date.toISOString().slice(0, 10) === todayKey;
                return <div key={date.toISOString()} className={`grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border p-3 ${isToday ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-100 bg-white'}`}>
                  <div className={`text-center ${isToday ? 'text-orange-600' : 'text-gray-500'}`}><div className="text-[10px] font-bold">{date.toLocaleDateString('th-TH', { weekday: 'short' })}</div><div className="text-lg font-black">{date.getDate()}</div></div>
                  <div className="min-w-0"><div className="flex items-center gap-2"><span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border text-sm font-black ${workout.color}`}>{workout.icon}</span><span className="truncate text-xs font-bold text-gray-800">{workout.label}{isToday && <span className="ml-1 text-orange-600">· วันนี้</span>}</span></div><div className="mt-1 truncate text-[10px] text-gray-500">{plan.detail}</div></div>
                  <div className="text-right text-[10px] font-bold text-gray-500">{plan.duration ? `${plan.duration} นาที` : 'พัก'}</div>
                </div>;
              })}
            </div>
          </section>
        </main>
          </div>
        </>
      ) : (
        <main className="mx-auto max-w-5xl p-4 space-y-4 md:p-8">
          {superAdminSection === 'courts' && <CourtsDataPanel />}
          {superAdminSection === 'community' && <CommunityPanel />}
          {superAdminSection === 'logs' && <AccessLogPanel />}
          {superAdminSection === 'admins' && <AdminRequestsPanel />}
          {superAdminSection === 'admins' && <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-[15px] font-bold">เพิ่มผู้ดูแลคอร์ดด้วย UID</h2>
            <p className="text-[11px] text-gray-500 mt-1">เลือกคอร์ดและใส่ Firebase Auth UID</p>
            <select value={superAdminCourtId} onChange={event => setSuperAdminCourtId(event.target.value)} className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
              {COURTS.map(courtItem => <option key={courtItem.id} value={courtItem.id}>{courtItem.name}</option>)}
            </select>
            <form onSubmit={handleAddCourtAdmin} className="mt-3 space-y-3">
              <input value={adminUidInput} onChange={event => setAdminUidInput(event.target.value)} placeholder="Firebase Auth UID" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
              <button type="submit" disabled={isProcessing || !adminUidInput.trim()} className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50">เพิ่ม Admin ให้ {superAdminCourt.name}</button>
            </form>
          </div>}
        </main>
      )}
    </div>
  );
}
