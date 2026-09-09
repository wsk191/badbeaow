import { useState, useEffect, useMemo } from 'react';
import { 
    Users, Wallet, ArrowUp, ArrowDown, ArrowLeft, Plus, Trash2, Swords,
    UserPlus, Coins, ShieldCheck, Trophy, 
    X, Receipt, Check, Lock, LogOut, Mail, Key, Search, AlertTriangle, Minus, Edit2, GripVertical, LayoutDashboard, MoreHorizontal, ChevronDown, BookOpen
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { getDatabase, ref, onValue, push, update, remove, set, get } from 'firebase/database';

const COURTS = [
  { id: 'court-1', name: 'คอร์ด 1', accent: 'from-violet-700 to-indigo-900', solid: 'bg-violet-600', text: 'text-violet-600' },
  { id: 'court-2', name: 'คอร์ด 2', accent: 'from-amber-500 to-orange-700', solid: 'bg-amber-600', text: 'text-amber-600' },
  { id: 'court-3', name: 'คอร์ด 3', accent: 'from-emerald-600 to-teal-900', solid: 'bg-emerald-600', text: 'text-emerald-600' },
  { id: 'court-4', name: 'คอร์ด 4', accent: 'from-sky-600 to-blue-900', solid: 'bg-sky-600', text: 'text-sky-600' },
];

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCSbR4h0L-wB2dIS7Z5RuzTn9v1wfq51Q",
  authDomain: "badbeaow.firebaseapp.com",
  databaseURL: "https://badbeaow-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "badbeaow",
  storageBucket: "badbeaow.firebasestorage.app",
  messagingSenderId: "1084223380159",
  appId: "1:1084223380159:web:ce648eb62992e59eb6040a",
  measurementId: "G-4FGWG5VME1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app, "https://badbeaow-default-rtdb.asia-southeast1.firebasedatabase.app");

const getTodayKey = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
}).format(new Date());

