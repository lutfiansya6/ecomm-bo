'use client';

import React, { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { Plus, Package, Sparkles, AlertCircle } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
        message: 'Tidak dapat mengambil katalog produk dari backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, data);
        if (res.success && res.data) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? res.data! : p))
          );
          addToast({
            type: 'success',
            title: 'Produk Diperbarui',
            message: `Data produk "${res.data.name}" berhasil disimpan.`,
          });
        } else {
          throw new Error(res.error || 'Gagal memperbarui');
        }
      } else {
        const res = await api.products.create(data);
        if (res.success && res.data) {
          setProducts((prev) => [res.data!, ...prev]);
          addToast({
            type: 'success',
            title: 'Produk Ditambahkan',
            message: `Produk baru "${res.data.name}" berhasil dibuat.`,
          });
        } else {
          throw new Error(res.error || 'Gagal menambahkan');
        }
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem.',
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!window.confirm(`Yakin ingin menghapus produk "${product?.name || id}"?`)) {
      return;
    }

    try {
      const res = await api.products.delete(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        addToast({
          type: 'info',
          title: 'Produk Dihapus',
          message: `Produk telah berhasil dihapus dari katalog.`,
        });
      } else {
        throw new Error(res.error || 'Gagal menghapus');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem.',
      });
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const res = await api.products.update(id, { stock: newStock });
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
        );
        addToast({
          type: 'success',
          title: 'Stok Diperbarui',
          message: `Stok untuk "${res.data.name}" diubah menjadi ${newStock} unit.`,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Gagal Update Stok',
        message: 'Tidak dapat memperbarui jumlah stok di server.',
      });
    }
  };

  const featuredCount = products.filter((p) => p.featured).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white font-medium">
            Katalog & Manajemen Produk
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Total {products.length} SKU busana haute couture aktif di etalase
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary btn-sm self-start sm:self-auto">
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Produk Baru
        </button>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold/20 text-gold border border-gold/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{products.length}</p>
            <p className="text-[11px] text-gray-400">Total Model Produk</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{featuredCount}</p>
            <p className="text-[11px] text-gray-400">Featured di Beranda</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">
              {products.filter((p) => p.stock > 5).length}
            </p>
            <p className="text-[11px] text-gray-400">Stok Siap Kirim</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{outOfStockCount}</p>
            <p className="text-[11px] text-gray-400">Habis Terjual</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <ProductTable
          products={products}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteProduct}
          onUpdateStock={handleUpdateStock}
        />
      )}

      {/* Create / Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </div>
  );
}
