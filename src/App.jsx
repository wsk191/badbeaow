import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { signInAnonymously, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, update, remove, set, get, runTransaction, query, limitToLast, orderByChild, endAt, increment } from 'firebase/database';
import UserGuide from './components/UserGuide';
import MaintenanceScreen from './screens/MaintenanceScreen';
import SuperAdminScreen from './screens/SuperAdminScreen';
import HomeScreen from './screens/HomeScreen';
import CourtScreen from './screens/court/CourtScreen';
import { AppContext } from './context/AppContext';
import { auth, db } from './lib/firebase';
import { logVisit } from './lib/accessLog';
import { COURTS, INACTIVITY_TIMEOUT_MS, getChatWindowStart, getExercisePlan, getTodayKey, isCommunityAvatarExpired, isMaintenanceScheduleActive } from './lib/appConfig';

export default function BadmintonApp() {
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [activeTab, setActiveTab] = useState('queue');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [managedAdminIds, setManagedAdminIds] = useState({});
  const [assignedCourtIds, setAssignedCourtIds] = useState([]);
  const [superAdminSection, setSuperAdminSection] = useState('dashboard');
  const [superAdminShowHome, setSuperAdminShowHome] = useState(false);
  const [exerciseProfile, setExerciseProfile] = useState({ age: '', weight: '', height: '', level: 'มือใหม่' });
  const [superAdminCourtId, setSuperAdminCourtId] = useState('court-1');
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const [splashExiting, setSplashExiting] = useState(false);
  const [splashVideoDone, setSplashVideoDone] = useState(false);
  const [paymentQrCode, setPaymentQrCode] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentPlayerId, setPaymentPlayerId] = useState('');
  const [paymentSlipData, setPaymentSlipData] = useState('');
  const [paymentSlipHash, setPaymentSlipHash] = useState('');
  const [paymentSlipUploading, setPaymentSlipUploading] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentReviewAmounts, setPaymentReviewAmounts] = useState({});
  const [qrUploading, setQrUploading] = useState(false);

  // Modal จัดการการเงิน & สลิป สำหรับ Admin
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeModalTab, setFinanceModalTab] = useState('slips'); // 'slips' | 'history'
  const [previewSlipImage, setPreviewSlipImage] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');

  // Admin Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Database State
  const [players, setPlayers] = useState([]);
  const [allCourtPlayers, setAllCourtPlayers] = useState({});
  const [dashboardData, setDashboardData] = useState({});
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState({ enabled: false, startTime: '18:00', endTime: '23:00' });
  const [scheduleStartTime, setScheduleStartTime] = useState('18:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('23:00');
  const [scheduleUpdating, setScheduleUpdating] = useState(false);
  const [scheduleNow, setScheduleNow] = useState(Date.now());
  const [maintenanceUpdating, setMaintenanceUpdating] = useState(false);
  const [queue, setQueue] = useState([]);
  const [court, setCourt] = useState({ teamA: null, teamB: null });
  const [resultLockNow, setResultLockNow] = useState(Date.now());

  // Local UI State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draftPair, setDraftPair] = useState([null, null]);
  const [totalCourtBill, setTotalCourtBill] = useState('');
  const [courtSettings, setCourtSettings] = useState({ feePerPerson: 10, shuttlePrice: 0 });
  const [matches, setMatches] = useState([]);
  const [shuttlesUsed, setShuttlesUsed] = useState(1);
  const [followPlayerId, setFollowPlayerIdState] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [paymentInputs, setPaymentInputs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ message: null, type: 'success' });
  const [highlightedQueueId, setHighlightedQueueId] = useState(null);
  const [queueToDelete, setQueueToDelete] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [showDeleteAllPlayersModal, setShowDeleteAllPlayersModal] = useState(false);
  const [showDeleteAllQueueModal, setShowDeleteAllQueueModal] = useState(false);
  const [adminUidInput, setAdminUidInput] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  // undefined = ยังโหลดอยู่, null = ยังไม่เคยขอ
  const [myAdminRequest, setMyAdminRequest] = useState(undefined);
  const [showAdminGuide, setShowAdminGuide] = useState(false);
  const [remoteCommunityAvatars, setRemoteCommunityAvatars] = useState([]);
  // Avatars created on this device, kept until the server confirms the write (or forever if rules block sharing).
  const [localCommunityAvatars, setLocalCommunityAvatars] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('badbeaowCommunityLocalAvatars') || '[]');
    } catch {
      return [];
    }
  });
  const [communityClock, setCommunityClock] = useState(() => Date.now());
  const communityAvatars = useMemo(() => {
    const remoteIds = new Set(remoteCommunityAvatars.map(avatar => avatar.id));
    return [...remoteCommunityAvatars, ...localCommunityAvatars.filter(avatar => !remoteIds.has(avatar.id))]
      .filter(avatar => !isCommunityAvatarExpired(avatar, communityClock));
  }, [remoteCommunityAvatars, localCommunityAvatars, communityClock]);
  const [communityPanelOpen, setCommunityPanelOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768);
  const [communityChatOpen, setCommunityChatOpen] = useState(true);
  const [pendingCommunityMessages, setPendingCommunityMessages] = useState([]);
  const communityChatListRef = useRef(null);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communityView, setCommunityView] = useState('overview');
  const [selectedCommunityAvatar, setSelectedCommunityAvatar] = useState(null);
  const [communityMessages, setCommunityMessages] = useState([]);
  const [communityChatDraft, setCommunityChatDraft] = useState('');
  const [isCommunityFullscreen, setIsCommunityFullscreen] = useState(false);
  const communityShellRef = useRef(null);
  const [communityDeviceId] = useState(() => {
    const savedId = localStorage.getItem('badbeaowCommunityDeviceId');
    if (savedId) return savedId;
    const newId = `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('badbeaowCommunityDeviceId', newId);
    return newId;
  });
  const [communityAvatar, setCommunityAvatar] = useState({
    name: 'นักแบดสายฟ้า',
    description: 'ชอบตีเร็วและเล่นสนุก',
    shirt: '#3c83ee',
    pants: '#293d9a',
    hair: '#18243f',
    skin: '#f1af7d',
    shoes: '#f8fbff',
    face: 'happy',
    hairStyle: 'short',
    gender: 'ชาย',
    outfit: 'เสื้อยืด + กางเกงขาสั้น',
  });
  const communityModelOptions = [
    '/models/Avatars/toothless_chimuelo_cute.glb',
    '/models/Avatars/shiba.glb',
    '/models/Avatars/roblox-bacon-hair.glb',
    '/models/Avatars/mr_beast_meme.glb',
    '/models/Avatars/free_rigged_toothless_meme.glb',
  ];
  const communityOwnerId = user?.uid || communityDeviceId;
  const ownCommunityAvatar = communityAvatars.find(avatar => avatar.ownerId === communityOwnerId);
  const displayedCommunityMessages = useMemo(() => {
    const remoteIds = new Set(communityMessages.map(message => message.id));
    const windowStart = getChatWindowStart(communityClock);
    return [...communityMessages, ...pendingCommunityMessages.filter(message => !remoteIds.has(message.id))]
      .filter(message => (message.createdAt || 0) >= windowStart)
      .sort((first, second) => (first.createdAt || 0) - (second.createdAt || 0))
      .slice(-60);
  }, [communityMessages, pendingCommunityMessages, communityClock]);
  const communityGenderStyle = gender => {
    if (gender === 'หญิง') return { symbol: '♀', className: 'bg-pink-500' };
    if (gender === 'เพศทางเลือก') return { symbol: '⚧', className: 'bg-gradient-to-br from-rose-500 via-amber-400 to-sky-500' };
    return { symbol: '♂', className: 'bg-sky-500' };
  };
  
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

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  const selectedCourt = COURTS.find(courtItem => courtItem.id === selectedCourtId);
  const scheduledMaintenanceMode = isMaintenanceScheduleActive(maintenanceSchedule, new Date(scheduleNow));
  const effectiveMaintenanceMode = maintenanceMode || scheduledMaintenanceMode;
  const resultLockStartedAt = Number(court.resultLockStartedAt || 0);
  const resultLockRemaining = Math.max(0, resultLockStartedAt + 300000 - resultLockNow);
  const isResultLocked = userRole !== 'superAdmin' && resultLockRemaining > 0;
  const resultLockTotalSeconds = Math.ceil(resultLockRemaining / 1000);
  const getCourtRoot = useCallback((courtId = selectedCourtId) => courtId === 'court-1'
    ? 'badbeaow'
    : `badbeaow/courts/${courtId}`, [selectedCourtId]);
  const courtRoot = getCourtRoot();

  const getPowerLevel = (wins = 0) => {
    if (wins >= 40) return { label: 'ระดับเทพ 👑', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    if (wins >= 30) return { label: 'มือแข็ง 🔥', color: 'bg-orange-100 text-orange-700 border-orange-300' };
    if (wins >= 20) return { label: 'มือกลาง ⚡', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    if (wins >= 10) return { label: 'พอตีได้ 🏸', color: 'bg-green-100 text-green-700 border-green-300' };
    return { label: 'มือใหม่ 🌱', color: 'bg-gray-100 text-gray-500 border-gray-200' };
  };

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: 'success' }), 2500);
  }, []);

  const handleLogout = useCallback(async (isAuto = false) => {
    try {
      localStorage.removeItem('adminLastActive');
      await signOut(auth);
      await signInAnonymously(auth);
      setUserRole('user');
      setAssignedCourtIds([]);
      setIsAdmin(false);
      showToast(isAuto ? 'ออกจากระบบอัตโนมัติเนื่องจากไม่ใช้งานเกิน 1 ชม.' : 'ออกจากระบบแอดมินแล้ว', isAuto ? 'error' : 'success');
    } catch (error) {
      console.error(error);
    }
  }, [showToast]);

  // ระบบตรวจสอบ Inactivity Timeout (1 ชั่วโมง)
  useEffect(() => {
    if (!user?.email) return undefined;

    const updateActivity = () => {
      localStorage.setItem('adminLastActive', Date.now().toString());
    };

    if (!localStorage.getItem('adminLastActive')) {
      updateActivity();
    }

    let lastThrottle = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 15000) {
        lastThrottle = now;
        updateActivity();
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    const checkTimer = setInterval(() => {
      const lastActive = Number(localStorage.getItem('adminLastActive') || 0);
      if (lastActive && Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
        handleLogout(true);
      }
    }, 30000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(checkTimer);
    };
  }, [user, handleLogout]);

  // Inject Tailwind CSS, Fonts, Styles & Court Themes
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
      @keyframes shrink {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
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
        0% { opacity: 1; }
        100% { opacity: 1; }
      }
      @keyframes splash-content-exit {
        0% { opacity: 1; transform: scale(1); }
        45% { opacity: 0.45; transform: scale(1.015) translateY(-3px); filter: blur(1px); }
        100% { opacity: 0; transform: scale(1.035) translateY(-8px); filter: blur(4px); }
      }
      .splash-screen-exiting {
        animation: splash-screen-exit 0.7s ease-in forwards;
      }
      .splash-screen-exiting::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(5px);
        animation: splash-light-flash 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .splash-screen-exiting .splash-title {
        position: relative;
        z-index: 3;
      }
      .splash-screen-exiting .splash-content {
        position: relative;
        z-index: 2;
        animation: splash-content-exit 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .animate-jelly {
        animation: jelly-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      .queue-item {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      .drag-handle {
          touch-action: none;
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
      .court-theme-court-2 .hover\\:bg-purple-700:hover { background-color: #b45309 !important; }
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
      .court-theme-court-3 .hover\\:bg-purple-700:hover { background-color: #047857 !important; }
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
      .court-theme-court-4 .hover\\:bg-purple-700:hover { background-color: #0369a1 !important; }
      .court-theme-court-4 .border-purple-100 { border-color: #bae6fd !important; }
      .court-theme-court-4 .border-purple-200 { border-color: #7dd3fc !important; }
      .court-theme-court-4 .border-purple-500 { border-color: #0284c7 !important; }
    `;
    document.head.appendChild(style);

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
                holdToDrag: 100
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

  useEffect(() => {
    const chatRef = query(ref(db, 'community/chat'), limitToLast(60));
    return onValue(chatRef, snapshot => {
      const data = snapshot.val() || {};
      const messages = Object.entries(data).map(([id, message]) => ({ id, ...message })).sort((first, second) => (first.createdAt || 0) - (second.createdAt || 0));
      setCommunityMessages(messages);
    }, error => console.warn('Community chat is local only:', error.message));
  }, []);

  useEffect(() => {
    if (!court.resultLockStartedAt) return undefined;
    const timer = setInterval(() => setResultLockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [court.resultLockStartedAt]);

  // คำขอเป็นแอดมินของบัญชีที่ล็อกอินอยู่ (ยังไม่มีสิทธิ์สนามไหน)
  useEffect(() => {
    if (!user?.email || userRole === 'superAdmin') {
      setMyAdminRequest(undefined);
      return undefined;
    }
    return onValue(ref(db, `adminRequests/${user.uid}`), snapshot => {
      setMyAdminRequest(snapshot.val());
    }, () => setMyAdminRequest(undefined));
  }, [user, userRole]);

  // เมื่อ SuperAdmin อนุมัติ ให้ได้สิทธิ์สนามนั้นทันทีโดยไม่ต้องล็อกอินใหม่
  useEffect(() => {
    if (myAdminRequest?.status !== 'approved' || assignedCourtIds.includes(myAdminRequest.courtId)) return;
    get(ref(db, `boardAdmins/${myAdminRequest.courtId}/${user.uid}`))
      .then(snapshot => {
        if (snapshot.val() === true) setAssignedCourtIds(current => [...new Set([...current, myAdminRequest.courtId])]);
      })
      .catch(() => {});
  }, [myAdminRequest, assignedCourtIds, user]);

  // Log อุปกรณ์ที่เข้าใช้งาน (วันละ 1 รายการต่ออุปกรณ์) ให้ SuperAdmin ดู
  useEffect(() => {
    if (!user?.uid) return;
    logVisit({ uid: user.uid, email: user.email, courtId: selectedCourtId }).catch(() => {});
  }, [user, selectedCourtId]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth Error:", error);
        }
        return;
      }

      setUser(currentUser);
      if (currentUser?.email) {
        try {
          const roleSnapshot = await get(ref(db, `users/${currentUser.uid}/role`));
          const role = roleSnapshot.val() || 'user';
          setUserRole(role);

          const adminChecks = await Promise.all(COURTS.map(async (courtItem) => {
            try {
              const snapshot = await get(ref(db, `boardAdmins/${courtItem.id}/${currentUser.uid}`));
              return snapshot.val() === true ? courtItem.id : null;
            } catch {
              return null;
            }
          }));
          const courtIds = adminChecks.filter(Boolean);
          setAssignedCourtIds(role === 'superAdmin' ? COURTS.map(courtItem => courtItem.id) : courtIds);
          
          if (!localStorage.getItem('adminLastActive')) {
            localStorage.setItem('adminLastActive', Date.now().toString());
          }
        } catch (error) {
          console.error('Role lookup error:', error);
          setUserRole('user');
          setAssignedCourtIds([]);
        }
      } else {
        setUserRole('user');
        setAssignedCourtIds([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSplashComplete(false);
    setSplashExiting(false);
    setSplashVideoDone(false);
    if (selectedCourtId) return undefined;

    const exitTimer = setTimeout(() => setSplashExiting(true), 3300);
    const splashTimer = setTimeout(() => setSplashComplete(true), 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(splashTimer);
    };
  }, [selectedCourtId]);

  useEffect(() => {
    if (!selectedCourtId || !splashVideoDone) return undefined;
    setSplashExiting(true);
    const completeTimer = setTimeout(() => setSplashComplete(true), 700);
    return () => clearTimeout(completeTimer);
  }, [selectedCourtId, splashVideoDone]);

  useEffect(() => {
    if (!selectedCourtId) return undefined;
    const fallbackTimer = setTimeout(() => setSplashVideoDone(true), 30000);
    return () => clearTimeout(fallbackTimer);
  }, [selectedCourtId]);

  useEffect(() => {
    const dateTimer = setInterval(() => {
      const nextDateKey = getTodayKey();
      setTodayKey(previousDateKey => previousDateKey === nextDateKey ? previousDateKey : nextDateKey);
    }, 60000);
    return () => clearInterval(dateTimer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsCommunityFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const maintenanceRef = ref(db, 'systemStatus/maintenanceMode');
    return onValue(maintenanceRef, snapshot => {
      setMaintenanceMode(snapshot.val() === true);
    });
  }, []);

  useEffect(() => {
    const qrRef = ref(db, 'systemStatus/paymentQrCode');
    return onValue(qrRef, snapshot => {
      setPaymentQrCode(typeof snapshot.val() === 'string' ? snapshot.val() : '');
    });
  }, []);

  useEffect(() => {
    const communityRef = ref(db, 'community/avatars');
    return onValue(communityRef, snapshot => {
      const data = snapshot.val() || {};
      const remoteAvatars = Object.entries(data).map(([id, avatar]) => ({ id, ...avatar }));
      setRemoteCommunityAvatars(remoteAvatars);
    }, error => console.warn('Community avatars are using local fallback:', error.message));
  }, []);

  useEffect(() => {
    localStorage.setItem('badbeaowCommunityLocalAvatars', JSON.stringify(localCommunityAvatars));
  }, [localCommunityAvatars]);

  useEffect(() => {
    const timer = setInterval(() => setCommunityClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Clear avatars 2 hours after creation and chat from previous 2-hour windows.
  // Any signed-in client may do this; the database rules only allow deleting expired entries.
  useEffect(() => {
    setLocalCommunityAvatars(current => {
      const kept = current.filter(avatar => !isCommunityAvatarExpired(avatar, communityClock));
      return kept.length === current.length ? current : kept;
    });
    setPendingCommunityMessages(current => {
      const windowStart = getChatWindowStart(communityClock);
      const kept = current.filter(message => (message.createdAt || 0) >= windowStart);
      return kept.length === current.length ? current : kept;
    });
    if (!user) return;
    remoteCommunityAvatars
      .filter(avatar => isCommunityAvatarExpired(avatar, communityClock))
      .forEach(avatar => remove(ref(db, `community/avatars/${avatar.id}`)).catch(() => {}));
    const oldChatQuery = query(ref(db, 'community/chat'), orderByChild('createdAt'), endAt(getChatWindowStart(communityClock) - 1));
    get(oldChatQuery)
      .then(snapshot => {
        const removals = {};
        snapshot.forEach(child => { removals[child.key] = null; });
        return Object.keys(removals).length ? update(ref(db, 'community/chat'), removals) : undefined;
      })
      .catch(() => {});
  }, [user, remoteCommunityAvatars, communityClock]);

  useEffect(() => {
    const list = communityChatListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [displayedCommunityMessages, communityChatOpen]);

  useEffect(() => {
    if (!user || !selectedCourtId) {
      setPaymentRequests([]);
      return undefined;
    }
    const requestsRef = ref(db, `${courtRoot}/paymentRequests`);
    return onValue(requestsRef, snapshot => {
      const data = snapshot.val() || {};
      const requests = Object.keys(data).map(id => ({ id, ...data[id] }));
      requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPaymentRequests(requests);
    }, error => console.error('Payment requests lookup error:', error));
  }, [user, selectedCourtId, courtRoot]);

  useEffect(() => {
    const scheduleRef = ref(db, 'systemStatus/maintenanceSchedule');
    return onValue(scheduleRef, snapshot => {
      const schedule = snapshot.val() || {};
      const nextSchedule = {
        enabled: schedule.enabled === true,
        startTime: schedule.startTime || '18:00',
        endTime: schedule.endTime || '23:00',
      };
      setMaintenanceSchedule(nextSchedule);
      setScheduleStartTime(nextSchedule.startTime);
      setScheduleEndTime(nextSchedule.endTime);
    });
  }, []);

  useEffect(() => {
    const scheduleTimer = setInterval(() => setScheduleNow(Date.now()), 30000);
    return () => clearInterval(scheduleTimer);
  }, []);

  useEffect(() => {
    const adminCourtId = selectedCourtId || (userRole === 'superAdmin' ? superAdminCourtId : null);
    if (!user || !adminCourtId) {
      setManagedAdminIds({});
      if (userRole !== 'superAdmin') setIsAdmin(false);
      return;
    }

    const adminsRef = ref(db, `boardAdmins/${adminCourtId}`);
    const unsubscribe = onValue(adminsRef, (snapshot) => {
      const admins = snapshot.val() || {};
      setManagedAdminIds(admins);
      setIsAdmin(userRole === 'superAdmin' || admins[user.uid] === true);
    }, () => {
      setManagedAdminIds({});
      setIsAdmin(userRole === 'superAdmin');
    });

    return () => unsubscribe();
  }, [user, userRole, selectedCourtId, superAdminCourtId]);

  // Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsProcessing(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const roleSnapshot = await get(ref(db, `users/${credential.user.uid}/role`));
      const role = roleSnapshot.val() || 'user';
      const adminChecks = await Promise.all(COURTS.map(async courtItem => {
        try {
          const snapshot = await get(ref(db, `boardAdmins/${courtItem.id}/${credential.user.uid}`));
          return snapshot.val() === true ? courtItem.id : null;
        } catch {
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
      localStorage.setItem('adminLastActive', Date.now().toString());

      if (role !== 'superAdmin' && courtIds.length === 1) setSelectedCourtId(courtIds[0]);

      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      showToast(hasAdminAccess ? 'เข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบแล้ว แต่ยังไม่มีสิทธิ์ผู้ดูแล', hasAdminAccess ? 'success' : 'error');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setLoginError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
      }
    }
    setIsProcessing(false);
  };

  const toggleMaintenanceMode = async () => {
    if (userRole !== 'superAdmin') return;
    setMaintenanceUpdating(true);
    try {
      await set(ref(db, 'systemStatus/maintenanceMode'), !maintenanceMode);
      showToast(!maintenanceMode ? 'เปิดโหมดปรับปรุงระบบแล้ว' : 'เปิดระบบให้ผู้ใช้ใช้งานแล้ว', 'success');
    } catch {
      showToast('เปลี่ยนสถานะระบบไม่สำเร็จ', 'error');
    } finally {
      setMaintenanceUpdating(false);
    }
  };

  const saveMaintenanceSchedule = async () => {
    if (userRole !== 'superAdmin') return;
    if (scheduleStartTime === scheduleEndTime) {
      showToast('เวลาเปิดและเวลาปิดต้องไม่เหมือนกัน', 'error');
      return;
    }
    setScheduleUpdating(true);
    try {
      await set(ref(db, 'systemStatus/maintenanceSchedule'), {
        enabled: maintenanceSchedule.enabled,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
      });
      showToast('บันทึกตารางเวลาเรียบร้อยแล้ว', 'success');
    } catch {
      showToast('บันึกตารางเวลาไม่สำเร็จ', 'error');
    } finally {
      setScheduleUpdating(false);
    }
  };

  const handleQrUpload = event => {
    if (!isAdmin) {
      showToast('เฉพาะแอดมินของสนามเท่านั้นที่อัปโหลด QR ได้', 'error');
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }
    setQrUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const image = new Image();
        image.src = reader.result;
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const optimizedQr = canvas.toDataURL('image/png');
        await set(ref(db, 'systemStatus/paymentQrCode'), optimizedQr);
        showToast('อัปโหลด QR พร้อมเพย์เรียบร้อยแล้ว', 'success');
      } catch {
        showToast('อัปโหลด QR ไม่สำเร็จ', 'error');
      } finally {
        setQrUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeQrCode = async () => {
    if (!isAdmin) return;
    setQrUploading(true);
    try {
      await remove(ref(db, 'systemStatus/paymentQrCode'));
      showToast('ลบรูป QR แล้ว', 'success');
    } catch {
      showToast('ลบรูป QR ไม่สำเร็จ', 'error');
    } finally {
      setQrUploading(false);
    }
  };

  const handleSlipUpload = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์สลิปเป็นรูปภาพเท่านั้น', 'error');
      return;
    }
    setPaymentSlipUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const image = new Image();
        image.src = reader.result;
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const optimizedSlip = canvas.toDataURL('image/jpeg', 0.78);
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(optimizedSlip));
        const hash = Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
        setPaymentSlipData(optimizedSlip);
        setPaymentSlipHash(hash);
      } catch {
        showToast('อ่านรูปสลิปไม่สำเร็จ', 'error');
      } finally {
        setPaymentSlipUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitPaymentRequest = async () => {
    const player = players.find(item => item.id === paymentPlayerId);
    if (!player || !paymentSlipData || !paymentSlipHash) {
      showToast('กรุณาแนบรูปสลิปก่อนส่งรายการ', 'error');
      return;
    }
    if (!paymentQrCode) {
      showToast('ยังไม่มีรูป QR พร้อมเพย์ กรุณาแจ้งแอดมิน', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const requestRef = push(ref(db, `${courtRoot}/paymentRequests`));
      const hashRef = ref(db, `systemStatus/paymentSlipHashes/${paymentSlipHash}`);
      const hashResult = await runTransaction(hashRef, current => current || {
        requestId: requestRef.key,
        createdAt: Date.now(),
      });
      if (!hashResult.committed || hashResult.snapshot.val()?.requestId !== requestRef.key) {
        throw new Error('สลิปนี้ถูกส่งเข้าระบบแล้ว ไม่สามารถใช้ซ้ำได้');
      }
      await set(requestRef, {
        playerId: player.id,
        playerName: player.name,
        slipImage: paymentSlipData,
        slipHash: paymentSlipHash,
        status: 'pending',
        createdAt: Date.now(),
      });
      setShowPaymentForm(false);
      setPaymentPlayerId('');
      setPaymentSlipData('');
      setPaymentSlipHash('');
      showToast('ส่งสลิปแล้ว กรุณารอแอดมินตรวจสอบ', 'success');
    } catch (error) {
      showToast(error.message || 'ส่งรายการแจ้งโอนไม่สำเร็จ', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const updatePaymentRequest = async (request, status) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      const updates = { 
        status, 
        reviewedAt: Date.now(), 
        reviewedBy: user?.email || user?.uid || 'Admin' 
      };
      if (status === 'confirmed') {
        const player = players.find(item => item.id === request.playerId);
        if (!player) throw new Error('ไม่พบผู้เล่น');
        const receivedAmount = Number(paymentReviewAmounts[request.id]);
        if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) throw new Error('กรุณาระบุยอดที่ได้รับจริง');
        updates.receivedAmount = receivedAmount;
        const debtResult = await runTransaction(ref(db, `${courtRoot}/players/${request.playerId}/debt`), current => Math.max(0, Math.round(((Number(current) || 0) - receivedAmount) * 100) / 100));
        updates.playerDebt = Number(debtResult.snapshot.val()) || 0;
      }
      await update(ref(db, `${courtRoot}/paymentRequests/${request.id}`), updates);
      setPaymentReviewAmounts(previous => ({ ...previous, [request.id]: '' }));
      showToast(status === 'confirmed' ? 'ยืนยันและหักยอดหนี้แล้ว!' : 'ปฏิเสธรายการแล้ว', 'success');
    } catch (error) {
      showToast(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ราคาค่าสนาม/ค่าลูก และประวัติการแข่งของคอร์ดที่เลือก
  useEffect(() => {
    if (!user || !selectedCourtId) return undefined;
    const unsubSettings = onValue(ref(db, `${courtRoot}/settings`), snapshot => {
      const value = snapshot.val() || {};
      setCourtSettings({ feePerPerson: Number(value.feePerPerson) || 10, shuttlePrice: Number(value.shuttlePrice) || 0 });
    }, () => setCourtSettings({ feePerPerson: 10, shuttlePrice: 0 }));
    const unsubMatches = onValue(query(ref(db, `${courtRoot}/matches`), limitToLast(80)), snapshot => {
      const value = snapshot.val() || {};
      setMatches(Object.entries(value).map(([id, match]) => ({ id, ...match })).sort((a, b) => (b.at || 0) - (a.at || 0)));
    }, () => setMatches([]));
    return () => { unsubSettings(); unsubMatches(); };
  }, [user, selectedCourtId, courtRoot]);

  useEffect(() => {
    if (!selectedCourtId) return;
    try { setFollowPlayerIdState(localStorage.getItem(`badbeaowFollow:${selectedCourtId}`) || ''); } catch { setFollowPlayerIdState(''); }
  }, [selectedCourtId]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Sync Database
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
            isFromToday,
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
  }, [user, activeTab, getCourtRoot]);

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
  }, [user, userRole, activeTab, getCourtRoot]);

  const presentPlayers = useMemo(() => players.filter(p => p.isPresent), [players]);
  const todayMatches = useMemo(() => matches.filter(match => match.date === todayKey), [matches, todayKey]);
  const gamesToday = useCallback(player => Number(player?.dailyGames?.[todayKey]) || 0, [todayKey]);
  const UNDO_WINDOW_MS = 2 * 60 * 1000;
  const lastResult = court?.lastResult || null;
  const canUndoResult = Boolean(lastResult && (isAdmin || (!lastResult.charge && nowTick - lastResult.at < UNDO_WINDOW_MS)));
  
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

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || '';

  const selectCourt = (courtId) => {
    setSelectedCourtId(courtId);
    setSplashComplete(false);
    setSplashExiting(false);
    setSplashVideoDone(false);
    setActiveTab('queue');
    setPlayers([]);
    setQueue([]);
    setCourt({ teamA: null, teamB: null });
    setDraftPair([null, null]);
    setAllCourtPlayers({});
  };

  const handleAddCommunityAvatar = async () => {
    if (ownCommunityAvatar) {
      showToast('เครื่องนี้มี Avatar อยู่แล้ว ลบตัวเดิมก่อนสร้างใหม่', 'error');
      return;
    }
    const model = communityModelOptions[Math.floor(Math.random() * communityModelOptions.length)];
    const avatarRef = push(ref(db, 'community/avatars'));
    const avatarToAdd = {
      ...communityAvatar,
      name: communityAvatar.name.trim() || 'นักแบดสายฟ้า',
      description: communityAvatar.description.trim() || 'ชอบตีเร็วและเล่นสนุก',
      model,
      ownerId: communityOwnerId,
      createdAt: Date.now(),
    };
    // Show it right away; the server copy takes over once the write is confirmed.
    setLocalCommunityAvatars(current => [...current, { ...avatarToAdd, id: avatarRef.key }]);
    setCommunityOpen(true);
    showToast('เพิ่มตัวละครเข้าคอมมูแล้ว', 'success');
    try {
      await set(avatarRef, avatarToAdd);
      // Drop the local copy only once the server accepted it; an optimistic echo can still be rolled back.
      setLocalCommunityAvatars(current => current.filter(avatar => avatar.id !== avatarRef.key));
    } catch {
      showToast('ตัวละครแสดงเฉพาะเครื่องนี้ (ต้อง publish rules ของ community ใน Firebase ก่อน)', 'error');
    }
  };

  const handleDeleteCommunityAvatar = async () => {
    if (!ownCommunityAvatar) return;
    const avatarToDelete = ownCommunityAvatar;
    setIsProcessing(true);
    setLocalCommunityAvatars(current => current.filter(avatar => avatar.id !== avatarToDelete.id));
    setRemoteCommunityAvatars(current => current.filter(avatar => avatar.id !== avatarToDelete.id));
    setSelectedCommunityAvatar(current => (current?.id === avatarToDelete.id ? null : current));
    try {
      if (!avatarToDelete.id.startsWith('local-')) await remove(ref(db, `community/avatars/${avatarToDelete.id}`));
      showToast('ลบ Avatar ของเครื่องนี้แล้ว', 'success');
    } catch {
      showToast('ลบในเครื่องแล้ว แต่ลบบนเซิร์ฟเวอร์ไม่สำเร็จ กรุณา publish rules ใหม่', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCommunityFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await communityShellRef.current?.requestFullscreen();
      }
    } catch {
      showToast('เบราว์เซอร์ไม่อนุญาตโหมดเต็มจอ', 'error');
    }
  };

  const handleCommunityAvatarSelect = useCallback(avatar => {
    setSelectedCommunityAvatar(avatar);
  }, []);

  const handleSendCommunityMessage = async event => {
    event.preventDefault();
    const draft = communityChatDraft.trim();
    if (!draft) return;
    const messageRef = push(ref(db, 'community/chat'));
    const message = { text: draft.slice(0, 180), sender: (ownCommunityAvatar?.name || 'ผู้เล่น').slice(0, 22), senderId: communityOwnerId, createdAt: Date.now() };
    setCommunityChatDraft('');
    setPendingCommunityMessages(current => [...current, { ...message, id: messageRef.key }]);
    try {
      await set(messageRef, message);
      setPendingCommunityMessages(current => current.filter(pending => pending.id !== messageRef.key));
    } catch {
      setPendingCommunityMessages(current => current.map(pending => (pending.id === messageRef.key ? { ...pending, localOnly: true } : pending)));
    }
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
    } catch {
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
    } catch {
      showToast('ถอดสิทธิ์ไม่สำเร็จ', 'error');
    }
    setIsProcessing(false);
  };

  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (b.wins || 0) - (a.wins || 0) || (a.losses || 0) - (b.losses || 0));
  }, [players]);

  const rankedAllCourtPlayers = useMemo(() => {
    const combinedPlayers = new Map();
    Object.values(allCourtPlayers).flat().forEach(player => {
      const playerKey = player.name.trim().toLowerCase();
      const existingPlayer = combinedPlayers.get(playerKey);
      if (existingPlayer) {
        existingPlayer.wins += player.wins || 0;
        existingPlayer.losses += player.losses || 0;
        existingPlayer.games += player.games || 0;
        existingPlayer.courts.push(player.courtName);
      } else {
        combinedPlayers.set(playerKey, {
          ...player,
          id: `all-${playerKey}`,
          wins: player.wins || 0,
          losses: player.losses || 0,
          games: player.games || 0,
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

  const exerciseMonth = new Date();
  const exerciseDays = Array.from({ length: new Date(exerciseMonth.getFullYear(), exerciseMonth.getMonth() + 1, 0).getDate() }, (_, index) => {
    const date = new Date(exerciseMonth.getFullYear(), exerciseMonth.getMonth(), index + 1);
    return { date, plan: getExercisePlan(exerciseProfile, date) };
  });
  const exerciseBmi = Number(exerciseProfile.height) > 0
    ? Number(exerciseProfile.weight) / ((Number(exerciseProfile.height) / 100) ** 2)
    : 0;
  const exerciseReady = Number(exerciseProfile.age) > 0 && Number(exerciseProfile.weight) > 0 && Number(exerciseProfile.height) > 0;
  const exerciseToday = exerciseDays.find(item => item.date.toISOString().slice(0, 10) === todayKey) || exerciseDays[0];

  const pendingRequests = useMemo(() => {
    return paymentRequests.filter(req => req.status === 'pending');
  }, [paymentRequests]);

  const historyRequests = useMemo(() => {
    const list = paymentRequests.filter(req => req.status === 'confirmed' || req.status === 'rejected');
    if (historyFilter === 'all') return list;
    return list.filter(req => req.status === historyFilter);
  }, [paymentRequests, historyFilter]);

  // Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedQueueIdx(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString()); 
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (dragOverQueueIdx !== index) setDragOverQueueIdx(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); 
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragOverQueueIdx !== index) setDragOverQueueIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedQueueIdx(null);
    setDragOverQueueIdx(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (!isAdmin) return;
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
          if (pIndex !== -1) queueUpdates[`${q.id}/pair/${pIndex}/name`] = trimmedName;
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
    } catch { 
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนชื่อ', 'error');
    }
    setIsProcessing(false);
  };

  const handleDeletePlayerClick = (player) => {
    if (!isAdmin) return;
    if ((player.debt || 0) > 0) {
      showToast(`ไม่สามารถลบ ${player.name} ได้ เนื่องจากยังมียอดค้างจ่าย ${player.debt.toFixed(2)} ฿`, 'error');
      return;
    }
    setPlayerToDelete(player.id);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;
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

  const handleDeleteAllQueueClick = () => {
    if (queue.length === 0) {
      showToast('ยังไม่มีคู่ในคิวให้ลบ', 'error');
      return;
    }
    setShowDeleteAllQueueModal(true);
  };

  const confirmDeleteAllQueue = async () => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      await set(ref(db, `${courtRoot}/queue`), null);
      setShowDeleteAllQueueModal(false);
      showToast('ลบคู่ในคิวทั้งหมดแล้ว', 'success');
    } catch {
      showToast('ลบคู่ทั้งหมดไม่สำเร็จ', 'error');
    }
    setIsProcessing(false);
  };

  const confirmDeleteAllPlayers = async () => {
      if (!isAdmin) return;
      setIsProcessing(true);
      try {
          // ลบทีละคน เพราะ rules อนุญาตให้เขียนได้ระดับผู้เล่นแต่ละคน ไม่ใช่ทั้งโฟลเดอร์ players
          await update(ref(db), Object.fromEntries(players.map(p => [`${courtRoot}/players/${p.id}`, null])));
          await set(ref(db, `${courtRoot}/queue`), null);
          await set(ref(db, `${courtRoot}/court`), { teamA: null, teamB: null });
          setShowDeleteAllPlayersModal(false);
          showToast('ล้างข้อมูลผู้เล่น คิว และสนามทั้งหมดเรียบร้อยแล้ว!', 'success');
      } catch {
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

  // สุ่มจากคนที่ได้เล่นน้อยที่สุดวันนี้ก่อน เพื่อให้ทุกคนได้ลงสนามใกล้เคียงกัน
  const pickRandomPlayer = (candidates, excludedIds = []) => {
    const eligible = candidates.filter(player => !excludedIds.includes(player.id));
    if (!eligible.length) return null;
    const fewest = Math.min(...eligible.map(gamesToday));
    const leastPlayed = eligible.filter(player => gamesToday(player) === fewest);
    return leastPlayed[Math.floor(Math.random() * leastPlayed.length)];
  };

  const handleRandomPair = () => {
    const first = pickRandomPlayer(availablePlayers);
    const second = first ? pickRandomPlayer(availablePlayers, [first.id]) : null;
    if (!first || !second) {
      showToast('ต้องมีผู้เล่นว่างอย่างน้อย 2 คนเพื่อสุ่มจับคู่', 'error');
      return;
    }
    setDraftPair([first.id, second.id]);
    showToast(`สุ่มจับคู่ ${first.name} กับ ${second.name} แล้ว`, 'success');
  };

  const handleRandomOpponent = () => {
    if (court.teamA || court.teamB) {
      showToast('ต้องเคลียร์สนามก่อนสุ่มคู่แข่งจากคิว', 'error');
      return;
    }
    if (queue.length < 2) {
      showToast('ต้องมีคิวอย่างน้อย 2 คู่เพื่อสุ่มเจอกัน', 'error');
      return;
    }
    const shuffledQueue = [...queue].sort(() => Math.random() - 0.5);
    const [firstPair, secondPair] = shuffledQueue;
    setIsProcessing(true);
    update(ref(db), {
      [`${courtRoot}/court`]: { teamA: firstPair.pair, teamB: secondPair.pair },
      [`${courtRoot}/queue/${firstPair.id}`]: null,
      [`${courtRoot}/queue/${secondPair.id}`]: null,
    }).then(() => {
      showToast(`สุ่มคู่แข่งในคิว: ${firstPair.pair.map(player => player.name).join(' & ')} พบ ${secondPair.pair.map(player => player.name).join(' & ')}`, 'success');
    }).catch(() => {
      showToast('สุ่มคู่แข่งจากคิวไม่สำเร็จ กรุณาลองใหม่', 'error');
    }).finally(() => setIsProcessing(false));
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
    if (draftPair.some(id => allBusyIds.has(id))) {
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
      await push(ref(db, `${courtRoot}/queue`), { pair: pairData, sortOrder: maxOrder + 100 });
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
    if (queue.length < 2) {
      showToast('ต้องมีคิวอย่างน้อย 2 คู่ก่อนเริ่มการแข่งขัน', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await update(ref(db), {
        [`${courtRoot}/court`]: { teamA: queue[0].pair, teamB: queue[1].pair },
        [`${courtRoot}/queue/${queue[0].id}`]: null,
        [`${courtRoot}/queue/${queue[1].id}`]: null,
      });
      showToast('เริ่มการแข่งขันแล้ว!', 'success');
    } catch {
      showToast('ดึงคู่ลงสนามไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWin = async (winnerTeam) => {
    if (isResultLocked || !court.teamA || !court.teamB) return;
    setIsProcessing(true);
    try {
      const resultTimestamp = Date.now();
      const isRapidResult = resultTimestamp - Number(court.lastResultAt || 0) < 10000;
      let lockTime = 0;

      if (isRapidResult && userRole !== 'superAdmin') {
        const lockTransaction = await runTransaction(ref(db, `${courtRoot}/court/resultLockStartedAt`), currentLockStart => {
          const lockStart = Number(currentLockStart || 0);
          return lockStart + 300000 > resultTimestamp ? lockStart : resultTimestamp;
        });
        lockTime = Number(lockTransaction.snapshot.val() || 0);
        showToast('กดผลการแข่งขันเร็วเกินไป ระบบล็อกปุ่มไว้ 5 นาที', 'error');
      }

      const winningTeam = winnerTeam === 'A' ? court.teamA : court.teamB;
      const losingTeam = winnerTeam === 'A' ? court.teamB : court.teamA;
      let nextTeamA = winnerTeam === 'A' ? court.teamA : null;
      let nextTeamB = winnerTeam === 'B' ? court.teamB : null;
      const resultUpdates = {};
      const playerPath = (id, field) => `${courtRoot}/players/${id}/${field}`;

      rankedPlayers.forEach((player, index) => {
        resultUpdates[playerPath(player.id, 'previousRank')] = index + 1;
      });
      // Atomic increments: two phones recording at once can't overwrite each other.
      winningTeam.forEach(player => {
        resultUpdates[playerPath(player.id, 'wins')] = increment(1);
        resultUpdates[playerPath(player.id, 'games')] = increment(1);
        resultUpdates[playerPath(player.id, `dailyGames/${todayKey}`)] = increment(1);
      });
      losingTeam.forEach(player => {
        resultUpdates[playerPath(player.id, 'losses')] = increment(1);
        resultUpdates[playerPath(player.id, 'games')] = increment(1);
        resultUpdates[playerPath(player.id, `dailyGames/${todayKey}`)] = increment(1);
      });

      // ค่าลูกขนไก่ หาร 4 คนที่ลงเล่น (เฉพาะแอดมินเป็นคนบันทึก เพราะเป็นการแก้ยอดเงิน)
      const shuttles = Math.max(0, Math.round(Number(shuttlesUsed) || 0));
      const charge = isAdmin && courtSettings.shuttlePrice > 0 && shuttles > 0 ? Math.round((shuttles * courtSettings.shuttlePrice / 4) * 100) / 100 : 0;
      if (charge) [...winningTeam, ...losingTeam].forEach(player => { resultUpdates[playerPath(player.id, 'debt')] = increment(charge); });

      const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
      const losingQueueKey = push(ref(db, `${courtRoot}/queue`)).key;
      resultUpdates[`${courtRoot}/queue/${losingQueueKey}`] = { pair: losingTeam, sortOrder: maxOrder + 100 };
      let removedQueue = null;
      if (queue.length > 0) {
        const nextPairObj = queue[0];
        if (winnerTeam === 'A') nextTeamB = nextPairObj.pair;
        if (winnerTeam === 'B') nextTeamA = nextPairObj.pair;
        removedQueue = { id: nextPairObj.id, pair: nextPairObj.pair, sortOrder: nextPairObj.sortOrder || 0 };
        resultUpdates[`${courtRoot}/queue/${nextPairObj.id}`] = null;
      }

      const matchId = push(ref(db, `${courtRoot}/matches`)).key;
      const matchRecord = {
        at: resultTimestamp, date: todayKey, teamA: court.teamA, teamB: court.teamB, winner: winnerTeam, shuttles, charge,
      };
      resultUpdates[`${courtRoot}/court`] = {
        teamA: nextTeamA,
        teamB: nextTeamB,
        lastResultAt: resultTimestamp,
        ...(lockTime && userRole !== 'superAdmin' ? { resultLockStartedAt: lockTime } : {}),
        // Everything needed to put the court back exactly as it was if this result was a mis-tap.
        lastResult: {
          at: resultTimestamp, date: todayKey, matchId, winner: winnerTeam, charge,
          prevTeamA: court.teamA, prevTeamB: court.teamB, removedQueue, addedQueueId: losingQueueKey,
          winnerIds: winningTeam.map(player => player.id), loserIds: losingTeam.map(player => player.id),
        },
      };
      await update(ref(db), resultUpdates);
      // History is written separately so a result still saves if the history rules aren't published yet.
      set(ref(db, `${courtRoot}/matches/${matchId}`), matchRecord).catch(() => {});
      setShuttlesUsed(1);
      if (!isRapidResult || userRole === 'superAdmin') showToast(`บันทึกผล: ทีม ${winnerTeam} ชนะ!${charge ? ` · ค่าลูกคนละ ${charge}฿` : ''}`, 'success');
    } catch {
      showToast('บันทึกผลการแข่งขันไม่สำเร็จ', 'error');
    }
    setIsProcessing(false);
  };

  const handleUndoResult = async () => {
    const last = court?.lastResult;
    if (!last) return;
    if (!isAdmin && (last.charge || Date.now() - last.at > UNDO_WINDOW_MS)) {
      showToast(last.charge ? 'ผลนี้มีการคิดค่าลูกแล้ว ต้องให้แอดมินย้อนผล' : 'ย้อนผลได้ภายใน 2 นาที หลังจากนั้นต้องให้แอดมินย้อน', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const updates = {};
      const playerPath = (id, field) => `${courtRoot}/players/${id}/${field}`;
      (last.winnerIds || []).forEach(id => {
        updates[playerPath(id, 'wins')] = increment(-1);
        updates[playerPath(id, 'games')] = increment(-1);
        updates[playerPath(id, `dailyGames/${last.date}`)] = increment(-1);
      });
      (last.loserIds || []).forEach(id => {
        updates[playerPath(id, 'losses')] = increment(-1);
        updates[playerPath(id, 'games')] = increment(-1);
        updates[playerPath(id, `dailyGames/${last.date}`)] = increment(-1);
      });
      if (last.charge) [...(last.winnerIds || []), ...(last.loserIds || [])].forEach(id => { updates[playerPath(id, 'debt')] = increment(-last.charge); });
      if (last.removedQueue) updates[`${courtRoot}/queue/${last.removedQueue.id}`] = { pair: last.removedQueue.pair, sortOrder: last.removedQueue.sortOrder };
      if (last.addedQueueId) updates[`${courtRoot}/queue/${last.addedQueueId}`] = null;
      updates[`${courtRoot}/court`] = { teamA: last.prevTeamA || null, teamB: last.prevTeamB || null, lastResultAt: court.lastResultAt || null };
      await update(ref(db), updates);
      if (last.matchId) remove(ref(db, `${courtRoot}/matches/${last.matchId}`)).catch(() => {});
      showToast('ย้อนผลล่าสุดแล้ว สนามกลับเป็นเหมือนก่อนกด', 'success');
    } catch {
      showToast('ย้อนผลไม่สำเร็จ', 'error');
    }
    setIsProcessing(false);
  };

  const saveCourtSettings = async next => {
    if (!isAdmin) return;
    const feePerPerson = Math.max(0, Number(next.feePerPerson) || 0);
    const shuttlePrice = Math.max(0, Number(next.shuttlePrice) || 0);
    try {
      await set(ref(db, `${courtRoot}/settings`), { feePerPerson, shuttlePrice });
      showToast('บันทึกราคาแล้ว', 'success');
    } catch {
      showToast('บันทึกราคาไม่สำเร็จ (ตรวจสอบว่า publish database rules แล้ว)', 'error');
    }
  };

  const setFollowPlayerId = id => {
    setFollowPlayerIdState(id);
    try { localStorage.setItem(`badbeaowFollow:${selectedCourtId}`, id); } catch { /* optional */ }
    if (id && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  };

  const handleClearCourt = async () => {
    setIsProcessing(true);
    try {
      const queueRef = ref(db, `${courtRoot}/queue`);
      const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
      const queuedPairKeys = new Set(queue.map(q => (q.pair || []).map(player => player.id).sort().join(':')));
      const updates = {};
      let currentMaxOrder = maxOrder;

      [court.teamA, court.teamB].forEach(team => {
        if (!team) return;
        const pairKey = team.map(player => player.id).sort().join(':');
        if (queuedPairKeys.has(pairKey)) return;

        const queueId = push(queueRef).key;
        currentMaxOrder += 100;
        updates[`${courtRoot}/queue/${queueId}`] = { pair: team, sortOrder: currentMaxOrder };
        queuedPairKeys.add(pairKey);
      });

      updates[`${courtRoot}/court`] = { teamA: null, teamB: null };
      await update(ref(db), updates);
      setCourt({ teamA: null, teamB: null });
      showToast('เคลียร์สนามและนำคู่กลับเข้าคิวเรียบร้อย (ข้ามคู่ที่มีอยู่แล้ว)', 'success');
    } catch { 
      showToast('เคลียร์สนามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
    setIsProcessing(false);
  };

  const handleAddIndividualFee = async (playerId, amount = courtSettings.feePerPerson) => {
    if (!isAdmin || !amount) return;
    setIsProcessing(true);
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      await update(ref(db, `${courtRoot}/players/${playerId}`), { debt: increment(amount) });
      showToast(`บวกค่าบำรุง ${amount} บาทให้ ${player.name} แล้ว`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleAddFixedFee = async () => {
    if (!isAdmin) return;
    const fee = courtSettings.feePerPerson;
    if (presentPlayers.length === 0 || !fee) return;
    setIsProcessing(true);
    try {
      await update(ref(db), Object.fromEntries(presentPlayers.map(p => [`${courtRoot}/players/${p.id}/debt`, increment(fee)])));
      showToast(`บวกค่าบำรุง ${fee} บาทให้ ${presentPlayers.length} คนเรียบร้อย!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleSplitBill = async () => {
    if (!isAdmin) return;
    const amount = parseFloat(totalCourtBill);
    if (presentPlayers.length === 0 || isNaN(amount) || amount <= 0) return;
    const perPerson = Math.round((amount / presentPlayers.length) * 100) / 100;
    setIsProcessing(true);
    try {
      await update(ref(db), Object.fromEntries(presentPlayers.map(p => [`${courtRoot}/players/${p.id}/debt`, increment(perPerson)])));
      setTotalCourtBill('');
      showToast(`หารค่าคอร์ตคนละ ${perPerson.toFixed(2)} บาทเรียบร้อย!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handlePayDebt = async (playerId) => {
    if (!isAdmin) return;
    const payAmount = parseFloat(paymentInputs[playerId]);
    if (isNaN(payAmount) || payAmount <= 0) return;
    setIsProcessing(true);
    try {
      // Transaction so the balance can't drop below zero even if two admins act at once.
      await runTransaction(ref(db, `${courtRoot}/players/${playerId}/debt`), current => Math.max(0, Math.round(((Number(current) || 0) - payAmount) * 100) / 100));
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
      await Promise.all(playersWithDebt.map(p => {
        const playerRef = ref(db, `${courtRoot}/players/${p.id}`);
        return update(playerRef, { debt: 0 });
      }));
      showToast('เคลียร์หนี้ทั้งหมดให้ทุกคนเรียบร้อยแล้ว!', 'success');
    } catch { 
      showToast('เกิดข้อผิดพลาดในการเคลียร์หนี้', 'error');
    }
    setIsProcessing(false);
  };

  const showSplash = loading || !splashComplete;
  const visibleCourts = user?.email && userRole !== 'superAdmin' && assignedCourtIds.length > 0
    ? COURTS.filter(courtItem => assignedCourtIds.includes(courtItem.id))
    : COURTS;
  const isLoggedInAdmin = Boolean(user?.email && (userRole === 'superAdmin' || assignedCourtIds.length > 0));
  const superAdminCourt = COURTS.find(courtItem => courtItem.id === superAdminCourtId) || COURTS[0];

  // แจ้งเตือนเมื่อคู่ของผู้เล่นที่ติดตามอยู่คิวถัดไป หรือได้ลงสนาม
  const followStatus = useMemo(() => {
    if (!followPlayerId) return null;
    const onTeam = team => Array.isArray(team) && team.some(player => player?.id === followPlayerId);
    if (onTeam(court?.teamA) || onTeam(court?.teamB)) return { state: 'playing', position: 0 };
    const index = queue.findIndex(item => onTeam(item.pair));
    if (index === -1) return { state: 'idle', position: -1 };
    return { state: index === 0 ? 'next' : 'waiting', position: index + 1 };
  }, [followPlayerId, court, queue]);
  const lastAlertRef = useRef('');
  useEffect(() => {
    if (!followStatus || (followStatus.state !== 'next' && followStatus.state !== 'playing')) {
      if (followStatus?.state === 'idle' || followStatus?.state === 'waiting') lastAlertRef.current = '';
      return;
    }
    if (lastAlertRef.current === followStatus.state) return;
    lastAlertRef.current = followStatus.state;
    const name = players.find(player => player.id === followPlayerId)?.name || 'คุณ';
    const message = followStatus.state === 'next' ? `${name} อยู่คิวถัดไป เตรียมตัวได้เลย!` : `${name} ได้ลงสนามแล้ว!`;
    showToast(message, 'success');
    try { navigator.vibrate?.([250, 120, 250]); } catch { /* optional */ }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audio = new AudioContextClass();
      [0, 0.22].forEach(offset => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.18, audio.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + offset + 0.18);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(audio.currentTime + offset);
        oscillator.stop(audio.currentTime + offset + 0.2);
      });
    } catch { /* sound is optional */ }
    try {
      if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('BADBEAOW', { body: message });
    } catch { /* optional */ }
  }, [followStatus, followPlayerId, players, showToast]);

  // Modal คู่มือการใช้งาน (ใช้ทั้งหน้าเลือกคอร์ดและหน้าจัดการคอร์ด)
  const guideModal = showGuide && <UserGuide accent={selectedCourt?.accent} onClose={() => setShowGuide(false)} />;

  // ทุกหน้าจอ (src/screens) อ่าน state และ handler จากตรงนี้ผ่าน useApp()
  const appContextValue = {
    activeTab, adminUidInput, availablePlayers, communityAvatar, communityAvatars,
    communityChatDraft, communityChatListRef, communityChatOpen, communityGenderStyle,
    communityOpen, communityOwnerId, communityPanelOpen, communityShellRef, communityView,
    confirmDeleteAllPlayers, confirmDeleteAllQueue, confirmDeletePlayer, confirmDeleteQueue,
    confirmEditPlayer, court, dashboardSummary, displayedCommunityMessages, draftPair,
    editPlayerName, effectiveMaintenanceMode, exerciseBmi, exerciseDays, exerciseMonth,
    exerciseProfile, exerciseReady, exerciseToday, filteredAvailablePlayers,
    filteredPlayersList, financeModalTab, getPlayerName, getPowerLevel, guideModal,
    handleAddCommunityAvatar, handleAddCourtAdmin, handleAddFixedFee, handleAddIndividualFee,
    handleAddPlayer, handleAdminLogin, handleClearAllDebt, handleClearCourt,
    handleCommunityAvatarSelect, handleCreatePair, handleDeleteAllPlayersClick,
    handleDeleteAllQueueClick, handleDeleteCommunityAvatar, handleDeletePlayerClick,
    handleDraftSelect, handleDragEnd, handleDragEnter, handleDragOver, handleDragStart,
    handleDrop, handleEditPlayerClick, handleLogout, handleMoveQueue, handlePayDebt,
    handleQrUpload, handleRandomOpponent, handleRandomPair, handleRemoveCourtAdmin,
    handleSendCommunityMessage, handleSlipUpload, handleSplitBill, handleStartGame, handleWin,
    highlightedQueueId, historyFilter, historyRequests, isAdmin, isCommunityFullscreen,
    isDesktop, isLoggedInAdmin, isProcessing, isResultLocked, leaderboardPlayers,
    leaderboardScope, loginEmail, loginError, loginPassword, maintenanceMode,
    maintenanceSchedule, maintenanceUpdating, managedAdminIds, newPlayerName,
    ownCommunityAvatar, paymentInputs, paymentQrCode, paymentReviewAmounts, paymentSlipData,
    paymentSlipUploading, pendingRequests, playerToDelete, playerToEdit, players,
    presentPlayers, previewSlipImage, qrUploading, queue, queueToDelete, removeQrCode,
    resultLockTotalSeconds, saveMaintenanceSchedule, scheduleEndTime, scheduleStartTime,
    scheduleUpdating, scheduledMaintenanceMode, searchDraftQuery, searchPlayerQuery,
    selectCourt, selectedCommunityAvatar, selectedCourt, selectedCourtId, setActiveTab,
    setAdminUidInput, setCommunityAvatar, setCommunityChatDraft, setCommunityChatOpen,
    setCommunityOpen, setCommunityPanelOpen, setCommunityView, setDraftPair, setEditPlayerName,
    setExerciseProfile, setFinanceModalTab, setHistoryFilter, setLeaderboardScope,
    setLoginEmail, setLoginPassword, setMaintenanceSchedule, setNewPlayerName,
    setPaymentInputs, setPaymentPlayerId, setPaymentReviewAmounts, setPlayerToDelete,
    setPlayerToEdit, setPreviewSlipImage, setQueueToDelete, setScheduleEndTime,
    setScheduleStartTime, setSearchDraftQuery, setSearchPlayerQuery,
    setSelectedCommunityAvatar, setSelectedCourtId, setShowAdminGuide,
    setShowDeleteAllPlayersModal, setShowDeleteAllQueueModal, setShowFinanceModal,
    setShowGuide, setShowLoginModal, setShowMoreMenu, setShowPaymentForm, setSplashVideoDone,
    setSuperAdminCourtId, setSuperAdminSection, setSuperAdminShowHome, setTotalCourtBill,
    showAdminGuide, showDeleteAllPlayersModal, showDeleteAllQueueModal,
    showFinanceModal, showLoginModal, showMoreMenu, showPaymentForm, showSplash, splashExiting,
    submitPaymentRequest, superAdminCourt, superAdminCourtId, superAdminSection, toast,
    todayKey, toggleCommunityFullscreen, toggleMaintenanceMode, togglePresence, totalCourtBill,
    updatePaymentRequest, user, userRole, visibleCourts,
    myAdminRequest, showToast,
    courtSettings, saveCourtSettings, todayMatches, gamesToday, shuttlesUsed, setShuttlesUsed,
    lastResult, canUndoResult, handleUndoResult, followPlayerId, setFollowPlayerId, followStatus, nowTick,
  };

  let screen;
  if (!loading && effectiveMaintenanceMode && userRole !== 'superAdmin') {
    screen = <MaintenanceScreen />;
  } else if (!selectedCourtId && user?.email && userRole === 'superAdmin' && !superAdminShowHome) {
    // SuperAdmin Control Center
    screen = <SuperAdminScreen />;
  } else if (!selectedCourtId) {
    // หน้าเลือกคอร์ดทั่วไป
    screen = <HomeScreen />;
  } else {
    // หน้าจอจัดการคอร์ดที่เลือก
    screen = <CourtScreen />;
  }

  return <AppContext.Provider value={appContextValue}>{screen}</AppContext.Provider>;
}
