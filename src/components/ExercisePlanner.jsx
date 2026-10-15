/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, CalendarDays, CheckCircle2, Dumbbell, Flame, Info, Sparkles, Target, X } from 'lucide-react';

const TYPE_STYLES = {
  footwork: { label: 'ฟุตเวิร์ก', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: '↗' },
  strength: { label: 'สร้างความแข็งแรง', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: '▦' },
  cardio: { label: 'คาร์ดิโอ', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: '◒' },
  mobility: { label: 'ยืดเหยียด/ฟื้นฟู', color: 'bg-violet-50 text-violet-700 border-violet-100', icon: '◌' },
  rest: { label: 'พักฟื้น', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: '•' },
};

const EXERCISES = {
  splitSquat: {
    name: 'สปลิตสควอต', type: 'strength', image: 'https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=900&q=80',
    sets: '3 เซต', reps: 'ข้างละ 10 ครั้ง', rest: 'พัก 60 วินาที', tip: 'ก้าวขาข้างหนึ่งไปด้านหน้า หลังตรง ย่อตัวลงจนเข่าหน้าเป็นมุมประมาณ 90 องศา แล้วดันตัวกลับขึ้น',
  },
  plank: {
    name: 'แพลงก์แตะไหล่', type: 'strength', image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=900&q=80',
    sets: '3 เซต', reps: 'แตะข้างละ 12 ครั้ง', rest: 'พัก 45 วินาที', tip: 'ตั้งลำตัวเป็นเส้นตรง เกร็งหน้าท้อง แล้วใช้มือขวาแตะไหล่ซ้ายสลับข้างโดยไม่โยกสะโพก',
  },
  footwork: {
    name: 'ฟุตเวิร์ก 6 จุด', type: 'footwork', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80',
    sets: '4 เซต', reps: 'รอบละ 30 วินาที', rest: 'พัก 45 วินาที', tip: 'สมมติจุด 6 จุดรอบตัว เคลื่อนที่เข้าออกด้วยปลายเท้าเบา ๆ รักษาท่าเตรียมพร้อมและกลับจุดกลางทุกครั้ง',
  },
  shadow: {
    name: 'Shadow Badminton', type: 'footwork', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=80',
    sets: '4 เซต', reps: 'รอบละ 45 วินาที', rest: 'พัก 60 วินาที', tip: 'ถือไม้หรือทำท่าตีเปล่า เคลื่อนจากจุดกลางไปหน้าซ้าย หน้าขวา หลังซ้าย และหลังขวา เน้นการเบรกให้มั่นคง',
  },
  interval: {
    name: 'วิ่งสลับเร็ว-ช้า', type: 'cardio', image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
    sets: '6 รอบ', reps: 'เร็ว 30 วินาที / ช้า 60 วินาที', rest: 'พัก 2 นาทีหลังครบ 3 รอบ', tip: 'เริ่มด้วยเดินเร็ว 5 นาที จากนั้นสลับเร่งความเร็วและเดินช้า คุมลมหายใจไม่ให้หอบจนพูดไม่ได้',
  },
  mobility: {
    name: 'ยืดสะโพกและไหล่', type: 'mobility', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    sets: '2 เซต', reps: 'ท่าละ 30 วินาที', rest: 'พัก 20 วินาที', tip: 'ยืดแบบนุ่มนวล ไม่เด้ง และหยุดทันทีหากมีอาการเจ็บแปลบ เน้นสะโพก น่อง หลังต้นขา และหัวไหล่',
  },
};

const getPlan = (profile, date) => {
  const day = date.getDate();
  const weekDay = date.getDay();
  const bmi = Number(profile.height) > 0 ? Number(profile.weight) / ((Number(profile.height) / 100) ** 2) : 0;
  const gentle = Number(profile.age) >= 40 || profile.level === 'มือใหม่' || bmi >= 27;
  const cycle = day % 7;
  if (weekDay === 0 || cycle === 6) return { type: 'rest', duration: 0, exercises: [], intensity: 'พักเต็มที่', detail: 'เดินเบา ๆ และฟื้นฟูร่างกาย' };
  if (cycle === 1) return { type: 'footwork', duration: gentle ? 25 : 35, exercises: ['footwork', 'shadow'], intensity: gentle ? 'เบา-ปานกลาง' : 'ปานกลาง', detail: 'ฝึกการเคลื่อนที่และการกลับสู่จุดกลาง' };
  if (cycle === 2 || cycle === 5) return { type: 'strength', duration: gentle ? 25 : 35, exercises: ['splitSquat', 'plank'], intensity: gentle ? 'เบา' : 'ปานกลาง', detail: 'สร้างขาและแกนกลางลำตัวสำหรับการตีแบด' };
  if (cycle === 3) return { type: 'cardio', duration: gentle ? 20 : 30, exercises: ['interval'], intensity: gentle ? 'เบา-ปานกลาง' : 'ปานกลาง', detail: 'เพิ่มความฟิตสำหรับเกมที่ต้องเคลื่อนที่ต่อเนื่อง' };
  return { type: 'mobility', duration: 20, exercises: ['mobility'], intensity: 'เบา', detail: 'ยืดเหยียดและเตรียมร่างกายให้พร้อม' };
};

