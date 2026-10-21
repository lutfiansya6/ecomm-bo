'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Category } from '@/types';
import { AlertCircle, FolderPlus, Edit3, Loader2, Hash, Globe } from 'lucide-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    slug: string;
    active: boolean;
    label_en?: string;
    label_id?: string;
  }) => Promise<void>;
  category: Category | null;
  existingCategories: Category[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  category,
  existingCategories,
}: CategoryFormModalProps) {
  const isEditing = Boolean(category);

  const [labelEn, setLabelEn] = useState('');
  const [labelId, setLabelId] = useState('');
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState(true);

  const [labelEnError, setLabelEnError] = useState('');
  const [labelIdError, setLabelIdError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setLabelEn(category.label_en || category.name || '');
        setLabelId(category.label_id || category.name || '');
        setSlug(category.slug || '');
        setActive(category.active);
      } else {
        setLabelEn('');
        setLabelId('');
        setSlug('');
        setActive(true);
      }
      setLabelEnError('');
      setLabelIdError('');
      setSlugError('');
      setSubmitting(false);
    }
  }, [isOpen, category]);

  // Handle Label (English) Change - DO NOT touch slug
  const handleLabelEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelEn(e.target.value);
    setLabelEnError('');
  };

  // Handle Label (Indonesia) Change - DO NOT touch slug
  const handleLabelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelId(e.target.value);
    setLabelIdError('');
  };

  // Handle Slug Change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setSlug(val);
    setSlugError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    const cleanLabelEn = labelEn.trim();
    const cleanLabelId = labelId.trim();
    const cleanSlug = slug.trim().toLowerCase();

    // 1. Validasi Label (English)
    if (!cleanLabelEn) {
      setLabelEnError('Label (English) wajib diisi');
      hasError = true;
    } else if (cleanLabelEn.length < 2 || cleanLabelEn.length > 40) {
      setLabelEnError('Label (English) harus antara 2 hingga 40 karakter');
      hasError = true;
    } else {
      const dupName = existingCategories.some(
        (c) =>
          (!category || c.id !== category.id) &&
          ((c.label_en && c.label_en.trim().toLowerCase() === cleanLabelEn.toLowerCase()) ||
            (c.name && c.name.trim().toLowerCase() === cleanLabelEn.toLowerCase()))
      );
      if (dupName) {
        setLabelEnError('Label (English) sudah digunakan');
        hasError = true;
      }
    }

    // 2. Validasi Label (Indonesia)
    if (!cleanLabelId) {
      setLabelIdError('Label (Indonesia) wajib diisi');
      hasError = true;
    } else if (cleanLabelId.length < 2 || cleanLabelId.length > 40) {
      setLabelIdError('Label (Indonesia) harus antara 2 hingga 40 karakter');
      hasError = true;
    }

    // 3. Validasi Slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!cleanSlug) {
      setSlugError('Slug URL wajib diisi');
      hasError = true;
    } else if (!slugRegex.test(cleanSlug)) {
      setSlugError('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung');
      hasError = true;
    } else {
      const dupSlug = existingCategories.some(
        (c) => (!category || c.id !== category.id) && c.slug.trim().toLowerCase() === cleanSlug
      );
      if (dupSlug) {
        setSlugError('Slug sudah digunakan');
        hasError = true;
      }
    }

    if (hasError) return;

    setSubmitting(true);
    try {
      await onSave({
        name: cleanLabelEn,
        label_en: cleanLabelEn,
        label_id: cleanLabelId,
        slug: cleanSlug,
        active,
      });
      onClose();
    } catch {
      // Error handled with toast in parent
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
        onClick={handleSubmit}
        disabled={submitting}
        className="btn btn-primary btn-sm flex items-center gap-1.5"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            {isEditing ? <Edit3 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
      subtitle={
        isEditing
          ? `Sesuaikan informasi kategori "${category?.label_en || category?.name || ''}"`
          : 'Tambahkan kategori busana baru ke katalog produk dan etalase toko'
      }
      footer={footer}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bilingual Header Notice */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#181818] border border-[#262626] text-xs text-gray-300">
          <Globe className="w-4 h-4 text-gold shrink-0" />
          <span>Mendukung dua bahasa untuk etalase internasional & lokal.</span>
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
              {labelEn.trim().length}/40 karakter
            </span>
          </label>
          <input
            type="text"
            required
            value={labelEn}
            onChange={handleLabelEnChange}
            placeholder="Contoh: Dress & Gown, Tailored Blazer"
            maxLength={40}
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
              {labelId.trim().length}/40 karakter
            </span>
          </label>
          <input
            type="text"
            required
            value={labelId}
            onChange={handleLabelIdChange}
            placeholder="Contoh: Gaun & Terusan, Blazer Tailor"
            maxLength={40}
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

        {/* Input 3: Slug URL (Independent, not changed by labels) */}
        <div>
          <label className="input-label">Slug URL *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <Hash className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              value={slug}
              onChange={handleSlugChange}
              placeholder="contoh: dress-gown"
              className={`input pl-10 text-sm font-mono ${
                slugError ? 'border-rose-500 focus:border-rose-500' : ''
              }`}
            />
          </div>
          {slugError ? (
            <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {slugError}
            </p>
          ) : (
            <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1.5 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Slug tidak berubah otomatis saat label diedit agar link etalase tetap aman.
            </p>
          )}
        </div>

        {/* Saklar Tampilkan di toko */}
        <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] hover:border-[#383838] transition-colors flex items-center justify-between gap-4">
          <div className="space-y-0.5 flex-1 pr-2">
            <label
              htmlFor="toggle-active-status"
              className="text-sm font-semibold text-white block cursor-pointer select-none"
            >
              Tampilkan di toko
            </label>
            <p className="text-xs text-gray-400 leading-relaxed">
              Jika aktif, kategori ini akan tampil di menu toko dan filter katalog produk publik.
            </p>
          </div>
          <button
            type="button"
            id="toggle-active-status"
            role="switch"
            aria-checked={active}
            onClick={() => setActive(!active)}
            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold/50 ${
              active ? 'bg-gold' : 'bg-[#333333]'
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
  );
}
