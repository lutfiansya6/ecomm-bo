'use client';

import React, { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { InventoryTable } from '@/components/inventory/InventoryTable';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUIStore();

  const loadProducts = async () => {
    try {
      const res = await api.products.list();
      if (res.success && res.data?.products) {
        setProducts(res.data.products);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Koneksi Gagal',
        message: 'Tidak dapat mengambil data inventaris.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRestock = async (id: string, additionalStock: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const newStock = product.stock + additionalStock;
    try {
      const res = await api.products.update(id, { stock: newStock });
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
        );
        addToast({
          type: 'success',
          title: 'Restock Berhasil',
          message: `Stok "${product.name}" ditambah ${additionalStock} unit. Total sekarang: ${newStock} unit.`,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Restock Gagal',
        message: 'Terjadi kesalahan saat menambah stok.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif text-white font-medium">
          Inventaris & Pengawasan Stok Fisik
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Pantau status stok kritis, kelola restock cepat per varian busana, dan minimalkan stockout
        </p>
      </div>

      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <InventoryTable products={products} onRestock={handleRestock} />
      )}
    </div>
  );
}
