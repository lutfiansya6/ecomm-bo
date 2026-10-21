'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import type { Category, Product } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { formatPrice, getProductFallbackImage } from '@/lib/utils';
import {
  Package,
  PackageOpen,
  Edit2,
  ExternalLink,
  Plus,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface CategoryProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  allCategories: Category[];
  onMoveProduct: (
    productId: string,
    fromCategory: Category,
    targetCategory: Category
  ) => Promise<void>;
  onEditProduct: (product: Product) => void;
  onAddNewProduct: (category: Category) => void;
}

export function CategoryProductsModal({
  isOpen,
  onClose,
  category,
  allCategories,
  onMoveProduct,
  onEditProduct,
  onAddNewProduct,
}: CategoryProductsModalProps) {
  const router = useRouter();
  const { addToast } = useUIStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [movingProductId, setMovingProductId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!category) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // Filter by category slug, fallback to id if needed
      const res = await api.products.list({ category: category.slug });
      if (res.success && res.data?.products) {
        setProducts(res.data.products);
      } else {
        throw new Error(res.error || 'Gagal mengambil daftar produk dari backend');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat produk kategori';
      setErrorMsg(msg);
      addToast({
        type: 'error',
        title: 'Gagal Memuat Produk',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [category, addToast]);

  useEffect(() => {
    if (isOpen && category) {
      loadProducts();
    } else {
      setProducts([]);
      setErrorMsg('');
      setMovingProductId(null);
    }
  }, [isOpen, category, loadProducts]);

  if (!category) return null;

  // Other categories available to move products to
  const otherCategories = allCategories.filter((c) => c.id !== category.id);

  // Handle moving product to another category
  const handleSelectMove = async (product: Product, targetCatId: string) => {
    const targetCat = allCategories.find((c) => c.id === targetCatId);
    if (!targetCat) return;

    setMovingProductId(product.id);
    try {
      await onMoveProduct(product.id, category, targetCat);
      // Remove product from modal list immediately
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch {
      // Error is toasted in parent
    } finally {
      setMovingProductId(null);
    }
  };

  const handleOpenInCatalog = () => {
    onClose();
    router.push(`/products?category=${encodeURIComponent(category.slug)}`);
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={handleOpenInCatalog}
        className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-gray-300 hover:text-gold"
      >
        <ExternalLink className="w-3.5 h-3.5 text-gold" />
        <span>Lihat di Katalog</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        className="btn btn-primary btn-sm px-5"
      >
        Tutup
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Produk di kategori ${category.name}`}
      subtitle={`${products.length} produk terdaftar`}
      footer={footer}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 text-gold animate-spin" />
            <p className="text-xs text-gray-400">Memuat produk di kategori {category.name}...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-300">Gagal Mengambil Data Produk</p>
                <p className="text-xs text-rose-400/90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadProducts}
              className="btn btn-secondary btn-xs flex items-center gap-1 text-white shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMsg && products.length === 0 && (
          <div className="py-12 px-4 text-center rounded-2xl bg-[#141414] border border-[#222222] flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] flex items-center justify-center text-gray-500 mb-3.5">
              <PackageOpen className="w-7 h-7 text-gold/60" />
            </div>
            <h4 className="text-base font-semibold text-white font-serif mb-1">
              Belum ada produk di kategori ini
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mb-5 leading-relaxed">
              Kategori <strong className="text-gold font-medium">{category.name}</strong> saat ini belum
              memiliki produk terdaftar di etalase toko.
            </p>
            <button
              type="button"
              onClick={() => onAddNewProduct(category)}
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-gold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>
        )}

        {/* Products List */}
        {!loading && !errorMsg && products.length > 0 && (
          <div className="space-y-3">
            {products.map((product) => {
              const isMoving = movingProductId === product.id;
              const isOutOfStock = product.stock === 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;
              const primaryImage = product.images?.[0];

              return (
                <div
                  key={product.id}
                  className={`p-3.5 sm:p-4 rounded-xl bg-[#141414] border border-[#242424] hover:border-[#383838] transition-all flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 ${
                    isMoving ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  {/* Top / Main Section (Area 1, 2, and 3) */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Area 1: Foto kecil (lebar tetap, tidak menyusut) */}
                    <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-[#1c1c1c] border border-[#2a2a2a] shrink-0">
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

                    {/* Area 2: Info produk (area yang melebar, dengan min-w-0) */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Baris 1: Nama produk (bisa turun ke 2 baris, jangan dipotong jika masih muat) + ikon Featured */}
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-white text-sm leading-snug line-clamp-2 break-words">
                          {product.name}
                        </span>
                        {product.featured && (
                          <span
                            className="p-0.5 rounded bg-gold/15 text-gold shrink-0 mt-0.5"
                            title="Produk Featured di Beranda"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      {/* Baris 2: SKU */}
                      <p className="font-mono text-xs text-gray-400">
                        SKU: {product.id}
                      </p>

                      {/* Baris 3: Harga jual dan harga coret di sebelahnya */}
                      <div className="flex items-baseline gap-2 whitespace-nowrap pt-0.5">
                        <span className="text-sm font-semibold text-gold font-mono whitespace-nowrap">
                          {formatPrice(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-xs text-gray-500 line-through font-mono whitespace-nowrap">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Area 3: Stok dan status (lebar tetap, rata kanan, ditumpuk vertikal) */}
                    <div className="w-28 sm:w-32 shrink-0 flex flex-col items-end justify-center gap-1.5 text-right self-center">
                      {/* Badge Stok (di atas) */}
                      <div className="whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono whitespace-nowrap">
                            Habis (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono whitespace-nowrap">
                            Menipis ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#1e1e1e] border border-[#2e2e2e] text-gray-200 font-mono whitespace-nowrap">
                            {product.stock} pcs
                          </span>
                        )}
                      </div>

                      {/* Badge Status (di bawahnya) */}
                      <div className="whitespace-nowrap">
                        {product.stock > 0 ? (
                          <Badge variant="success">Tersedia</Badge>
                        ) : (
                          <Badge variant="error">Habis</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Area 4: Aksi (lebar tetap di desktop, baris sendiri penuh di mobile < 640px) */}
                  <div className="w-full sm:w-40 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#222222] flex flex-row sm:flex-col gap-2 justify-center sm:self-center">
                    {/* Tombol Ubah */}
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="btn btn-secondary btn-xs flex-1 sm:w-full flex items-center justify-center gap-1.5 text-xs text-gray-200 hover:text-white"
                      title="Ubah data produk"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>Ubah</span>
                    </button>

                    {/* Menu Pindah kategori */}
                    <div className="relative flex-1 sm:w-full">
                      <select
                        value=""
                        disabled={isMoving || otherCategories.length === 0}
                        onChange={(e) => handleSelectMove(product, e.target.value)}
                        className="w-full bg-[#181818] hover:bg-[#222222] border border-[#2c2c2c] hover:border-gold/50 text-xs text-gray-300 hover:text-white rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold truncate"
                        title="Pindahkan produk ke kategori lain"
                      >
                        <option value="" disabled>
                          {isMoving ? 'Memindahkan...' : 'Pindah kategori...'}
                        </option>
                        {otherCategories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#141414] text-white">
                            Pindah ke: {c.name} {!c.active ? '(disembunyikan)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
