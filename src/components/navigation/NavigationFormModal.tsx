'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { NavigationItem, Product, Category } from '@/types';
import { NavigationProductPickerModal } from '@/components/navigation/NavigationProductPickerModal';
import { getProductFallbackImage } from '@/lib/utils';
import {
  Compass,
  Edit3,
  Loader2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  Globe,
  Plus,
  Package,
} from 'lucide-react';

interface NavigationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    label: string;
    label_en?: string;
    label_id?: string;
    accent: boolean;
    active: boolean;
    productIds?: string[];
  }) => Promise<void>;
  item: NavigationItem | null;
  existingItems: NavigationItem[];
  allProducts: Product[];
  categories: Category[];
}

export function NavigationFormModal({
  isOpen,
  onClose,
  onSave,
  item,
  existingItems,
  allProducts,
  categories,
}: NavigationFormModalProps) {
  const isEditing = Boolean(item);

  const [labelEn, setLabelEn] = useState('');
  const [labelId, setLabelId] = useState('');
  const [accent, setAccent] = useState(false);
  const [active, setActive] = useState(true);
  const [productIds, setProductIds] = useState<string[]>([]);

  // Sub-modal state for picking products
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Validation errors & loading state
  const [labelEnError, setLabelEnError] = useState('');
  const [labelIdError, setLabelIdError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setLabelEn(item.label_en || item.label || '');
        setLabelId(item.label_id || item.label || '');
        setAccent(Boolean(item.accent));
        setActive(item.active !== undefined ? item.active : true);
        setProductIds(item.productIds ? [...item.productIds] : []);
      } else {
        setLabelEn('');
        setLabelId('');
        setAccent(false);
        setActive(true);
        setProductIds([]);
      }
      setLabelEnError('');
      setLabelIdError('');
      setSubmitting(false);
      setIsPickerOpen(false);
    }
  }, [isOpen, item]);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const cleanLabelEn = labelEn.trim();
    const cleanLabelId = labelId.trim();

    // 1. Validasi Label (English)
    if (!cleanLabelEn) {
      setLabelEnError('Label (English) wajib diisi');
      hasError = true;
    } else if (cleanLabelEn.length < 2 || cleanLabelEn.length > 50) {
      setLabelEnError('Label (English) harus antara 2 hingga 50 karakter');
      hasError = true;
    } else {
      const dup = existingItems.some(
        (i) =>
          (!item || i.id !== item.id) &&
          ((i.label_en && i.label_en.toLowerCase() === cleanLabelEn.toLowerCase()) ||
            i.label.toLowerCase() === cleanLabelEn.toLowerCase())
      );
      if (dup) {
        setLabelEnError('Label (English) sudah digunakan, gunakan label lain');
        hasError = true;
      }
    }

    // 2. Validasi Label (Indonesia)
    if (!cleanLabelId) {
      setLabelIdError('Label (Indonesia) wajib diisi');
      hasError = true;
    } else if (cleanLabelId.length < 2 || cleanLabelId.length > 50) {
      setLabelIdError('Label (Indonesia) harus antara 2 hingga 50 karakter');
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);
    try {
      await onSave({
        label: cleanLabelEn,
        label_en: cleanLabelEn,
        label_id: cleanLabelId,
        accent,
        active,
        productIds,
      });
      onClose();
    } catch {
      // Error is handled with toast in parent component
    } finally {
      setSubmitting(false);
    }
  };

  // Preview selected product thumbnails (first 5)
  const selectedProductThumbnails = productIds
    .map((pid) => allProducts.find((p) => p.id === pid))
    .filter(Boolean) as Product[];

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
        onClick={handleSubmit}
        disabled={submitting}
        className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-gold"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            {isEditing ? <Edit3 className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
            <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Menu'}</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Ubah Menu Navbar' : 'Tambah Menu Navbar'}
        subtitle={
          isEditing
            ? `Sesuaikan label dan produk untuk menu "${item?.label_en || item?.label || ''}"`
            : 'Tambahkan menu baru ke navigasi header etalase toko'
        }
        footer={footer}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bilingual Header Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181818] border border-[#262626] text-xs text-gray-300">
            <Globe className="w-4 h-4 text-gold shrink-0" />
            <span>Semua menu navbar dikurasi secara manual dengan memilih produk langsung.</span>
          </div>

          {/* Input 1: Label (English) */}
          <div>
            <label className="input-label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">
                  EN
                </span>
                <span>Label (English) *</span>
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                {labelEn.trim().length}/50 karakter
              </span>
            </label>
            <input
              type="text"
              required
              value={labelEn}
              onChange={(e) => {
                setLabelEn(e.target.value);
                setLabelEnError('');
              }}
              placeholder="Contoh: Signature Bags, New Season"
              maxLength={50}
              className={`input text-sm ${
                labelEnError ? 'border-rose-500 focus:border-rose-500' : ''
              }`}
              autoFocus
            />
            {labelEnError && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {labelEnError}
              </p>
            )}
          </div>

          {/* Input 2: Label (Indonesia) */}
          <div>
            <label className="input-label flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                  ID
                </span>
                <span>Label (Indonesia) *</span>
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                {labelId.trim().length}/50 karakter
              </span>
            </label>
            <input
              type="text"
              required
              value={labelId}
              onChange={(e) => {
                setLabelId(e.target.value);
                setLabelIdError('');
              }}
              placeholder="Contoh: Tas Ikonik, Musim Terbaru"
              maxLength={50}
              className={`input text-sm ${
                labelIdError ? 'border-rose-500 focus:border-rose-500' : ''
              }`}
            />
            {labelIdError && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {labelIdError}
              </p>
            )}
          </div>

          {/* Section: "Produk di menu ini" (Requirement 1) */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gold/15 text-gold border border-gold/30">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Produk di Menu Ini</h4>
                  <p className="text-[11px] text-gray-400">
                    {productIds.length > 0 ? (
                      <span>
                        <strong className="text-gold font-mono">{productIds.length}</strong> produk dipilih untuk menu ini
                      </span>
                    ) : (
                      <span className="text-amber-400/90">Belum ada produk dipilih</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Tombol Pilih Produk */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-gold border-gold/40 hover:bg-gold/10"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{productIds.length > 0 ? 'Ubah Pilihan Produk' : 'Pilih Produk'}</span>
              </button>
            </div>

            {/* Visual Thumbnail Strip */}
            {selectedProductThumbnails.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                {selectedProductThumbnails.slice(0, 6).map((prod, i) => (
                  <div
                    key={prod.id}
                    className="relative w-11 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2e2e2e] shrink-0"
                    title={`${i + 1}. ${prod.name}`}
                  >
                    {prod.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = getProductFallbackImage(prod.name || prod.category);
                        }}
                      />
                    ) : (
                      <img
                        src={getProductFallbackImage(prod.name || prod.category)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-0 right-0 px-1 rounded-tl bg-black/80 text-[8px] font-mono text-gold font-bold">
                      {i + 1}
                    </span>
                  </div>
                ))}
                {productIds.length > 6 && (
                  <div className="w-11 h-14 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] shrink-0 flex items-center justify-center text-xs font-mono font-bold text-gray-400">
                    +{productIds.length - 6}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic bg-[#0f0f0f] p-2.5 rounded-lg border border-[#202020]">
                Klik tombol "Pilih Produk" untuk memilih produk apa saja yang tampil saat menu ini diklik di toko.
              </p>
            )}
          </div>

          {/* Toggle: Sorot (warna emas) */}
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-[#383838] transition-colors flex items-center justify-between gap-4">
            <div className="space-y-0.5 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="toggle-accent"
                  className="text-sm font-semibold text-white block cursor-pointer select-none"
                >
                  Sorot (warna emas)
                </label>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/40">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Emas</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tampilkan menu dengan gaya aksen emas elegan di navbar toko untuk menarik perhatian.
              </p>
            </div>
            <button
              type="button"
              id="toggle-accent"
              role="switch"
              aria-checked={accent}
              onClick={() => setAccent(!accent)}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                accent ? 'bg-gold' : 'bg-[#333333]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
                  accent ? 'translate-x-6 bg-black' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>

          {/* Toggle: Tampil / Sembunyi */}
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-[#383838] transition-colors flex items-center justify-between gap-4">
            <div className="space-y-0.5 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="toggle-active"
                  className="text-sm font-semibold text-white block cursor-pointer select-none"
                >
                  Tampilkan di Toko
                </label>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {active ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                  <span>{active ? 'Tampil' : 'Disembunyikan'}</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Jika dinonaktifkan, menu ini akan disembunyikan dari navbar pengunjung etalase toko.
              </p>
            </div>
            <button
              type="button"
              id="toggle-active"
              role="switch"
              aria-checked={active}
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                active ? 'bg-emerald-500' : 'bg-[#333333]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out ${
                  active ? 'translate-x-6 bg-black' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>
        </form>
      </Modal>

      {/* Product Picker Modal */}
      <NavigationProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        item={item}
        allProducts={allProducts}
        categories={categories}
        initialSelectedIds={productIds}
        onSelectDraft={(ids) => {
          setProductIds(ids);
        }}
      />
    </>
  );
}
