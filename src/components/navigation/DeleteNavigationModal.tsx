'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { NavigationItem } from '@/types';
import { AlertTriangle, Trash2, Loader2, Compass } from 'lucide-react';

interface DeleteNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NavigationItem | null;
  onConfirmDelete: (id: string) => Promise<void>;
}

export function DeleteNavigationModal({
  isOpen,
  onClose,
  item,
  onConfirmDelete,
}: DeleteNavigationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!item) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirmDelete(item.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus menu navbar');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="btn btn-secondary btn-sm"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={submitting}
        className="btn btn-sm flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-rose-900/30"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menghapus...</span>
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            <span>Hapus Menu</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus Menu Navbar"
      subtitle="Konfirmasi penghapusan menu navigasi etalase toko"
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Warning Alert */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-rose-200">
              Apakah Anda yakin ingin menghapus menu ini?
            </p>
            <p className="text-xs text-rose-300/90 leading-relaxed">
              Tindakan ini akan menghapus menu navigasi dari header toko etalase publik. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        {/* Item Details Card */}
        <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Label Menu:</span>
            <span className="font-semibold text-white">{item.label}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Tipe Navigasi:</span>
            <span className="font-mono text-gold uppercase">{item.type}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Tujuan (Target):</span>
            <span className="font-mono text-gray-300 truncate max-w-[200px]">{item.target}</span>
          </div>
          {item.childCategoryIds && item.childCategoryIds.length > 0 && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222222]">
              <span className="text-amber-400 font-medium">Submenu Terhubung:</span>
              <span className="font-bold text-amber-300">
                {item.childCategoryIds.length} Kategori
              </span>
            </div>
          )}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-medium p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            {errorMsg}
          </p>
        )}
      </div>
    </Modal>
  );
}
