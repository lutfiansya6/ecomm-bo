'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Category } from '@/types';
import { AlertTriangle, Trash2, ArrowRight, Loader2, Package } from 'lucide-react';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  otherCategories: Category[];
  onConfirmDelete: (categoryId: string, moveToId?: string) => Promise<void>;
}

export function DeleteCategoryModal({
  isOpen,
  onClose,
  category,
  otherCategories,
  onConfirmDelete,
}: DeleteCategoryModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const productCount = category?.productCount ?? 0;
  const hasProducts = productCount > 0;

  useEffect(() => {
    if (isOpen) {
      // Pick first other category as default target if available
      if (otherCategories.length > 0) {
        setSelectedTargetId(otherCategories[0].id);
      } else {
        setSelectedTargetId('');
      }
      setErrorMsg('');
      setSubmitting(false);
    }
  }, [isOpen, otherCategories]);

  if (!category) return null;

  const handleDelete = async () => {
    if (hasProducts && !selectedTargetId) {
      setErrorMsg('Silakan pilih kategori tujuan untuk memindahkan produk.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirmDelete(category.id, hasProducts ? selectedTargetId : undefined);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus kategori');
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
        disabled={submitting || (hasProducts && !selectedTargetId)}
        className={`btn btn-sm flex items-center gap-1.5 ${
          hasProducts
            ? 'bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-gold'
            : 'bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-rose-900/30'
        }`}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            <span>{hasProducts ? 'Pindahkan & Hapus' : 'Hapus Kategori'}</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasProducts ? 'Pindahkan Produk & Hapus Kategori' : 'Hapus Kategori'}
      subtitle={
        hasProducts
          ? `Kategori "${category.name}" masih memiliki produk aktif`
          : `Konfirmasi penghapusan kategori "${category.name}"`
      }
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-4">
        {hasProducts ? (
          <>
            {/* Banner peringatan jumlah produk */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-300">
                  {productCount} produk memakai kategori ini
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Sebelum kategori <strong className="text-white">"{category.name}"</strong>{' '}
                  dihapus, seluruh produk tersebut harus dipindahkan ke kategori tujuan berikut:
                </p>
              </div>
            </div>

            {/* Pilihan kategori tujuan */}
            <div className="space-y-2 pt-1">
              <label className="input-label flex items-center gap-1.5">
                <Package className="w-4 h-4 text-gold" />
                <span>Kategori Tujuan Pemindahan Produk *</span>
              </label>

              {otherCategories.length === 0 ? (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  Tidak ada kategori lain yang tersedia untuk memindahkan produk.
                </div>
              ) : (
                <select
                  value={selectedTargetId}
                  onChange={(e) => {
                    setSelectedTargetId(e.target.value);
                    setErrorMsg('');
                  }}
                  className="input select text-sm w-full"
                >
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.productCount ?? 0} produk)
                      {!c.active ? ' — (disembunyikan)' : ''}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-gray-400">
                Produk akan langsung dialihkan ke kategori ini dan kategori lama akan dihapus permanen.
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-4 p-3 rounded-xl bg-[#161616] border border-[#262626]">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="text-gold font-semibold">"{category.name}"</span>?
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Kategori ini tidak memiliki produk terdaftar. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
