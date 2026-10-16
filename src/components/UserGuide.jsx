/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { BookOpen, X, ChevronLeft, ChevronRight, Users, Swords, Trophy, Wallet, Dumbbell, Activity, LayoutDashboard, ListOrdered, Check, Crown, QrCode, Upload, MessageCircle, Hand } from 'lucide-react';

const Toggle = ({ on }) => (
  <span className={`relative inline-block h-5 w-9 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-gray-300'}`}>
    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow ${on ? 'left-[18px]' : 'left-0.5'}`} />
  </span>
);

const Tap = ({ className = '' }) => (
  <span className={`pointer-events-none absolute flex h-9 w-9 items-center justify-center ${className}`}>
    <span className="absolute h-9 w-9 animate-ping rounded-full bg-amber-400/40" />
    <Hand size={22} className="relative -rotate-12 fill-amber-100 text-amber-600 drop-shadow" />
  </span>
);

const Chip = ({ name, color = 'bg-indigo-100 text-indigo-700', selected }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${color} ${selected ? 'ring-2 ring-purple-500' : ''}`}>
    {selected && <Check size={11} />}{name}
  </span>
);

const IllustrationCourts = () => (
  <div className="relative mx-auto w-full max-w-[260px] space-y-2">
    {[['คอร์ด 1', 'from-violet-600 to-indigo-800'], ['คอร์ด 2', 'from-amber-500 to-orange-700'], ['คอร์ด 3', 'from-emerald-600 to-teal-800']].map(([name, color], i) => (
      <div key={name} className={`flex items-center justify-between rounded-2xl bg-gradient-to-r ${color} px-4 py-3 text-white shadow ${i === 0 ? 'scale-[1.03] ring-4 ring-amber-300/70' : 'opacity-80'}`}>
        <div><div className="text-sm font-black">{name}</div><div className="text-[10px] text-white/75">เข้าสู่ระบบจัดการคิว</div></div>
        <ChevronRight size={16} />
      </div>
    ))}
    <Tap className="right-6 top-4" />
  </div>
);

const IllustrationPlayers = () => (
  <div className="relative mx-auto w-full max-w-[260px] rounded-2xl bg-white p-3 shadow ring-1 ring-black/5">
    <div className="mb-2 text-xs font-black text-gray-800">รายชื่อทั้งหมด</div>
    {[['เจ๊เนย', true], ['พี่บอล', true], ['น้องมิว', false], ['ลุงต๋อง', true]].map(([name, on]) => (
      <div key={name} className="flex items-center justify-between border-t border-gray-100 py-2 text-xs">
        <span className={`font-bold ${on ? 'text-gray-800' : 'text-gray-400'}`}>{name}</span>
        <span className="flex items-center gap-2">{on && <span className="text-[10px] font-bold text-emerald-600">มาตีวันนี้</span>}<Toggle on={on} /></span>
      </div>
    ))}
    <Tap className="-right-2 top-[118px]" />
  </div>
);

const IllustrationQueue = () => (
  <div className="relative mx-auto w-full max-w-[260px] space-y-2">
    <div className="rounded-2xl bg-white p-3 shadow ring-1 ring-black/5">
      <div className="mb-2 text-[11px] font-black text-gray-700">จับคู่เตรียมลงสนาม</div>
      <div className="flex flex-wrap gap-1.5"><Chip name="เจ๊เนย" selected /><Chip name="พี่บอล" selected /><Chip name="ลุงต๋อง" /><Chip name="น้องฟ้า" /></div>
      <div className="relative mt-2.5 rounded-xl bg-purple-600 py-2 text-center text-[11px] font-black text-white">เพิ่มเข้าคิวรอ<Tap className="-right-1 -top-2" /></div>
    </div>
    <div className="rounded-2xl bg-white p-3 shadow ring-1 ring-black/5">
      <div className="mb-1.5 flex items-center gap-1 text-[11px] font-black text-gray-700"><ListOrdered size={13} /> คิวรอ</div>
      {['เจ๊เนย + พี่บอล', 'ลุงต๋อง + น้องฟ้า'].map((pair, i) => (
        <div key={pair} className="mt-1 flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-black text-purple-700">{i + 1}</span><span className="font-bold text-gray-700">{pair}</span></div>
      ))}
    </div>
  </div>
);