export default function ExercisePlanner({ onBack, isAdmin = false }) {
  const [profile, setProfile] = useState({ age: '', weight: '', height: '', level: 'มือใหม่' });
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const month = useMemo(() => new Date(), []);
  const days = useMemo(() => Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
    return { date, plan: getPlan(profile, date) };
  }), [profile, month]);
  const ready = Number(profile.age) > 0 && Number(profile.weight) > 0 && Number(profile.height) > 0;
  const today = days.find(item => item.date.toISOString().slice(0, 10) === todayKey) || days[0];
  const bmi = Number(profile.height) > 0 ? Number(profile.weight) / ((Number(profile.height) / 100) ** 2) : 0;

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateProfile = (key, value) => setProfile(current => ({ ...current, [key]: value }));
  const openDay = item => setSelectedDay(item);
  const currentPlan = selectedDay?.plan || today.plan;

  const profileForm = <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2"><Target size={18} className="text-orange-500" /><div><h2 className="text-[15px] font-bold">ข้อมูลนักกีฬา</h2><p className="text-[11px] text-gray-500">แผนจะปรับตามข้อมูลที่กรอก</p></div></div>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {[['age', 'อายุ', 'ปี'], ['weight', 'น้ำหนัก', 'กก.'], ['height', 'ส่วนสูง', 'ซม.']].map(([key, label, unit]) => <label key={key} className="text-[11px] font-bold text-gray-600">{label}<div className="relative mt-1"><input type="number" min="1" value={profile[key]} onChange={event => updateProfile(key, event.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2.5 pr-8 text-sm font-bold outline-none focus:border-orange-400" placeholder="-" /><span className="absolute right-2 top-3 text-[9px] font-normal text-gray-400">{unit}</span></div></label>)}
    </div>
    <label className="mt-3 block text-[11px] font-bold text-gray-600">ระดับการเล่น<select value={profile.level} onChange={event => updateProfile('level', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-orange-400"><option>มือใหม่</option><option>เล่นเป็นประจำ</option><option>นักกีฬาแข่งขัน</option></select></label>
    {!ready && <p className="mt-3 rounded-xl bg-gray-50 p-3 text-center text-[11px] text-gray-500">กรอกข้อมูลให้ครบ เพื่อให้ AI สร้างแผนเฉพาะบุคคล</p>}
  </section>;

  const detailPanel = <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Info size={18} className="text-orange-500" /><h2 className="text-[15px] font-bold">รายละเอียดวันนี้</h2></div><span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-700">{currentPlan.intensity}</span></div>
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-orange-50 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white"><Dumbbell size={20} /></div><div><div className="text-xs font-black text-gray-900">{TYPE_STYLES[currentPlan.type].label}</div><div className="text-[11px] text-gray-600">{currentPlan.detail} · {currentPlan.duration || 0} นาที</div></div></div>
    <div className="mt-3 space-y-2">{currentPlan.exercises.length ? currentPlan.exercises.map(key => { const exercise = EXERCISES[key]; return <button key={key} onClick={() => setSelectedDay({ date: selectedDay?.date || today.date, plan: currentPlan, focus: key })} className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 p-2.5 text-left transition hover:border-orange-300 hover:bg-orange-50"><img src={exercise.image} alt={exercise.name} className="h-14 w-16 rounded-xl object-cover" /><span className="min-w-0 flex-1"><b className="block truncate text-xs text-gray-800">{exercise.name}</b><span className="text-[10px] text-gray-500">{exercise.sets} · {exercise.reps}</span></span><ArrowLeft size={15} className="rotate-180 text-gray-400" /></button>; }) : <div className="rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-500">วันนี้เป็นวันพัก แนะนำให้เดินเบา ๆ และยืดตัว</div>}</div>
  </section>;

  const calendar = <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><CalendarDays size={17} className="text-orange-500" /><h2 className="text-[15px] font-bold">ตารางฝึกประจำเดือน</h2></div><p className="mt-1 text-[11px] text-gray-500">กดวันที่เพื่อดูรายละเอียดท่าออกกำลัง</p></div><Activity size={19} className="text-gray-300" /></div><div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">{days.map(item => { const style = TYPE_STYLES[item.plan.type]; const isToday = item.date.toISOString().slice(0, 10) === todayKey; const isSelected = selectedDay?.date?.toISOString() === item.date.toISOString(); return <button key={item.date.toISOString()} onClick={() => openDay(item)} className={`min-h-[112px] rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${isToday || isSelected ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-100 bg-white'}`}><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold text-gray-500">{item.date.toLocaleDateString('th-TH', { weekday: 'short' })}</div><div className="text-lg font-black text-gray-900">{item.date.getDate()}</div></div><span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-base font-black ${style.color}`}>{style.icon}</span></div><div className="mt-2 truncate text-[11px] font-bold text-gray-800">{style.label}</div><div className="mt-1 text-[10px] text-gray-500">{item.plan.duration ? `${item.plan.duration} นาที` : 'พักฟื้น'}</div></button>; })}</div></section>;

  return <div className={isDesktop ? 'mx-auto max-w-6xl space-y-5' : 'space-y-4'}>
    <div className="flex items-center justify-between"><div><div className="flex items-center gap-2 text-xs font-bold text-orange-600"><Sparkles size={15} /> BADBEAOW AI COACH</div><h1 className="mt-1 text-xl font-black text-gray-900">แผนฝึกแบดมินตันเฉพาะบุคคล</h1><p className="mt-1 text-xs text-gray-500">{isAdmin ? 'จัดการแผนฝึกสำหรับผู้เล่นในระบบ' : 'วางแผนการฝึกให้เหมาะกับร่างกายของคุณ'}</p></div>{onBack && <button onClick={onBack} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500" title="กลับ"><ArrowLeft size={18} /></button>}</div>
    <div className={isDesktop ? 'grid grid-cols-[280px_1fr] items-start gap-5' : 'space-y-4'}><div className="space-y-4">{profileForm}{ready && <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm"><div className="flex items-center gap-2 text-amber-300"><Flame size={17} /><span className="text-xs font-bold">AI วิเคราะห์</span></div><p className="mt-2 text-xs leading-5 text-white/75">BMI {bmi.toFixed(1)} · แนะนำความหนักระดับ {today.plan.intensity} และเน้น {TYPE_STYLES[today.plan.type].label}</p><div className="mt-3 flex items-center gap-2 text-[10px] text-white/60"><CheckCircle2 size={14} className="text-emerald-400" /> ปรับแผนอัตโนมัติตามข้อมูล</div></div>}</div><div className="space-y-4">{detailPanel}{calendar}</div></div>
    {selectedDay?.focus && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="relative"><img src={EXERCISES[selectedDay.focus].image} alt={EXERCISES[selectedDay.focus].name} className="h-52 w-full object-cover" /><button onClick={() => setSelectedDay(null)} className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white" title="ปิด"><X size={18} /></button></div><div className="p-5"><div className="text-xs font-bold text-orange-600">วิธีทำอย่างละเอียด</div><h2 className="mt-1 text-xl font-black text-gray-900">{EXERCISES[selectedDay.focus].name}</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-orange-50 p-3"><b className="block text-sm text-orange-700">{EXERCISES[selectedDay.focus].sets}</b><span className="text-[10px] text-gray-500">จำนวนเซต</span></div><div className="rounded-xl bg-blue-50 p-3"><b className="block text-sm text-blue-700">{EXERCISES[selectedDay.focus].reps}</b><span className="text-[10px] text-gray-500">จำนวนครั้ง/เวลา</span></div><div className="rounded-xl bg-emerald-50 p-3"><b className="block text-sm text-emerald-700">{EXERCISES[selectedDay.focus].rest}</b><span className="text-[10px] text-gray-500">เวลาพัก</span></div></div><p className="mt-4 text-sm leading-6 text-gray-700">{EXERCISES[selectedDay.focus].tip}</p><button onClick={() => setSelectedDay(null)} className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white">เข้าใจแล้ว</button></div></div></div>}
  </div>;
}