export default function BadmintonApp() {
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [managedAdminIds, setManagedAdminIds] = useState({});
  const [assignedCourtIds, setAssignedCourtIds] = useState([]);
  const [superAdminSection, setSuperAdminSection] = useState('dashboard');
  const [superAdminCourtId, setSuperAdminCourtId] = useState('court-1');
  const [expandedCourtIds, setExpandedCourtIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);

  // Admin Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Database State
  const [players, setPlayers] = useState([]);
  const [allCourtPlayers, setAllCourtPlayers] = useState({});
  const [dashboardData, setDashboardData] = useState({});
  const [queue, setQueue] = useState([]);
  const [court, setCourt] = useState({ teamA: null, teamB: null });

  // Local UI State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draftPair, setDraftPair] = useState([null, null]);
  const [totalCourtBill, setTotalCourtBill] = useState('');
  const [paymentInputs, setPaymentInputs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ message: null, type: 'success' });
  const [highlightedQueueId, setHighlightedQueueId] = useState(null);
  const [queueToDelete, setQueueToDelete] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [showDeleteAllPlayersModal, setShowDeleteAllPlayersModal] = useState(false);
  const [adminUidInput, setAdminUidInput] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // Edit Player State
  const [playerToEdit, setPlayerToEdit] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');

  // Drag and Drop State
  const [draggedQueueIdx, setDraggedQueueIdx] = useState(null);
  const [dragOverQueueIdx, setDragOverQueueIdx] = useState(null);

  // Search State
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
  const [searchDraftQuery, setSearchDraftQuery] = useState('');
  const [leaderboardScope, setLeaderboardScope] = useState('court');
  const [todayKey, setTodayKey] = useState(getTodayKey);

  const selectedCourt = COURTS.find(courtItem => courtItem.id === selectedCourtId);
  const getCourtRoot = (courtId = selectedCourtId) => courtId === 'court-1'
    ? 'badbeaow'
    : `badbeaow/courts/${courtId}`;
  const courtRoot = getCourtRoot();

  // ฟังก์ชันคำนวณระดับพลังจากจำนวนรอบที่ชนะ
  const getPowerLevel = (wins = 0) => {
    if (wins >= 40) return { label: 'ระดับเทพ 👑', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    if (wins >= 30) return { label: 'มือแข็ง 🔥', color: 'bg-orange-100 text-orange-700 border-orange-300' };
    if (wins >= 20) return { label: 'มือกลาง ⚡', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    if (wins >= 10) return { label: 'พอตีได้ 🏸', color: 'bg-green-100 text-green-700 border-green-300' };
    return { label: 'มือใหม่ 🌱', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  };

  // Inject Tailwind CSS CDN, Fonts, Animations, and Mobile Drag&Drop Polyfill
  useEffect(() => {
    const tailwindScript = document.createElement('script');
    tailwindScript.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(tailwindScript);

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes highlight-glow {
        0%, 100% { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); background-color: #ffffff; border-color: #f3f4f6; transform: scale(1); }
        50% { box-shadow: 0 0 25px rgba(168, 85, 247, 0.7); background-color: #faf5ff; border-color: #9333ea; transform: scale(1.02); }
      }
      .queue-highlight {
        animation: highlight-glow 1s ease-in-out 3;
        z-index: 10;
        position: relative;
      }
      @keyframes jelly-bounce {
        0% { transform: translate(-50%, -20px) scale(0.8); opacity: 0; }
        40% { transform: translate(-50%, 5px) scale(1.05); opacity: 1; }
        70% { transform: translate(-50%, -3px) scale(0.97); }
        100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
      }
      .splash-title {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        white-space: nowrap;
        -webkit-text-stroke: 1px rgba(255, 255, 255, 0.45);
        paint-order: stroke fill;
      }
      @keyframes splash-letter {
        0% { opacity: 0; color: #ffffff; transform: translateZ(260px) scale(2.2); text-shadow: none; }
        60% { opacity: 1; color: #ffffff; transform: translateZ(20px) scale(1.05); text-shadow: 0 0 16px rgba(255, 255, 255, 0.9); }
        68% { opacity: 1; color: #ff9f43; transform: translateZ(0) scale(1); text-shadow: 0 0 10px rgba(255, 159, 67, 0.55); }
        88% { opacity: 1; color: #ff9f43; transform: translateZ(0) scale(1); text-shadow: 0 0 10px rgba(255, 159, 67, 0.55); }
        100% { opacity: 1; color: #ef3f35; transform: translateZ(0) scale(1); text-shadow: 0 0 8px rgba(239, 63, 53, 0.45); }
      }
      @keyframes splash-a-flicker {
        0%, 7%, 15%, 22%, 39%, 47%, 64%, 72%, 100% { text-shadow: 0 0 9px rgba(239, 63, 53, 0.7), 0 0 22px rgba(239, 63, 53, 0.4); opacity: 1; }
        8%, 14%, 23%, 38%, 48%, 63%, 73%, 78% { text-shadow: none; opacity: 0.55; }
        79%, 86% { text-shadow: 0 0 14px rgba(255, 125, 72, 0.95), 0 0 32px rgba(239, 63, 53, 0.75); opacity: 1; }
      }
      .splash-letter {
        display: inline-block;
        transform-origin: center;
        animation: splash-letter 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .splash-a-glow {
        animation: splash-letter 1.1s cubic-bezier(0.16, 1, 0.3, 1) both, splash-a-flicker 1.8s steps(1, end) 0.9s infinite;
      }
      .splash-letter:nth-child(1) { animation-delay: 0s; }
      .splash-letter:nth-child(2) { animation-delay: 0.13s; }
      .splash-letter:nth-child(3) { animation-delay: 0.26s; }
      .splash-letter:nth-child(4) { animation-delay: 0.39s; }
      .splash-letter:nth-child(5) { animation-delay: 0.52s; }
      .splash-letter:nth-child(6) { animation-delay: 0.65s; }
      .splash-letter:nth-child(7) { animation-delay: 0.78s; }
      .splash-letter:nth-child(8) { animation-delay: 0.91s; }
      @keyframes splash-screen-exit {
        0%, 100% { opacity: 1; }
      }
      @keyframes splash-o-impact {
        0%, 100% { transform: scale(1) rotate(0); }
        18% { transform: scale(1.12) rotate(-7deg); }
        38% { transform: scale(0.88) rotate(6deg); }
        62% { transform: scale(1.05) rotate(-3deg); }
        82% { transform: scale(0.96) rotate(2deg); }
      }
      .splash-o-impact {
        position: relative;
        z-index: 3;
        animation: splash-o-impact 0.55s ease-out both;
      }
      .splash-o-impact::after {
        content: '';
        position: absolute;
        top: -8%;
        left: 48%;
        width: 2px;
        height: 116%;
        background: rgba(255, 255, 255, 0.9);
        transform: rotate(24deg);
        box-shadow: 5px 16px 0 -0.5px rgba(255, 255, 255, 0.8);
      }
      @keyframes splash-light-flash {
        0%, 42% { opacity: 0; }
        62% { opacity: 0.95; }
        100% { opacity: 0; }
      }
      .splash-screen-exiting {
        animation: splash-screen-exit 0.5s ease-in forwards;
      }
      .splash-screen-exiting::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: #ffffff;
        animation: splash-light-flash 0.5s ease-out forwards;
      }
      .splash-screen-exiting .splash-title {
        position: relative;
        z-index: 2;
      }
      .animate-jelly {
        animation: jelly-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      /* ป้องกันการคลุมดำข้อความและหน้าจอเลื่อนตอนลากในมือถือ */
      .queue-item {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .drag-handle {
          touch-action: none; /* ห้ามหน้าจอขยับเวลาแตะลากตรงไอคอนนี้ */
      }
      .court-theme-court-2 .text-purple-600 { color: #b45309 !important; }
      .court-theme-court-2 .text-purple-700 { color: #92400e !important; }
      .court-theme-court-2 .text-purple-500 { color: #d97706 !important; }
      .court-theme-court-2 .text-purple-300 { color: #fed7aa !important; }
      .court-theme-court-2 .bg-purple-50 { background-color: #fffbeb !important; }
      .court-theme-court-2 .bg-purple-100 { background-color: #fef3c7 !important; }
      .court-theme-court-2 .bg-purple-500 { background-color: #d97706 !important; }
      .court-theme-court-2 .bg-purple-600 { background-color: #d97706 !important; }
      .court-theme-court-2 .bg-purple-700 { background-color: #b45309 !important; }
      .court-theme-court-2 .hover\:bg-purple-700:hover { background-color: #b45309 !important; }
      .court-theme-court-2 .border-purple-100 { border-color: #fde68a !important; }
      .court-theme-court-2 .border-purple-200 { border-color: #fcd34d !important; }
      .court-theme-court-2 .border-purple-500 { border-color: #d97706 !important; }
      .court-theme-court-3 .text-purple-600 { color: #047857 !important; }
      .court-theme-court-3 .text-purple-700 { color: #065f46 !important; }
      .court-theme-court-3 .text-purple-500 { color: #059669 !important; }
      .court-theme-court-3 .text-purple-300 { color: #a7f3d0 !important; }
      .court-theme-court-3 .bg-purple-50 { background-color: #ecfdf5 !important; }
      .court-theme-court-3 .bg-purple-100 { background-color: #d1fae5 !important; }
      .court-theme-court-3 .bg-purple-500 { background-color: #059669 !important; }
      .court-theme-court-3 .bg-purple-600 { background-color: #059669 !important; }
      .court-theme-court-3 .bg-purple-700 { background-color: #047857 !important; }
      .court-theme-court-3 .hover\:bg-purple-700:hover { background-color: #047857 !important; }
      .court-theme-court-3 .border-purple-100 { border-color: #a7f3d0 !important; }
      .court-theme-court-3 .border-purple-200 { border-color: #6ee7b7 !important; }
      .court-theme-court-3 .border-purple-500 { border-color: #059669 !important; }
      .court-theme-court-4 .text-purple-600 { color: #0369a1 !important; }
      .court-theme-court-4 .text-purple-700 { color: #075985 !important; }
      .court-theme-court-4 .text-purple-500 { color: #0284c7 !important; }
      .court-theme-court-4 .text-purple-300 { color: #bae6fd !important; }
      .court-theme-court-4 .bg-purple-50 { background-color: #f0f9ff !important; }
      .court-theme-court-4 .bg-purple-100 { background-color: #e0f2fe !important; }
      .court-theme-court-4 .bg-purple-500 { background-color: #0284c7 !important; }
      .court-theme-court-4 .bg-purple-600 { background-color: #0284c7 !important; }
      .court-theme-court-4 .bg-purple-700 { background-color: #0369a1 !important; }
      .court-theme-court-4 .hover\:bg-purple-700:hover { background-color: #0369a1 !important; }
      .court-theme-court-4 .border-purple-100 { border-color: #bae6fd !important; }
      .court-theme-court-4 .border-purple-200 { border-color: #7dd3fc !important; }
      .court-theme-court-4 .border-purple-500 { border-color: #0284c7 !important; }
    `;
    document.head.appendChild(style);

    // ฝัง Mobile Drag and Drop Polyfill ให้รองรับมือถือ
    const polyfillScript = document.createElement('script');
    polyfillScript.src = 'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/index.min.js';
    const polyfillStyle = document.createElement('link');
    polyfillStyle.rel = 'stylesheet';
    polyfillStyle.href = 'https://cdn.jsdelivr.net/npm/mobile-drag-drop@2.3.0-rc.2/default.css';
    
    document.head.appendChild(polyfillScript);
    document.head.appendChild(polyfillStyle);

    polyfillScript.onload = () => {
        if (window.MobileDragDrop) {
            window.MobileDragDrop.polyfill({
                dragImageTranslateOverride: window.MobileDragDrop.scrollBehaviourDragImageTranslateOverride,
                holdToDrag: 100 // ลดเวลาลงอีก เพื่อให้ตอบสนองไวขึ้นบนมือถือ
            });
            window.addEventListener('touchmove', function() {}, {passive: false});
        }
    };

    return () => {
      document.head.removeChild(tailwindScript);
      document.head.removeChild(link);
      document.head.removeChild(style);
      document.head.removeChild(polyfillScript);
      document.head.removeChild(polyfillStyle);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: 'success' }), 2000);
  };

  // Auth & Realtime Sync
  useEffect(() => {
    setSplashComplete(false);
    setSplashExiting(false);
    const splashDuration = selectedCourtId ? 3000 : 4000;
    const exitTimer = setTimeout(() => setSplashExiting(true), splashDuration - 500);
    const splashTimer = setTimeout(() => setSplashComplete(true), splashDuration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(splashTimer);
    };
  }, [selectedCourtId]);

  useEffect(() => {
    const dateTimer = setInterval(() => {
      const nextDateKey = getTodayKey();
      setTodayKey(previousDateKey => previousDateKey === nextDateKey ? previousDateKey : nextDateKey);
    }, 60000);

    return () => clearInterval(dateTimer);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        try {
          const roleSnapshot = await get(ref(db, `users/${currentUser.uid}/role`));
          const role = roleSnapshot.val() || 'user';
          const adminChecks = await Promise.all(COURTS.map(async (courtItem) => {
            try {
              const snapshot = await get(ref(db, `boardAdmins/${courtItem.id}/${currentUser.uid}`));
              return snapshot.val() === true ? courtItem.id : null;
            } catch (error) {
              console.error(`Court access lookup error (${courtItem.id}):`, error);
              return null;
            }
          }));
          const courtIds = adminChecks.filter(Boolean);
          setUserRole(role);
          setAssignedCourtIds(role === 'superAdmin' ? COURTS.map(courtItem => courtItem.id) : courtIds);
          if (role === 'superAdmin') setActiveTab('dashboard');
          if (role !== 'superAdmin' && courtIds.length === 1) {
            setSelectedCourtId(courtIds[0]);
          }
        } catch (error) {
          console.error('Role lookup error:', error);
          setUserRole('user');
          setAssignedCourtIds([]);
        }
      } else if (currentUser) {
        setUserRole('user');
        setAssignedCourtIds([]);
        setIsAdmin(false);
      } else {
        setUserRole('user');
        setAssignedCourtIds([]);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const adminCourtId = selectedCourtId || (userRole === 'superAdmin' ? superAdminCourtId : null);
    if (!user || !adminCourtId) {
      setManagedAdminIds({});
      setIsAdmin(false);
      return;
    }

    const adminsRef = ref(db, `boardAdmins/${adminCourtId}`);
    setIsAdmin(userRole === 'superAdmin' || managedAdminIds[user.uid] === true);
    const unsubscribe = onValue(adminsRef, (snapshot) => {
      const admins = snapshot.val() || {};
      setManagedAdminIds(admins);
      setIsAdmin(userRole === 'superAdmin' || admins[user.uid] === true);
    }, (error) => {
      console.error('Board admin lookup error:', error);
      setManagedAdminIds({});
      setIsAdmin(userRole === 'superAdmin');
    });

    return () => unsubscribe();
  }, [user, userRole, selectedCourtId, superAdminCourtId]);

  // Admin Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsProcessing(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const roleSnapshot = await get(ref(db, `users/${credential.user.uid}/role`));
      const role = roleSnapshot.val() || 'user';
      const adminChecks = await Promise.all(COURTS.map(async (courtItem) => {
        try {
          const snapshot = await get(ref(db, `boardAdmins/${courtItem.id}/${credential.user.uid}`));
          return snapshot.val() === true ? courtItem.id : null;
        } catch (error) {
          return null;
        }
      }));
      const courtIds = adminChecks.filter(Boolean);
      const isCourtAdmin = selectedCourtId ? courtIds.includes(selectedCourtId) : courtIds.length > 0;
      const hasAdminAccess = role === 'superAdmin' || isCourtAdmin;

      setUser(credential.user);
      setUserRole(role);
      setAssignedCourtIds(role === 'superAdmin' ? COURTS.map(courtItem => courtItem.id) : courtIds);
      setIsAdmin(hasAdminAccess);
      if (role === 'superAdmin') {
        setSelectedCourtId(null);
        setSuperAdminSection('dashboard');
        setActiveTab('dashboard');
      }
      if (role !== 'superAdmin' && courtIds.length === 1) {
        setSelectedCourtId(courtIds[0]);
      }

      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      if (role === 'superAdmin') {
        showToast('เข้าสู่ระบบ SuperAdmin สำเร็จ', 'success');
      } else if (isCourtAdmin) {
        showToast(`เข้าสู่ระบบ Admin ${selectedCourt?.name || 'ประจำคอร์ด'} สำเร็จ`, 'success');
      } else {
        showToast(selectedCourt
          ? `เข้าสู่ระบบสำเร็จ แต่บัญชีนี้ยังไม่มีสิทธิ์ ${selectedCourt.name}`
          : 'เข้าสู่ระบบสำเร็จ แต่บัญชีนี้ไม่มีสิทธิ์ SuperAdmin', 'error');
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'PERMISSION_DENIED') {
        setLoginError('ล็อกอินสำเร็จ แต่ระบบอ่านสิทธิ์ไม่ได้ กรุณา Publish Rules และตรวจ UID');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setLoginError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    }
    setIsProcessing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      setUserRole('user');
      setAssignedCourtIds([]);
      setIsAdmin(false);
      showToast('ออกจากระบบแอดมินแล้ว', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user || !selectedCourtId) return;

    const playersRef = ref(db, `${courtRoot}/players`);
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const stalePresenceUpdates = {};
        const loadedPlayers = Object.keys(data).map(key => {
          const player = data[key];
          const isFromToday = player.attendanceDate === todayKey;
          if (!isFromToday) {
            stalePresenceUpdates[`${key}/isPresent`] = false;
            stalePresenceUpdates[`${key}/attendanceDate`] = todayKey;
          }
          return {
            id: key,
            ...player,
            isPresent: isFromToday ? Boolean(player.isPresent) : false,
            attendanceDate: todayKey,
          };
        });
        loadedPlayers.sort((a, b) => a.name.localeCompare(b.name));
        setPlayers(loadedPlayers);
        if (Object.keys(stalePresenceUpdates).length > 0) {
          update(playersRef, stalePresenceUpdates).catch(error => console.error('Attendance reset error:', error));
        }
      } else {
        setPlayers([]);
      }
      setLoading(false);
    });

    const queueRef = ref(db, `${courtRoot}/queue`);
    const unsubQueue = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedQueue = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        loadedQueue.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setQueue(loadedQueue);
      } else {
        setQueue([]);
      }
    });

    const courtRef = ref(db, `${courtRoot}/court`);
    const unsubCourt = onValue(courtRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCourt(data);
      } else {
        set(courtRef, { teamA: null, teamB: null });
      }
    });

    return () => {
      unsubPlayers();
      unsubQueue();
      unsubCourt();
    };
  }, [user, selectedCourtId, courtRoot, todayKey]);

  useEffect(() => {
    if (!user || activeTab !== 'leaderboard') return;

    const unsubscribers = COURTS.map(courtItem => {
      const playersRef = ref(db, `${getCourtRoot(courtItem.id)}/players`);
      return onValue(playersRef, (snapshot) => {
        const data = snapshot.val() || {};
        const loadedPlayers = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          courtId: courtItem.id,
          courtName: courtItem.name,
        }));
        setAllCourtPlayers(previous => ({ ...previous, [courtItem.id]: loadedPlayers }));
      });
    });

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;

    const unsubscribers = COURTS.flatMap((courtItem) => {
      const root = getCourtRoot(courtItem.id);
      const updateDashboard = (key, value) => {
        setDashboardData(previous => ({
          ...previous,
          [courtItem.id]: { ...(previous[courtItem.id] || {}), [key]: value },
        }));
      };
      const playersUnsubscribe = onValue(ref(db, `${root}/players`), (snapshot) => {
        const data = snapshot.val() || {};
        updateDashboard('players', Object.values(data));
      });
      const queueUnsubscribe = onValue(ref(db, `${root}/queue`), (snapshot) => {
        updateDashboard('queueCount', snapshot.exists() ? Object.keys(snapshot.val()).length : 0);
      });
      const courtUnsubscribe = onValue(ref(db, `${root}/court`), (snapshot) => {
        updateDashboard('court', snapshot.val() || { teamA: null, teamB: null });
      });
      return [playersUnsubscribe, queueUnsubscribe, courtUnsubscribe];
    });

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [user, userRole, activeTab]);

  const presentPlayers = useMemo(() => players.filter(p => p.isPresent), [players]);
  
  const busyPlayerIds = useMemo(() => {
    const ids = new Set();
    queue.forEach(q => { if (q.pair) q.pair.forEach(p => p && ids.add(p.id)); });
    if (court.teamA) court.teamA.forEach(p => p && ids.add(p.id));
    if (court.teamB) court.teamB.forEach(p => p && ids.add(p.id));
    return ids;
  }, [queue, court]);

  const availablePlayers = useMemo(() => {
    return presentPlayers.filter(p => !busyPlayerIds.has(p.id));
  }, [presentPlayers, busyPlayerIds]);

  const filteredAvailablePlayers = useMemo(() => {
    if (!searchDraftQuery.trim()) return availablePlayers;
    const lowerQuery = searchDraftQuery.toLowerCase();
    return availablePlayers.filter(p => p.name.toLowerCase().includes(lowerQuery));
  }, [availablePlayers, searchDraftQuery]);

  const filteredPlayersList = useMemo(() => {
      if (!searchPlayerQuery.trim()) return players;
      const lowerQuery = searchPlayerQuery.toLowerCase();
      return players.filter(p => p.name.toLowerCase().includes(lowerQuery));
  }, [players, searchPlayerQuery]);

  const suggestedPlayers = useMemo(() => {
      if (!newPlayerName.trim()) return [];
      const lowerQuery = newPlayerName.toLowerCase();
      return players.filter(p => p.name.toLowerCase().includes(lowerQuery));
  }, [players, newPlayerName]);

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || '';

  const selectCourt = (courtId) => {
    setSelectedCourtId(courtId);
    setActiveTab('queue');
    setPlayers([]);
    setQueue([]);
    setCourt({ teamA: null, teamB: null });
    setDraftPair([null, null]);
    setAllCourtPlayers({});
  };

  const handleAddCourtAdmin = async (e) => {
    e.preventDefault();
    if (userRole !== 'superAdmin') return;
    const targetCourtId = selectedCourtId || superAdminCourtId;
    const adminUid = adminUidInput.trim();
    if (!adminUid) return;

    setIsProcessing(true);
    try {
      await set(ref(db, `boardAdmins/${targetCourtId}/${adminUid}`), true);
      setAdminUidInput('');
      showToast('เพิ่มผู้ดูแลคอร์ดเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      showToast('เพิ่มผู้ดูแลคอร์ดไม่สำเร็จ', 'error');
    }
    setIsProcessing(false);
  };

  const handleRemoveCourtAdmin = async (adminUid) => {
    if (userRole !== 'superAdmin') return;
    const targetCourtId = selectedCourtId || superAdminCourtId;

    setIsProcessing(true);
    try {
      await remove(ref(db, `boardAdmins/${targetCourtId}/${adminUid}`));
      showToast('ถอดสิทธิ์ผู้ดูแลคอร์ดแล้ว', 'success');
    } catch (error) {
      console.error(error);
      showToast('ถอดสิทธิ์ไม่สำเร็จ', 'error');
    }
    setIsProcessing(false);
  };

  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (b.wins || 0) - (a.wins || 0));
  }, [players]);

  const rankedAllCourtPlayers = useMemo(() => {
    const combinedPlayers = new Map();
    Object.values(allCourtPlayers).flat().forEach(player => {
      const playerKey = player.name.trim().toLowerCase();
      const existingPlayer = combinedPlayers.get(playerKey);
      if (existingPlayer) {
        existingPlayer.wins += player.wins || 0;
        existingPlayer.courts.push(player.courtName);
      } else {
        combinedPlayers.set(playerKey, {
          ...player,
          id: `all-${playerKey}`,
          wins: player.wins || 0,
          courts: [player.courtName],
        });
      }
    });
    return [...combinedPlayers.values()].sort((a, b) => b.wins - a.wins);
  }, [allCourtPlayers]);

  const leaderboardPlayers = leaderboardScope === 'all' ? rankedAllCourtPlayers : rankedPlayers;

  const dashboardSummary = useMemo(() => {
    const courtSummaries = COURTS.map((courtItem) => {
      const data = dashboardData[courtItem.id] || {};
      const playersInCourt = data.players || [];
      const activeCourt = data.court || {};
      const debtTotal = playersInCourt.reduce((total, player) => total + (Number(player.debt) || 0), 0);
      return {
        ...courtItem,
        playerCount: playersInCourt.length,
        presentCount: playersInCourt.filter(player => player.isPresent && player.attendanceDate === todayKey).length,
        queueCount: data.queueCount || 0,
        debtTotal,
        isPlaying: Boolean(activeCourt.teamA || activeCourt.teamB),
      };
    });
    return {
      courts: courtSummaries,
      playerCount: courtSummaries.reduce((total, courtItem) => total + courtItem.playerCount, 0),
      presentCount: courtSummaries.reduce((total, courtItem) => total + courtItem.presentCount, 0),
      queueCount: courtSummaries.reduce((total, courtItem) => total + courtItem.queueCount, 0),
      debtTotal: courtSummaries.reduce((total, courtItem) => total + courtItem.debtTotal, 0),
      playingCount: courtSummaries.filter(courtItem => courtItem.isPlaying).length,
    };
  }, [dashboardData, todayKey]);

  // --- Drag & Drop Handlers สำหรับจัดคิว ---
  const handleDragStart = (e, index) => {
    if (!isAdmin) {
      e.preventDefault();
      return;
    }
    setDraggedQueueIdx(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // สำคัญมากสำหรับมือถือ: setData เพื่อให้ Drag API ทำงานได้
      e.dataTransfer.setData('text/plain', index.toString()); 
    }
  };

  const handleDragEnter = (e, index) => {
    if (!isAdmin) return;
    e.preventDefault();
    if (dragOverQueueIdx !== index) {
      setDragOverQueueIdx(index);
    }
  };

  const handleDragOver = (e, index) => {
    if (!isAdmin) return;
    e.preventDefault(); 
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverQueueIdx !== index) {
      setDragOverQueueIdx(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedQueueIdx(null);
    setDragOverQueueIdx(null);
  };

  const handleDrop = async (e, dropIndex) => {
    if (!isAdmin) return;
    e.preventDefault();
    
    const dragIdx = draggedQueueIdx;
    setDraggedQueueIdx(null);
    setDragOverQueueIdx(null);

    if (dragIdx === null || dragIdx === dropIndex) return;

    setIsProcessing(true);
    try {
      const newQueue = [...queue];
      const [draggedItem] = newQueue.splice(dragIdx, 1);
      newQueue.splice(dropIndex, 0, draggedItem); 

      const updates = {};
      newQueue.forEach((q, i) => {
        updates[`${q.id}/sortOrder`] = (i + 1) * 100;
        if (q.id === draggedItem.id) {
          updates[`${q.id}/isMoved`] = true;
          updates[`${q.id}/moveDirection`] = dropIndex < dragIdx ? 'up' : 'down';
        }
      });

      await update(ref(db, `${courtRoot}/queue`), updates);
      
      setHighlightedQueueId(draggedItem.id);
      setTimeout(() => setHighlightedQueueId(null), 3000);
    } catch (error) {
      console.error(error);
    }
    setIsProcessing(false);
  };
  // ----------------------------------------

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    const isDuplicate = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      showToast('มีชื่อผู้เล่นนี้อยู่ในระบบแล้ว', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const playersRef = ref(db, `${courtRoot}/players`);
      await push(playersRef, { name: trimmedName, isPresent: true, attendanceDate: todayKey, debt: 0, wins: 0 });
      setNewPlayerName('');
      showToast('เพิ่มผู้เล่นสำเร็จ!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleEditPlayerClick = (player) => {
    if (!isAdmin) return;
    setPlayerToEdit(player);
    setEditPlayerName(player.name);
  };

  const confirmEditPlayer = async () => {
    if (!playerToEdit || !isAdmin) return;
    const trimmedName = editPlayerName.trim();
    if (!trimmedName) return;

    const isDuplicate = players.some(p => p.id !== playerToEdit.id && p.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      showToast('ชื่อนี้มีอยู่ในระบบแล้ว', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await update(ref(db, `${courtRoot}/players/${playerToEdit.id}`), { name: trimmedName });

      const queueUpdates = {};
      queue.forEach(q => {
          if (q.pair) {
              const pIndex = q.pair.findIndex(p => p.id === playerToEdit.id);
              if (pIndex !== -1) {
                  queueUpdates[`${q.id}/pair/${pIndex}/name`] = trimmedName;
              }
          }
      });
      if (Object.keys(queueUpdates).length > 0) {
          await update(ref(db, `${courtRoot}/queue`), queueUpdates);
      }

      const courtUpdates = {};
      if (court.teamA) {
          const pIndex = court.teamA.findIndex(p => p.id === playerToEdit.id);
          if (pIndex !== -1) courtUpdates[`teamA/${pIndex}/name`] = trimmedName;
      }
      if (court.teamB) {
          const pIndex = court.teamB.findIndex(p => p.id === playerToEdit.id);
          if (pIndex !== -1) courtUpdates[`teamB/${pIndex}/name`] = trimmedName;
      }
      if (Object.keys(courtUpdates).length > 0) {
          await update(ref(db, `${courtRoot}/court`), courtUpdates);
      }

      setPlayerToEdit(null);
      showToast('เปลี่ยนชื่อผู้เล่นสำเร็จ!', 'success');
    } catch (error) { 
      console.error(error); 
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนชื่อ', 'error');
    }
    setIsProcessing(false);
  };

  const handleDeletePlayerClick = (player) => {
    if ((player.debt || 0) > 0) {
      showToast(`ไม่สามารถลบ ${player.name} ได้ เนื่องจากยังมียอดค้างจ่าย ${player.debt.toFixed(2)} ฿`, 'error');
      return;
    }
    setPlayerToDelete(player.id);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete || !isAdmin) return;
    setIsProcessing(true);
    try {
      await remove(ref(db, `${courtRoot}/players/${playerToDelete}`));
      setPlayerToDelete(null);
      showToast('ลบผู้เล่นออกแล้ว', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleDeleteAllPlayersClick = () => {
      if (!isAdmin) return;
      const hasDebt = players.some(p => (p.debt || 0) > 0);
      if (hasDebt) {
          showToast('ไม่สามารถลบผู้เล่นทั้งหมดได้ เนื่องจากยังมีคนมียอดค้างจ่าย', 'error');
          return;
      }
      setShowDeleteAllPlayersModal(true);
  };

  const confirmDeleteAllPlayers = async () => {
      if (!isAdmin) return;
      setIsProcessing(true);
      try {
          await set(ref(db, `${courtRoot}/players`), null);
          await set(ref(db, `${courtRoot}/queue`), null);
          await set(ref(db, `${courtRoot}/court`), { teamA: null, teamB: null });
          setShowDeleteAllPlayersModal(false);
          showToast('ลบข้อมูลผู้เล่น คิว และสนามทั้งหมดเรียบร้อยแล้ว!', 'success');
      } catch (error) {
          console.error(error);
          showToast('เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด', 'error');
      }
      setIsProcessing(false);
  };

  const togglePresence = async (id, currentStatus) => {
    try {
      const playerRef = ref(db, `${courtRoot}/players/${id}`);
      await update(playerRef, { isPresent: !currentStatus, attendanceDate: todayKey });
      if (currentStatus) setDraftPair(prev => prev.map(slotId => slotId === id ? null : slotId));
    } catch (error) { console.error(error); }
  };

  const handleDraftSelect = (playerId) => {
    if (draftPair.includes(playerId)) {
      setDraftPair(prev => prev.map(id => id === playerId ? null : id));
      return;
    }
    const emptyIndex = draftPair.findIndex(s => s === null);
    if (emptyIndex !== -1) {
      const newDraft = [...draftPair];
      newDraft[emptyIndex] = playerId;
      setDraftPair(newDraft);
    }
  };

  const handleCreatePair = async () => {
    if (draftPair.includes(null)) return;

    if (draftPair[0] === draftPair[1]) {
      showToast('ไม่สามารถเลือกชื่อผู้เล่นซ้ำกันในคู่เดียวกันได้', 'error');
      return;
    }

    const sortedDraftIds = [...draftPair].sort();

    const isPairExistsInQueue = queue.some(q => {
      if (!q.pair || q.pair.length !== 2) return false;
      const qIds = q.pair.map(p => p.id).sort();
      return qIds[0] === sortedDraftIds[0] && qIds[1] === sortedDraftIds[1];
    });

    if (isPairExistsInQueue) {
      showToast('คู่นี้มีอยู่ในคิวรออยู่แล้ว', 'error');
      return;
    }

    const activePairs = [court.teamA, court.teamB];
    const isPairExistsOnCourt = activePairs.some(team => {
      if (!team || team.length !== 2) return false;
      const teamIds = team.map(p => p.id).sort();
      return teamIds[0] === sortedDraftIds[0] && teamIds[1] === sortedDraftIds[1];
    });

    if (isPairExistsOnCourt) {
      showToast('คู่นี้กำลังแข่งขันอยู่บนสนาม', 'error');
      return;
    }

    const allBusyIds = new Set([...busyPlayerIds]);
    const hasBusyPlayer = draftPair.some(id => allBusyIds.has(id));
    if (hasBusyPlayer) {
      showToast('มีผู้เล่นบางคนกำลังแข่งขันหรืออยู่ในคิวรอแล้ว', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const pairData = draftPair.map(id => {
        const p = players.find(p => p.id === id);
        return { id: p.id, name: p.name };
      });

      const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
      const queueRef = ref(db, `${courtRoot}/queue`);
      
      await push(queueRef, { pair: pairData, sortOrder: maxOrder + 100 });
      setDraftPair([null, null]);
      showToast('เพิ่มคู่เข้าคิวรอสำเร็จ!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleMoveQueue = async (index, direction) => {
    if (!isAdmin) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === queue.length - 1) return;

    setIsProcessing(true);
    try {
      const currentItem = queue[index];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const targetItem = queue[targetIndex];

      await update(ref(db, `${courtRoot}/queue/${currentItem.id}`), {
        sortOrder: targetItem.sortOrder,
        isMoved: true,
        moveDirection: direction
      });
      await update(ref(db, `${courtRoot}/queue/${targetItem.id}`), {
        sortOrder: currentItem.sortOrder,
        isMoved: true,
        moveDirection: direction === 'up' ? 'down' : 'up'
      });
      
      setHighlightedQueueId(currentItem.id);
      setTimeout(() => setHighlightedQueueId(null), 3000);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const confirmDeleteQueue = async () => {
    if (!queueToDelete || !isAdmin) return; 
    setIsProcessing(true);
    try {
      await remove(ref(db, `${courtRoot}/queue/${queueToDelete}`));
      setQueueToDelete(null);
      showToast('ลบคิวออกแล้ว', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleStartGame = async () => {
    if (!isAdmin || queue.length < 2) return;
    setIsProcessing(true);
    try {
      const courtRef = ref(db, `${courtRoot}/court`);
      await set(courtRef, { teamA: queue[0].pair, teamB: queue[1].pair });
      await remove(ref(db, `${courtRoot}/queue/${queue[0].id}`));
      await remove(ref(db, `${courtRoot}/queue/${queue[1].id}`));
      showToast('เริ่มการแข่งขันแล้ว!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleWin = async (winnerTeam) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      let nextTeamA = winnerTeam === 'A' ? court.teamA : null;
      let nextTeamB = winnerTeam === 'B' ? court.teamB : null;
      let losingTeam = winnerTeam === 'A' ? court.teamB : court.teamA;
      let winningTeam = winnerTeam === 'A' ? court.teamA : court.teamB;

      const playersUpdates = {};

      rankedPlayers.forEach((p, index) => {
        playersUpdates[`${p.id}/previousRank`] = index + 1;
      });

      if (winningTeam) {
        winningTeam.forEach((player) => {
          const dbPlayer = players.find(p => p.id === player.id);
          playersUpdates[`${player.id}/wins`] = (dbPlayer?.wins || 0) + 1;
        });
      }

      if (losingTeam) {
        losingTeam.forEach((player) => {
          const dbPlayer = players.find(p => p.id === player.id);
          playersUpdates[`${player.id}/wins`] = Math.max(0, (dbPlayer?.wins || 0) - 1);
        });
        
        const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
        const queueRef = ref(db, `${courtRoot}/queue`);
        await push(queueRef, { pair: losingTeam, sortOrder: maxOrder + 100 });
      }

      await update(ref(db, `${courtRoot}/players`), playersUpdates);

      if (queue.length > 0) {
        const nextPairObj = queue[0];
        const nextPair = nextPairObj.pair;
        if (winnerTeam === 'A') nextTeamB = nextPair;
        if (winnerTeam === 'B') nextTeamA = nextPair;
        await remove(ref(db, `${courtRoot}/queue/${nextPairObj.id}`));
      }
      
      await set(ref(db, `${courtRoot}/court`), { teamA: nextTeamA, teamB: nextTeamB });
      showToast(`บันทึกผล: ทีม ${winnerTeam} ชนะ!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleClearCourt = async () => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      const queueRef = ref(db, `${courtRoot}/queue`);
      const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
      
      let currentMaxOrder = maxOrder;
      if (court.teamA) {
        currentMaxOrder += 100;
        await push(queueRef, { pair: court.teamA, sortOrder: currentMaxOrder });
      }
      if (court.teamB) {
        currentMaxOrder += 100;
        await push(queueRef, { pair: court.teamB, sortOrder: currentMaxOrder });
      }

      const courtRef = ref(db, `${courtRoot}/court`);
      await set(courtRef, { teamA: null, teamB: null });
      setCourt({ teamA: null, teamB: null });
      
      showToast('เคลียร์สนาม นำผู้เล่นกลับเข้าคิวรอเรียบร้อย', 'success');
    } catch (error) { 
      console.error(error); 
    }
    setIsProcessing(false);
  };

  const handleAddIndividualFee = async (playerId, amount = 10) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      
      const playerRef = ref(db, `${courtRoot}/players/${playerId}`);
      await update(playerRef, { debt: (player.debt || 0) + amount });
      showToast(`บวกค่าบำรุง ${amount} บาทให้ ${player.name} แล้ว`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleAddFixedFee = async () => {
    if (!isAdmin) return;
    if (presentPlayers.length === 0) return;
    setIsProcessing(true);
    try {
      const promises = presentPlayers.map(p => {
        const playerRef = ref(db, `${courtRoot}/players/${p.id}`);
        return update(playerRef, { debt: (p.debt || 0) + 10 });
      });
      await Promise.all(promises);
      showToast(`บวกค่าบำรุง 10 บาทให้ ${presentPlayers.length} คนเรียบร้อย!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleSplitBill = async () => {
    if (!isAdmin) return;
    const amount = parseFloat(totalCourtBill);
    if (presentPlayers.length === 0 || isNaN(amount) || amount <= 0) return;
    const perPerson = amount / presentPlayers.length;
    setIsProcessing(true);
    try {
      await Promise.all(presentPlayers.map(p => {
        const playerRef = ref(db, `${courtRoot}/players/${p.id}`);
        return update(playerRef, { debt: (p.debt || 0) + perPerson });
      }));
      setTotalCourtBill('');
      showToast(`หารค่าคอร์ตคนละ ${perPerson.toFixed(2)} บาทเรียบร้อย!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handlePayDebt = async (playerId) => {
    if (!isAdmin) return;
    const payAmount = parseFloat(paymentInputs[playerId]);
    if (isNaN(payAmount) || payAmount <= 0) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setIsProcessing(true);
    try {
      const newDebt = Math.max(0, (player.debt || 0) - payAmount);
      const playerRef = ref(db, `${courtRoot}/players/${playerId}`);
      await update(playerRef, { debt: newDebt });
      setPaymentInputs(prev => ({ ...prev, [playerId]: '' }));
      showToast('ชำระเงินเรียบร้อย หักยอดหนี้อัตโนมัติ!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleClearAllDebt = async () => {
    if (!isAdmin) return;
    const playersWithDebt = players.filter(p => (p.debt || 0) > 0);
    if (playersWithDebt.length === 0) {
      showToast('ไม่มีรายการค้างชำระในระบบ', 'success');
      return;
    }

    setIsProcessing(true);
    try {
      const promises = playersWithDebt.map(p => {
        const playerRef = ref(db, `${courtRoot}/players/${p.id}`);
        return update(playerRef, { debt: 0 });
      });
      await Promise.all(promises);
      showToast('เคลียร์หนี้ทั้งหมดให้ทุกคนเรียบร้อยแล้ว!', 'success');
    } catch (error) { 
      console.error(error); 
      showToast('เกิดข้อผิดพลาดในการเคลียร์หนี้', 'error');
    }
    setIsProcessing(false);
  };

  const showSplash = loading || !splashComplete;
  const visibleCourts = user?.email && userRole !== 'superAdmin'
    ? COURTS.filter(courtItem => assignedCourtIds.includes(courtItem.id))
    : COURTS;
  const isLoggedInAdmin = Boolean(user?.email && (userRole === 'superAdmin' || assignedCourtIds.length > 0));
  const superAdminCourt = COURTS.find(courtItem => courtItem.id === superAdminCourtId) || COURTS[0];

  if (!selectedCourtId && user?.email && userRole === 'superAdmin') {
    return (
      <div style={{ fontFamily: "'Prompt', sans-serif" }} className="min-h-screen bg-slate-50 text-gray-800 max-w-md mx-auto relative shadow-2xl overflow-x-hidden pb-6">
        {showSplash && (
          <div
            className={`splash-screen ${splashExiting ? 'splash-screen-exiting' : ''} fixed inset-0 z-[60] bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-950 flex items-center justify-center px-6 text-white overflow-hidden`}
          >
            <div className="relative w-full text-center animate-in fade-in zoom-in-95 duration-500">
              <h1 className="splash-title text-3xl font-black tracking-[0.18em]">
                {'BADBEAOW'.split('').map((letter, index) => (
                  <span className={`splash-letter ${letter === 'A' ? 'splash-a-glow' : ''}`} key={`${letter}-${index}`}>{letter}</span>
                ))}
              </h1>
              <p className="mt-2 text-sm text-purple-200">ระบบจัดการคิวตีแบด</p>
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/60">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                กำลังเตรียมระบบ...
              </div>
            </div>
          </div>
        )}
        <header className="bg-slate-950 text-white px-5 pt-10 pb-5 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-300 font-semibold tracking-wide">BADBEAOW CONTROL CENTER</div>
              <h1 className="text-xl font-black mt-1">ศูนย์ควบคุมระบบ</h1>
            </div>
            <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl" title="ออกจากระบบ">
              <LogOut size={18} />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setSuperAdminSection('dashboard')} className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${superAdminSection === 'dashboard' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70'}`}>
              ภาพรวม
            </button>
            <button onClick={() => setSuperAdminSection('admins')} className={`flex-1 rounded-xl py-2.5 text-xs font-bold ${superAdminSection === 'admins' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70'}`}>
              ผู้ดูแล
            </button>
          </div>
        </header>

        {superAdminSection === 'dashboard' ? (
          <main className="p-4 space-y-4">
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
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold">สถานะทุกคอร์ด</h2>
                <span className="text-xs font-bold text-red-500">หนี้รวม {dashboardSummary.debtTotal.toFixed(2)} ฿</span>
              </div>
              <div className="space-y-3">
                {dashboardSummary.courts.map(courtItem => {
                  const isExpanded = expandedCourtIds[courtItem.id];
                  const courtDetails = dashboardData[courtItem.id] || {};
                  const detailPlayers = courtDetails.players || [];
                  const presentNames = detailPlayers.filter(player => player.isPresent && player.attendanceDate === todayKey).map(player => player.name);
                  const teamA = courtDetails.court?.teamA || [];
                  const teamB = courtDetails.court?.teamB || [];

                  return (
                    <div key={courtItem.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <button onClick={() => selectCourt(courtItem.id)} className={`font-bold ${courtItem.text} hover:underline`}>
                            {courtItem.name}
                          </button>
                          <span className={`text-[10px] rounded-full px-2 py-1 font-bold ${courtItem.isPlaying ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{courtItem.isPlaying ? 'กำลังแข่ง' : 'สนามว่าง'}</span>
                        </div>
                        <div className="grid grid-cols-4 text-center">
                          <div><b>{courtItem.playerCount}</b><small className="block text-[9px] text-gray-400">ผู้เล่น</small></div>
                          <div><b className="text-emerald-600">{courtItem.presentCount}</b><small className="block text-[9px] text-gray-400">มาวันนี้</small></div>
                          <div><b className="text-amber-600">{courtItem.queueCount}</b><small className="block text-[9px] text-gray-400">คู่รอ</small></div>
                          {userRole === 'superAdmin' && <div><b className="text-red-500">{courtItem.debtTotal.toFixed(0)}</b><small className="block text-[9px] text-gray-400">หนี้ ฿</small></div>}
                        </div>
                        <button onClick={() => setExpandedCourtIds(previous => ({ ...previous, [courtItem.id]: !previous[courtItem.id] }))} className="w-full mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800">
                          {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                          <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-3 text-xs">
                          <div>
                            <div className="font-bold text-gray-700 mb-1">ผู้เล่นที่มาเล่นวันนี้</div>
                            <div className="text-gray-500">{presentNames.length > 0 ? presentNames.join(' , ') : 'ยังไม่มีผู้เล่นเช็คชื่อวันนี้'}</div>
                          </div>
                          <div>
                            <div className="font-bold text-gray-700 mb-1">สนามปัจจุบัน</div>
                            <div className="text-gray-500">
                              {courtItem.isPlaying ? `ทีม A: ${teamA.map(player => player.name).join(' / ') || '-'} | ทีม B: ${teamB.map(player => player.name).join(' / ') || '-'}` : 'สนามว่าง'}
                            </div>
                          </div>
                          {userRole === 'superAdmin' && (
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-700">ยอดค้างชำระ</span>
                              <span className="font-black text-red-500">{courtItem.debtTotal.toFixed(2)} ฿</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        ) : (
          <main className="p-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-[15px] font-bold">เพิ่มผู้ดูแลคอร์ด</h2>
              <p className="text-[11px] text-gray-500 mt-1">เลือกคอร์ดและใส่ Firebase Auth UID</p>
              <select value={superAdminCourtId} onChange={event => setSuperAdminCourtId(event.target.value)} className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
                {COURTS.map(courtItem => <option key={courtItem.id} value={courtItem.id}>{courtItem.name}</option>)}
              </select>
              <form onSubmit={handleAddCourtAdmin} className="mt-3 space-y-3">
                <input value={adminUidInput} onChange={event => setAdminUidInput(event.target.value)} placeholder="Firebase Auth UID" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                <button type="submit" disabled={isProcessing || !adminUidInput.trim()} className="w-full bg-slate-900 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50">เพิ่ม Admin ให้ {superAdminCourt.name}</button>
              </form>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h2 className="text-[15px] font-bold mb-3">Admin ของ {superAdminCourt.name}</h2>
              {Object.keys(managedAdminIds).length === 0 ? <p className="text-sm text-gray-400 text-center py-4">ยังไม่มี Admin</p> : (
                <div className="space-y-2">
                  {Object.keys(managedAdminIds).map(adminUid => (
                    <div key={adminUid} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="text-xs break-all text-gray-600">{adminUid}</span>
                      <button onClick={() => handleRemoveCourtAdmin(adminUid)} disabled={isProcessing} className="shrink-0 bg-red-50 text-red-600 rounded-lg px-3 py-2 text-xs font-bold">ถอดสิทธิ์</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    );
  }

  if (!selectedCourtId) {
    return (
      <div style={{ fontFamily: "'Prompt', sans-serif" }} className="min-h-screen bg-gray-50 text-gray-800 max-w-md mx-auto px-5 py-10 relative overflow-hidden">
        {showSplash && (
          <div
            className={`splash-screen ${splashExiting ? 'splash-screen-exiting' : ''} fixed inset-0 z-[60] bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-950 flex items-center justify-center px-6 text-white overflow-hidden`}
          >
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
            <div className="relative w-full text-center animate-in fade-in zoom-in-95 duration-500">
              <h1 className="splash-title text-3xl font-black tracking-[0.18em]">
                {'BADBEAOW'.split('').map((letter, index) => (
                  <span className={`splash-letter ${letter === 'A' ? 'splash-a-glow' : ''}`} key={`${letter}-${index}`}>{letter}</span>
                ))}
              </h1>
              <p className="mt-2 text-sm text-purple-200">ระบบจัดการคิวตีแบด</p>
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/60">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                กำลังเตรียมระบบ...
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-8 pb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg mb-5">
            <Swords size={30} />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">BADBEAOW</h1>
          <p className="text-sm text-gray-500 mt-2">เลือกคอร์ดเพื่อเข้าสู่ระบบจัดการคิว</p>
        </div>

        <div className="space-y-3">
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

        <button
          onClick={() => setShowGuide(true)}
          className="w-full mt-5 bg-white border border-purple-100 text-purple-700 rounded-2xl py-3.5 font-bold text-sm shadow-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
        >
          <BookOpen size={18} /> คู่มือการใช้งาน
        </button>

        {isLoggedInAdmin ? (
          <button
            onClick={handleLogout}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl py-3.5 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} /> เข้าสู่ระบบ
          </button>
        )}

        {user?.email && !isLoggedInAdmin && (
          <p className="mt-6 text-center text-xs text-red-500">บัญชีนี้ยังไม่ได้รับสิทธิ์ดูแลคอร์ด</p>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          ข้อมูลคิว ผู้เล่น และการเงินจะแยกตามคอร์ดที่เลือก
        </div>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm max-h-[85vh] shadow-2xl overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 text-purple-700"><BookOpen size={21} /><h2 className="text-lg font-bold">คู่มือการใช้งาน</h2></div>
                  <p className="text-xs text-gray-500 mt-1">BADBEAOW ระบบจัดการคิวตีแบด</p>
                </div>
                <button onClick={() => setShowGuide(false)} className="p-1 text-gray-400 hover:text-gray-700" aria-label="ปิดคู่มือ"><X size={20} /></button>
              </div>
              <div className="space-y-4 text-sm text-gray-700">
                <section>
                  <h3 className="font-bold text-gray-900 mb-1.5">เริ่มต้นใช้งาน</h3>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>เลือกคอร์ดที่ต้องการใช้งาน</li>
                    <li>ไปที่ <b>รายชื่อ</b> แล้วเปิดสวิตช์คนที่มาเล่นวันนี้</li>
                    <li>ไปที่ <b>คิวสนาม</b> เลือกผู้เล่น 2 คน แล้วเพิ่มเข้าคิว</li>
                  </ol>
                </section>
                <section>
                  <h3 className="font-bold text-gray-900 mb-1.5">จัดคิวและเริ่มแข่ง</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>เมื่อมีคิวอย่างน้อย 2 คู่ ให้กด <b>ดึงคิวที่ 1 & 2 ลงสนาม</b></li>
                    <li>เมื่อจบเกม กด <b>ทีม A ชนะ</b> หรือ <b>ทีม B ชนะ</b> เพื่อบันทึกสถิติ</li>
                    <li>ผู้ชนะจะอยู่สนามต่อ ตามกติกา WINNER STAYS ON ส่วนผู้เล่นที่เหลือจะกลับเข้าคิว</li>
                    <li>แอดมินสามารถแตะค้างที่ไอคอนลากเพื่อสลับลำดับคิว</li>
                  </ul>
                </section>
                <section>
                  <h3 className="font-bold text-gray-900 mb-1.5">ดูอันดับและการเงิน</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>ดูอันดับผู้เล่นได้ที่เมนู <b>จัดอันดับ</b> โดยเลือกดูเฉพาะคอร์ดหรือรวม 4 คอร์ด</li>
                    <li>แอดมินกดเข้าสู่ระบบเพื่อแก้ไขข้อมูลผู้เล่น จัดการคิว และใช้เมนูคิดเงิน</li>
                  </ul>
                </section>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
                  <b>หมายเหตุ:</b> ข้อมูลคิว ผู้เล่น และการเงินจะแยกตามคอร์ดที่เลือก
                </div>
              </div>
            </div>
          </div>
        )}

        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-1">เข้าสู่ระบบผู้ดูแล</h3>
              <p className="text-xs text-gray-500 mb-4">ระบบจะพาไปยังคอร์ดตามสิทธิ์ของบัญชี</p>
              {loginError && <div className="mb-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">{loginError}</div>}
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="อีเมล" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="รหัสผ่าน" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600 text-sm">ยกเลิก</button>
                  <button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-slate-900 text-white text-sm disabled:opacity-50">เข้าสู่ระบบ</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }} className={`court-theme-${selectedCourtId} min-h-screen bg-gray-50/50 text-gray-800 pb-24 max-w-md mx-auto relative shadow-2xl overflow-x-hidden selection:bg-purple-200`}>
      {showSplash && (
        <div
          className={`splash-screen ${splashExiting ? 'splash-screen-exiting' : ''} fixed inset-0 z-[60] bg-gradient-to-br ${selectedCourt.accent} flex items-center justify-center px-6 text-white overflow-hidden`}
        >
          <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative w-full text-center animate-in fade-in zoom-in-95 duration-500">
            <h1 className="splash-title text-3xl font-black tracking-[0.18em]">
              {'BADBEAOW'.split('').map((letter, index) => (
                <span className={`splash-letter ${letter === 'A' ? 'splash-a-glow' : ''}`} key={`${letter}-${index}`}>{letter}</span>
              ))}
            </h1>
            <p className="mt-2 text-sm text-purple-200">ระบบจัดการคิวตีแบด</p>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/60">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              กำลังเตรียมระบบ...
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 z-50 transition-all duration-300 ease-out ${toast.message ? 'opacity-100 scale-100 animate-jelly' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}`}>
        <div className={`px-6 py-3.5 rounded-full shadow-lg font-semibold flex items-center gap-2.5 text-[13px] whitespace-nowrap text-white ${toast.type === 'error' ? 'bg-red-500 shadow-[0_8px_30px_rgb(239,68,68,0.3)]' : 'bg-emerald-500 shadow-[0_8px_30px_rgb(16,185,129,0.3)]'}`}>
          <div className="bg-white/20 rounded-full p-0.5">
            {toast.type === 'error' ? <X size={14} /> : <Check size={14} />}
          </div>
          {toast.message}
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md text-gray-800 pt-10 pb-3 px-6 sticky top-0 z-20 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedCourtId(null)} className="p-1.5 -ml-2 text-gray-400 hover:text-purple-600 transition-colors" title="กลับไปเลือกคอร์ด">
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 className={`text-lg font-bold tracking-tight ${selectedCourt.text}`}>BADBEAOW</h1>
            <div className="text-[10px] text-gray-400 font-medium">{selectedCourt.name}</div>
          </div>
        </div>
        <div>
          {isAdmin ? (
            <button 
              onClick={handleLogout}
              className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-red-100 transition-colors"
            >
              <LogOut size={13} /> โหมดผู้ดูแล
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              <Lock size={13} /> เข้าสู่ระบบแอดมิน
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-160px)]">
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-5">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard size={21} />
                <h2 className="text-lg font-bold">Dashboard ภาพรวม</h2>
              </div>
              <p className="text-xs text-white/65">สรุปข้อมูลทุกคอร์ดแบบเรียลไทม์</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'ผู้เล่นทั้งหมด', value: dashboardSummary.playerCount, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'มาเล่นวันนี้', value: dashboardSummary.presentCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'คู่รอสนาม', value: dashboardSummary.queueCount, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'สนามกำลังแข่ง', value: dashboardSummary.playingCount, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((metric) => (
                <div key={metric.label} className={`${metric.bg} rounded-2xl p-4 border border-white shadow-sm`}>
                  <div className="text-[11px] text-gray-500 font-medium">{metric.label}</div>
                  <div className={`text-2xl font-black mt-1 ${metric.color}`}>{metric.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-800">สถานะแต่ละคอร์ด</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">ข้อมูลผู้เล่น คิว และสนาม</p>
                </div>
                {userRole === 'superAdmin' && (
                  <div className="text-right">
                    <div className="text-[11px] text-gray-400">ยอดค้างชำระรวม</div>
                    <div className="text-sm font-black text-red-500">{dashboardSummary.debtTotal.toFixed(2)} ฿</div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {dashboardSummary.courts.map((courtItem) => (
                  <div
                    key={courtItem.id}
                    className="w-full text-left border border-gray-100 rounded-2xl p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-bold ${courtItem.text}`}>{courtItem.name}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${courtItem.isPlaying ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {courtItem.isPlaying ? 'กำลังแข่ง' : 'สนามว่าง'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div><div className="text-base font-black text-gray-800">{courtItem.playerCount}</div><div className="text-[9px] text-gray-400">ผู้เล่น</div></div>
                      <div><div className="text-base font-black text-emerald-600">{courtItem.presentCount}</div><div className="text-[9px] text-gray-400">มาวันนี้</div></div>
                      <div><div className="text-base font-black text-amber-600">{courtItem.queueCount}</div><div className="text-[9px] text-gray-400">คู่รอ</div></div>
                      {userRole === 'superAdmin' && <div><div className="text-base font-black text-red-500">{courtItem.debtTotal.toFixed(0)}</div><div className="text-[9px] text-gray-400">หนี้ ฿</div></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="p-4 space-y-6">
            
            {/* Active Court Widget */}
            <div className={`bg-gradient-to-br ${selectedCourt.accent} rounded-3xl p-5 shadow-xl relative overflow-hidden text-white`}>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Swords size={20} className="text-purple-300" /> สนามกำลังแข่ง
                </h2>
                <span className="bg-purple-900/50 text-[10px] font-semibold px-3 py-1 rounded-full text-purple-200 border border-purple-500/30">
                  WINNER STAYS ON
                </span>
              </div>

              {!court.teamA && !court.teamB ? (
                <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/10">
                  <div className="text-purple-300 mb-3 text-sm">สนามว่าง รอผู้เล่น</div>
                  {queue.length >= 2 ? (
                    <button onClick={handleStartGame} disabled={isProcessing} className="bg-white text-purple-800 px-6 py-2.5 rounded-full font-bold shadow-lg text-sm">
                      ดึงคิวที่ 1 & 2 ลงสนาม
                    </button>
                  ) : (
                    <span className="text-xs text-white/50">จัดคิวให้ครบ 2 คู่เพื่อเริ่มเกม</span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/20 rounded-2xl p-4 border border-white/10">
                    <div className="w-[42%] text-center">
                      <div className="text-[10px] text-purple-300 font-medium mb-1">ทีม A</div>
                      <div className="font-semibold text-sm">{court.teamA ? court.teamA.map(p => p.name).join(' & ') : 'ว่าง'}</div>
                    </div>
                    <div className="text-sm font-black text-purple-300/50 italic">VS</div>
                    <div className="w-[42%] text-center">
                      <div className="text-[10px] text-purple-300 font-medium mb-1">ทีม B</div>
                      <div className="font-semibold text-sm">{court.teamB ? court.teamB.map(p => p.name).join(' & ') : 'ว่าง'}</div>
                    </div>
                  </div>

                  {court.teamA && court.teamB && (
                    <div className="flex gap-3">
                      <button onClick={() => handleWin('A')} disabled={isProcessing} className="flex-1 bg-purple-500 hover:bg-purple-400 py-3 rounded-xl text-sm font-bold shadow-lg">
                        <Trophy size={16} className="inline mr-1"/> ทีม A ชนะ
                      </button>
                      <button onClick={() => handleWin('B')} disabled={isProcessing} className="flex-1 bg-indigo-500 hover:bg-indigo-400 py-3 rounded-xl text-sm font-bold shadow-lg">
                        <Trophy size={16} className="inline mr-1"/> ทีม B ชนะ
                      </button>
                    </div>
                  )}
                  <div className="text-center pt-1">
                    <button onClick={handleClearCourt} disabled={isProcessing} className="text-[11px] text-white/50 hover:text-white transition-colors">
                      เคลียร์สนาม (ส่งผู้เล่นกลับคิวรอ)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Create Pair Section */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center justify-between">
                จับคู่เตรียมลงสนาม
                <span className="text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  {draftPair.filter(s => s !== null).length}/2 คน
                </span>
              </h2>

              <div className="flex gap-3 mb-4">
                {[0, 1].map(idx => (
                  <div 
                    key={idx}
                    onClick={() => {
                      const newDraft = [...draftPair];
                      newDraft[idx] = null;
                      setDraftPair(newDraft);
                    }}
                    className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center text-sm font-semibold cursor-pointer ${
                      draftPair[idx] ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'
                    }`}
                  >
                    {draftPair[idx] ? getPlayerName(draftPair[idx]) : '+ เลือกชื่อ'}
                  </div>
                ))}
              </div>
              
              <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchDraftQuery} 
                    onChange={(e) => setSearchDraftQuery(e.target.value)} 
                    placeholder="ค้นหาชื่อผู้เล่น..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
              </div>

              <div className="flex flex-wrap gap-2 mb-5 max-h-40 overflow-y-auto custom-scrollbar p-1">
                {filteredAvailablePlayers.length === 0 ? (
                  <div className="text-xs text-gray-400 py-3 w-full text-center bg-gray-50 rounded-xl">
                      {searchDraftQuery ? 'ไม่พบชื่อที่ค้นหา' : 'ไม่มีผู้เล่นว่าง (กรุณาเช็คชื่อในแถบผู้เล่นก่อน)'}
                  </div>
                ) : (
                  filteredAvailablePlayers.map(player => {
                    const isSelected = draftPair.includes(player.id);
                    return (
                      <button 
                        key={player.id}
                        onClick={() => handleDraftSelect(player.id)}
                        className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                          isSelected ? 'bg-purple-600 text-white shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200'
                        }`}
                      >
                        {player.name}
                      </button>
                    );
                  })
                )}
              </div>

              <button 
                onClick={handleCreatePair}
                disabled={draftPair.includes(null) || isProcessing}
                className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  !draftPair.includes(null) ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md transform hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={18} /> เพิ่มเข้าคิวรอ
              </button>
            </div>

            {/* Queue List (With Drag & Drop) */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-3 flex items-center justify-between">
                คิวรอสนาม <span className="text-[11px] font-medium text-gray-500">{queue.length} คู่</span>
              </h3>
              {queue.length === 0 ? (
                <div className="text-center py-8 bg-white border border-gray-100 rounded-3xl text-gray-400 text-[13px] shadow-sm">ยังไม่มีคิวรอ</div>
              ) : (
                <div className="space-y-3">
                  {queue.map((q, idx) => {
                    const isDragging = draggedQueueIdx === idx;
                    const isDragOver = dragOverQueueIdx === idx;
                    let dragClass = '';
                    if (isDragging) dragClass = 'dragging scale-95 shadow-inner bg-gray-50 border-purple-400';
                    else if (isDragOver && draggedQueueIdx !== null && draggedQueueIdx !== idx) {
                        dragClass = draggedQueueIdx < idx ? 'border-b-4 border-b-purple-500 transform -translate-y-1' : 'border-t-4 border-t-purple-500 transform translate-y-1';
                    }

                    return (
                      <div 
                        key={q.id} 
                        draggable={isAdmin}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragEnter={(e) => handleDragEnter(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 queue-item
                          ${q.id === highlightedQueueId ? 'queue-highlight ' : ''} 
                          ${q.isMoved ? 'bg-fuchsia-50 border-fuchsia-400' : 'bg-white border-gray-100 shadow-sm'}
                          ${isAdmin ? 'cursor-grab active:cursor-grabbing active:bg-gray-50' : ''}
                          ${dragClass}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {isAdmin && (
                            <div className="text-gray-300 hover:text-gray-500 drag-handle" title="แตะค้างไว้เพื่อลากสลับคิว">
                                <GripVertical size={18} />
                            </div>
                          )}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold ${q.isMoved ? 'bg-fuchsia-200 text-fuchsia-800' : 'bg-purple-50 text-purple-700'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-700 text-sm">
                              {q.pair ? q.pair.map(p => p.name).join(' & ') : ''}
                            </div>
                            {q.isMoved && (
                              <div className="text-[10px] text-fuchsia-600 font-bold mt-0.5">
                                {q.moveDirection === 'up' ? '🔼 ถูกเลื่อนขึ้น (แซงคิว)' : '🔽 ถูกเลื่อนลง'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <div className="flex flex-col gap-1 mr-2">
                              <button onClick={() => handleMoveQueue(idx, 'up')} disabled={idx === 0 || isProcessing} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-colors">
                                <ArrowUp size={16} />
                              </button>
                              <button onClick={() => handleMoveQueue(idx, 'down')} disabled={idx === queue.length - 1 || isProcessing} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-colors">
                                <ArrowDown size={16} />
                              </button>
                            </div>
                          )}
                          <button onClick={() => setQueueToDelete(q.id)} disabled={isProcessing} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'players' && (
          <div className="p-4 space-y-5">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus size={18} className="text-purple-500"/> เพิ่มผู้เล่นใหม่
              </h2>
              <form onSubmit={handleAddPlayer} className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={newPlayerName} 
                  onChange={(e) => setNewPlayerName(e.target.value)} 
                  placeholder="พิมพ์ชื่อเพื่อเพิ่ม..." 
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button type="submit" disabled={isProcessing || !newPlayerName} className="bg-purple-600 text-white px-5 py-3.5 rounded-xl font-bold hover:bg-purple-700 shadow-md transition-colors disabled:opacity-50">
                  เพิ่ม
                </button>
                
                {newPlayerName && suggestedPlayers.length > 0 && (
                    <div className="absolute top-full left-0 right-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-2 max-h-32 overflow-y-auto">
                        <div className="text-[10px] text-gray-400 mb-1 px-2">รายชื่อที่มีอยู่แล้ว:</div>
                        <div className="flex flex-wrap gap-1">
                            {suggestedPlayers.map(p => (
                                <span key={p.id} className="bg-gray-100 text-gray-600 text-[11px] px-2 py-1 rounded-md">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[60vh]">
              <div className="p-4 border-b border-gray-50 flex flex-col gap-3 bg-gray-50/50 shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-[15px] font-bold text-gray-800">รายชื่อทั้งหมด</h2>
                      <p className="text-[11px] text-gray-500 mt-1">เช็คชื่อคนที่ <span className="font-semibold text-purple-600">มาตีวันนี้</span></p>
                    </div>
                    <div className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
                      มา {presentPlayers.length} คน
                    </div>
                  </div>
                  
                  <div className="relative">
                      <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchPlayerQuery} 
                        onChange={(e) => setSearchPlayerQuery(e.target.value)} 
                        placeholder="ค้นหาชื่อเพื่อเช็คชื่อ/ลบ..." 
                        className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      />
                  </div>
              </div>
              
              <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
                {filteredPlayersList.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                      {searchPlayerQuery ? 'ไม่พบชื่อที่ค้นหา' : 'ยังไม่มีรายชื่อผู้เล่น'}
                  </div>
                ) : (
                  filteredPlayersList.map((player) => (
                    <div key={player.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start gap-1">
                          <div className={`font-semibold text-sm ${player.isPresent ? 'text-gray-800' : 'text-gray-400'} flex items-center gap-2`}>
                            {player.name}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPowerLevel(player.wins).color}`}>
                            {getPowerLevel(player.wins).label} (ชนะ {player.wins || 0})
                          </span>
                          
                          {player.debt > 0 && (
                            <div className="text-[11px] font-bold text-red-500 mt-0.5">ค้างจ่าย: {player.debt.toFixed(2)} ฿</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button 
                            onClick={() => handleAddIndividualFee(player.id, 10)}
                            disabled={isProcessing}
                            title="บวกค่าบำรุง 10 บาท"
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Plus size={12} /> 10฿
                          </button>
                        )}
                        <button 
                          onClick={() => togglePresence(player.id, player.isPresent)}
                          disabled={isProcessing}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${player.isPresent ? 'bg-purple-500' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${player.isPresent ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        
                        <div className="flex items-center gap-1 pl-1">
                            {isAdmin && (
                              <button onClick={() => handleEditPlayerClick(player)} disabled={isProcessing} className="text-blue-400 hover:text-blue-600 p-1.5 transition-colors bg-blue-50 hover:bg-blue-100 rounded-lg">
                                <Edit2 size={15} />
                              </button>
                            )}
                            <button onClick={() => handleDeletePlayerClick(player)} disabled={isProcessing} className="text-red-400 hover:text-red-600 p-1.5 transition-colors bg-red-50 hover:bg-red-100 rounded-lg">
                              <Trash2 size={15} />
                            </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2 pb-4">
                  <button 
                      onClick={handleDeleteAllPlayersClick}
                      disabled={isProcessing || players.length === 0}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                      <AlertTriangle size={18} /> ล้างข้อมูลผู้เล่นทั้งหมด (รีเซ็ตระบบ)
                  </button>
              </div>
            )}
          </div>
        )}

        {/* แท็บจัดอันดับ Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="p-4 space-y-5">
            <div className={`bg-gradient-to-br ${selectedCourt.accent} p-6 rounded-3xl shadow-lg text-white text-center relative overflow-hidden`}>
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <Trophy size={100} />
              </div>
              <Trophy size={42} className="mx-auto mb-3 text-yellow-300 drop-shadow-md" />
              <h2 className="text-xl font-black mb-1 tracking-wide">ทำเนียบยอดฝีมือ</h2>
              <p className="text-purple-200 text-[12px] font-medium">ใครชนะบ่อย ค่าพลังยิ่งสูง อันดับยิ่งแรง!</p>
            </div>

            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
              <button
                onClick={() => setLeaderboardScope('court')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${leaderboardScope === 'court' ? `${selectedCourt.solid} text-white shadow-sm` : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {selectedCourt.name}
              </button>
              <button
                onClick={() => setLeaderboardScope('all')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${leaderboardScope === 'all' ? `${selectedCourt.solid} text-white shadow-sm` : 'text-gray-500 hover:bg-gray-50'}`}
              >
                รวม 4 คอร์ด
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {leaderboardPlayers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลผู้เล่น</div>
                ) : (
                  leaderboardPlayers.map((player, index) => {
                    const currentRank = index + 1;
                    const prevRank = player.previousRank || currentRank;
                    const rankDiff = prevRank - currentRank; 

                    let rankColor = 'text-gray-300';
                    let rankBg = 'bg-gray-50';
                    if (currentRank === 1) { rankColor = 'text-yellow-600'; rankBg = 'bg-yellow-100 border-yellow-200'; }
                    else if (currentRank === 2) { rankColor = 'text-slate-500'; rankBg = 'bg-slate-100 border-slate-200'; }
                    else if (currentRank === 3) { rankColor = 'text-orange-600'; rankBg = 'bg-orange-100 border-orange-200'; }

                    let RankIcon = null;
                    let rankChangeColor = '';
                    if (rankDiff > 0) {
                      RankIcon = ArrowUp;
                      rankChangeColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
                    } else if (rankDiff < 0) {
                      RankIcon = ArrowDown;
                      rankChangeColor = 'text-red-500 bg-red-50 border-red-100';
                    } else {
                      RankIcon = Minus;
                      rankChangeColor = 'text-gray-400 bg-gray-50 border-gray-100';
                    }

                    return (
                      <div key={player.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-1.5 w-10">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-sm ${rankColor} ${rankBg}`}>
                              {currentRank}
                            </div>
                            {player.previousRank && (
                                <div className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${rankChangeColor}`}>
                                  <RankIcon size={10} />
                                  {rankDiff !== 0 && Math.abs(rankDiff)}
                                </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                              {player.name}
                              {currentRank === 1 && <span className="text-[10px]">👑</span>}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">ชนะทั้งหมด {player.wins || 0} แมตช์</div>
                            {leaderboardScope === 'all' && (
                              <div className="text-[10px] text-purple-500 mt-0.5">{player.courts.join(' · ')}</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${getPowerLevel(player.wins).color}`}>
                            {getPowerLevel(player.wins).label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="p-4 space-y-5">
            {!isAdmin && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-800">โหมดดูข้อมูล (ระบบเงินล็อกอยู่)</div>
                  <div className="text-[11px] text-amber-600">เฉพาะแอดมินเท่านั้นที่ใช้เครื่องมือคิดเงินได้</div>
                </div>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
                >
                  ล็อกอินแอดมิน
                </button>
              </div>
            )}

            {isAdmin && (
              <>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-lg text-white text-center transition-all">
                  <h2 className="text-base font-bold mb-1 flex items-center justify-center gap-2">
                    <Coins size={20} /> ค่าบำรุงประจำวัน
                  </h2>
                  <p className="text-emerald-50 text-[12px] mb-5">บวกหนี้ <span className="font-bold text-white">10 บาท</span> ให้กับทุกคนที่เช็คชื่อมาตีวันนี้</p>
                  <button onClick={handleAddFixedFee} disabled={isProcessing || presentPlayers.length === 0} className="w-full bg-white text-emerald-600 hover:bg-emerald-50 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                    <Plus size={18} /> เก็บทุกคนคนละ 10 บาท
                  </button>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all">
                  <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-purple-500"/> หารค่าคอร์ต
                  </h2>
                  <input 
                    type="number" 
                    value={totalCourtBill} 
                    onChange={(e) => setTotalCourtBill(e.target.value)} 
                    placeholder="ยอดบิลรวมทั้งหมด (บาท)" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm mb-3 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button onClick={handleSplitBill} disabled={isProcessing || !totalCourtBill} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                    หาร {presentPlayers.length} คน (ตกคนละ {((parseFloat(totalCourtBill) || 0) / (presentPlayers.length || 1)).toFixed(2)} ฿)
                  </button>
                </div>
              </>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-purple-500"/> ยอดค้างจ่ายทั้งหมด
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">สรุปยอดเงินผู้เล่นปัจจุบัน</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleClearAllDebt}
                    disabled={isProcessing}
                    className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    เคลียร์หนี้ทั้งหมด
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {players.filter(p => p.debt > 0).length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">ไม่มีคนค้างจ่ายเลย ยอดเยี่ยม! 🎉</div>
                ) : (
                  players.filter(p => p.debt > 0).map((player) => (
                    <div key={player.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="font-semibold text-sm text-gray-800">{player.name}</div>
                        <div className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-lg">{player.debt.toFixed(2)} ฿</div>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex gap-2 items-center">
                          <input 
                            type="number" 
                            value={paymentInputs[player.id] || ''} 
                            onChange={(e) => setPaymentInputs({ ...paymentInputs, [player.id]: e.target.value })} 
                            placeholder="ยอดที่จ่าย..." 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                          />
                          <button onClick={() => handlePayDebt(player.id)} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50">
                            จ่าย
                          </button>
                        </div>
                      )}
                      
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'admins' && userRole === 'superAdmin' && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={21} />
                <h2 className="text-lg font-bold">SuperAdmin</h2>
              </div>
              <p className="text-xs text-white/70">จัดการผู้ดูแลของ {selectedCourt.name}</p>
            </div>

            <form onSubmit={handleAddCourtAdmin} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div>
                <h3 className="text-[15px] font-bold text-gray-800">เพิ่ม Admin ให้คอร์ดนี้</h3>
                <p className="text-[11px] text-gray-500 mt-1">ใส่ Firebase Auth UID ของผู้ดูแล</p>
              </div>
              <input
                value={adminUidInput}
                onChange={(e) => setAdminUidInput(e.target.value)}
                placeholder="เช่น abc123..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              />
              <button type="submit" disabled={isProcessing || !adminUidInput.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                เพิ่มสิทธิ์ Admin
              </button>
            </form>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-800 mb-3">Admin ของ {selectedCourt.name}</h3>
              {Object.keys(managedAdminIds).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">ยังไม่มี Admin ประจำคอร์ดนี้</p>
              ) : (
                <div className="space-y-2">
                  {Object.keys(managedAdminIds).map((adminUid) => (
                    <div key={adminUid} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="text-xs text-gray-600 break-all">{adminUid}</span>
                      <button onClick={() => handleRemoveCourtAdmin(adminUid)} disabled={isProcessing} className="shrink-0 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50">
                        ถอดสิทธิ์
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30 pb-safe">
        <div className="flex justify-between px-2 py-3">
          <button onClick={() => setActiveTab('queue')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'queue' ? 'text-purple-600 font-bold transform scale-105 transition-all' : 'text-gray-400 hover:text-gray-600'}`}>
            <Swords size={22} className={activeTab === 'queue' ? 'drop-shadow-sm' : ''} />
            <span className="text-[10px]">คิวสนาม</span>
          </button>
          
          <button onClick={() => setActiveTab('players')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'players' ? 'text-purple-600 font-bold transform scale-105 transition-all' : 'text-gray-400 hover:text-gray-600'}`}>
            <Users size={22} className={activeTab === 'players' ? 'drop-shadow-sm' : ''} />
            <span className="text-[10px]">รายชื่อ</span>
          </button>

          <button onClick={() => setActiveTab('leaderboard')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'leaderboard' ? 'text-purple-600 font-bold transform scale-105 transition-all' : 'text-gray-400 hover:text-gray-600'}`}>
            <Trophy size={22} className={activeTab === 'leaderboard' ? 'drop-shadow-sm' : ''} />
            <span className="text-[10px]">จัดอันดับ</span>
          </button>

          <button onClick={() => setActiveTab('payment')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'payment' ? 'text-purple-600 font-bold transform scale-105 transition-all' : 'text-gray-400 hover:text-gray-600'}`}>
            <Wallet size={22} className={activeTab === 'payment' ? 'drop-shadow-sm' : ''} />
            <span className="text-[10px]">คิดเงิน</span>
          </button>

          <button onClick={() => setShowMoreMenu(previous => !previous)} className={`flex flex-col items-center gap-1 flex-1 ${showMoreMenu || activeTab === 'dashboard' || activeTab === 'admins' ? 'text-purple-600 font-bold transform scale-105 transition-all' : 'text-gray-400 hover:text-gray-600'}`}>
            <MoreHorizontal size={22} />
            <span className="text-[10px]">เพิ่มเติม</span>
          </button>
        </div>
      </nav>

      {showMoreMenu && (
        <div className="fixed bottom-[74px] right-3 z-40 w-44 bg-white rounded-2xl border border-gray-100 shadow-xl p-2">
          <button
            onClick={() => { setActiveTab('dashboard'); setShowMoreMenu(false); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={18} /> ภาพรวม
          </button>
          {userRole === 'superAdmin' && (
            <button
              onClick={() => { setActiveTab('admins'); setShowMoreMenu(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${activeTab === 'admins' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ShieldCheck size={18} /> ผู้ดูแล
            </button>
          )}
          <button
            onClick={() => { setShowGuide(true); setShowMoreMenu(false); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <BookOpen size={18} /> คู่มือการใช้งาน
          </button>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className={`bg-gradient-to-br ${selectedCourt.accent} p-5 text-white flex items-start justify-between`}>
              <div>
                <div className="flex items-center gap-2 mb-1"><BookOpen size={21} /><h2 className="text-lg font-bold">คู่มือการใช้งาน</h2></div>
                <p className="text-xs text-white/75">BADBEAOW ระบบจัดการคิวตีแบด</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="p-1 text-white/75 hover:text-white" aria-label="ปิดคู่มือ"><X size={20} /></button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(85vh-92px)] text-sm text-gray-700 space-y-5">
              <section>
                <h3 className="font-bold text-gray-900 mb-2">เริ่มต้นใช้งาน</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-600">
                  <li>เลือกคอร์ดที่ต้องการใช้งาน</li>
                  <li>เปิดเมนู <b>รายชื่อ</b> แล้วเปิดสวิตช์ข้างชื่อคนที่มาเล่นวันนี้</li>
                  <li>ไปที่ <b>คิวสนาม</b> เลือกผู้เล่น 2 คน แล้วกด <b>เพิ่มเข้าคิวรอ</b></li>
                </ol>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">จัดคิวและเริ่มแข่ง</h3>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                  <li>เมื่อมีคิวอย่างน้อย 2 คู่ ให้กด <b>ดึงคิวที่ 1 & 2 ลงสนาม</b></li>
                  <li>เมื่อจบเกม กด <b>ทีม A ชนะ</b> หรือ <b>ทีม B ชนะ</b> เพื่อบันทึกสถิติ</li>
                  <li>ผู้ชนะจะอยู่สนามต่อ ตามกติกา WINNER STAYS ON ส่วนผู้เล่นที่เหลือจะกลับเข้าคิว</li>
                  <li>แอดมินสามารถแตะค้างที่ไอคอนลากเพื่อสลับลำดับคิว</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">ดูรายชื่อและอันดับ</h3>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                  <li><b>รายชื่อ</b> ใช้ค้นหาชื่อ เช็คชื่อ แก้ไข หรือลบผู้เล่น</li>
                  <li><b>จัดอันดับ</b> แสดงผู้เล่นที่ชนะมากที่สุด เลือกดูเฉพาะคอร์ดหรือรวม 4 คอร์ดได้</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-gray-900 mb-2">การเงินสำหรับแอดมิน</h3>
                <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                  <li>กด <b>เข้าสู่ระบบแอดมิน</b> ที่มุมขวาบนเพื่อปลดล็อกเครื่องมือ</li>
                  <li>แท็บ <b>คิดเงิน</b> ใช้เก็บค่าบำรุงคนละ 10 บาท หรือหารค่าคอร์ตตามบิลรวม</li>
                  <li>บันทึกยอดที่ผู้เล่นชำระในรายการค้างจ่าย แล้วกด <b>จ่าย</b></li>
                  <li>เมนู <b>เพิ่มเติม &gt; ภาพรวม</b> ใช้ดูสถานะทุกคอร์ดแบบเรียลไทม์</li>
                </ul>
              </section>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
                <b>หมายเหตุ:</b> การลบผู้เล่นและการล้างระบบเป็นการกระทำถาวร ควรตรวจสอบให้แน่ใจก่อนยืนยันทุกครั้ง
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-1">ปลดล็อกสิทธิ์แอดมิน</h3>
            <p className="text-xs text-gray-500 mb-4">สำหรับจัดการการเงินและลบข้อมูลระบบ</p>
            
            {loginError && (
              <div className="mb-3 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">อีเมลแอดมิน</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    placeholder="admin@badbeaow.com" 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-md text-sm transition-colors disabled:opacity-50">ปลดล็อก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Player Modal (แอดมิน) */}
      {playerToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">แก้ไขชื่อผู้เล่น</h3>
            <p className="text-xs text-gray-500 mb-4">ระบบจะอัปเดตชื่อใหม่ให้ในคิวและบนสนามด้วย</p>
            <div className="space-y-4">
              <input 
                type="text" 
                value={editPlayerName} 
                onChange={(e) => setEditPlayerName(e.target.value)} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-3">
                <button onClick={() => setPlayerToEdit(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">ยกเลิก</button>
                <button onClick={confirmEditPlayer} disabled={isProcessing || !editPlayerName.trim()} className="flex-1 py-3 rounded-xl font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-colors disabled:opacity-50">บันทึกชื่อ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Queue Modal */}
      {queueToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ลบคิวนี้ใช่หรือไม่?</h3>
            <p className="text-sm text-gray-500 mb-6">รายชื่อคู่นี้จะถูกนำออกจากคิวรอ</p>
            <div className="flex gap-3">
              <button onClick={() => setQueueToDelete(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">ยกเลิก</button>
              <button onClick={confirmDeleteQueue} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors disabled:opacity-50">ลบคิว</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Player Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ลบผู้เล่นนี้ออก?</h3>
            <p className="text-sm text-gray-500 mb-6">รายชื่อนี้จะหายไปจากระบบถาวร</p>
            <div className="flex gap-3">
              <button onClick={() => setPlayerToDelete(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">ยกเลิก</button>
              <button onClick={confirmDeletePlayer} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors disabled:opacity-50">ลบผู้เล่น</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete ALL Players Modal */}
      {showDeleteAllPlayersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border-2 border-red-500 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-black">อันตราย! ยืนยันการล้างระบบ?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2 font-medium">การกระทำนี้จะลบ:</p>
            <ul className="text-xs text-gray-500 list-disc list-inside mb-6 space-y-1 ml-2">
                <li>รายชื่อผู้เล่น<span className="font-bold text-red-500">ทุกคน</span></li>
                <li>สถิติการชนะและค่าพลังทั้งหมด</li>
                <li>คิวรอและสถานะสนามปัจจุบัน</li>
            </ul>
            <p className="text-[11px] text-red-500 mb-6 font-bold">*ไม่สามารถกู้คืนข้อมูลได้</p>
            
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAllPlayersModal(false)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">ยกเลิก</button>
              <button onClick={confirmDeleteAllPlayers} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50">ล้างระบบถาวร</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}