const IllustrationMatch = () => (
  <div className="relative mx-auto w-full max-w-[260px]">
    <div className="relative overflow-hidden rounded-2xl bg-emerald-700 p-3 shadow">
      <div className="absolute inset-3 rounded-lg border-2 border-white/40" />
      <div className="absolute inset-y-3 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
      <div className="relative grid grid-cols-2 gap-6 py-4 text-center text-white">
        <div><div className="mx-auto mb-1 flex w-fit items-center gap-1 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900"><Crown size={11} /> ทีม A</div><div className="text-[11px] font-bold">เจ๊เนย<br />พี่บอล</div></div>
        <div><div className="mx-auto mb-1 w-fit rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">ทีม B</div><div className="text-[11px] font-bold">ลุงต๋อง<br />น้องฟ้า</div></div>
      </div>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-2">
      <div className="relative rounded-xl bg-indigo-600 py-2 text-center text-[11px] font-black text-white ring-4 ring-amber-300/70">ทีม A ชนะ<Tap className="-bottom-3 right-1" /></div>
      <div className="rounded-xl bg-rose-500 py-2 text-center text-[11px] font-black text-white opacity-70">ทีม B ชนะ</div>
    </div>
  </div>
);

const IllustrationRanking = () => (
  <div className="mx-auto flex w-full max-w-[260px] items-end justify-center gap-2 pt-4">
    {[['พี่บอล', 2, 'h-16', 'bg-slate-300'], ['เจ๊เนย', 1, 'h-24', 'bg-amber-400'], ['น้องฟ้า', 3, 'h-12', 'bg-orange-300']].map(([name, rank, h, color]) => (
      <div key={name} className="flex w-20 flex-col items-center">
        {rank === 1 && <Crown size={20} className="mb-0.5 fill-amber-300 text-amber-500" />}
        <div className="mb-1 text-[11px] font-black text-gray-700">{name}</div>
        <div className={`flex w-full ${h} items-start justify-center rounded-t-xl ${color} pt-1.5 text-lg font-black text-white shadow-inner`}>{rank}</div>
      </div>
    ))}
  </div>
);

const IllustrationPayment = () => (
  <div className="mx-auto flex w-full max-w-[280px] items-center justify-center gap-2">
    <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 shadow ring-1 ring-black/5">
      <QrCode size={52} className="text-slate-800" />
      <div className="mt-1 text-[9px] font-bold text-blue-700">พร้อมเพย์</div>
    </div>
    <ChevronRight size={16} className="shrink-0 text-gray-400" />
    <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 shadow ring-1 ring-black/5">
      <div className="flex h-[52px] w-[42px] items-center justify-center rounded-md border-2 border-dashed border-purple-300 bg-purple-50"><Upload size={18} className="text-purple-500" /></div>
      <div className="mt-1 text-[9px] font-bold text-purple-700">แนบสลิป</div>
    </div>
    <ChevronRight size={16} className="shrink-0 text-gray-400" />
    <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 shadow ring-1 ring-black/5">
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-emerald-100"><Check size={28} className="text-emerald-600" /></div>
      <div className="mt-1 text-[9px] font-bold text-emerald-700">แอดมินตรวจ</div>
    </div>
  </div>
);

