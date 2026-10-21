'use client';

import React, { useState } from 'react';
import type { NavigationItem, Category } from '@/types';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Search,
  HelpCircle,
  Package,
  Layers,
} from 'lucide-react';

interface NavigationTableProps {
  items: NavigationItem[];
  categories: Category[];
  onEdit: (item: NavigationItem) => void;
  onManageProducts: (item: NavigationItem) => void;
  onToggleActive: (item: NavigationItem) => Promise<void>;
  onDelete: (item: NavigationItem) => void;
  onReorder: (newOrderedIds: string[]) => Promise<void>;
  isReordering?: boolean;
}

export function NavigationTable({
  items,
  categories,
  onEdit,
  onManageProducts,
  onToggleActive,
  onDelete,
  onReorder,
  isReordering = false,
}: NavigationTableProps) {
  const [search, setSearch] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.label_en && item.label_en.toLowerCase().includes(q)) ||
      (item.label_id && item.label_id.toLowerCase().includes(q))
    );
  });

  const isFiltered = Boolean(search.trim());

  // Reorder Up/Down handlers
  const handleMoveUp = async (index: number) => {
    if (index <= 0 || isReordering) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    await onReorder(newItems.map((i) => i.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index >= items.length - 1 || isReordering) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    await onReorder(newItems.map((i) => i.id));
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isFiltered) return;
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

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    setDraggedIndex(null);

    await onReorder(newItems.map((i) => i.id));
  };

  const handleToggle = async (item: NavigationItem) => {
    setTogglingId(item.id);
    try {
      await onToggleActive(item);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari label menu navbar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-mono text-gold font-bold">{items.length}</span> Menu Terdaftar
        </div>
      </div>

      {isFiltered && (
        <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Pengubahan urutan (drag/naik-turun) dinonaktifkan saat filter pencarian aktif.</span>
        </div>
      )}

      {/* Main Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#141414] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-28 text-center">Urutan</th>
                <th className="py-3.5 px-4">Label Menu</th>
                <th className="py-3.5 px-4 text-center">Produk</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020] text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <p className="text-base font-medium text-white mb-1">
                      {isFiltered ? 'Tidak ada menu yang cocok' : 'Belum ada menu navbar'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isFiltered
                        ? 'Coba kata kunci pencarian lain.'
                        : 'Mulai dengan menambahkan menu baru menggunakan tombol di atas.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const originalIndex = items.findIndex((i) => i.id === item.id);
                  const isFirst = originalIndex === 0;
                  const isLast = originalIndex === items.length - 1;
                  const isBeingDragged = draggedIndex === originalIndex;
                  const isDragTarget = dragOverIndex === originalIndex;
                  const isToggling = togglingId === item.id;
                  const count = item.productCount ?? item.productIds?.length ?? 0;

                  return (
                    <tr
                      key={item.id}
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
                          {/* Drag Handle */}
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
                            {item.order || originalIndex + 1}
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

                      {/* Label Menu */}
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-semibold tracking-wide block ${
                                  item.accent ? 'text-gold' : 'text-white'
                                }`}
                              >
                                {item.label_en || item.label}
                              </span>

                              {item.accent && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/40 shadow-[0_0_8px_rgba(201,168,76,0.25)]"
                                  title="Menu ini disorot dengan warna emas di navbar"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Sorot</span>
                                </span>
                              )}

                              {item.system && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  title="Menu bawaan sistem"
                                >
                                  <Shield className="w-2.5 h-2.5" />
                                  <span>Sistem</span>
                                </span>
                              )}
                            </div>

                            {item.label_id && item.label_id !== (item.label_en || item.label) && (
                              <span className="text-[11px] text-gray-400 font-normal block mt-0.5">
                                {item.label_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kolom Produk (Requirement 2): Jumlah dan Tombol "Kelola" */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              count > 0
                                ? 'bg-[#181818] border-[#2c2c2c] text-white'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                            title={`${count} produk ditautkan ke menu ini`}
                          >
                            <Package className={`w-3.5 h-3.5 ${count > 0 ? 'text-gold' : 'text-amber-400'}`} />
                            <span className="font-mono font-bold text-gold">{count}</span>
                            <span className="text-gray-400 font-normal text-[11px]">produk</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => onManageProducts(item)}
                            className="btn btn-secondary btn-xs flex items-center gap-1 text-[11px] text-gray-200 hover:text-gold border-[#2e2e2e] hover:border-gold/40 shadow-sm"
                            title={`Kelola produk untuk menu "${item.label_en || item.label}"`}
                          >
                            <Layers className="w-3 h-3 text-gold" />
                            <span>Kelola</span>
                          </button>
                        </div>
                      </td>

                      {/* Status (Tampil / Sembunyikan) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(item)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                            item.active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                          }`}
                          title={`Klik untuk ${item.active ? 'menyembunyikan' : 'menampilkan'} di navbar`}
                        >
                          {item.active ? (
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
                            onClick={() => handleToggle(item)}
                            disabled={isToggling}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.active
                                ? 'border-[#2a2a2a] bg-[#161616] text-gray-400 hover:text-amber-400 hover:border-amber-500/40'
                                : 'border-[#2a2a2a] bg-[#161616] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40'
                            }`}
                            title={item.active ? 'Sembunyikan dari Navbar' : 'Tampilkan di Navbar'}
                          >
                            {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Ubah Button */}
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg border border-[#2a2a2a] bg-[#161616] text-gray-400 hover:text-white hover:border-[#383838] transition-colors"
                            title="Ubah Label / Pengaturan Menu"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Hapus Button: Disabled for system menu with tooltip */}
                          {item.system ? (
                            <div className="relative group/tooltip inline-block">
                              <button
                                type="button"
                                disabled
                                className="p-1.5 rounded-lg border border-transparent bg-transparent text-gray-600 opacity-40 cursor-not-allowed"
                                aria-disabled="true"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* Tooltip on hover */}
                              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tooltip:block z-50 w-64 p-2 rounded-lg bg-[#1f1f1f] text-gray-200 text-xs border border-[#383838] shadow-2xl pointer-events-none text-center">
                                Menu sistem tidak bisa dihapus, hanya bisa disembunyikan
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="p-1.5 rounded-lg border border-[#2a2a2a] bg-[#161616] text-gray-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Menu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
