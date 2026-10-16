/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';

// Two-tap button for destructive actions: first tap arms it, second tap runs onConfirm.
export default function ConfirmButton({ onConfirm, children, confirmLabel = 'ยืนยัน?', className = '', disabled }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}
      className={`${className} ${armed ? '!bg-red-600 !text-white' : ''} disabled:opacity-50`}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
