import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  key?: string;
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600" />,
    info: <Info className="w-5 h-5 text-[#D4AF37]" />
  };

  const bgColors = {
    success: 'bg-white border-emerald-100 text-[#1A1A1A] shadow-emerald-500/5',
    error: 'bg-white border-rose-100 text-[#1A1A1A] shadow-rose-500/5',
    info: 'bg-white border-[#D4AF37]/20 text-[#1A1A1A] shadow-[#D4AF37]/5'
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-xl ${bgColors[toast.type]} backdrop-blur-md animate-slide-in max-w-sm`}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium tracking-wide flex-grow">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-700 transition-colors duration-150 p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
