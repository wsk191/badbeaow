import { Check, X } from 'lucide-react';
import CourtHeader from './CourtHeader';
import ExercisePlanner from '../../components/ExercisePlanner';
import DashboardTab from './DashboardTab';
import QueueTab from './QueueTab';
import PlayersTab from './PlayersTab';
import LeaderboardTab from './LeaderboardTab';
import PaymentTab from './PaymentTab';
import AdminsTab from './AdminsTab';
import FinanceModal from './modals/FinanceModal';
import SlipPreviewModal from './modals/SlipPreviewModal';
import PaymentFormModal from './modals/PaymentFormModal';
import BottomNav from './BottomNav';
import MoreMenu from './MoreMenu';
import DeleteQueueModal from './modals/DeleteQueueModal';
import DeleteAllQueueModal from './modals/DeleteAllQueueModal';
import DeletePlayerModal from './modals/DeletePlayerModal';
import DeleteAllPlayersModal from './modals/DeleteAllPlayersModal';
import EditPlayerModal from './modals/EditPlayerModal';
import LoginModal from '../LoginModal';
import { AdminGuide } from '../../components/UserGuide';
import { useApp } from '../../context/AppContext';

export default function CourtScreen() {
  const {
    activeTab, guideModal, isAdmin, isDesktop, playerToDelete, playerToEdit, previewSlipImage,
    queueToDelete, selectedCourt, selectedCourtId, setShowAdminGuide, setSplashVideoDone,
    showAdminGuide, showDeleteAllPlayersModal, showDeleteAllQueueModal,
    showFinanceModal, showLoginModal, showMoreMenu, showPaymentForm, showSplash, splashExiting,
    toast, userRole,
  } = useApp();

  return (
    <div style={{ fontFamily: "'Prompt', sans-serif" }} className={`court-theme-${selectedCourtId} min-h-screen bg-gray-50/50 text-gray-800 pb-24 ${isDesktop ? 'max-w-6xl mx-auto pt-14 shadow-none' : 'max-w-md mx-auto shadow-2xl'} relative overflow-x-hidden selection:bg-purple-200`}>
      {/* Splash Screen */}
      {showSplash && (
        <div
          className={`splash-screen ${splashExiting ? 'splash-screen-exiting' : ''} fixed inset-0 z-[60] bg-gradient-to-br ${selectedCourt.accent} flex items-center justify-center px-6 text-white overflow-hidden`}
        >
          <video autoPlay muted playsInline onEnded={() => setSplashVideoDone(true)} onError={() => setSplashVideoDone(true)} className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_28%]" aria-hidden="true">
            <source src="/badbeaow_intro.mp4" type="video/mp4" />
          </video>
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${selectedCourt.accent} opacity-75`} />
          <div className="pointer-events-none absolute inset-0 bg-slate-950/25" />
          <div className="splash-content relative z-10 w-full text-center animate-in fade-in zoom-in-95 duration-500">
            <h1 className="splash-title text-3xl font-black tracking-[0.18em]">
              {'BADBEAOW'.split('').map((letter, index) => (
                <span className={`splash-letter ${letter === 'A' ? 'splash-a-glow' : ''}`} key={`${letter}-${index}`}>{letter}</span>
              ))}
            </h1>
              <p className="mt-2 text-sm text-white/80">กำลังเข้าสู่ {selectedCourt.name}</p>
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
      <CourtHeader />

      {/* Main Content Area */}
      <main className="min-h-[calc(100vh-160px)]">
        {activeTab === 'exercise' && <div className="p-4 md:p-8"><ExercisePlanner isAdmin={isAdmin} /></div>}
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && <DashboardTab />}

        {/* TAB: QUEUE */}
        {activeTab === 'queue' && <QueueTab />}

        {/* TAB: PLAYERS */}
        {activeTab === 'players' && <PlayersTab />}

        {/* TAB: LEADERBOARD */}
        {activeTab === 'leaderboard' && <LeaderboardTab />}

        {/* TAB: PAYMENT (การเงิน & สรุปยอด) */}
        {activeTab === 'payment' && <PaymentTab />}

        {/* TAB: ADMINS (เฉพาะ SuperAdmin) */}
        {activeTab === 'admins' && userRole === 'superAdmin' && <AdminsTab />}
      </main>

      {/* POPUP MODAL: ตรวจสอบสลิป & ประวัติการจ่ายเงินสำหรับแอดมิน */}
      {showFinanceModal && isAdmin && <FinanceModal />}

      {/* MODAL: ขยายดูรูปสลิป */}
      {previewSlipImage && <SlipPreviewModal />}

      {/* POPUP สำหรับผู้เล่นแจ้งโอนเงิน */}
      {showPaymentForm && <PaymentFormModal />}

      {/* Navigation */}
      <BottomNav />

      {/* เมนูเพิ่มเติม */}
      {showMoreMenu && <MoreMenu />}

      {/* Delete Queue Modal */}
      {queueToDelete && <DeleteQueueModal />}

      {/* Delete All Queue Modal */}
      {showDeleteAllQueueModal && <DeleteAllQueueModal />}

      {/* Delete Player Modal */}
      {playerToDelete && <DeletePlayerModal />}

      {/* Delete All Players Modal */}
      {showDeleteAllPlayersModal && <DeleteAllPlayersModal />}

      {/* Edit Player Modal */}
      {playerToEdit && <EditPlayerModal />}

      {guideModal}

      {/* Modal คู่มือแอดมิน */}
      {showAdminGuide && isAdmin && <AdminGuide accent={selectedCourt.accent} onClose={() => setShowAdminGuide(false)} />}

      {/* Admin Login Modal (เรียกได้ทั้งจากหน้าแต่ละสนาม) */}
      {showLoginModal && <LoginModal />}
    </div>
  );
}