const IllustrationExercise = () => (
  <div className="mx-auto w-full max-w-[250px] rounded-2xl bg-white p-3 shadow ring-1 ring-black/5">
    <div className="mb-2 text-[11px] font-black text-gray-700">ตารางฝึกประจำเดือน</div>
    <div className="grid grid-cols-7 gap-1 text-center text-[9px]">
      {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => <div key={day} className="font-bold text-gray-400">{day}</div>)}
      {['bg-orange-100', 'bg-orange-100', 'bg-sky-100', 'bg-gray-100', 'bg-orange-100', 'bg-gray-100', 'bg-emerald-100', 'bg-orange-100', 'bg-orange-200 ring-2 ring-orange-400', 'bg-sky-100', 'bg-gray-100', 'bg-orange-100', 'bg-gray-100', 'bg-emerald-100'].map((color, i) => (
        <div key={i} className={`rounded-md py-1.5 font-bold text-gray-600 ${color}`}>{i + 1}</div>
      ))}
    </div>
    <div className="mt-2 flex gap-2 text-[9px] text-gray-500"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-orange-200" />ความแข็งแรง</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-sky-200" />ฟุตเวิร์ก</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-gray-200" />พัก</span></div>
  </div>
);

const IllustrationCommunity = () => (
  <div className="relative mx-auto h-[150px] w-full max-w-[260px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#dff4f0] to-amber-100 shadow">
    <div className="absolute inset-x-6 bottom-6 h-12 rounded-[50%] border-2 border-amber-600/30" />
    {[['left-10 bottom-10', 'bg-sky-500', 'เจ๊เนย'], ['right-12 bottom-14', 'bg-pink-500', 'น้องฟ้า']].map(([pos, color, name]) => (
      <div key={name} className={`absolute ${pos} flex flex-col items-center`}>
        <span className="mb-1 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-bold text-white">{name}</span>
        <span className="h-4 w-4 rounded-full bg-amber-200 ring-2 ring-white" />
        <span className={`h-6 w-5 rounded-t-lg ${color}`} />
      </div>
    ))}
    <div className="absolute right-2 top-2 flex items-center gap-1 rounded-xl bg-slate-900/80 px-2 py-1 text-[9px] text-white"><MessageCircle size={11} className="text-emerald-300" /> สวัสดีทุกคน!</div>
    <div className="absolute left-2 top-2 rounded-lg bg-indigo-500 px-2 py-1 text-[9px] font-bold text-white">+ ตัวละคร</div>
  </div>
);

const SECTIONS = [
  { id: 'court', icon: LayoutDashboard, title: 'เลือกคอร์ด', Illustration: IllustrationCourts, steps: ['ที่หน้าแรก แตะการ์ดคอร์ดที่กำลังเล่นอยู่', 'แต่ละคอร์ดมีคิวและรายชื่อแยกกัน', 'กดปุ่มย้อนกลับมุมซ้ายบนเพื่อเปลี่ยนคอร์ด'] },
  { id: 'players', icon: Users, title: 'เช็คชื่อผู้เล่น', Illustration: IllustrationPlayers, steps: ['เปิดเมนู "รายชื่อ" ถ้ายังไม่มีชื่อ ให้พิมพ์ชื่อแล้วกด "เพิ่ม"', 'เปิดสวิตช์ข้างชื่อคนที่มาตีวันนี้', 'เฉพาะคนที่เช็คชื่อแล้วถึงจะจับคู่ลงคิวได้'] },
  { id: 'queue', icon: ListOrdered, title: 'จับคู่เข้าคิว', Illustration: IllustrationQueue, steps: ['ไปที่เมนู "คิวสนาม"', 'แตะเลือกผู้เล่น 2 คนเพื่อเป็นคู่กัน', 'กด "เพิ่มเข้าคิวรอ" คู่จะต่อท้ายคิวตามลำดับ'] },
  { id: 'match', icon: Swords, title: 'ลงสนามและบันทึกผล', Illustration: IllustrationMatch, steps: ['เมื่อมีคิวอย่างน้อย 2 คู่ กด "ดึงคิวที่ 1 & 2 ลงสนาม"', 'จบเกมแล้วกด "ทีม A ชนะ" หรือ "ทีม B ชนะ"', 'ผู้ชนะอยู่สนามต่อ (WINNER STAYS ON) ผู้แพ้กลับไปต่อคิว'] },
  { id: 'ranking', icon: Trophy, title: 'จัดอันดับ', Illustration: IllustrationRanking, steps: ['เปิดเมนู "จัดอันดับ"', 'ยิ่งชนะบ่อย ค่าพลังยิ่งสูง อันดับยิ่งขึ้น', 'ผลทุกเกมที่บันทึกจะนับรวมให้อัตโนมัติ'] },
  { id: 'payment', icon: Wallet, title: 'คิดเงินและแจ้งโอน', Illustration: IllustrationPayment, steps: ['เปิดเมนู "คิดเงิน" เพื่อดูยอดที่ต้องจ่าย', 'สแกน QR พร้อมเพย์ของสนาม แล้วแนบรูปสลิป', 'แอดมินตรวจสลิปแล้วยอดค้างจะถูกหักออก'] },
  { id: 'exercise', icon: Dumbbell, title: 'แผนออกกำลังกาย', Illustration: IllustrationExercise, steps: ['เปิดเมนู "ออกกำลัง"', 'กรอกอายุ น้ำหนัก ส่วนสูง และเป้าหมาย', 'ระบบจัดตารางฝึกทั้งเดือน แตะวันที่เพื่อดูรายละเอียด'] },
  { id: 'community', icon: Activity, title: 'ลานกีฬาชุมชน', Illustration: IllustrationCommunity, steps: ['ที่หน้าแรก กด "เข้าสู่ลานกีฬาชุมชน"', 'กดปุ่ม "ตัวละคร" เพื่อสร้างตัวละครของคุณ', 'เดินสำรวจด้วยจอยสติ๊กและคุยกับคนอื่นในแชทโลก'] },
];

