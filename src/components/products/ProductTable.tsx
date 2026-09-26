'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Product, ProductCategory } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  Edit2,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  Star,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onUpdateStock,
}: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Inline Stock Edit State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);

  // Filter products
  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;

      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock <= 5;
      else if (stockFilter === 'out') matchStock = p.stock === 0;
      else if (stockFilter === 'in_stock') matchStock = p.stock > 5;

      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      if (sortBy === 'rating') return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleStartEditStock = (p: Product) => {
    setEditingStockId(p.id);
    setTempStock(p.stock);
  };

  const handleSaveStock = async (id: string) => {
    setSavingStock(true);
    try {
      await onUpdateStock(id, tempStock);
      setEditingStockId(null);
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama produk, SKU, atau tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input select text-sm"
          >
            <option value="all">Semua Kategori</option>
            <option value="dress">Dress & Gown</option>
            <option value="blazer">Blazer</option>
            <option value="bag">Tas Mewah</option>
            <option value="shoes">Sepatu & Heels</option>
            <option value="coat">Mantel / Coat</option>
            <option value="accessories">Aksesoris</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div className="w-full md:w-44">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input select text-sm"
          >
            <option value="all">Semua Stok</option>
            <option value="in_stock">Tersedia (&gt;5)</option>
            <option value="low">Stok Rendah (≤5)</option>
            <option value="out">Habis (0)</option>
          </select>
        </div>

        {/* Sort */}
        <div className="w-full md:w-44">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input select text-sm"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga: Terendah</option>
            <option value="price_desc">Harga: Tertinggi</option>
            <option value="stock_asc">Stok: Sedikit</option>
            <option value="stock_desc">Stok: Banyak</option>
            <option value="rating">Rating Terbaik</option>
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
              <th>Harga</th>
              <th>Stok Tersedia</th>
              <th>Rating</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Tidak ada produk yang cocok dengan pencarian / filter.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id}>
                  {/* Product Info */}
                  <td>
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#181818] border border-[#2a2a2a] shrink-0">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                            No Pic
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{product.name}</p>
                          {product.featured && (
                            <span className="p-0.5 rounded bg-gold/20 text-gold" title="Featured Product">
                              <Sparkles className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-gray-400 mt-0.5">{product.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="capitalize px-2.5 py-1 rounded-md bg-[#181818] border border-[#2a2a2a] text-xs text-gray-300">
                      {product.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td>
                    <div className="font-semibold text-white">
                      {formatPrice(product.price)}
                    </div>
                    {product.comparePrice && (
                      <div className="text-[11px] text-gray-500 line-through">
                        {formatPrice(product.comparePrice)}
                      </div>
                    )}
                  </td>

                  {/* Stock with inline edit */}
                  <td>
                    {editingStockId === product.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tempStock}
                          onChange={(e) => setTempStock(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 text-xs bg-[#181818] border border-gold rounded text-white outline-none"
                          min={0}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveStock(product.id)}
                          disabled={savingStock}
                          className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          title="Simpan Stok"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStockId(null)}
                          className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditStock(product)}
                        className="cursor-pointer group flex items-center gap-1.5"
                        title="Klik untuk ubah stok cepat"
                      >
                        <span
                          className={`font-mono font-semibold text-sm ${
                            product.stock === 0
                              ? 'text-rose-400'
                              : product.stock <= 5
                              ? 'text-amber-400'
                              : 'text-gray-200'
                          }`}
                        >
                          {product.stock}
                        </span>
                        <Edit2 className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </td>

                  {/* Rating */}
                  <td>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span className="font-semibold text-white">{product.rating}</span>
                      <span className="text-gray-500 text-[11px]">({product.reviewCount})</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    {product.stock === 0 ? (
                      <Badge variant="error">Habis</Badge>
                    ) : product.stock <= 5 ? (
                      <Badge variant="warning">Kritis</Badge>
                    ) : (
                      <Badge variant="success">Tersedia</Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-400 border border-[#2a2a2a] transition-all"
                        title="Edit Produk"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 border border-[#2a2a2a] transition-all"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
