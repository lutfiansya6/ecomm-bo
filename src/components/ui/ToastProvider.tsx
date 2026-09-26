'use client';

import React from 'react';
import { useUIStore } from '@/store/ui';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastProvider() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        let borderColor = 'border-emerald-500/40 bg-[#142319]';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/40 bg-[#251416]';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/40 bg-[#241c10]';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-gold shrink-0" />;
          borderColor = 'border-gold/40 bg-[#1f1a10]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderColor} shadow-2xl backdrop-blur-md animate-slideInRight`}
          >
            {icon}
            <div className="flex-1 text-sm">
              {toast.title && <p className="font-semibold text-white mb-0.5">{toast.title}</p>}
              <p className="text-gray-300 text-xs leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
