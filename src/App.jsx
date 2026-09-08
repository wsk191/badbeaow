import React, { useState, useEffect } from 'react';
import { Users, LayoutList, Wallet, Trash2, ArrowUp, ArrowDown, Check, Trophy } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue');
  
  // โหลดข้อมูลจาก LocalStorage (ปิดคอมเปิดใหม่ข้อมูลไม่หาย)
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem('badbeaow_players')) || []);
  const [queue, setQueue] = useState(() => JSON.parse(localStorage.getItem('badbeaow_queue')) || []);
  const [court, setCourt] = useState(() => JSON.parse(localStorage.getItem('badbeaow_court')) || null);
  const [toast, setToast] = useState('');

  // บันทึกข้อมูลเมื่อมีการเปลี่ยนแปลง
  useEffect(() => { localStorage.setItem('badbeaow_players', JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('badbeaow_queue', JSON.stringify(queue)); }, [queue]);
  useEffect(() => { localStorage.setItem('badbeaow_court', JSON.stringify(court)); }, [court]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // --- ระบบผู้เล่น ---
  const addPlayer = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (name && !players.find(p => p.name === name)) {
      setPlayers([...players, { id: Date.now(), name, isPresent: true, debt: 0 }]);
      e.target.reset();
    }
  };

  const togglePresent = (id) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isPresent: !p.isPresent } : p));
  };

  // --- ระบบจัดคิว ---
  const [tempTeamA, setTempTeamA] = useState([]);
  const [tempTeamB, setTempTeamB] = useState([]);

  const handleSelectPlayer = (player) => {
    if (tempTeamA.length < 2) setTempTeamA([...tempTeamA, player]);
    else if (tempTeamB.length < 2) setTempTeamB([...tempTeamB, player]);
  };

  const addToQueue = () => {
    if (tempTeamA.length === 2 && tempTeamB.length === 2) {
      setQueue([...queue, { id: Date.now(), teamA: tempTeamA, teamB: tempTeamB, isMoved: false, moveDirection: '' }]);
      setTempTeamA([]);
      setTempTeamB([]);
    }
  };

  const sendToCourt = () => {
    if (queue.length > 0 && !court) {
      setCourt(queue[0]);
      setQueue(queue.slice(1));
    }
  };

  const handleWin = (winningTeamStr) => {
    if (!court) return;
    const winningTeam = winningTeamStr === 'A' ? court.teamA : court.teamB;
    const losingTeam = winningTeamStr === 'A' ? court.teamB : court.teamA;
    
    // เอาทีมแพ้ไปต่อท้ายคิว (จับคู่ให้ใหม่เป็น A และ B ฝั่งละคนชั่วคราวเพื่อให้ครบ 2 ทีม)
    const newQueueItem = { id: Date.now(), teamA: [losingTeam[0], losingTeam[1]], teamB: [], isMoved: false, moveDirection: '' };
    let newQueue = [...queue, newQueueItem];
    
    // ดึงคิวต่อไปมาเสียบแทนทีมแพ้
    if (newQueue.length > 1) { // มีคิวรออยู่
      const nextUp = newQueue[0];
      newQueue = newQueue.slice(1);
      setCourt({ ...court, teamA: winningTeam, teamB: [...nextUp.teamA, ...nextUp.teamB].slice(0,2) });
      setQueue(newQueue);
    } else {
      // ไม่มีคิวรอ ให้เคลียร์สนาม
      setCourt(null);
      setQueue(newQueue);
    }
  };

  const moveQueue = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newQueue = [...queue];
      newQueue[index].isMoved = true;
      newQueue[index].moveDirection = 'up';
      newQueue[index-1].isMoved = true;
      newQueue[index-1].moveDirection = 'down';
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
      setQueue(newQueue);
    } else if (direction === 'down' && index < queue.length - 1) {
      const newQueue = [...queue];
      newQueue[index].isMoved = true;
      newQueue[index].moveDirection = 'down';
      newQueue[index+1].isMoved = true;
      newQueue[index+1].moveDirection = 'up';
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      setQueue(newQueue);
    }
  };

  const deleteQueue = (id) => {
    if(window.confirm("ต้องการลบคิวนี้ใช่หรือไม่?")) {
      setQueue(queue.filter(q => q.id !== id));
    }
  };

  // --- ระบบคิดเงิน ---
  const chargeTenBaht = () => {
    setPlayers(players.map(p => p.isPresent ? { ...p, debt: p.debt + 10 } : p));
    showToast('บวกเพิ่ม 10 บาท สำหรับคนที่มาวันนี้เรียบร้อย!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* แจ้งเตือน Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <Check size={18} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-40 text-center">
        <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          BADBEAOW
        </h1>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto">
        
        {/* --- แท็บ จัดคิว --- */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            
            {/* สนามปัจจุบัน */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
              <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2"><Trophy size={20}/> กำลังแข่งขัน</h2>
              {court ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                    <div>
                      <p className="font-bold text-purple-700">ทีม A</p>
                      <p className="text-sm text-gray-600">{court.teamA.map(p=>p.name).join(' + ')}</p>
                    </div>
                    <button onClick={()=>handleWin('A')} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">ชนะ!</button>
                  </div>
                  <div className="text-center text-gray-400 font-bold text-sm">VS</div>
                  <div className="flex justify-between items-center bg-pink-50 p-3 rounded-xl">
                    <div>
                      <p className="font-bold text-pink-700">ทีม B</p>
                      <p className="text-sm text-gray-600">{court.teamB.map(p=>p.name).join(' + ')}</p>
                    </div>
                    <button onClick={()=>handleWin('B')} className="bg-pink-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">ชนะ!</button>
                  </div>
                </div>
              ) : (
                <button onClick={sendToCourt} disabled={queue.length === 0} className="w-full py-3 rounded-xl bg-purple-100 text-purple-700 font-bold disabled:opacity-50">
                  {queue.length > 0 ? 'ดึงคิวแรกลงสนาม' : 'สนามว่าง (ไม่มีคิวรอ)'}
                </button>
              )}
            </div>

            {/* จัดคิวใหม่ */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold mb-3">จับคู่ลงคิวใหม่</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="border border-purple-200 rounded-xl p-2 min-h-[60px] bg-purple-50">
                  <span className="text-xs text-purple-400 font-bold">ทีม A (2 คน)</span>
                  <div className="text-sm font-bold text-purple-700">{tempTeamA.map(p=>p.name).join(', ')}</div>
                </div>
                <div className="border border-pink-200 rounded-xl p-2 min-h-[60px] bg-pink-50">
                  <span className="text-xs text-pink-400 font-bold">ทีม B (2 คน)</span>
                  <div className="text-sm font-bold text-pink-700">{tempTeamB.map(p=>p.name).join(', ')}</div>
                </div>
              </div>
              
              {/* รายชื่อคนว่าง */}
              <div className="flex flex-wrap gap-2 mb-3">
                {players.filter(p => p.isPresent).map(p => (
                  <button key={p.id} onClick={() => handleSelectPlayer(p)} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200">
                    {p.name}
                  </button>
                ))}
              </div>

              <button onClick={addToQueue} className="w-full py-2 bg-black text-white rounded-xl font-bold">
                + นำคู่นี้เข้าคิวรอ
              </button>
              <button onClick={()=>{setTempTeamA([]); setTempTeamB([]);}} className="w-full py-2 mt-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">
                ล้างที่จับคู่ไว้
              </button>
            </div>

            {/* รายการคิวรอ */}
            <h2 className="font-bold text-gray-500 pt-2">คิวรอ ({queue.length})</h2>
            {queue.map((q, i) => (
              <div key={q.id} className={`p-4 rounded-xl shadow-sm border transition-all ${q.isMoved ? 'bg-fuchsia-100 border-fuchsia-300' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-lg mr-2 text-gray-300">#{i+1}</span>
                    {q.isMoved && (
                      <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-200 px-2 py-1 rounded-full">
                        {q.moveDirection === 'up' ? '🔼 ถูกเลื่อนขึ้น (แซง)' : '🔽 ถูกเลื่อนลง'}
                      </span>
                    )}
                    <div className="mt-2 space-y-1">
                      <p className="text-sm"><span className="font-bold text-purple-600">A:</span> {q.teamA.map(p=>p.name).join(' + ')}</p>
                      <p className="text-sm"><span className="font-bold text-pink-600">B:</span> {q.teamB.map(p=>p.name).join(' + ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={()=>moveQueue(i, 'up')} className="p-1 bg-gray-50 rounded hover:bg-gray-200"><ArrowUp size={16} /></button>
                    <button onClick={()=>moveQueue(i, 'down')} className="p-1 bg-gray-50 rounded hover:bg-gray-200"><ArrowDown size={16} /></button>
                    <button onClick={()=>deleteQueue(q.id)} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100 mt-2"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- แท็บ ผู้เล่น --- */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            <form onSubmit={addPlayer} className="flex gap-2">
              <input type="text" name="name" placeholder="ชื่อผู้เล่น..." className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-500" required />
              <button type="submit" className="bg-purple-600 text-white px-6 rounded-xl font-bold">เพิ่ม</button>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                  <span className="font-medium">{p.name}</span>
                  <button onClick={() => togglePresent(p.id)} className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${p.isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {p.isPresent ? 'มาวันนี้' : 'ไม่มา'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- แท็บ คิดเงิน --- */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <button onClick={chargeTenBaht} className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform">
              💰 เก็บค่าบำรุง 10 บาท (เฉพาะคนที่มา)
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between font-bold text-gray-600">
                <span>ชื่อผู้เล่น</span>
                <span>ยอดค้างจ่าย</span>
              </div>
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.isPresent ? '🟢 มาวันนี้' : '⚪ ไม่มา'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-black ${p.debt > 0 ? 'text-red-500' : 'text-green-500'}`}>{p.debt} ฿</span>
                    {p.debt > 0 && (
                      <button onClick={() => {
                        const amount = prompt(`คุณ ${p.name} ต้องการจ่ายเท่าไหร่? (ค้าง ${p.debt})`, p.debt);
                        if(amount && !isNaN(amount)) setPlayers(players.map(pl => pl.id === p.id ? {...pl, debt: pl.debt - Number(amount)} : pl));
                      }} className="text-xs bg-black text-white px-3 py-1 rounded-lg">เคลียร์</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-2 pb-6 z-50">
        <button onClick={() => setActiveTab('queue')} className={`flex flex-col items-center p-2 ${activeTab === 'queue' ? 'text-purple-600' : 'text-gray-400'}`}>
          <LayoutList size={24} /><span className="text-xs font-medium mt-1">จัดคิว</span>
        </button>
        <button onClick={() => setActiveTab('players')} className={`flex flex-col items-center p-2 ${activeTab === 'players' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Users size={24} /><span className="text-xs font-medium mt-1">ผู้เล่น</span>
        </button>
        <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center p-2 ${activeTab === 'billing' ? 'text-purple-600' : 'text-gray-400'}`}>
          <Wallet size={24} /><span className="text-xs font-medium mt-1">คิดเงิน</span>
        </button>
      </div>
    </div>
  );
}