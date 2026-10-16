import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { CheckCircle2, Key, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth } from '../lib/firebase';
import { COURTS } from '../lib/appConfig';
import { submitAdminRequest } from '../lib/adminRequests';

const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500';

const signupErrorMessage = code => ({
  'auth/email-already-in-use': 'อีเมลนี้เคยสมัครแล้ว สมัครซ้ำหรือเปลี่ยนสนามไม่ได้ หากต้องการเปลี่ยนสนามให้ติดต่อ SuperAdmin',
  'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
  'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  'auth/operation-not-allowed': 'ระบบยังไม่เปิดให้สมัครด้วยอีเมล',
  'auth/too-many-requests': 'ลองหลายครั้งเกินไป กรุณารอสักครู่',
}[code] || 'สมัครไม่สำเร็จ กรุณาลองใหม่');

export default function LoginModal() {
  const {
    handleAdminLogin, isProcessing, loginEmail, loginError, loginPassword, setLoginEmail,
    setLoginPassword, setShowLoginModal,
  } = useApp();
  const [mode, setMode] = useState('login');
  const [signup, setSignup] = useState({ email: '', password: '', confirm: '', courtId: '' });
  const [signupError, setSignupError] = useState('');
  const [signupBusy, setSignupBusy] = useState(false);
  const [signupDone, setSignupDone] = useState(null);

  const handleSignup = async event => {
    event.preventDefault();
    setSignupError('');
    if (signup.password.length < 6) return setSignupError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    if (signup.password !== signup.confirm) return setSignupError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    if (!signup.courtId) return setSignupError('กรุณาเลือกสนามที่ต้องการดูแล');
    setSignupBusy(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, signup.email.trim(), signup.password);
      const { emailed } = await submitAdminRequest(credential.user, signup.courtId);
      setSignupDone({ courtName: COURTS.find(court => court.id === signup.courtId)?.name, emailed });
      setSignup({ email: '', password: '', confirm: '', courtId: '' });
    } catch (error) {
      console.error(error);
      setSignupError(error.code?.startsWith('auth/') ? signupErrorMessage(error.code) : 'สร้างบัญชีแล้ว แต่ส่งคำขอไม่สำเร็จ กดปุ่ม "ส่งคำขอ" ที่หน้าแรกอีกครั้ง');
    }
    setSignupBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 sm:rounded-3xl md:max-w-xl">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1">
          {[['login', 'เข้าสู่ระบบ'], ['signup', 'สมัครเป็นแอดมิน']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setMode(key)} className={`rounded-xl py-2 text-sm font-bold transition ${mode === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
          ))}
        </div>

        {mode === 'login' ? (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-1">เข้าสู่ระบบผู้ดูแล</h3>
            <p className="text-xs text-gray-500 mb-4">ระบบจะจำการล็อกอินไว้ 1 ชั่วโมง</p>
            {loginError && <div className="mb-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">{loginError}</div>}
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="อีเมล" required className={inputClass} />
              </div>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="รหัสผ่าน" required className={inputClass} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white text-sm disabled:opacity-50 transition-colors">เข้าสู่ระบบ</button>
              </div>
            </form>
          </>
        ) : signupDone ? (
          <div className="py-4 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <h3 className="mt-3 text-lg font-black text-gray-900">ส่งคำขอแล้ว</h3>
            <p className="mt-1 text-sm text-gray-600">ขอเป็นแอดมิน <b>{signupDone.courtName}</b> รอ SuperAdmin อนุมัติ</p>
            <p className="mt-1 text-xs text-gray-400">{signupDone.emailed ? 'แจ้งเตือน SuperAdmin ทางอีเมลแล้ว' : 'คำขอจะแสดงในหน้า SuperAdmin'} · อนุมัติแล้วจะใช้งานได้ทันที</p>
            <button type="button" onClick={() => setShowLoginModal(false)} className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white">ตกลง</button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-800 mb-1">สมัครเป็นแอดมินสนาม</h3>
            <p className="text-xs text-gray-500 mb-4">1 อีเมลเลือกได้ 1 สนามเท่านั้น และเปลี่ยนภายหลังไม่ได้ SuperAdmin ต้องอนุมัติก่อนใช้งาน</p>
            {signupError && <div className="mb-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">{signupError}</div>}
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="email" value={signup.email} onChange={e => setSignup(s => ({ ...s, email: e.target.value }))} placeholder="อีเมล" required className={inputClass} />
              </div>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="password" value={signup.password} onChange={e => setSignup(s => ({ ...s, password: e.target.value }))} placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" required autoComplete="new-password" className={inputClass} />
              </div>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input type="password" value={signup.confirm} onChange={e => setSignup(s => ({ ...s, confirm: e.target.value }))} placeholder="ยืนยันรหัสผ่าน" required autoComplete="new-password" className={inputClass} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700"><ShieldCheck size={14} className="text-purple-500" /> เลือกสนามที่ต้องการดูแล (เลือกได้ 1 สนาม)</div>
                <div className="grid grid-cols-2 gap-2">
                  {COURTS.map(court => (
                    <label key={court.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${signup.courtId === court.id ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border-gray-200 text-gray-600'}`}>
                      <input type="radio" name="admin-court" value={court.id} checked={signup.courtId === court.id} onChange={() => setSignup(s => ({ ...s, courtId: court.id }))} className="accent-purple-600" />
                      {court.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors">ยกเลิก</button>
                <button type="submit" disabled={signupBusy} className="flex-1 py-3 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white text-sm disabled:opacity-50 transition-colors">{signupBusy ? 'กำลังส่ง...' : 'ส่งคำขอ'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
