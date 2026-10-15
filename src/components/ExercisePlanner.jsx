/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, CalendarDays, CheckCircle2, Dumbbell, Flame, Info, Sparkles, Target, X, Utensils } from 'lucide-react';

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
  pushUp: {
    name: 'วิดพื้น', type: 'strength', image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=900&q=80',
    sets: '3 เซต', reps: '8-12 ครั้ง', rest: 'พัก 60 วินาที', tip: 'วางมือกว้างกว่าไหล่เล็กน้อย ลำตัวตรง เกร็งหน้าท้อง ลดอกลงอย่างควบคุม แล้วดันกลับขึ้น',
  },
  row: {
    name: 'ดึงยางยืดเข้าหาลำตัว', type: 'strength', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
    sets: '3 เซต', reps: '12-15 ครั้ง', rest: 'พัก 60 วินาที', tip: 'ยึดยางให้มั่นคง ดึงศอกไปด้านหลัง บีบสะบักเข้าหากันโดยไม่ยกไหล่ แล้วค่อย ๆ ปล่อยกลับ',
  },
  shoulder: {
    name: 'ดันไหล่เหนือศีรษะ', type: 'strength', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
    sets: '3 เซต', reps: '10-12 ครั้ง', rest: 'พัก 60 วินาที', tip: 'ถือดัมเบลระดับไหล่ เกร็งแกนกลาง ดันขึ้นเหนือศีรษะโดยไม่แอ่นหลัง แล้วลดลงช้า ๆ',
  },
  glute: {
    name: 'สะพานก้น', type: 'strength', image: 'https://images.unsplash.com/photo-1597452485677-d661e96d8f4a?auto=format&fit=crop&w=900&q=80',
    sets: '3 เซต', reps: '15 ครั้ง', rest: 'พัก 45 วินาที', tip: 'นอนหงาย งอเข่า กดส้นเท้า ยกสะโพกขึ้นพร้อมบีบก้น ค้าง 1 วินาที แล้วลดลงอย่างช้า ๆ',
  },
};

const getPlan = (profile, date) => {
  const day = date.getDate();
  const weekDay = date.getDay();
  const bmi = Number(profile.height) > 0 ? Number(profile.weight) / ((Number(profile.height) / 100) ** 2) : 0;
  const gentle = Number(profile.age) >= 40 || profile.level === 'มือใหม่' || bmi >= 27;
  const trainingMinutes = Math.min(180, Math.max(10, Number(profile.workoutMinutes) || 45));
  const cycle = day % 7;
  if (weekDay === 0 || cycle === 6) return { type: 'rest', duration: 0, exercises: [], intensity: 'พักเต็มที่', focus: 'ฟื้นฟูร่างกาย', detail: 'เดินเบา ๆ และยืดเหยียด 10 นาที' };
  if (cycle === 1) return { type: 'strength', duration: trainingMinutes, exercises: ['splitSquat', 'glute', 'plank'], intensity: gentle ? 'เบา-ปานกลาง' : 'ปานกลาง', focus: 'ขา + ก้น + แกนกลาง', detail: 'สร้างแรงส่งและความมั่นคงจากช่วงล่าง' };
  if (cycle === 2) return { type: 'strength', duration: trainingMinutes, exercises: ['pushUp', 'row', 'shoulder'], intensity: gentle ? 'เบา' : 'ปานกลาง', focus: 'อก + หลัง + ไหล่', detail: 'เสริมช่วงบนให้ตีและควบคุมไม้ได้ดีขึ้น' };
  if (cycle === 5) return { type: 'strength', duration: trainingMinutes, exercises: ['glute', 'splitSquat', 'plank'], intensity: gentle ? 'เบา' : 'ปานกลาง', focus: 'ขา + ก้น + แกนกลาง', detail: 'เสริมกล้ามเนื้อที่ใช้พุ่งและเปลี่ยนทิศทาง' };
  if (cycle === 3) return { type: 'footwork', duration: trainingMinutes, exercises: ['footwork', 'shadow'], intensity: gentle ? 'เบา-ปานกลาง' : 'ปานกลาง', focus: 'ฟุตเวิร์ก + ความคล่องตัว', detail: 'ฝึกการเคลื่อนที่และการกลับสู่จุดกลาง' };
  if (cycle === 4) return { type: 'cardio', duration: trainingMinutes, exercises: ['interval'], intensity: gentle ? 'เบา-ปานกลาง' : 'ปานกลาง', focus: 'หัวใจและปอด', detail: 'เพิ่มความฟิตสำหรับเกมที่ต้องเคลื่อนที่ต่อเนื่อง' };
  return { type: 'mobility', duration: Math.min(trainingMinutes, 30), exercises: ['mobility'], intensity: 'เบา', focus: 'ยืดเหยียดครบทุกส่วน', detail: 'ยืดเหยียดและเตรียมร่างกายให้พร้อม' };
};

