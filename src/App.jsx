import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Wallet, ArrowUp, ArrowDown, Plus, Trash2, 
    UserPlus, Coins, ShieldCheck, Trophy, 
    Swords, X, Receipt, Check, Lock, Unlock, LogOut, Mail, Key, AlertCircle 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { getDatabase, ref, onValue, push, update, remove, set } from 'firebase/database';

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

export default function BadmintonApp() {
  const [activeTab, setActiveTab] = useState('queue');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Database State
  const [players, setPlayers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [court, setCourt] = useState({ teamA: null, teamB: null });

  // Local UI State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draftPair, setDraftPair] = useState([null, null]);
  const [totalCourtBill, setTotalCourtBill] = useState('');
  const [paymentInputs, setPaymentInputs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ message: null, type: 'success' }); // type: 'success' หรือ 'error'
  const [highlightedQueueId, setHighlightedQueueId] = useState(null);
  const [queueToDelete, setQueueToDelete] = useState(null);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  // Inject Tailwind CSS CDN & Google Font & Custom Animations
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
      .animate-jelly {
        animation: jelly-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(tailwindScript);
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: 'success' }), 2000); // เด้งสั้นๆ 2 วินาที
  };

  // Auth & Realtime Sync
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

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isUserAdmin = currentUser.email ? true : false;
        setIsAdmin(isUserAdmin);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsProcessing(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      showToast('เข้าสู่ระบบแอดมินสำเร็จ (ปลดล็อกระบบเงิน)', 'success');
    } catch (error) {
      console.error(error);
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    setIsProcessing(false);
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
      setIsAdmin(false);
      showToast('ออกจากระบบแอดมินแล้ว', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Listen to Players
    const playersRef = ref(db, 'badbeaow/players');
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedPlayers = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        loadedPlayers.sort((a, b) => a.name.localeCompare(b.name));
        setPlayers(loadedPlayers);
      } else {
        setPlayers([]);
      }
      setLoading(false);
    });

    // Listen to Queue
    const queueRef = ref(db, 'badbeaow/queue');
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

    // Listen to Court
    const courtRef = ref(db, 'badbeaow/court');
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
  }, [user]);

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

  const getPlayerName = (id) => players.find(p => p.id === id)?.name || '';

  // Handlers
  const handleAddPlayer = async (e) => {
    e.preventDefault();
    const trimmedName = newPlayerName.trim();
    if (!trimmedName) return;

    // ตรวจสอบชื่อซ้ำ (ไม่สนตัวพิมพ์เล็ก-ใหญ่)
    const isDuplicate = players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      showToast('มีชื่อผู้เล่นนี้อยู่ในระบบแล้ว', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const playersRef = ref(db, 'badbeaow/players');
      await push(playersRef, { name: trimmedName, isPresent: true, debt: 0 });
      setNewPlayerName('');
      showToast('เพิ่มผู้เล่นสำเร็จ!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;
    setIsProcessing(true);
    try {
      await remove(ref(db, `badbeaow/players/${playerToDelete}`));
      setPlayerToDelete(null);
      showToast('ลบผู้เล่นออกแล้ว', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const togglePresence = async (id, currentStatus) => {
    try {
      const playerRef = ref(db, `badbeaow/players/${id}`);
      await update(playerRef, { isPresent: !currentStatus });
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

    // 1. เช็คห้ามเลือกชื่อซ้ำกันเองในคู่เดียวกัน
    if (draftPair[0] === draftPair[1]) {
      showToast('ไม่สามารถเลือกชื่อผู้เล่นซ้ำกันในคู่เดียวกันได้', 'error');
      return;
    }

    const sortedDraftIds = [...draftPair].sort();

    // 2. เช็คว่ามีคู่นี้อยู่แล้วในคิวรอ
    const isPairExistsInQueue = queue.some(q => {
      if (!q.pair || q.pair.length !== 2) return false;
      const qIds = q.pair.map(p => p.id).sort();
      return qIds[0] === sortedDraftIds[0] && qIds[1] === sortedDraftIds[1];
    });

    if (isPairExistsInQueue) {
      showToast('คู่นี้มีอยู่ในคิวรออยู่แล้ว', 'error');
      return;
    }

    // 3. เช็คว่ามีคู่นี้กำลังแข่งขันอยู่บนสนาม
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

    // 4. เช็คผู้เล่นซ้ำซ้อนในคิวอื่น/สนามอื่น
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
      const queueRef = ref(db, 'badbeaow/queue');
      
      await push(queueRef, { pair: pairData, sortOrder: maxOrder + 100 });
      setDraftPair([null, null]);
      showToast('เพิ่มคู่เข้าคิวรอสำเร็จ!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleMoveQueue = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === queue.length - 1) return;

    setIsProcessing(true);
    try {
      const currentItem = queue[index];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const targetItem = queue[targetIndex];

      await update(ref(db, `badbeaow/queue/${currentItem.id}`), { 
        sortOrder: targetItem.sortOrder,
        isMoved: true,
        moveDirection: direction
      });
      await update(ref(db, `badbeaow/queue/${targetItem.id}`), { 
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
    if (!queueToDelete) return;
    setIsProcessing(true);
    try {
      await remove(ref(db, `badbeaow/queue/${queueToDelete}`));
      setQueueToDelete(null);
      showToast('ลบคิวออกแล้ว', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleStartGame = async () => {
    if (queue.length < 2) return;
    setIsProcessing(true);
    try {
      const courtRef = ref(db, 'badbeaow/court');
      await set(courtRef, { teamA: queue[0].pair, teamB: queue[1].pair });
      await remove(ref(db, `badbeaow/queue/${queue[0].id}`));
      await remove(ref(db, `badbeaow/queue/${queue[1].id}`));
      showToast('เริ่มการแข่งขันแล้ว!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleWin = async (winnerTeam) => {
    setIsProcessing(true);
    try {
      let nextTeamA = winnerTeam === 'A' ? court.teamA : null;
      let nextTeamB = winnerTeam === 'B' ? court.teamB : null;
      let losingTeam = winnerTeam === 'A' ? court.teamB : court.teamA;

      const queueRef = ref(db, 'badbeaow/queue');
      if (losingTeam) {
        const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
        await push(queueRef, { pair: losingTeam, sortOrder: maxOrder + 100 });
      }

      if (queue.length > 0) {
        const nextPairObj = queue[0];
        const nextPair = nextPairObj.pair;
        if (winnerTeam === 'A') nextTeamB = nextPair;
        if (winnerTeam === 'B') nextTeamA = nextPair;
        await remove(ref(db, `badbeaow/queue/${nextPairObj.id}`));
      }
      
      await set(ref(db, 'badbeaow/court'), { teamA: nextTeamA, teamB: nextTeamB });
      showToast(`บันทึกผล: ทีม ${winnerTeam} ชนะ!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleClearCourt = async () => {
    setIsProcessing(true);
    try {
      const queueRef = ref(db, 'badbeaow/queue');
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

      const courtRef = ref(db, 'badbeaow/court');
      await set(courtRef, { teamA: null, teamB: null });
      setCourt({ teamA: null, teamB: null });
      
      showToast('เคลียร์สนาม นำผู้เล่นกลับเข้าคิวรอเรียบร้อย', 'success');
    } catch (error) { 
      console.error(error); 
    }
    setIsProcessing(false);
  };

  const handleAddFixedFee = async () => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    if (presentPlayers.length === 0) return;
    setIsProcessing(true);
    try {
      const promises = presentPlayers.map(p => {
        const playerRef = ref(db, `badbeaow/players/${p.id}`);
        return update(playerRef, { debt: (p.debt || 0) + 10 });
      });
      await Promise.all(promises);
      showToast(`บวกค่าบำรุง 10 บาทให้ ${presentPlayers.length} คนเรียบร้อย!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleSplitBill = async () => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const amount = parseFloat(totalCourtBill);
    if (presentPlayers.length === 0 || isNaN(amount) || amount <= 0) return;
    const perPerson = amount / presentPlayers.length;
    setIsProcessing(true);
    try {
      await Promise.all(presentPlayers.map(p => {
        const playerRef = ref(db, `badbeaow/players/${p.id}`);
        return update(playerRef, { debt: (p.debt || 0) + perPerson });
      }));
      setTotalCourtBill('');
      showToast(`หารค่าคอร์ตคนละ ${perPerson.toFixed(2)} บาทเรียบร้อย!`, 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handlePayDebt = async (playerId) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const payAmount = parseFloat(paymentInputs[playerId]);
    if (isNaN(payAmount) || payAmount <= 0) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setIsProcessing(true);
    try {
      const newDebt = Math.max(0, (player.debt || 0) - payAmount);
      const playerRef = ref(db, `badbeaow/players/${playerId}`);
      await update(playerRef, { debt: newDebt });
      setPaymentInputs(prev => ({ ...prev, [playerId]: '' }));
      showToast('ชำระเงินเรียบร้อย หักยอดหนี้อัตโนมัติ!', 'success');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily: "'Prompt', sans-serif" }}>
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-purple-200 border-t-purple-600"></div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }} className="min-h-screen bg-gray-50/50 text-gray-800 pb-24 max-w-md mx-auto relative shadow-2xl overflow-x-hidden selection:bg-purple-200">
      
      {/* Toast Notification with Jelly Bounce Animation */}
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
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          BADBEAOW
        </h1>
        <div>
          {isAdmin ? (
            <button 
              onClick={handleLogout}
              className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-red-100 transition-colors"
            >
              <LogOut size={13} /> ออกจากระบบเงิน
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-emerald-100 transition-colors"
            >
              <Lock size={13} /> ปลดล็อกระบบเงิน
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-160px)]">
        {activeTab === 'queue' && (
          <div className="p-4 space-y-6">
            
            {/* Active Court Widget */}
            <div className="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-3xl p-5 shadow-xl relative overflow-hidden text-white">
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
                    <button onClick={handleClearCourt} disabled={isProcessing} className="text-[11px] text-white/50 hover:text-white">
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

              <div className="flex gap-3 mb-5">
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

              <div className="flex flex-wrap gap-2 mb-5 max-h-40 overflow-y-auto">
                {availablePlayers.length === 0 ? (
                  <div className="text-xs text-gray-400 py-3 w-full text-center bg-gray-50 rounded-xl">ไม่มีผู้เล่นว่าง (กรุณาเช็คชื่อในแถบผู้เล่นก่อน)</div>
                ) : (
                  availablePlayers.map(player => {
                    const isSelected = draftPair.includes(player.id);
                    return (
                      <button 
                        key={player.id}
                        onClick={() => handleDraftSelect(player.id)}
                        className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                          isSelected ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
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
                className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
                  !draftPair.includes(null) ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={18} /> เพิ่มเข้าคิวรอ
              </button>
            </div>

            {/* Queue List */}
            <div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-3 flex items-center justify-between">
                คิวรอสนาม <span className="text-[11px] font-medium text-gray-500">{queue.length} คู่</span>
              </h3>
              {queue.length === 0 ? (
                <div className="text-center py-8 bg-white border border-gray-100 rounded-3xl text-gray-400 text-[13px]">ยังไม่มีคิวรอ</div>
              ) : (
                <div className="space-y-3">
                  {queue.map((q, idx) => (
                    <div key={q.id} className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all ${q.id === highlightedQueueId ? 'queue-highlight ' : ''} ${q.isMoved ? 'bg-fuchsia-50 border-fuchsia-400' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
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
                        <div className="flex flex-col gap-1 mr-2">
                          <button onClick={() => handleMoveQueue(idx, 'up')} disabled={idx === 0 || isProcessing} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30">
                            <ArrowUp size={16} />
                          </button>
                          <button onClick={() => handleMoveQueue(idx, 'down')} disabled={idx === queue.length - 1 || isProcessing} className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-30">
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <button onClick={() => setQueueToDelete(q.id)} disabled={isProcessing} className="p-2 text-red-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
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
              <form onSubmit={handleAddPlayer} className="flex gap-2">
                <input 
                  type="text" 
                  value={newPlayerName} 
                  onChange={(e) => setNewPlayerName(e.target.value)} 
                  placeholder="ชื่อผู้เล่น..." 
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-500"
                />
                <button type="submit" disabled={isProcessing || !newPlayerName} className="bg-purple-600 text-white px-5 py-3.5 rounded-xl font-bold hover:bg-purple-700 shadow-md">
                  เพิ่ม
                </button>
              </form>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-800">รายชื่อทั้งหมด</h2>
                  <p className="text-[11px] text-gray-500 mt-1">เช็คชื่อคนที่ <span className="font-semibold text-purple-600">มาตีวันนี้</span></p>
                </div>
                <div className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
                  มา {presentPlayers.length} คน
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {players.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">ยังไม่มีรายชื่อผู้เล่น</div>
                ) : (
                  players.map((player) => (
                    <div key={player.id} className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className={`font-semibold text-sm ${player.isPresent ? 'text-gray-800' : 'text-gray-400'}`}>
                            {player.name}
                          </div>
                          {player.debt > 0 && (
                            <div className="text-[11px] font-bold text-red-500 mt-0.5">ค้างจ่าย: {player.debt.toFixed(2)} ฿</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => togglePresence(player.id, player.isPresent)}
                          disabled={isProcessing}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${player.isPresent ? 'bg-purple-500' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${player.isPresent ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <button onClick={() => setPlayerToDelete(player.id)} disabled={isProcessing} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
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
                  <div className="text-[11px] text-amber-600">เฉพาะแอดมินเท่านั้นที่กดคิดเงิน/เคลียร์หนี้ได้</div>
                </div>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm"
                >
                  ปลดล็อก
                </button>
              </div>
            )}

            <div className={`bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-lg text-white text-center ${!isAdmin ? 'opacity-90' : ''}`}>
              <h2 className="text-base font-bold mb-1 flex items-center justify-center gap-2">
                <Coins size={20} /> ค่าบำรุงประจำวัน
              </h2>
              <p className="text-emerald-50 text-[12px] mb-5">บวกหนี้ <span className="font-bold text-white">10 บาท</span> ให้กับทุกคนที่เช็คชื่อมาตีวันนี้</p>
              <button onClick={handleAddFixedFee} disabled={isProcessing || presentPlayers.length === 0} className="w-full bg-white text-emerald-600 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2">
                {!isAdmin && <Lock size={14} />} <Plus size={18} /> เก็บคนละ 10 บาท
              </button>
            </div>

            <div className={`bg-white p-5 rounded-3xl shadow-sm border border-gray-100 ${!isAdmin ? 'opacity-90' : ''}`}>
              <h2 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Receipt size={18} className="text-purple-500"/> หารค่าคอร์ต
              </h2>
              <input 
                type="number" 
                value={totalCourtBill} 
                onChange={(e) => setTotalCourtBill(e.target.value)} 
                placeholder="ยอดบิลรวมทั้งหมด (บาท)" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm mb-3 focus:outline-none focus:border-purple-500"
              />
              <button onClick={handleSplitBill} disabled={isProcessing || !totalCourtBill} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm shadow-md flex items-center justify-center gap-2">
                {!isAdmin && <Lock size={14} />} หาร {presentPlayers.length} คน (ตกคนละ {((parseFloat(totalCourtBill) || 0) / (presentPlayers.length || 1)).toFixed(2)} ฿)
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple-500"/> ยอดค้างจ่ายทั้งหมด
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">ระบบหักยอดหนี้อัตโนมัติเมื่อกดจ่าย</p>
              </div>
              <div className="divide-y divide-gray-50">
                {players.filter(p => p.debt > 0).length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">ไม่มีคนค้างจ่ายเลย ยอดเยี่ยม! 🎉</div>
                ) : (
                  players.filter(p => p.debt > 0).map((player) => (
                    <div key={player.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="font-semibold text-sm text-gray-800">{player.name}</div>
                        <div className="text-sm font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">{player.debt.toFixed(2)} ฿</div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="number" 
                          value={paymentInputs[player.id] || ''} 
                          onChange={(e) => setPaymentInputs({ ...paymentInputs, [player.id]: e.target.value })} 
                          placeholder="ยอดที่จ่าย..." 
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                        <button onClick={() => handlePayDebt(player.id)} disabled={isProcessing} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-1">
                          {!isAdmin && <Lock size={12} />} จ่าย
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 shadow-lg z-30">
        <div className="flex justify-around px-2 py-3">
          <button onClick={() => setActiveTab('queue')} className={`flex flex-col items-center gap-1 w-24 ${activeTab === 'queue' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
            <Swords size={22} />
            <span className="text-[10px]">สนาม & คิว</span>
          </button>
          <button onClick={() => setActiveTab('players')} className={`flex flex-col items-center gap-1 w-24 ${activeTab === 'players' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
            <Users size={22} />
            <span className="text-[10px]">ผู้เล่น</span>
          </button>
          <button onClick={() => setActiveTab('payment')} className={`flex flex-col items-center gap-1 w-24 ${activeTab === 'payment' ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
            <Wallet size={22} />
            <span className="text-[10px]">คิดเงิน</span>
          </button>
        </div>
      </nav>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">ปลดล็อกระบบคิดเงิน</h3>
            <p className="text-xs text-gray-500 mb-4">กรอกอีเมลและรหัสผ่านแอดมินเพื่อจัดการการเงิน</p>
            
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
                <button type="button" onClick={() => setShowLoginModal(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600 text-sm">ยกเลิก</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-purple-600 text-white shadow-md text-sm">ปลดล็อก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Queue Modal */}
      {queueToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ลบคิวนี้ใช่หรือไม่?</h3>
            <p className="text-sm text-gray-500 mb-6">รายชื่อคู่นี้จะถูกนำออกจากคิวรอ</p>
            <div className="flex gap-3">
              <button onClick={() => setQueueToDelete(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600">ยกเลิก</button>
              <button onClick={confirmDeleteQueue} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white shadow-md">ลบคิว</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Player Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ลบผู้เล่นนี้ออก?</h3>
            <p className="text-sm text-gray-500 mb-6">รายชื่อนี้จะหายไปจากระบบถาวร</p>
            <div className="flex gap-3">
              <button onClick={() => setPlayerToDelete(null)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600">ยกเลิก</button>
              <button onClick={confirmDeletePlayer} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white shadow-md">ลบผู้เล่น</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}