import { Activity, ArrowLeft, BookOpen, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import HomeSplash from './home/HomeSplash';
import CommunityOverlay from './home/CommunityOverlay';
import LoginModal from './LoginModal';
import AdminRequestStatus from './home/AdminRequestStatus';
import { useApp } from '../context/AppContext';

export default function HomeScreen() {
  const {
    communityAvatar, communityAvatars, communityOpen, guideModal, handleAddCommunityAvatar,
    handleLogout, isLoggedInAdmin, isProcessing, selectCourt, setCommunityAvatar,
    setCommunityOpen, setShowGuide, setShowLoginModal, setSuperAdminShowHome, showLoginModal,
    showSplash, user, userRole, visibleCourts,
  } = useApp();

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }} className="min-h-screen w-full bg-gray-50 text-gray-800 px-5 py-10 md:px-12 md:py-14 relative overflow-hidden">
      {showSplash && <HomeSplash />}

      <div className="relative z-10 mx-auto max-w-7xl pt-8 pb-6 text-center">
        <h1 aria-label="BADBEAOW" className="flex items-end justify-center text-5xl md:text-7xl font-black tracking-tight leading-none">
          {'BADBEAOW'.split('').map((letter, index) => letter === 'A' ? (
            <img key={index} src="/shuttlecock-a.png" alt="" aria-hidden="true" className="h-[1.05em] w-auto rotate-180 mx-[0.02em] drop-shadow-[0_3px_6px_rgba(79,70,229,0.35)]" />
          ) : (
            <span key={index} aria-hidden="true" className="bg-gradient-to-b from-purple-600 to-indigo-600 bg-clip-text text-transparent">{letter}</span>
          ))}
        </h1>
        <p className="text-sm text-gray-500 mt-2">เลือกคอร์ดเพื่อเข้าสู่ระบบจัดการคิว</p>
      </div>

      <section className="hidden">
        <div className="relative min-h-[310px] overflow-hidden rounded-3xl bg-[#dff4f0] shadow-inner">
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10"><div className="rounded-2xl bg-white/85 px-5 py-4 text-center shadow-lg backdrop-blur-sm"><div className="text-sm font-black text-slate-900">พื้นที่คอมมูสนามแบด</div><div className="mt-1 text-[11px] text-gray-500">กดปุ่มด้านข้างเพื่อเปิดหน้าคอมมูโดยเฉพาะ</div></div></div>
          <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-slate-950/75 px-3 py-2 text-white backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-black"><Activity size={15} className="text-emerald-300" /> สนามคอมมู 3D</div>
            <div className="mt-1 text-[10px] text-white/70">ผู้เล่นในสนาม {communityAvatars.length} คน</div>
          </div>
        </div>
        <div className="flex flex-col justify-center p-2 md:p-3">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-600"><Sparkles size={15} /> สร้างตัวละครของคุณ</div>
          <h2 className="mt-2 text-xl font-black text-slate-900">เข้าคอมมูสนามแบด</h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">เพิ่มตัวละครก่อน แล้วเข้าชมคอมมูเพื่อดูผู้เล่นเดินเล่นและทำกิจกรรมในสนาม</p>
          <label className="mt-4 text-[11px] font-bold text-gray-600">ชื่อที่แสดง<input value={communityAvatar.name} maxLength={22} onChange={event => setCommunityAvatar(current => ({ ...current, name: event.target.value || 'นักแบดสายฟ้า' }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-indigo-400" placeholder="เช่น น้องลูกขนไก่" /></label>
          <label className="mt-3 text-[11px] font-bold text-gray-600">คำอธิบายสั้น ๆ<input value={communityAvatar.description} maxLength={36} onChange={event => setCommunityAvatar(current => ({ ...current, description: event.target.value || 'ชอบตีเร็วและเล่นสนุก' }))} className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="เช่น มือใหม่สายบุก" /></label>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[['shirt', 'เสื้อ'], ['pants', 'กางเกง'], ['hair', 'ผม']].map(([key, label]) => <label key={key} className="text-[10px] font-bold text-gray-600">{label}<input type="color" value={communityAvatar[key]} onChange={event => setCommunityAvatar(current => ({ ...current, [key]: event.target.value }))} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1" /></label>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-gray-600">เพศตัวละคร<select value={communityAvatar.gender} onChange={event => setCommunityAvatar(current => ({ ...current, gender: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"><option>ชาย</option><option>หญิง</option><option>เพศทางเลือก</option></select></label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={handleAddCommunityAvatar} disabled={isProcessing} className="rounded-xl bg-indigo-600 py-2.5 text-xs font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-50">{isProcessing ? 'กำลังเพิ่ม...' : 'เพิ่มเข้าคอมมู'}</button>
            <button type="button" onClick={() => setCommunityOpen(true)} className="rounded-xl border border-indigo-200 bg-white py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-50">เปิดหน้าคอมมู</button>
          </div>
          {communityAvatars.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{communityAvatars.map(avatar => <span key={avatar.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{avatar.name}</span>)}</div>}
        </div>
      </section>

      <button type="button" onClick={() => setCommunityOpen(true)} className="relative z-10 mx-auto mb-8 flex w-full max-w-5xl items-center justify-between rounded-3xl border border-white/70 bg-gradient-to-r from-slate-950 via-indigo-950 to-emerald-950 p-5 text-left text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl md:p-7">
        <span><span className="flex items-center gap-2 text-xs font-bold text-emerald-300"><Activity size={16} /> COMMUNITY SPORTS WORLD</span><strong className="mt-2 block text-xl font-black">เข้าสู่ลานกีฬาชุมชน</strong><small className="mt-1 block text-xs text-white/65">สำรวจศูนย์กีฬา 3D ดูสนามแบด บาส ฟุตซอล โซนพัก และตัวละครผู้เล่น</small></span><ArrowLeft size={24} className="rotate-180 text-emerald-300" />
      </button>

      {communityOpen && <CommunityOverlay />}

      <div className="relative z-10 mx-auto max-w-7xl space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:max-w-5xl">
        {visibleCourts.map(courtItem => (
          <button
            key={courtItem.id}
            onClick={() => selectCourt(courtItem.id)}
            className={`w-full bg-gradient-to-r ${courtItem.accent} text-white rounded-2xl p-5 flex items-center justify-between shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-left`}
          >
            <span>
              <span className="block text-lg font-bold">{courtItem.name}</span>
              <span className="block text-xs text-white/75 mt-1">เข้าสู่ระบบจัดการคิว</span>
            </span>
            <ArrowLeft size={20} className="rotate-180" />
          </button>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl md:max-w-5xl">
      <button
        onClick={() => setShowGuide(true)}
        className="w-full mt-5 bg-white border border-purple-100 text-purple-700 rounded-2xl py-3.5 font-bold text-sm shadow-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
      >
        <BookOpen size={18} /> คู่มือการใช้งาน
      </button>

      {userRole === 'superAdmin' && user?.email && (
        <button
          onClick={() => setSuperAdminShowHome(false)}
          className="w-full mt-6 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl py-3.5 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck size={18} /> กลับศูนย์ควบคุม SuperAdmin
        </button>
      )}

      {user?.email && !isLoggedInAdmin && <AdminRequestStatus />}

      {isLoggedInAdmin || user?.email ? (
        <button
          onClick={() => handleLogout(false)}
          className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl py-3.5 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isLoggedInAdmin ? 'ออกจากระบบแอดมิน' : 'ออกจากระบบ'}
        </button>
      ) : (
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck size={18} /> เข้าสู่ระบบแอดมิน
        </button>
      )}
      </div>

      {showLoginModal && <LoginModal />}
      {guideModal}
    </div>
  );
}
