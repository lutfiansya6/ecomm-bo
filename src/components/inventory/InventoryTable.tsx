'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Product, ColorVariant } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  ChevronRight,
  Palette,
  Check,
} from 'lucide-react';

interface InventoryTableProps {
  products: Product[];
  onRestock: (id: string, additionalStock: number) => Promise<void>;
  onUpdateColorStock?: (
    productId: string,
    colorName: string,
    newStock: number
  ) => Promise<void>;
  onUpdateSizeStock: (
    productId: string,
    colorName: string,
    sizeName: string,
    newStock: number
  ) => Promise<void>;
}

export function InventoryTable({
  products,
  onRestock,
  onUpdateSizeStock,
}: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'critical' | 'out' | 'healthy'
  >('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingCellKey, setLoadingCellKey] = useState<string | null>(null);

  // Expanded row tracking (set of product IDs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Local draft inputs for cell stock: key is `${productId}_${colorName}_${sizeName}`
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(products.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Helper to extract normalized color variants with sizeStock
  const getProductVariants = (product: Product): ColorVariant[] => {
    const sizes =
      product.sizes && product.sizes.length > 0 ? product.sizes : ['Standard'];

    if (product.colorVariants && product.colorVariants.length > 0) {
      return product.colorVariants.map((cv) => {
        const sizeStock: Record<string, number> = {};
        if (cv.sizeStock && Object.keys(cv.sizeStock).length > 0) {
          sizes.forEach((sz) => {
            sizeStock[sz] =
              typeof cv.sizeStock?.[sz] === 'number' ? cv.sizeStock[sz] : 0;
          });
        } else {
          const total =
            typeof cv.stock === 'number' ? cv.stock : product.stock || 0;
          const perSize = Math.floor(total / sizes.length);
          const remainder = total - perSize * sizes.length;
          sizes.forEach((sz, idx) => {
            sizeStock[sz] = idx === 0 ? perSize + remainder : perSize;
          });
        }
        const cvTotal = Object.values(sizeStock).reduce((sum, n) => sum + n, 0);
        return {
          ...cv,
          sizeStock,
          stock: cvTotal,
        };
      });
    }

    if (product.colors && product.colors.length > 0) {
      const perColor = Math.floor((product.stock || 0) / product.colors.length);
      return product.colors.map((cName, cIdx) => {
        const total =
          cIdx === 0
            ? (product.stock || 0) - perColor * (product.colors.length - 1)
            : perColor;
        const sizeStock: Record<string, number> = {};
        const perSize = Math.floor(total / sizes.length);
        const remainder = total - perSize * sizes.length;
        sizes.forEach((sz, sIdx) => {
          sizeStock[sz] = sIdx === 0 ? perSize + remainder : perSize;
        });
        return {
          name: cName,
          hex: cIdx === 0 ? '#000000' : '#c9a84c',
          images: product.images || [],
          sizeStock,
          stock: total,
        };
      });
    }

    const singleStock: Record<string, number> = {};
    const perSize = Math.floor((product.stock || 0) / sizes.length);
    const remainder = (product.stock || 0) - perSize * sizes.length;
    sizes.forEach((sz, sIdx) => {
      singleStock[sz] = sIdx === 0 ? perSize + remainder : perSize;
    });
    return [
      {
        name: 'Default',
        hex: '#000000',
        images: product.images || [],
        sizeStock: singleStock,
        stock: product.stock,
      },
    ];
  };

  // Filter products
  const filtered = products.filter((p) => {
    const variants = getProductVariants(p);
    const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ['Standard'];

    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      variants.some((v) => v.name.toLowerCase().includes(search.toLowerCase()));

    // Collect all cell stocks
    const allCellStocks: number[] = [];
    variants.forEach((v) => {
      sizes.forEach((sz) => {
        allCellStocks.push(v.sizeStock?.[sz] ?? 0);
      });
    });

    const hasLowStock = allCellStocks.some((s) => s > 0 && s <= 5) || (p.stock > 0 && p.stock <= 5);
    const hasOutOfStock = allCellStocks.some((s) => s === 0) || p.stock === 0;
    const allHealthy = allCellStocks.every((s) => s > 5) && p.stock > 5;

    let matchMode = true;
    if (filterMode === 'critical') {
      matchMode = hasLowStock;
    } else if (filterMode === 'out') {
      matchMode = hasOutOfStock;
    } else if (filterMode === 'healthy') {
      matchMode = allHealthy;
    }

    return matchSearch && matchMode;
  });

  const handleQuickAdd = async (id: string, amount: number) => {
    setLoadingId(id);
    try {
      await onRestock(id, amount);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSaveSizeStock = async (
    productId: string,
    colorName: string,
    sizeName: string,
    targetStock: number
  ) => {
    const key = `${productId}_${colorName}_${sizeName}`;
    setLoadingCellKey(key);
    try {
      await onUpdateSizeStock(productId, colorName, sizeName, targetStock);
      // Clean draft
      setDraftInputs((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    } finally {
      setLoadingCellKey(null);
    }
  };

  // Aggregate metrics
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  let criticalVariantsCount = 0;
  let outOfStockVariantsCount = 0;
  let totalVariantsCount = 0;

  products.forEach((p) => {
    const vars = getProductVariants(p);
    vars.forEach((v) => {
      totalVariantsCount++;
      const s = v.stock ?? p.stock;
      if (s === 0) outOfStockVariantsCount++;
      else if (s <= 5) criticalVariantsCount++;
    });
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-gray-400">
              Total Unit Fisik
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
              SKU
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {totalStockCount} Unit
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Terbagi dalam {products.length} model ({totalVariantsCount} varian warna)
          </p>
        </div>

        <div className="card p-5 border-amber-500/30 bg-[#17130a]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-amber-400">
              Stok Menipis (≤5)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2">
            {criticalVariantsCount} Varian
          </p>
          <p className="text-xs text-amber-200/60 mt-1">
            Perlu pengadaan restock untuk varian atau ukuran kritis
          </p>
        </div>

        <div className="card p-5 border-rose-500/30 bg-[#170a0c]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-rose-400">
              Stok Habis (0)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-300 mt-2">
            {outOfStockVariantsCount} Varian
          </p>
          <p className="text-xs text-rose-200/60 mt-1">
            Varian warna atau ukuran ini tidak dapat dipesan pelanggan
          </p>
        </div>
      </div>

      {/* Search, Filter & Bulk Expand Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari inventaris berdasarkan nama barang, SKU, atau varian warna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-56">
            <select
              value={filterMode}
              onChange={(e) =>
                setFilterMode(
                  e.target.value as 'all' | 'critical' | 'out' | 'healthy'
                )
              }
              className="input select text-sm"
            >
              <option value="all">Semua Status Stok</option>
              <option value="critical">Stok Menipis (≤5)</option>
              <option value="out">Stok Habis (0)</option>
              <option value="healthy">Stok Aman (&gt;5)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expandAll}
              className="btn btn-secondary btn-sm text-xs px-2.5 py-1.5"
              title="Buka semua matriks stok produk"
            >
              Buka Semua
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="btn btn-secondary btn-sm text-xs px-2.5 py-1.5"
              title="Tutup semua matriks stok produk"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="w-10 text-center"></th>
              <th>Produk & SKU</th>
              <th>Kategori</th>
              <th>Harga Jual</th>
              <th>Total Stok</th>
              <th>Status Stok</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Tidak ada data inventaris yang cocok dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const variants = getProductVariants(product);
                const productSizes =
                  product.sizes && product.sizes.length > 0
                    ? product.sizes
                    : ['Standard'];
                const isExpanded = expandedIds.has(product.id);
                const isProductOut = product.stock === 0;
                const isProductCritical = product.stock > 0 && product.stock <= 5;

                // Color-level conditions
                const anyVariantOut = variants.some(
                  (v) => (v.stock ?? product.stock) === 0
                );
                const anyVariantLow = variants.some(
                  (v) =>
                    (v.stock ?? product.stock) > 0 &&
                    (v.stock ?? product.stock) <= 5
                );

                return (
                  <React.Fragment key={product.id}>
                    {/* Main Product Row */}
                    <tr
                      className={`cursor-pointer transition-colors ${
                        isExpanded ? 'bg-[#141414]' : 'hover:bg-[#111111]'
                      }`}
                      onClick={() => toggleExpand(product.id)}
                    >
                      {/* Expand Toggle */}
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(product.id);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-gold hover:bg-gold/10 transition-colors"
                          title={
                            isExpanded
                              ? 'Tutup tabel stok'
                              : 'Buka tabel stok per warna dan ukuran'
                          }
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90 text-gold' : ''
                            }`}
                          />
                        </button>
                      </td>

                      {/* Product Image & Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#181818] border border-[#262626] shrink-0">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-800" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white text-sm hover:text-gold transition-colors">
                                {product.name}
                              </p>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1e1e1e] border border-[#333] text-gray-300">
                                {variants.length} Warna • {productSizes.length} Ukuran
                              </span>
                            </div>
                            <p className="font-mono text-xs text-gray-500 mt-0.5">
                              {product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="capitalize text-xs text-gray-300 px-2 py-0.5 rounded bg-[#181818] border border-[#2a2a2a]">
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="font-medium text-white text-sm">
                        {formatPrice(product.price)}
                      </td>

                      {/* Total Stock */}
                      <td>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`font-mono text-base font-bold ${
                              isProductOut
                                ? 'text-rose-400'
                                : isProductCritical
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {product.stock}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            pcs
                          </span>
                        </div>
                      </td>

                      {/* Stock Health Badge */}
                      <td>
                        {isProductOut ? (
                          <Badge variant="error">Habis</Badge>
                        ) : anyVariantOut ? (
                          <Badge variant="error">Ada Warna Habis</Badge>
                        ) : isProductCritical ? (
                          <Badge variant="warning">Stok menipis</Badge>
                        ) : anyVariantLow ? (
                          <Badge variant="warning">Ada Warna Menipis</Badge>
                        ) : (
                          <Badge variant="success">Stok Aman</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(product.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-300 border border-[#2a2a2a] transition-all flex items-center gap-1"
                          >
                            <Palette className="w-3 h-3 text-gold" />
                            {isExpanded ? 'Tutup Tabel' : 'Buka Matriks Stok'}
                          </button>

                          <button
                            onClick={() => handleQuickAdd(product.id, 5)}
                            disabled={loadingId === product.id}
                            className="px-2 py-1 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-300 border border-[#2a2a2a] transition-all disabled:opacity-50"
                            title="Restock cepat +5 unit"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleQuickAdd(product.id, 10)}
                            disabled={loadingId === product.id}
                            className="px-2 py-1 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-300 border border-[#2a2a2a] transition-all disabled:opacity-50"
                            title="Restock cepat +10 unit"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Stock Table: Baris = Warna, Kolom = Ukuran (Requirement 9) */}
                    {isExpanded && (
                      <tr className="bg-[#0b0b0b] border-t-0">
                        <td colSpan={7} className="p-0">
                          <div className="p-4 mx-3 my-2 rounded-xl bg-[#121212] border border-[#262626] space-y-3.5 animate-fadeIn">
                            {/* Table Sub-Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#222] gap-2">
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-gold" />
                                <div>
                                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                                    Matriks Stok: Varian Warna & Ukuran — {product.name}
                                  </h4>
                                  <p className="text-[11px] text-gray-400">
                                    Ketik langsung di sel ukuran untuk mengubah stok fisik. Tekan Enter atau klik di luar sel untuk menyimpan.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  Total Stok Produk:
                                </span>
                                <span className="font-mono font-bold text-gold px-2.5 py-1 rounded bg-gold/10 border border-gold/30 text-xs">
                                  {product.stock} pcs
                                </span>
                              </div>
                            </div>

                            {/* Small Matrix Table */}
                            <div className="overflow-x-auto rounded-lg border border-[#222]">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-[#171717] text-gray-300 border-b border-[#262626]">
                                    <th className="py-2.5 px-3 text-left font-medium w-48">
                                      Varian Warna
                                    </th>
                                    {productSizes.map((sz) => (
                                      <th
                                        key={sz}
                                        className="py-2.5 px-3 text-center font-semibold text-gray-200 min-w-[90px]"
                                      >
                                        {sz}
                                      </th>
                                    ))}
                                    <th className="py-2.5 px-3 text-right font-semibold text-gold w-36">
                                      Total Warna
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e1e1e] bg-[#0f0f0f]">
                                  {variants.map((v, vIdx) => {
                                    const colorTotal = productSizes.reduce(
                                      (sum, sz) =>
                                        sum + (Number(v.sizeStock?.[sz]) || 0),
                                      0
                                    );

                                    return (
                                      <tr
                                        key={vIdx}
                                        className="hover:bg-[#141414] transition-colors"
                                      >
                                        {/* Color Info */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex items-center gap-2.5">
                                            <span
                                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                                              style={{
                                                backgroundColor:
                                                  v.hex || '#000000',
                                              }}
                                            />
                                            <div>
                                              <p className="font-semibold text-white text-xs">
                                                {v.name}
                                              </p>
                                              <span className="text-[10px] font-mono text-gray-500 uppercase">
                                                {v.hex || '#000000'}
                                              </span>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Editable Size Cells */}
                                        {productSizes.map((sz) => {
                                          const currentVal =
                                            v.sizeStock?.[sz] ?? 0;
                                          const cellKey = `${product.id}_${v.name}_${sz}`;
                                          const draftVal = draftInputs[cellKey];
                                          const displayedVal =
                                            draftVal !== undefined
                                              ? draftVal
                                              : String(currentVal);
                                          const isSaving =
                                            loadingCellKey === cellKey;

                                          const numericVal =
                                            draftVal !== undefined
                                              ? parseInt(draftVal, 10) || 0
                                              : currentVal;
                                          const isOutOfStock = numericVal === 0;
                                          const isLowStock =
                                            numericVal > 0 && numericVal <= 5;

                                          return (
                                            <td
                                              key={sz}
                                              className="py-2 px-2 text-center"
                                            >
                                              <div className="flex flex-col items-center justify-center">
                                                <div className="relative w-full max-w-[80px]">
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    inputMode="numeric"
                                                    value={displayedVal}
                                                    onChange={(e) => {
                                                      const raw = e.target.value;
                                                      setDraftInputs((prev) => ({
                                                        ...prev,
                                                        [cellKey]: raw,
                                                      }));
                                                    }}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        const targetStock =
                                                          Math.max(
                                                            0,
                                                            parseInt(
                                                              displayedVal || '0',
                                                              10
                                                            )
                                                          );
                                                        handleSaveSizeStock(
                                                          product.id,
                                                          v.name,
                                                          sz,
                                                          targetStock
                                                        );
                                                      }
                                                    }}
                                                    onBlur={() => {
                                                      if (
                                                        draftVal !== undefined
                                                      ) {
                                                        const targetStock =
                                                          Math.max(
                                                            0,
                                                            parseInt(
                                                              displayedVal || '0',
                                                              10
                                                            )
                                                          );
                                                        if (
                                                          targetStock !==
                                                          currentVal
                                                        ) {
                                                          handleSaveSizeStock(
                                                            product.id,
                                                            v.name,
                                                            sz,
                                                            targetStock
                                                          );
                                                        } else {
                                                          setDraftInputs(
                                                            (prev) => {
                                                              const copy = {
                                                                ...prev,
                                                              };
                                                              delete copy[
                                                                cellKey
                                                              ];
                                                              return copy;
                                                            }
                                                          );
                                                        }
                                                      }
                                                    }}
                                                    disabled={isSaving}
                                                    className={`w-full text-center text-xs font-mono py-1 px-1.5 h-8 rounded border transition-all ${
                                                      isOutOfStock
                                                        ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-bold focus:border-rose-400'
                                                        : isLowStock
                                                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold focus:border-amber-400'
                                                        : 'bg-[#181818] border-[#333] text-gray-100 hover:border-[#444] focus:border-gold'
                                                    } ${
                                                      isSaving
                                                        ? 'opacity-50 cursor-wait'
                                                        : ''
                                                    }`}
                                                    placeholder="0"
                                                  />
                                                </div>

                                                {/* Status indicator: Habis (0) or Menipis (<=5) */}
                                                {isOutOfStock ? (
                                                  <span className="text-[10px] font-bold text-rose-400 mt-1 uppercase tracking-tight">
                                                    Habis
                                                  </span>
                                                ) : isLowStock ? (
                                                  <span className="text-[10px] font-medium text-amber-400 mt-1">
                                                    Menipis
                                                  </span>
                                                ) : (
                                                  <span className="text-[10px] text-gray-500 mt-1 font-mono">
                                                    pcs
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          );
                                        })}

                                        {/* Total per warna */}
                                        <td className="py-2.5 px-3 text-right">
                                          <div className="flex flex-col items-end">
                                            <span
                                              className={`font-mono text-sm font-bold ${
                                                colorTotal === 0
                                                  ? 'text-rose-400'
                                                  : colorTotal <= 5
                                                  ? 'text-amber-400'
                                                  : 'text-gray-200'
                                              }`}
                                            >
                                              {colorTotal} pcs
                                            </span>
                                            {colorTotal === 0 ? (
                                              <span className="text-[10px] text-rose-400 font-semibold">
                                                Habis
                                              </span>
                                            ) : colorTotal <= 5 ? (
                                              <span className="text-[10px] text-amber-400">
                                                Stok Kritis
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-emerald-400">
                                                Aman
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>

                                {/* Footer Summary Row: Total per ukuran & Total per produk */}
                                <tfoot>
                                  <tr className="bg-[#141414] border-t-2 border-[#262626] text-gray-300 font-medium">
                                    <td className="py-2.5 px-3 font-semibold text-xs text-gray-300">
                                      Total per Ukuran
                                    </td>
                                    {productSizes.map((sz) => {
                                      const sizeTotal = variants.reduce(
                                        (sum, v) =>
                                          sum + (Number(v.sizeStock?.[sz]) || 0),
                                        0
                                      );
                                      return (
                                        <td
                                          key={sz}
                                          className="py-2.5 px-2 text-center font-mono font-bold text-xs"
                                        >
                                          <span
                                            className={
                                              sizeTotal === 0
                                                ? 'text-rose-400'
                                                : sizeTotal <= 5
                                                ? 'text-amber-400'
                                                : 'text-white'
                                            }
                                          >
                                            {sizeTotal}
                                          </span>
                                          <span className="text-[10px] text-gray-500 ml-0.5">
                                            pcs
                                          </span>
                                        </td>
                                      );
                                    })}
                                    <td className="py-2.5 px-3 text-right">
                                      <span className="text-xs text-gray-400 block">
                                        Total Produk:
                                      </span>
                                      <span className="font-mono font-bold text-gold text-sm">
                                        {product.stock} pcs
                                      </span>
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
