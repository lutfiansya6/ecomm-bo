'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Search, AlertTriangle, CheckCircle2, XCircle, Plus, RefreshCw } from 'lucide-react';

interface InventoryTableProps {
  products: Product[];
  onRestock: (id: string, additionalStock: number) => Promise<void>;
}

export function InventoryTable({ products, onRestock }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'healthy'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    let matchMode = true;
    if (filterMode === 'critical') matchMode = p.stock <= 5;
    else if (filterMode === 'healthy') matchMode = p.stock > 5;

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

  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const criticalCount = products.filter((p) => p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-gray-400">Total Unit Fisik</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
              SKU
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalStockCount} Unit</p>
          <p className="text-xs text-gray-400 mt-1">Terbagi dalam {products.length} model busana</p>
        </div>

        <div className="card p-5 border-amber-500/30 bg-[#17130a]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-amber-400">Stok Kritis (≤5)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2">{criticalCount} Model</p>
          <p className="text-xs text-amber-200/60 mt-1">Memerlukan pengadaan restock segera</p>
        </div>

        <div className="card p-5 border-rose-500/30 bg-[#170a0c]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-rose-400">Habis Terjual (0)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-300 mt-2">{outOfStockCount} Model</p>
          <p className="text-xs text-rose-200/60 mt-1">Tidak dapat dipesan oleh pelanggan</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari inventaris berdasarkan nama barang atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'critical' | 'healthy')}
            className="input select text-sm"
          >
            <option value="all">Semua Status Stok</option>
            <option value="critical">Stok Kritis Saja (≤5)</option>
            <option value="healthy">Stok Aman (&gt;5)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Produk & SKU</th>
              <th>Kategori</th>
              <th>Harga Jual</th>
              <th>Stok Tersedia</th>
              <th>Tingkat Kesehatan Stok</th>
              <th className="text-right">Aksi Cepat Restock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  Tidak ada data inventaris yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const isCritical = product.stock <= 5;
                const isOut = product.stock === 0;

                return (
                  <tr key={product.id}>
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
                          <p className="font-semibold text-white text-sm">{product.name}</p>
                          <p className="font-mono text-xs text-gray-500">{product.id}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="capitalize text-xs text-gray-300 px-2 py-0.5 rounded bg-[#181818] border border-[#2a2a2a]">
                        {product.category}
                      </span>
                    </td>

                    <td className="font-medium text-white text-sm">
                      {formatPrice(product.price)}
                    </td>

                    <td>
                      <span
                        className={`font-mono text-base font-bold ${
                          isOut
                            ? 'text-rose-400'
                            : isCritical
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {product.stock} pcs
                      </span>
                    </td>

                    <td>
                      {isOut ? (
                        <Badge variant="error">Stok Habis</Badge>
                      ) : isCritical ? (
                        <Badge variant="warning">Peringatan Kritis</Badge>
                      ) : (
                        <Badge variant="success">Stok Melimpah</Badge>
                      )}
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickAdd(product.id, 5)}
                          disabled={loadingId === product.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-300 border border-[#2a2a2a] transition-all disabled:opacity-50"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleQuickAdd(product.id, 10)}
                          disabled={loadingId === product.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-300 border border-[#2a2a2a] transition-all disabled:opacity-50"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleQuickAdd(product.id, 25)}
                          disabled={loadingId === product.id}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-300 border border-[#2a2a2a] transition-all disabled:opacity-50"
                        >
                          +25
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
  );
}
