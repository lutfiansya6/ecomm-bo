'use client';

import React, { useState, useEffect } from 'react';
import type { Product, ColorVariant } from '@/types';
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

    const sizes =
      product.sizes && product.sizes.length > 0 ? product.sizes : ['Standard'];

    let updatedVariants: ColorVariant[] | undefined;
    if (product.colorVariants && product.colorVariants.length > 0) {
      updatedVariants = product.colorVariants.map((cv, idx) => {
        const { stock: _s, ...restCv } = cv;
        if (idx === 0) {
          const sizeStock = { ...(cv.sizeStock || {}) };
          const firstSize = sizes[0];
          sizeStock[firstSize] = (Number(sizeStock[firstSize]) || 0) + additionalStock;
          return {
            ...restCv,
            sizeStock,
          };
        }
        return {
          ...restCv,
        };
      });
    }

    try {
      const res = await api.products.update(id, {
        ...(updatedVariants ? { colorVariants: updatedVariants } : {}),
      });
      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? res.data! : p))
        );
        addToast({
          type: 'success',
          title: 'Restock Berhasil',
          message: `Stok "${product.name}" ditambah ${additionalStock} unit. Total sekarang: ${res.data.stock} unit.`,
        });
      } else {
        throw new Error(res.error || 'Gagal menambah stok di server.');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Restock Gagal',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan saat menambah stok.',
      });
    }
  };

  const handleUpdateSizeStock = async (
    productId: string,
    colorName: string,
    sizeName: string,
    newStock: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const safeStock = Math.max(0, Math.floor(newStock));
    const sizes =
      product.sizes && product.sizes.length > 0 ? product.sizes : ['Standard'];

    let updatedVariants: ColorVariant[];

    if (product.colorVariants && product.colorVariants.length > 0) {
      updatedVariants = product.colorVariants.map((cv) => {
        const sizeStock = { ...(cv.sizeStock || {}) };
        sizes.forEach((sz) => {
          if (typeof sizeStock[sz] !== 'number') {
            sizeStock[sz] = Math.floor((cv.stock || 0) / sizes.length);
          }
        });

        if (cv.name.toLowerCase() === colorName.toLowerCase()) {
          sizeStock[sizeName] = safeStock;
        }

        const { stock: _s, ...restCv } = cv;
        return {
          ...restCv,
          sizeStock,
        };
      });
    } else {
      const baseColors =
        product.colors && product.colors.length > 0 ? product.colors : ['Default'];
      const perColor = Math.floor((product.stock || 0) / baseColors.length);

      updatedVariants = baseColors.map((cName) => {
        const sizeStock: Record<string, number> = {};
        sizes.forEach((sz) => {
          sizeStock[sz] = Math.floor(perColor / sizes.length);
        });

        if (cName.toLowerCase() === colorName.toLowerCase()) {
          sizeStock[sizeName] = safeStock;
        }

        return {
          name: cName,
          hex: '#000000',
          images: product.images || [],
          sizeStock,
        };
      });
    }

    try {
      const res = await api.products.update(productId, {
        colorVariants: updatedVariants,
      });

      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? res.data! : p))
        );
        addToast({
          type: 'success',
          title: 'Stok Ukuran Diperbarui',
          message: `Stok "${product.name}" [${colorName} - ${sizeName}] berhasil diubah menjadi ${safeStock} pcs. Total: ${res.data.stock} pcs.`,
        });
      } else {
        throw new Error(res.error || 'Gagal menyimpan perubahan stok ukuran');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Pembaruan Gagal',
        message:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memperbarui stok ukuran.',
      });
      throw err;
    }
  };

  const handleUpdateColorStock = async (
    productId: string,
    colorName: string,
    newStock: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const safeStock = Math.max(0, Math.floor(newStock));
    const sizes =
      product.sizes && product.sizes.length > 0 ? product.sizes : ['Standard'];

    let updatedVariants: ColorVariant[];
    if (product.colorVariants && product.colorVariants.length > 0) {
      updatedVariants = product.colorVariants.map((cv) => {
        const { stock: _s, ...restCv } = cv;
        if (cv.name.toLowerCase() === colorName.toLowerCase()) {
          const sizeStock: Record<string, number> = {};
          const perSize = Math.floor(safeStock / sizes.length);
          const remainder = safeStock - perSize * sizes.length;
          sizes.forEach((sz, sIdx) => {
            sizeStock[sz] = sIdx === 0 ? perSize + remainder : perSize;
          });
          return { ...restCv, sizeStock };
        }
        return { ...restCv };
      });
    } else {
      const baseColors =
        product.colors && product.colors.length > 0 ? product.colors : ['Default'];
      updatedVariants = baseColors.map((cName) => {
        const sizeStock: Record<string, number> = {};
        const target =
          cName.toLowerCase() === colorName.toLowerCase()
            ? safeStock
            : product.stock || 0;
        const perSize = Math.floor(target / sizes.length);
        const remainder = target - perSize * sizes.length;
        sizes.forEach((sz, sIdx) => {
          sizeStock[sz] = sIdx === 0 ? perSize + remainder : perSize;
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
      const res = await api.products.update(productId, {
        colorVariants: updatedVariants,
      });

      if (res.success && res.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? res.data! : p))
        );
        addToast({
          type: 'success',
          title: 'Stok Warna Diperbarui',
          message: `Stok warna "${colorName}" untuk "${product.name}" berhasil diubah menjadi ${safeStock} unit. Total stok produk: ${res.data.stock} unit.`,
        });
      } else {
        throw new Error(res.error || 'Gagal menyimpan perubahan stok');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Pembaruan Gagal',
        message:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memperbarui stok warna.',
      });
      throw err;
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
          Pantau status stok kritis, kelola restock cepat per varian busana dan ukuran, serta minimalkan stockout
        </p>
      </div>

      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <InventoryTable
          products={products}
          onRestock={handleRestock}
          onUpdateColorStock={handleUpdateColorStock}
          onUpdateSizeStock={handleUpdateSizeStock}
        />
      )}
    </div>
  );
}
