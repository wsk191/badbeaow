import { LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DashboardTab() {
  const {
    dashboardSummary, userRole,
  } = useApp();

  return (
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
  );
}
