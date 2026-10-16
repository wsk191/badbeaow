export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 ชั่วโมง
export const COMMUNITY_TTL_MS = 2 * 60 * 60 * 1000; // Avatar อยู่ได้ 2 ชั่วโมง, แชทล้างทุก 2 ชั่วโมง
export const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
// Start of the current 2-hour chat window, aligned to even hours in Bangkok time (00:00, 02:00, ...).
// Must match the formula in database.rules.json.
export const getChatWindowStart = (now = Date.now()) => now - ((now + BANGKOK_OFFSET_MS) % COMMUNITY_TTL_MS);
export const isCommunityAvatarExpired = (avatar, now = Date.now()) => !avatar.createdAt || avatar.createdAt <= now - COMMUNITY_TTL_MS;

export const COURTS = [
  { id: 'court-1', name: 'คอร์ด 1', accent: 'from-violet-700 to-indigo-900', solid: 'bg-violet-600', text: 'text-violet-600' },
  { id: 'court-2', name: 'คอร์ด 2', accent: 'from-amber-500 to-orange-700', solid: 'bg-amber-600', text: 'text-amber-600' },
  { id: 'court-3', name: 'คอร์ด 3', accent: 'from-emerald-600 to-teal-900', solid: 'bg-emerald-600', text: 'text-emerald-600' },
  { id: 'court-4', name: 'คอร์ด 4', accent: 'from-sky-600 to-blue-900', solid: 'bg-sky-600', text: 'text-sky-600' },
];

export const getTodayKey = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
}).format(new Date());

export const getBangkokMinutes = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  return Number(parts.find(part => part.type === 'hour')?.value || 0) * 60
    + Number(parts.find(part => part.type === 'minute')?.value || 0);
};

export const isMaintenanceScheduleActive = (schedule, date = new Date()) => {
  if (!schedule?.enabled || !schedule.startTime || !schedule.endTime) return false;
  const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const now = getBangkokMinutes(date);
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
};

export const WORKOUT_TYPES = [
  { key: 'footwork', label: 'ฟุตเวิร์ก', icon: '↗', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { key: 'strength', label: 'สร้างความแข็งแรง', icon: '▦', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'cardio', label: 'คาร์ดิโอ', icon: '◒', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { key: 'mobility', label: 'ยืดเหยียด/ฟื้นฟู', icon: '◌', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { key: 'rest', label: 'พักฟื้น', icon: '•', color: 'bg-slate-50 text-slate-600 border-slate-100' },
];

export const getExercisePlan = (profile, date) => {
  const day = date.getDate();
  const weekDay = date.getDay();
  const bmi = Number(profile.height) > 0 ? Number(profile.weight) / ((Number(profile.height) / 100) ** 2) : 0;
  const isOlder = Number(profile.age) >= 40;
  const isBeginner = profile.level === 'มือใหม่';
  const cycle = day % 7;
  const typeKey = weekDay === 0 || cycle === 6
    ? 'rest'
    : cycle === 1 || cycle === 4
      ? 'footwork'
      : cycle === 2 || cycle === 5
        ? 'strength'
        : cycle === 3 ? 'cardio' : 'mobility';
  const duration = typeKey === 'rest' ? 0 : Math.max(20, (isOlder || isBeginner ? 25 : 35) - (bmi >= 27 ? 5 : 0));
  const intensity = typeKey === 'rest' ? 'พักเต็มที่' : isOlder || isBeginner ? 'เบา-ปานกลาง' : 'ปานกลาง';
  const details = {
    footwork: 'ก้าว 6 จุด + shadow badminton 4 รอบ',
    strength: 'สควอต, lunge, plank อย่างละ 3 เซต',
    cardio: 'เดินเร็วหรือปั่นจักรยาน สลับเร็ว-ช้า',
    mobility: 'ยืดสะโพก น่อง ไหล่ และหลัง 15 นาที',
    rest: 'พัก ดื่มน้ำ และนอนให้ครบ 7-9 ชั่วโมง',
  };
  return { typeKey, duration, intensity, detail: details[typeKey] };
};
