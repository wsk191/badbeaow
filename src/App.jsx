import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Wallet, Plus, Trash2, ArrowUp, ArrowDown, 
  Play, CheckCircle, AlertCircle, UserPlus, DollarSign, RefreshCw 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('queue');
  
  // Players State
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('badbeaow_players');
    return saved ? JSON.parse(saved) : ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  });
  const [newPlayerName, setNewPlayerName] = useState('');

  // Queue State (แต่ละคิวเก็บเป็น array ของผู้เล่น 4 คน หรือชื่อคู่)
  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('badbeaow_queue');
    return saved ? JSON.parse(saved) : [];
  });

  // Current Match State [player1, player2, player3, player4]
  const [currentMatch, setCurrentMatch] = useState(() => {
    const saved = localStorage.getItem('badbeaow_current');
    return saved ? JSON.parse(saved) : null;
  });

  // Builder State (เลือกคนเข้าคิวใหม่)
  const [selectedBuilderPlayers, setSelectedBuilderPlayers] = useState([]);

  // Billing State
  const [balances, setBalances] = useState(() => {
    const saved = localStorage.getItem('badbeaow_balances');
    return saved ? JSON.parse(saved) : {};
  });

  // Notification Toast
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem('badbeaow_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('badbeaow_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('badbeaow_current', JSON.stringify(currentMatch));
  }, [currentMatch]);

  useEffect(() => {
    localStorage.setItem('badbeaow_balances', JSON.stringify(balances));
  }, [balances]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Player Management
  const addPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    if (players.includes(newPlayerName.trim())) {
      showNotification('มีชื่อผู้เล่นนี้อยู่แล้ว');
      return;
    }
    setPlayers([...players, newPlayerName.trim()]);
    setNewPlayerName('');
    showNotification('เพิ่มผู้เล่นสำเร็จ');
  };

  const removePlayer = (name) => {
    setPlayers(players.filter(p => p !== name));
    showNotification(`ลบ ${name} ออกแล้ว`);
  };

  // Queue Builder Selection (เลือกผู้เล่น 4 คนเข้าคิว)
  const toggleBuilderPlayer = (name) => {
    if (selectedBuilderPlayers.includes(name)) {
      setSelectedBuilderPlayers(selectedBuilderPlayers.filter(p => p !== name));
    } else {
      if (selectedBuilderPlayers.length >= 4) {
        showNotification('1 คิวต้องมีผู้เล่น 4 คนครับ');
        return;
      }
      setSelectedBuilderPlayers([...selectedBuilderPlayers, name]);
    }
  };

  const addPairToQueue = () => {
    if (selectedBuilderPlayers.length !== 4) {
      showNotification('กรุณาเลือกผู้เล่นให้ครบ 4 คน');
      return;
    }
    setQueue([...queue, selectedBuilderPlayers]);
    setSelectedBuilderPlayers([]);
    showNotification('เพิ่มคิวใหม่สำเร็จ!');
  };

  // Move Queue Position
  const moveQueue = (index, direction) => {
    const newQueue = [...queue];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQueue.length) return;
    
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIndex];
    newQueue[targetIndex] = temp;
    setQueue(newQueue);
    showNotification('สลับคิวเรียบร้อย');
  };

  const deleteQueueItem = (index) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    showNotification('ลบคิวออกแล้ว');
  };

  // Match Control
  const startNextMatch = () => {
    if (queue.length === 0) {
      showNotification('ไม่มีคิวรออยู่ครับ');
      return;
    }
    const nextMatch = queue[0];
    const remainingQueue = queue.slice(1);
    setCurrentMatch(nextMatch);
    setQueue(remainingQueue);
    showNotification('เริ่มการแข่งขันแมตช์ถัดไป!');
  };

  const finishMatch = (winningTeam) => {
    if (!currentMatch) return;
    // เก็บเงิน 10 บาทต่อคนในแมตช์ที่จบลง
    const newBalances = { ...balances };
    currentMatch.forEach(player => {
      newBalances[player] = (newBalances[player] || 0) + 10;
    });
    setBalances(newBalances);
    setCurrentMatch(null);
    showNotification(`บันทึกผลและคิดเงิน 10 บาท/คน เรียบร้อย!`);
  };

  return (
    <div className="min-h-screen bg-purple-50 pb-20 font-sans text-gray-800">
      {/* Top Header */}
      <header className="bg-purple-600 text-white py-4 px-6 shadow-md text-center">
        <h1 className="text-xl font-bold tracking-wider">BADBEAOW</h1>
        <p className="text-xs text-purple-200 mt-0.5">ระบบจัดการคิวและคิดเงินแบดมินตัน</p>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-purple-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {activeTab === 'queue' && (
          <>
            {/* กำลังแข่งขัน */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
              <div className="flex items-center gap-2 mb-3 text-purple-700 font-semibold text-sm">
                <Trophy className="w-4 h-4" />
                <span>กำลังแข่งขันในสนาม</span>
              </div>

              {currentMatch ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <div className="text-xs text-purple-500 font-medium mb-1">ทีม A</div>
                      <div className="font-bold text-gray-700">{currentMatch[0]} & {currentMatch[1]}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <div className="text-xs text-purple-500 font-medium mb-1">ทีม B</div>
                      <div className="font-bold text-gray-700">{currentMatch[2]} & {currentMatch[3]}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => finishMatch('A')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
                    >
                      ทีม A ชนะ
                    </button>
                    <button 
                      onClick={() => finishMatch('B')}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
                    >
                      ทีม B ชนะ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-3">ยังไม่มีแมตช์แข่งขันในสนาม</p>
                  <button 
                    onClick={startNextMatch}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition inline-flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>ดึงคิวถัดไปลงสนาม</span>
                  </button>
                </div>
              )}
            </div>

            {/* จับคู่ลงคิวใหม่ */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
              <h2 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>จัดคิวรอ (เลือกผู้เล่น 4 คน)</span>
              </h2>

              <div className="text-xs text-gray-500 mb-2">เลือกแล้ว: {selectedBuilderPlayers.length} / 4 คน</div>
              
              <div className="flex flex-wrap gap-1.5 mb-4 max-h-36 overflow-y-auto p-1">
                {players.map(p => {
                  const isSelected = selectedBuilderPlayers.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => toggleBuilderPlayer(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected 
                          ? 'bg-purple-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={addPairToQueue}
                disabled={selectedBuilderPlayers.length !== 4}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition shadow-sm ${
                  selectedBuilderPlayers.length === 4 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                + นำคู่นี้เข้าคิวรอ
              </button>
            </div>

            {/* รายการคิวรอ (แสดงแบบแถวเดี่ยว) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
              <h2 className="text-sm font-semibold text-purple-700 mb-3 flex items-center justify-between">
                <span>คิวรอทั้งหมด</span>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {queue.length} คิว
                </span>
              </h2>

              {queue.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีคิวรอในระบบ</p>
              ) : (
                <div className="space-y-2.5">
                  {queue.map((match, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-800 text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div className="text-sm font-medium text-gray-700">
                          <span className="text-purple-600">ทีม A:</span> {match[0]}, {match[1]} <span className="text-gray-300 mx-1">|</span> <span className="text-purple-600">ทีม B:</span> {match[2]}, {match[3]}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => moveQueue(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-purple-100 text-gray-500 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => moveQueue(idx, 'down')}
                          disabled={idx === queue.length - 1}
                          className="p-1 rounded hover:bg-purple-100 text-gray-500 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteQueueItem(idx)}
                          className="p-1 rounded hover:bg-red-100 text-red-500 ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'players' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-4">
            <h2 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>จัดการรายชื่อผู้เล่น</span>
            </h2>

            <form onSubmit={addPlayer} className="flex gap-2">
              <input 
                type="text"
                placeholder="ชื่อผู้เล่น..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm"
              >
                เพิ่ม
              </button>
            </form>

            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {players.map(p => (
                <div key={p} className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                  <span className="text-sm font-medium text-gray-700">{p}</span>
                  <button 
                    onClick={() => removePlayer(p)}
                    className="p-1 text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 space-y-4">
            <h2 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span>สรุปค่าใช้จ่าย (10 บาท / แมตช์)</span>
            </h2>

            <div className="space-y-2">
              {players.map(p => {
                const total = balances[p] || 0;
                return (
                  <div key={p} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <span className="text-sm font-medium text-gray-700">{p}</span>
                    <span className="text-sm font-bold text-purple-600">{total} บาท</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-100 py-2.5 px-6 flex justify-around max-w-md mx-auto z-40">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${activeTab === 'queue' ? 'text-purple-600' : 'text-gray-400'}`}
        >
          <Trophy className="w-5 h-5" />
          <span>จัดคิว</span>
        </button>
        <button 
          onClick={() => setActiveTab('players')}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${activeTab === 'players' ? 'text-purple-600' : 'text-gray-400'}`}
        >
          <Users className="w-5 h-5" />
          <span>ผู้เล่น</span>
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center gap-1 text-xs font-medium transition ${activeTab === 'billing' ? 'text-purple-600' : 'text-gray-400'}`}
        >
          <Wallet className="w-5 h-5" />
          <span>คิดเงิน</span>
        </button>
      </nav>
    </div>
  );
}