export default function UserGuide({ accent = 'from-purple-600 to-indigo-700', onClose }) {
  const [index, setIndex] = useState(0);
  const section = SECTIONS[index];
  const { Illustration } = section;
  const chipsRef = useRef(null);
  useEffect(() => {
    chipsRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index]);
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl" onClick={event => event.stopPropagation()}>
        <div className={`bg-gradient-to-br ${accent} px-5 pb-3 pt-4 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2"><BookOpen size={20} /><h2 className="text-lg font-bold">คู่มือการใช้งาน</h2></div>
              <p className="text-xs text-white/75">BADBEAOW ระบบจัดการคิวตีแบด</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-white/75 hover:bg-white/10 hover:text-white" aria-label="ปิดคู่มือ"><X size={20} /></button>
          </div>
          <div ref={chipsRef} className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {SECTIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => setIndex(i)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${i === index ? 'bg-white text-gray-900 shadow' : 'bg-white/15 text-white/85 hover:bg-white/25'}`}>
                  <Icon size={13} /> {item.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-5 p-5 md:grid-cols-2 md:items-center md:gap-8 md:p-8">
            <div className="flex min-h-[190px] items-center rounded-3xl bg-gradient-to-br from-slate-50 to-purple-50 p-5 ring-1 ring-purple-100/60">
              <Illustration />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-purple-500">หัวข้อ {index + 1} / {SECTIONS.length}</div>
              <h3 className="mt-1 text-xl font-black text-gray-900">{section.title}</h3>
              <ol className="mt-4 space-y-3">
                {section.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-gray-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-black text-white">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setIndex(i => i - 1)} disabled={index === 0} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:invisible"><ChevronLeft size={16} /> ก่อนหน้า</button>
          <div className="flex gap-1.5">{SECTIONS.map((item, i) => <span key={item.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-purple-600' : 'w-1.5 bg-gray-300'}`} />)}</div>
          {index < SECTIONS.length - 1
            ? <button type="button" onClick={() => setIndex(i => i + 1)} className="flex items-center gap-1 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">ถัดไป <ChevronRight size={16} /></button>
            : <button type="button" onClick={onClose} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">เข้าใจแล้ว</button>}
        </div>
      </div>
    </div>
  );
}