export default function ExercisePlanner({ onBack, isAdmin = false }) {
  const [profile, setProfile] = useState({ age: '', weight: '', height: '', level: 'มือใหม่', goal: 'ลดไขมัน', activity: 'ออกกำลัง 3-4 วัน/สัปดาห์', workoutMinutes: '45', sex: 'ชาย' });
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
  const nutrition = useMemo(() => {
    if (!ready) return null;
    const bmr = (10 * Number(profile.weight)) + (6.25 * Number(profile.height)) - (5 * Number(profile.age)) + (profile.sex === 'หญิง' ? -161 : 5);
    const activityFactor = profile.activity === 'นั่งทำงานเป็นส่วนใหญ่' ? 1.2 : profile.activity === 'ออกกำลัง 5-6 วัน/สัปดาห์' ? 1.55 : 1.375;
    const maintenance = Math.round(bmr * activityFactor);
    const adjustment = profile.goal === 'ลดน้ำหนัก' ? -400 : profile.goal === 'ลดไขมัน' ? -250 : profile.goal === 'เพิ่มกล้ามเนื้อ' ? 250 : 0;
    const target = Math.max(1200, maintenance + adjustment);
    const proteinPerKg = profile.goal === 'เพิ่มกล้ามเนื้อ' ? 1.8 : profile.goal === 'ลดไขมัน' ? 1.7 : 1.5;
    const protein = Math.round(Number(profile.weight) * proteinPerKg);
    const fat = Math.round((target * 0.27) / 9);
    const carbs = Math.max(80, Math.round((target - (protein * 4) - (fat * 9)) / 4));
    return { bmr: Math.round(bmr), maintenance, target, adjustment, protein, carbs, fat };
  }, [profile, ready]);

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
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="block text-[11px] font-bold text-gray-600">ระดับการเล่น<select value={profile.level} onChange={event => updateProfile('level', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-orange-400"><option>มือใหม่</option><option>เล่นเป็นประจำ</option><option>นักกีฬาแข่งขัน</option></select></label>
      <label className="block text-[11px] font-bold text-gray-600">เพศสำหรับคำนวณพลังงาน<select value={profile.sex} onChange={event => updateProfile('sex', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-orange-400"><option>ชาย</option><option>หญิง</option></select></label>
      <label className="block text-[11px] font-bold text-gray-600 sm:col-span-2">เป้าหมายหลัก<select value={profile.goal} onChange={event => updateProfile('goal', event.target.value)} className="mt-1 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-800 outline-none focus:border-orange-400"><option>ลดน้ำหนัก</option><option>ลดไขมัน</option><option>เพิ่มกล้ามเนื้อ</option><option>รักษาน้ำหนักและเพิ่มความฟิต</option></select></label>
      <label className="block text-[11px] font-bold text-gray-600">กิจกรรมประจำวัน<select value={profile.activity} onChange={event => updateProfile('activity', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-orange-400"><option>นั่งทำงานเป็นส่วนใหญ่</option><option>ออกกำลัง 3-4 วัน/สัปดาห์</option><option>ออกกำลัง 5-6 วัน/สัปดาห์</option></select></label>
      <label className="block text-[11px] font-bold text-gray-600">เวลาออกกำลัง/วัน<div className="relative mt-1"><input type="number" min="10" max="180" value={profile.workoutMinutes} onChange={event => updateProfile('workoutMinutes', event.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 pr-12 text-sm font-bold outline-none focus:border-orange-400" /><span className="absolute right-3 top-3 text-[9px] font-normal text-gray-400">นาที</span></div></label>
    </div>
    {!ready && <p className="mt-3 rounded-xl bg-gray-50 p-3 text-center text-[11px] text-gray-500">กรอกข้อมูลให้ครบ เพื่อให้ AI สร้างแผนเฉพาะบุคคล</p>}
  </section>;

  const detailPanel = <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Info size={18} className="text-orange-500" /><h2 className="text-[15px] font-bold">รายละเอียด{selectedDay ? `วันที่ ${selectedDay.date.getDate()}` : 'วันนี้'}</h2></div><span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-700">{currentPlan.intensity}</span></div>
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-orange-50 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white"><Dumbbell size={20} /></div><div><div className="text-xs font-black text-gray-900">{TYPE_STYLES[currentPlan.type].label} · {currentPlan.focus}</div><div className="text-[11px] text-gray-600">{currentPlan.detail} · {currentPlan.duration || 0} นาที</div></div></div>
    <div className="mt-3 space-y-2">{currentPlan.exercises.length ? currentPlan.exercises.map(key => { const exercise = EXERCISES[key]; return <button key={key} onClick={() => setSelectedDay({ date: selectedDay?.date || today.date, plan: currentPlan, focus: key })} className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 p-2.5 text-left transition hover:border-orange-300 hover:bg-orange-50"><img src={exercise.image} alt={exercise.name} className="h-14 w-16 rounded-xl object-cover" /><span className="min-w-0 flex-1"><b className="block truncate text-xs text-gray-800">{exercise.name}</b><span className="text-[10px] text-gray-500">{exercise.sets} · {exercise.reps}</span></span><ArrowLeft size={15} className="rotate-180 text-gray-400" /></button>; }) : <div className="rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-500">วันนี้เป็นวันพัก แนะนำให้เดินเบา ๆ และยืดตัว</div>}</div>
  </section>;

  const firstDayOffset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const calendarCells = [...Array(firstDayOffset).fill(null), ...days];
  const calendar = <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><CalendarDays size={17} className="text-orange-500" /><h2 className="text-[15px] font-bold">ปฏิทินการฝึกประจำเดือน</h2></div><p className="mt-1 text-[11px] text-gray-500">กดวันที่ต้องการเพื่อดูรายละเอียด</p></div><Activity size={19} className="text-gray-300" /></div><div className="mt-4 grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-gray-400"><span>อา.</span><span>จ.</span><span>อ.</span><span>พ.</span><span>พฤ.</span><span>ศ.</span><span>ส.</span></div><div className="mt-1 grid grid-cols-7 gap-1">{calendarCells.map((item, index) => item ? (() => { const style = TYPE_STYLES[item.plan.type]; const isToday = item.date.toISOString().slice(0, 10) === todayKey; const isSelected = selectedDay?.date?.toISOString() === item.date.toISOString(); return <button key={item.date.toISOString()} onClick={() => openDay(item)} title={`${style.label} ${item.plan.duration ? `${item.plan.duration} นาที` : ''}`} className={`aspect-square min-h-[45px] rounded-xl border p-1 text-left transition hover:border-orange-300 ${isToday || isSelected ? 'border-orange-300 bg-orange-50 ring-1 ring-orange-200' : 'border-gray-100 bg-white'}`}><div className="flex items-start justify-between"><span className="text-[11px] font-black text-gray-800">{item.date.getDate()}</span><span className={`hidden h-4 w-4 items-center justify-center rounded text-[9px] sm:inline-flex ${style.color}`}>{style.icon}</span></div><div className="mt-1 truncate text-[8px] font-bold text-gray-500 sm:text-[9px]">{style.label}</div><div className="text-[8px] text-gray-400">{item.plan.duration ? `${item.plan.duration}น.` : 'พัก'}</div></button>; })() : <div key={`empty-${index}`} className="aspect-square min-h-[45px] rounded-xl bg-gray-50/60" />)}</div></section>;

  return <div className={isDesktop ? 'mx-auto max-w-6xl space-y-5' : 'space-y-4'}>
    <div className="flex items-center justify-between"><div><div className="flex items-center gap-2 text-xs font-bold text-orange-600"><Sparkles size={15} /> BADBEAOW AI COACH</div><h1 className="mt-1 text-xl font-black text-gray-900">แผนฝึกแบดมินตันเฉพาะบุคคล</h1><p className="mt-1 text-xs text-gray-500">{isAdmin ? 'จัดการแผนฝึกสำหรับผู้เล่นในระบบ' : 'วางแผนการฝึกให้เหมาะกับร่างกายของคุณ'}</p></div>{onBack && <button onClick={onBack} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500" title="กลับ"><ArrowLeft size={18} /></button>}</div>
    <div className={isDesktop ? 'grid grid-cols-[300px_1fr] items-start gap-5' : 'space-y-4'}><div className="space-y-4">{profileForm}{ready && <><div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm"><div className="flex items-center gap-2 text-amber-300"><Flame size={17} /><span className="text-xs font-bold">AI วิเคราะห์เป้าหมาย</span></div><p className="mt-2 text-xs leading-5 text-white/75">BMI {bmi.toFixed(1)} · เป้าหมาย {profile.goal} · เน้น {today.plan.focus}</p><div className="mt-3 flex items-center gap-2 text-[10px] text-white/60"><CheckCircle2 size={14} className="text-emerald-400" /> แผนฝึก {profile.workoutMinutes} นาที/วัน ปรับตามข้อมูลแล้ว</div></div><section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm"><div className="flex items-center gap-2"><Utensils size={17} className="text-emerald-700" /><h2 className="text-[15px] font-black text-emerald-900">เป้าหมายโภชนาการต่อวัน</h2></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white p-3"><span className="block text-[10px] text-gray-500">ควรกินเพื่อรักษาน้ำหนัก</span><b className="text-lg text-gray-900">{nutrition.maintenance.toLocaleString()} kcal</b></div><div className="rounded-2xl bg-orange-100 p-3"><span className="block text-[10px] text-orange-700">เป้าหมายที่แนะนำ</span><b className="text-lg text-orange-800">{nutrition.target.toLocaleString()} kcal</b></div></div><p className="mt-2 text-[10px] text-emerald-800">{nutrition.adjustment < 0 ? `ลดจากค่ารักษาน้ำหนัก ${Math.abs(nutrition.adjustment)} kcal/วัน` : nutrition.adjustment > 0 ? `เพิ่มจากค่ารักษาน้ำหนัก ${nutrition.adjustment} kcal/วัน` : 'รักษาพลังงานใกล้เคียงเดิม'}</p><div className="mt-3 grid grid-cols-3 gap-1 text-center"><div className="rounded-xl bg-blue-100 p-2"><b className="block text-sm text-blue-800">{nutrition.protein}g</b><span className="text-[9px] text-blue-700">โปรตีน</span></div><div className="rounded-xl bg-amber-100 p-2"><b className="block text-sm text-amber-800">{nutrition.carbs}g</b><span className="text-[9px] text-amber-700">คาร์บ</span></div><div className="rounded-xl bg-rose-100 p-2"><b className="block text-sm text-rose-800">{nutrition.fat}g</b><span className="text-[9px] text-rose-700">ไขมัน</span></div></div><p className="mt-3 text-[10px] leading-4 text-emerald-800">แบ่งโปรตีน 3-4 มื้อ ดื่มน้ำตามความกระหาย และปรึกษาผู้เชี่ยวชาญหากมีโรคประจำตัว ค่านี้เป็นค่าประมาณสำหรับวางแผนเบื้องต้น</p></section></>}</div><div className="space-y-4">{detailPanel}{calendar}</div></div>
    {selectedDay?.focus && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="relative"><img src={EXERCISES[selectedDay.focus].image} alt={EXERCISES[selectedDay.focus].name} className="h-52 w-full object-cover" /><button onClick={() => setSelectedDay(null)} className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white" title="ปิด"><X size={18} /></button></div><div className="p-5"><div className="text-xs font-bold text-orange-600">วิธีทำอย่างละเอียด</div><h2 className="mt-1 text-xl font-black text-gray-900">{EXERCISES[selectedDay.focus].name}</h2><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-orange-50 p-3"><b className="block text-sm text-orange-700">{EXERCISES[selectedDay.focus].sets}</b><span className="text-[10px] text-gray-500">จำนวนเซต</span></div><div className="rounded-xl bg-blue-50 p-3"><b className="block text-sm text-blue-700">{EXERCISES[selectedDay.focus].reps}</b><span className="text-[10px] text-gray-500">จำนวนครั้ง/เวลา</span></div><div className="rounded-xl bg-emerald-50 p-3"><b className="block text-sm text-emerald-700">{EXERCISES[selectedDay.focus].rest}</b><span className="text-[10px] text-gray-500">เวลาพัก</span></div></div><p className="mt-4 text-sm leading-6 text-gray-700">{EXERCISES[selectedDay.focus].tip}</p><button onClick={() => setSelectedDay(null)} className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white">เข้าใจแล้ว</button></div></div></div>}
  </div>;
}
