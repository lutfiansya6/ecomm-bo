'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Clickable backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card (3-part flex column) */}
      <div
        className={`relative w-full ${maxWidthClass} bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header (fixed at top, shrink-0, does NOT scroll) */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 sm:py-5 border-b border-[#262626] bg-[#141414]">
          <div>
            <h3 className="text-lg font-semibold text-white font-serif tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202020] transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Body (scrollable content with overflow-y-auto, flex-1, min-h-0) */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 overscroll-contain">
          {children}
        </div>

        {/* 3. Footer (fixed at bottom, shrink-0, always visible) */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-[#262626] bg-[#141414]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
