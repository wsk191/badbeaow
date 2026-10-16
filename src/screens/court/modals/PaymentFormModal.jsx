import { X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export default function PaymentFormModal() {
  const {
    handleSlipUpload, isProcessing, paymentQrCode, paymentSlipData, paymentSlipUploading,
    setShowPaymentForm, submitPaymentRequest,
  } = useApp();

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
      <div className="relative w-full max-w-lg md:max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <button onClick={() => setShowPaymentForm(false)} className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"><X size={19} /></button>
        <h2 className="text-lg font-black text-gray-800">แจ้งโอนเงิน</h2>
        <p className="mt-1 text-xs text-gray-500">สแกนจ่ายแล้วแนบรูปสลิปด้านล่าง</p>
        <img src={paymentQrCode} alt="QR พร้อมเพย์" className="mx-auto mt-4 h-44 w-44 rounded-2xl border border-gray-100 bg-white object-contain p-2" />
        <label className="mt-4 block text-xs font-bold text-gray-600">รูปสลิปการโอน
          <input type="file" accept="image/*" onChange={handleSlipUpload} disabled={paymentSlipUploading} className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-sky-700" />
        </label>
        {paymentSlipData && <img src={paymentSlipData} alt="ตัวอย่างสลิป" className="mt-3 max-h-40 w-full rounded-xl border border-gray-100 object-contain" />}
        <button onClick={submitPaymentRequest} disabled={isProcessing || paymentSlipUploading || !paymentSlipData} className="mt-5 w-full rounded-xl bg-sky-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50">
          {isProcessing ? 'กำลังส่งสลิป...' : 'ส่งสลิปให้แอดมินตรวจสอบ'}
        </button>
      </div>
    </div>
  );
}
