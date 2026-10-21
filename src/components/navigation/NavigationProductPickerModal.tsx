'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { NavigationItem, Product, Category } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { formatPrice, getProductFallbackImage } from '@/lib/utils';
import {
  Search,
  Filter,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Layers,
  ArrowUpDown,
  RefreshCw,
  X,
  ListOrdered,
} from 'lucide-react';

interface NavigationProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NavigationItem | null;
  allProducts: Product[];
  categories: Category[];
  initialSelectedIds?: string[];
  onSaved?: (updatedItem: NavigationItem) => void;
  onSelectDraft?: (selectedIds: string[]) => void;
}

export function NavigationProductPickerModal({
  isOpen,
  onClose,
  item,
  allProducts,
  categories,
  initialSelectedIds,
  onSaved,
  onSelectDraft,
}: NavigationProductPickerModalProps) {
  const { addToast } = useUIStore();

  // Selected Product IDs in order
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Mobile active tab ('catalog' | 'selected')
  const [activeTab, setActiveTab] = useState<'catalog' | 'selected'>('catalog');

  // Load initial products assigned to this menu
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedIds) {
        setSelectedIds([...initialSelectedIds]);
      } else if (item?.id) {
        setLoading(true);
        api.navigation
          .getProducts(item.id)
          .then((res) => {
            if (res.success && res.data?.products) {
              setSelectedIds(res.data.products.map((p) => p.id));
            } else {
              setSelectedIds(item.productIds ? [...item.productIds] : []);
            }
          })
          .catch(() => {
            setSelectedIds(item.productIds ? [...item.productIds] : []);
          })
          .finally(() => {
            setLoading(false);
          });
      } else if (item?.productIds) {
        setSelectedIds([...item.productIds]);
      } else {
        setSelectedIds([]);
      }

      setSearch('');
      setCategoryFilter('all');
      setGenderFilter('all');
      setActiveTab('catalog');
    } else {
      setSelectedIds([]);
    }
  }, [isOpen, item, initialSelectedIds]);

  // Lookup map for fast access
  const productMap = useMemo(() => {
    return new Map<string, Product>(allProducts.map((p) => [p.id, p]));
  }, [allProducts]);

  // Filtered Catalog
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // Search match
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

      // Category match
      const matchCat =
        categoryFilter === 'all' ||
        p.category === categoryFilter ||
        p.categoryId === categoryFilter;

      // Gender match
      const matchGender =
        genderFilter === 'all' ||
        (p.gender && p.gender.toLowerCase() === genderFilter.toLowerCase());

      return matchSearch && matchCat && matchGender;
    });
  }, [allProducts, search, categoryFilter, genderFilter]);

  // Toggle selection
  const handleToggleProduct = (productId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Select all filtered results
  const handleSelectAllFiltered = () => {
    const toAdd = filteredProducts.map((p) => p.id);
    setSelectedIds((prev) => {
      const combined = [...prev];
      toAdd.forEach((id) => {
        if (!combined.includes(id)) {
          combined.push(id);
        }
      });
      return combined;
    });
  };

  // Deselect all
  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Move product up in order
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setSelectedIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  // Move product down in order
  const handleMoveDown = (index: number) => {
    if (index >= selectedIds.length - 1) return;
    setSelectedIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Remove single product from selected list
  const handleRemoveItem = (productId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
  };

  // Submit / Save
  const handleSave = async () => {
    if (onSelectDraft) {
      onSelectDraft(selectedIds);
      onClose();
      return;
    }

    if (!item) return;

    setSubmitting(true);
    try {
      const res = await api.navigation.updateProducts(item.id, selectedIds);
      if (res.success && res.data) {
        addToast({
          type: 'success',
          title: 'Produk Menu Tersimpan',
          message: `${selectedIds.length} produk berhasil ditautkan ke menu "${item.label_en || item.label}".`,
        });
        if (onSaved) {
          onSaved({
            ...item,
            ...res.data,
            productIds: selectedIds,
            productCount: selectedIds.length,
          });
        }
        onClose();
      } else {
        throw new Error(res.error || 'Gagal menyimpan produk ke menu navigasi');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  const menuTitle = item.label_en || item.label;

  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
      {/* Left side: selected count indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300">
          Total dipilih:{' '}
          <strong className="text-gold font-mono font-bold">{selectedIds.length}</strong> produk
        </span>
        {selectedIds.length === 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Menu akan kosong di storefront</span>
          </span>
        )}
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center justify-end gap-2.5">
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
          onClick={handleSave}
          disabled={submitting || loading}
          className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-gold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Simpan Pilihan ({selectedIds.length})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kelola Produk Menu: ${menuTitle}`}
      subtitle={`Pilih produk dan tentukan urutan tampilannya pada etalase toko untuk menu "${menuTitle}"`}
      footer={footer}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Warning Banner if 0 products selected */}
        {selectedIds.length === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300">
              <strong className="font-semibold block text-amber-200">
                Menu akan kosong di storefront!
              </strong>
              Pengunjung yang mengklik menu ini di navbar tidak akan melihat produk apa pun. Silakan centang produk dari daftar di bawah.
            </div>
          </div>
        )}

        {/* Tab switch for small screens (< 1024px) */}
        <div className="flex lg:hidden items-center p-1 rounded-xl bg-[#141414] border border-[#262626]">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-gold text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog Produk ({filteredProducts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('selected')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'selected'
                ? 'bg-gold text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Terpilih ({selectedIds.length})</span>
          </button>
        </div>

        {/* Two Column Layout (Desktop: Side-by-side, Mobile: Tab switch) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Product Catalog & Selection */}
          <div
            className={`space-y-3 lg:col-span-7 ${
              activeTab !== 'catalog' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Filter Toolbar */}
            <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] space-y-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama produk, SKU, atau tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9 text-xs bg-[#191919] py-1.5"
                />
              </div>

              {/* Category & Gender filters */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input select text-xs bg-[#191919] py-1"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.label_en || c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="input select text-xs bg-[#191919] py-1"
                >
                  <option value="all">Semua Gender</option>
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#202020]">
                <span className="text-[11px] text-gray-400 font-mono">
                  Menampilkan {filteredProducts.length} produk
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    disabled={filteredProducts.length === 0}
                    className="text-[11px] font-medium text-gold hover:underline disabled:opacity-30"
                  >
                    Pilih semua hasil
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={selectedIds.length === 0}
                    className="text-[11px] font-medium text-gray-400 hover:text-white disabled:opacity-30"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            </div>

            {/* Product List Scroll Area (4-Area Layout, zero overlap) */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 divide-y-0">
              {loading ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                  <p className="text-xs">Memuat katalog produk...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center rounded-xl bg-[#141414] border border-[#222222] p-4 text-gray-400 text-xs">
                  Tidak ada produk yang cocok dengan pencarian / filter.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;
                  const primaryImage = product.images?.[0];

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                        isSelected
                          ? 'bg-gold/10 border-gold/40 shadow-sm'
                          : 'bg-[#141414] border-[#242424] hover:bg-[#181818] hover:border-[#333333]'
                      }`}
                    >
                      {/* Area 1: Checkbox & Foto Kecil */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-gold border-gold text-black shadow-sm'
                              : 'border-gray-600 bg-[#1a1a1a]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#1c1c1c] border border-[#2a2a2a] shrink-0">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.onerror = null;
                                target.src = getProductFallbackImage(product.name || product.category);
                              }}
                            />
                          ) : (
                            <img
                              src={getProductFallbackImage(product.name || product.category)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>

                      {/* Area 2: Info Produk (Nama, SKU, Harga) */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white text-xs leading-snug line-clamp-1 truncate">
                            {product.name}
                          </span>
                          {product.featured && (
                            <span
                              className="p-0.5 rounded bg-gold/15 text-gold shrink-0"
                              title="Featured"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <p className="font-mono text-[11px] text-gray-400 truncate">
                          {product.id}
                        </p>

                        <div className="flex items-baseline gap-2 whitespace-nowrap pt-0.5">
                          <span className="text-xs font-semibold text-gold font-mono">
                            {formatPrice(product.price)}
                          </span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-[10px] text-gray-500 line-through font-mono">
                              {formatPrice(product.comparePrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Area 3: Stok & Badge Gender (lebar tetap, rata kanan) */}
                      <div className="w-24 shrink-0 flex flex-col items-end justify-center gap-1 text-right">
                        {/* Badge Stok */}
                        <div className="whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                              {product.stock} pcs
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#1e1e1e] border border-[#2e2e2e] text-gray-300 font-mono">
                              {product.stock} pcs
                            </span>
                          )}
                        </div>

                        {/* Badge Gender */}
                        <div>
                          {product.gender === 'women' ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              Women
                            </span>
                          ) : product.gender === 'men' ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              Men
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              Unisex
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Ordered List of Selected Products */}
          <div
            className={`space-y-3 lg:col-span-5 ${
              activeTab !== 'selected' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-gold" />
                    <span>Terpilih ({selectedIds.length})</span>
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    Urutan di bawah = urutan tampil di storefront
                  </p>
                </div>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              {/* Selected List */}
              <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
                {selectedIds.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">
                    <Layers className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                    <p className="text-gray-400 font-medium">Belum ada produk dipilih</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Pilih produk dari daftar di sebelah kiri untuk menambahkannya ke menu ini.
                    </p>
                  </div>
                ) : (
                  selectedIds.map((pid, idx) => {
                    const product = productMap.get(pid);
                    if (!product) return null;
                    const isFirst = idx === 0;
                    const isLast = idx === selectedIds.length - 1;

                    return (
                      <div
                        key={pid}
                        className="p-2 rounded-lg bg-[#181818] border border-[#282828] hover:border-[#383838] transition-colors flex items-center gap-2 group"
                      >
                        {/* Order Number Badge */}
                        <span className="w-5 h-5 rounded bg-black/60 border border-[#333] text-[10px] font-mono font-bold text-gold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Thumbnail */}
                        <div className="w-9 h-11 rounded overflow-hidden bg-[#222] border border-[#333] shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.onerror = null;
                                target.src = getProductFallbackImage(product.name || product.category);
                              }}
                            />
                          ) : (
                            <img
                              src={getProductFallbackImage(product.name || product.category)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate leading-snug">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                            <span>{product.id}</span>
                            <span>•</span>
                            <span className="text-gold">{formatPrice(product.price)}</span>
                          </div>
                        </div>

                        {/* Move Up / Move Down & Remove actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={isFirst}
                            className="p-1 rounded text-gray-400 hover:text-gold hover:bg-[#242424] disabled:opacity-20 transition-colors"
                            title="Pindahkan ke atas"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={isLast}
                            className="p-1 rounded text-gray-400 hover:text-gold hover:bg-[#242424] disabled:opacity-20 transition-colors"
                            title="Pindahkan ke bawah"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(pid)}
                            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus dari menu ini"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
