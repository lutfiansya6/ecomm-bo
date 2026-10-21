'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Product, ColorVariant, Category } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { Plus, Package, Sparkles, AlertCircle } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || undefined;
  const editParam = searchParams.get('edit') || undefined;
  const newParam = searchParams.get('new') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialCategory, setInitialCategory] = useState<string | undefined>(categoryParam);
  const { addToast } = useUIStore();

  const loadData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.products.list(),
        api.categories.list({ all: true }),
      ]);
      if (prodsRes.success && prodsRes.data?.products) {
        setProducts(prodsRes.data.products);
      }
      if (catsRes.success && catsRes.data) {
        setCategories(catsRes.data);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Koneksi Gagal',
        message: 'Tidak dapat mengambil data produk atau kategori dari backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL query parameters for auto-editing or adding
  useEffect(() => {
    if (!loading && products.length > 0 && editParam) {
      const found = products.find((p) => p.id === editParam || p.slug === editParam);
      if (found) {
        setEditingProduct(found);
        setIsModalOpen(true);
      }
    } else if (!loading && newParam) {
      setEditingProduct(null);
      setInitialCategory(categoryParam);
      setIsModalOpen(true);
    }
  }, [loading, products, editParam, newParam, categoryParam]);

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
          const updated = res.data;
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? updated : p))
          );
          setEditingProduct(null);
          addToast({
            type: 'success',
            title: 'Produk Diperbarui',
            message: `Data produk "${updated.name}" berhasil disimpan.`,
          });
        } else {
          throw new Error(res.error || 'Gagal memperbarui data produk.');
        }
      } else {
        const res = await api.products.create(data);
        if (res.success && res.data) {
          const created = res.data;
          setProducts((prev) => [created, ...prev]);
          setEditingProduct(null);
          addToast({
            type: 'success',
            title: 'Produk Ditambahkan',
            message: `Produk baru "${created.name}" berhasil dibuat.`,
          });
        } else {
          throw new Error(res.error || 'Gagal menambahkan produk.');
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: errMsg,
      });
      throw err;
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
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const sizes =
      product.sizes && product.sizes.length > 0 ? product.sizes : ['One Size'];
    const safeStock = Math.max(0, Math.floor(newStock));

    // Update sizeStock across colorVariants tanpa menyertakan field turunan stock
    let updatedVariants: ColorVariant[];
    if (product.colorVariants && product.colorVariants.length > 0) {
      const perVariant = Math.floor(safeStock / product.colorVariants.length);
      const variantRemainder = safeStock - perVariant * product.colorVariants.length;

      updatedVariants = product.colorVariants.map((cv, vIdx) => {
        const vTarget = vIdx === 0 ? perVariant + variantRemainder : perVariant;
        const perSize = Math.floor(vTarget / sizes.length);
        const sizeRemainder = vTarget - perSize * sizes.length;

        const sizeStock: Record<string, number> = {};
        sizes.forEach((sz, sIdx) => {
          sizeStock[sz] = sIdx === 0 ? perSize + sizeRemainder : perSize;
        });

        const { stock: _s, ...restCv } = cv;
        return {
          ...restCv,
          sizeStock,
        };
      });
    } else {
      const colors =
        product.colors && product.colors.length > 0 ? product.colors : ['Default'];
      const perColor = Math.floor(safeStock / colors.length);
      const colorRemainder = safeStock - perColor * colors.length;

      updatedVariants = colors.map((cName, cIdx) => {
        const cTarget = cIdx === 0 ? perColor + colorRemainder : perColor;
        const perSize = Math.floor(cTarget / sizes.length);
        const sizeRemainder = cTarget - perSize * sizes.length;

        const sizeStock: Record<string, number> = {};
        sizes.forEach((sz, sIdx) => {
          sizeStock[sz] = sIdx === 0 ? perSize + sizeRemainder : perSize;
        });

        return {
          name: cName,
          hex: '#000000',
          images: product.images || [],
          sizeStock,
        };
      });
    }

    try {
      const res = await api.products.update(id, {
        colorVariants: updatedVariants,
      });
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? res.data! : p))
        );
        addToast({
          type: 'success',
          title: 'Stok Diperbarui',
          message: `Stok untuk "${res.data.name}" diubah menjadi ${res.data.stock} unit.`,
        });
      } else {
        throw new Error(res.error || 'Gagal memperbarui jumlah stok di server.');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Gagal Update Stok',
        message: err instanceof Error ? err.message : 'Tidak dapat memperbarui jumlah stok di server.',
      });
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      const res = await api.products.update(product.id, {
        featured: !product.featured,
      });
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? res.data! : p))
        );
        addToast({
          type: 'info',
          title: 'Status Featured Diperbarui',
          message: `Produk "${product.name}" sekarang ${
            res.data.featured ? 'ditampilkan di beranda' : 'tidak lagi featured'
          }.`,
        });
      } else {
        throw new Error(res.error || 'Gagal mengubah status featured.');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Gagal Update Featured',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem.',
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
          categories={categories}
          initialCategoryFilter={categoryParam}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteProduct}
          onUpdateStock={handleUpdateStock}
          onToggleFeatured={handleToggleFeatured}
        />
      )}

      {/* Create / Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        initialCategory={initialCategory}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="card p-8 skeleton h-96" />}>
      <ProductsContent />
    </Suspense>
  );
}
