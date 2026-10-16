import { X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function SlipPreviewModal() {
  const {
    previewSlipImage, setPreviewSlipImage,
  } = useApp();

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setPreviewSlipImage(null)}>
      <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => setPreviewSlipImage(null)} className="absolute right-3 top-3 z-10 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70">
          <X size={18} />
        </button>
        <img src={previewSlipImage} alt="สลิปฉบับเต็ม" className="w-full max-h-[80vh] object-contain rounded-2xl" />
      </div>
    </div>
  );
}
