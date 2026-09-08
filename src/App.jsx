import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Wallet, ArrowUp, ArrowDown, Plus, Trash2, 
  UserPlus, Coins, ShieldCheck, Trophy, 
  Swords, X, Receipt, Check
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

// Firebase Configuration ที่ดึงมาจากโปรเจกต์ของคุณ
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
const db = getFirestore(app);
const appId = 'badbeaow-app';

export default function BadmintonApp() {
  const [activeTab, setActiveTab] = useState('queue');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firestore Data State
  const [players, setPlayers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [court, setCourt] = useState({ teamA: null, teamB: null });

  // Local UI State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [draftPair, setDraftPair] = useState([null, null]);
  const [totalCourtBill, setTotalCourtBill] = useState('');
  const [paymentInputs, setPaymentInputs] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [highlightedQueueId, setHighlightedQueueId] = useState(null);
  const [queueToDelete, setQueueToDelete] = useState(null);

  // Inject Google Font
  useEffect(() => {
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
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // Listen to Players
    const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      playersData.sort((a, b) => a.name.localeCompare(b.name));
      setPlayers(playersData);
      setLoading(false);
    }, (error) => console.error("Players Error:", error));

    // Listen to Queue
    const queueRef = collection(db, 'artifacts', appId, 'public', 'data', 'queue');
    const unsubQueue = onSnapshot(queueRef, (snapshot) => {
      const queueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      queueData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setQueue(queueData);
    }, (error) => console.error("Queue Error:", error));

    // Listen to Active Court
    const courtRef = doc(db, 'artifacts', appId, 'public', 'data', 'courts', 'main_court');
    const unsubCourt = onSnapshot(courtRef, (snapshot) => {
      if (snapshot.exists()) {
        setCourt(snapshot.data());
      } else {
        setDoc(courtRef, { teamA: null, teamB: null });
      }
    }, (error) => console.error("Court Error:", error));

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

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !user) return;
    setIsProcessing(true);
    try {
      const playersRef = collection(db, 'artifacts', appId, 'public', 'data', 'players');
      await addDoc(playersRef, { name: newPlayerName.trim(), isPresent: true, debt: 0 });
      setNewPlayerName('');
      showToast('เพิ่มผู้เล่นสำเร็จ!');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const togglePresence = async (id, currentStatus) => {
    if (!user) return;
    try {
      const playerRef = doc(db, 'artifacts', appId, 'public', 'data', 'players', id);
      await updateDoc(playerRef, { isPresent: !currentStatus });
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
    if (draftPair.includes(null) || !user) return;
    setIsProcessing(true);
    try {
      const pairData = draftPair.map(id => {
        const p = players.find(p => p.id === id);
        return { id: p.id, name: p.name };
      });

      const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
      const queueRef = collection(db, 'artifacts', appId, 'public', 'data', 'queue');
      
      await addDoc(queueRef, { pair: pairData, sortOrder: maxOrder + 100 });
      setDraftPair([null, null]);
      showToast('เพิ่มคู่เข้าคิวรอสำเร็จ!');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleMoveQueue = async (index, direction) => {
    if (!user) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === queue.length - 1) return;

    setIsProcessing(true);
    try {
      const currentItem = queue[index];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const targetItem = queue[targetIndex];

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'queue', currentItem.id), { 
        sortOrder: targetItem.sortOrder,
        isMoved: true,
        moveDirection: direction
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'queue', targetItem.id), { 
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
    if (!user || !queueToDelete) return;
    setIsProcessing(true);
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'queue', queueToDelete)); 
      setQueueToDelete(null);
      showToast('ลบคิวออกแล้ว');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleStartGame = async () => {
    if (queue.length < 2 || !user) return;
    setIsProcessing(true);
    try {
      const courtRef = doc(db, 'artifacts', appId, 'public', 'data', 'courts', 'main_court');
      await updateDoc(courtRef, { teamA: queue[0].pair, teamB: queue[1].pair });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'queue', queue[0].id));
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'queue', queue[1].id));
      showToast('เริ่มการแข่งขันแล้ว!');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleWin = async (winnerTeam) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const courtRef = doc(db, 'artifacts', appId, 'public', 'data', 'courts', 'main_court');
      let nextTeamA = winnerTeam === 'A' ? court.teamA : null;
      let nextTeamB = winnerTeam === 'B' ? court.teamB : null;
      let losingTeam = winnerTeam === 'A' ? court.teamB : court.teamA;

      if (losingTeam) {
        const maxOrder = queue.length > 0 ? Math.max(...queue.map(q => q.sortOrder || 0)) : 0;
        const queueRef = collection(db, 'artifacts', appId, 'public', 'data', 'queue');
        await addDoc(queueRef, { pair: losingTeam, sortOrder: maxOrder + 100 });
      }

      if (queue.length > 0) {
        const nextPairObj = queue[0];
        const nextPair = nextPairObj.pair;
        if (winnerTeam === 'A') nextTeamB = nextPair;
        if (winnerTeam === 'B') nextTeamA = nextPair;
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'queue', nextPairObj.id));
      }
      
      await updateDoc(courtRef, { teamA: nextTeamA, teamB: nextTeamB });
      showToast(`บันทึกผล: ทีม ${winnerTeam} ชนะ!`);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleClearCourt = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const courtRef = doc(db, 'artifacts', appId, 'public', 'data', 'courts', 'main_court');
      await updateDoc(courtRef, { teamA: null, teamB: null });
      showToast('เคลียร์สนามเรียบร้อย');
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleAddFixedFee = async () => {
    if (!user || presentPlayers.length === 0) return;
    setIsProcessing(true);
    try {
      const promises = presentPlayers.map(p => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id);
        return updateDoc(ref, { debt: (p.debt || 0) + 10 });
      });
      await Promise.all(promises);
      showToast(`บวกค่าบำรุง 10 บาทให้ ${presentPlayers.length} คนเรียบร้อย!`);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handleSplitBill = async () => {
    const amount = parseFloat(totalCourtBill);
    if (!user || presentPlayers.length === 0 || isNaN(amount) || amount <= 0) return;
    const perPerson = amount / presentPlayers.length;
    setIsProcessing(true);
    try {
      await Promise.all(presentPlayers.map(p => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'players', p.id);
        return updateDoc(ref, { debt: (p.debt || 0) + perPerson });
      }));
      setTotalCourtBill('');
      showToast(`หารค่าคอร์ตคนละ ${perPerson.toFixed(2)} บาทเรียบร้อย!`);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handlePayDebt = async (playerId) => {
    const payAmount = parseFloat(paymentInputs[playerId]);
    if (!user || isNaN(payAmount) || payAmount <= 0) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setIsProcessing(true);
    try {
      const newDebt = Math.max(0, (player.debt || 0) - payAmount);
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'players', playerId);
      await updateDoc(ref, { debt: newDebt });
      setPaymentInputs(prev => ({ ...prev, [playerId]: '' }));
      showToast('บันทึกการชำระเงินเรียบร้อย!');
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
      
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${toastMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-3.5 rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] font-semibold flex items-center gap-2.5 text-[13px] whitespace-nowrap">
          <div className="bg-white/20 rounded-full p-0.5"><Check size={14} /></div>
          {toastMessage}
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md text-gray-800 pt-12 pb-4 px-6 sticky top-0 z-20 border-b border-gray-100">
        <h1 className="text-xl font-bold tracking-tight text-center bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          BADBEAOW
        </h1>
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
                      เคลียร์สนาม
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
                คิวรอสนาม
                <span className="text-[11px] font-medium text-gray-500">{queue.length} คู่</span>
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
                            {q.pair.map(p => p.name).join(' & ')}
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
                  <p className="text-[11px] text-gray-500 mt-1">เปิดสวิตช์สำหรับคนที่ <span className="font-semibold text-purple-600">มาตีวันนี้</span></p>
                </div>
                <div className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full">
                  มา {presentPlayers.length} คน
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {players.map((player) => (
                  <div key={player.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className={`font-semibold text-sm ${player.isPresent ? 'text-gray-800' : 'text-gray-400'}`}>
                        {player.name}
                      </div>
                      {player.debt > 0 && (
                        <div className="text-[11px] font-bold text-red-500 mt-0.5">ค้างจ่าย: {player.debt.toFixed(2)} ฿</div>
                      )}
                    </div>
                    <button 
                      onClick={() => togglePresence(player.id, player.isPresent)}
                      disabled={isProcessing}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${player.isPresent ? 'bg-purple-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${player.isPresent ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="p-4 space-y-5">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-3xl shadow-lg text-white text-center">
              <h2 className="text-base font-bold mb-1 flex items-center justify-center gap-2">
                <Coins size={20} /> ค่าบำรุงประจำวัน
              </h2>
              <p className="text-emerald-50 text-[12px] mb-5">บวกหนี้ <span className="font-bold text-white">10 บาท</span> ให้กับทุกคนที่เช็คชื่อมาตีวันนี้</p>
              <button onClick={handleAddFixedFee} disabled={isProcessing || presentPlayers.length === 0} className="w-full bg-white text-emerald-600 py-3.5 rounded-xl font-bold text-sm shadow-md">
                <Plus size={18} className="inline mr-1" /> เก็บคนละ 10 บาท
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
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
              <button onClick={handleSplitBill} disabled={isProcessing || !totalCourtBill} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm shadow-md">
                หาร {presentPlayers.length} คน (ตกคนละ {((parseFloat(totalCourtBill) || 0) / (presentPlayers.length || 1)).toFixed(2)} ฿)
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple-500"/> เคลียร์ยอดค้างจ่าย
                </h2>
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
                        <button onClick={() => handlePayDebt(player.id)} disabled={isProcessing} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                          จ่าย
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

      {/* Delete Modal */}
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

    </div>
  );
}