import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function CourtOneAd() {
  const {
    setShowCourtOneAd,
  } = useApp();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg md:max-w-xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 p-1 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-white px-6 py-9 text-center">
          <button
            onClick={() => setShowCourtOneAd(false)}
            className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
            aria-label="ปิดโฆษณา"
          >
            <X size={19} />
          </button>
          <div className="mx-auto mb-5 flex h-20 w-20 rotate-[-6deg] items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-red-600 text-4xl shadow-lg">📣</div>
          <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-orange-500">สนาม 1 presents</div>
          <h2 className="text-4xl font-black tracking-tight text-gray-900">เจ๊เนยสั่งลุย</h2>
          <p className="mt-3 text-sm font-medium text-gray-500">พร้อมลุยทุกเกม สนุกทุกแมตช์</p>
          <div className="mx-auto mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-orange-100">
            <div className="h-full w-full origin-left animate-[shrink_10s_linear_forwards] rounded-full bg-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
