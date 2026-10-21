'use client';

import React, { useState } from 'react';
import type { Category } from '@/types';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Hash,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onToggleActive: (category: Category) => Promise<void>;
  onDelete: (category: Category) => void;
  onReorder: (newOrderedIds: string[]) => Promise<void>;
  onOpenProducts: (category: Category) => void;
  isReordering?: boolean;
}

export function CategoryTable({
  categories,
  onEdit,
  onToggleActive,
  onDelete,
  onReorder,
  onOpenProducts,
  isReordering = false,
}: CategoryTableProps) {
  const [search, setSearch] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.label_en && c.label_en.toLowerCase().includes(q)) ||
      (c.label_id && c.label_id.toLowerCase().includes(q))
    );
  });

  const isFiltered = Boolean(search.trim());
  const isOnlyOneCategory = categories.length <= 1;

  // Naik/Turun handlers
  const handleMoveUp = async (index: number) => {
    if (index <= 0 || isReordering) return;
    const newItems = [...categories];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    await onReorder(newItems.map((c) => c.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index >= categories.length - 1 || isReordering) return;
    const newItems = [...categories];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    await onReorder(newItems.map((c) => c.id));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isFiltered) return; // Disable drag during search to prevent index confusion
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isFiltered) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (isFiltered || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const newItems = [...categories];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(null);

    await onReorder(newItems.map((c) => c.id));
  };

  const handleToggle = async (category: Category) => {
    setTogglingId(category.id);
    try {
      await onToggleActive(category);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar & Help Banner */}
      <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau slug kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-mono text-gold font-bold">{categories.length}</span> Kategori
          Terdaftar
        </div>
      </div>

      {isFiltered && (
        <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Pengubahan urutan (drag/naik-turun) dinonaktifkan saat filter pencarian aktif.</span>
        </div>
      )}

      {/* Main Categories Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#141414] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-28 text-center">Urutan</th>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4 text-center">Jumlah Produk</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020] text-sm">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <p className="text-base font-medium text-white mb-1">
                      {isFiltered ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isFiltered
                        ? 'Coba kata kunci pencarian lain.'
                        : 'Mulai dengan menambahkan kategori baru menggunakan tombol di atas.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  // Find original index in full list for order actions
                  const originalIndex = categories.findIndex((c) => c.id === cat.id);
                  const isFirst = originalIndex === 0;
                  const isLast = originalIndex === categories.length - 1;
                  const isBeingDragged = draggedIndex === originalIndex;
                  const isDragTarget = dragOverIndex === originalIndex;
                  const isToggling = togglingId === cat.id;

                  return (
                    <tr
                      key={cat.id}
                      draggable={!isFiltered}
                      onDragStart={(e) => handleDragStart(e, originalIndex)}
                      onDragOver={(e) => handleDragOver(e, originalIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, originalIndex)}
                      className={`group transition-colors ${
                        isBeingDragged
                          ? 'opacity-40 bg-[#1e1e1e]'
                          : isDragTarget
                          ? 'bg-gold/10 border-t-2 border-gold'
                          : 'hover:bg-[#161616]'
                      }`}
                    >
                      {/* Urutan & Drag Handle */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Native Drag Handle */}
                          <div
                            className={`p-1 rounded text-gray-500 transition-colors ${
                              isFiltered
                                ? 'cursor-not-allowed opacity-30'
                                : 'cursor-grab active:cursor-grabbing hover:text-gold hover:bg-[#202020]'
                            }`}
                            title={isFiltered ? 'Nonaktif saat filter' : 'Tahan & Geser untuk mengubah urutan'}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Order Number Badge */}
                          <span className="w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#2e2e2e] text-[11px] font-mono font-bold text-gray-300 flex items-center justify-center shrink-0">
                            {cat.order || originalIndex + 1}
                          </span>

                          {/* Tombol Naik / Turun */}
                          <div className="flex flex-col ml-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveUp(originalIndex)}
                              disabled={isFirst || isFiltered || isReordering}
                              className="p-0.5 text-gray-400 hover:text-gold disabled:opacity-20 disabled:hover:text-gray-400 transition-colors rounded hover:bg-[#222222]"
                              title="Pindahkan ke atas"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(originalIndex)}
                              disabled={isLast || isFiltered || isReordering}
                              className="p-0.5 text-gray-400 hover:text-gold disabled:opacity-20 disabled:hover:text-gray-400 transition-colors rounded hover:bg-[#222222]"
                              title="Pindahkan ke bawah"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Nama Kategori */}
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-gold shrink-0 shadow-[0_0_8px_rgba(201,168,76,0.5)]" />
                          <div>
                            <span className="text-sm font-semibold tracking-wide block">
                              {cat.label_en || cat.name}
                            </span>
                            {cat.label_id && cat.label_id !== (cat.label_en || cat.name) && (
                              <span className="text-[11px] text-gray-400 font-normal block">
                                {cat.label_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-300">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181818] border border-[#2c2c2c] text-gold/90">
                          <Hash className="w-3 h-3 text-gray-500" />
                          {cat.slug}
                        </span>
                      </td>

                      {/* Jumlah Produk */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenProducts(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#181818] border border-[#2c2c2c] text-white hover:text-gold hover:border-gold/60 hover:bg-gold/10 hover:shadow-[0_0_12px_rgba(201,168,76,0.15)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all cursor-pointer group/badge"
                          title={`Lihat daftar produk di kategori "${cat.name}"`}
                          aria-label={`Lihat ${cat.productCount ?? 0} produk di kategori ${cat.name}`}
                        >
                          <Package className="w-3.5 h-3.5 text-gold group-hover/badge:scale-110 transition-transform" />
                          <span className="font-mono font-bold text-white group-hover/badge:text-gold">
                            {cat.productCount ?? 0}
                          </span>
                          <span className="text-gray-400 text-[11px] group-hover/badge:text-gold/90">
                            produk
                          </span>
                        </button>
                      </td>

                      {/* Status (Tampil / Disembunyikan) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(cat)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                            cat.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                          }`}
                          title={`Klik untuk ${cat.active ? 'menyembunyikan' : 'menampilkan'} di toko`}
                        >
                          {cat.active ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Tampil</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                              <span>Disembunyikan</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Aksi Per Baris */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sembunyikan / Tampilkan Button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(cat)}
                            disabled={isToggling}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              cat.active
                                ? 'border-[#2a2a2a] bg-[#161616] text-gray-400 hover:text-amber-400 hover:border-amber-500/40'
                                : 'border-[#2a2a2a] bg-[#161616] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40'
                            }`}
                            title={cat.active ? 'Sembunyikan dari Toko' : 'Tampilkan di Toko'}
                          >
                            {cat.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Ubah Button */}
                          <button
                            type="button"
                            onClick={() => onEdit(cat)}
                            className="p-1.5 rounded-lg border border-[#2a2a2a] bg-[#161616] text-gray-400 hover:text-white hover:border-[#383838] transition-colors"
                            title="Ubah Kategori"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Hapus Button (Disabled if only 1 category remains) */}
                          <button
                            type="button"
                            onClick={() => onDelete(cat)}
                            disabled={isOnlyOneCategory}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isOnlyOneCategory
                                ? 'border-transparent text-gray-600 cursor-not-allowed opacity-40'
                                : 'border-[#2a2a2a] bg-[#161616] text-gray-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10'
                            }`}
                            title={
                              isOnlyOneCategory
                                ? 'Kategori terakhir tidak boleh dihapus'
                                : 'Hapus Kategori'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
