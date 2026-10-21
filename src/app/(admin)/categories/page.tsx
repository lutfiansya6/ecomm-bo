'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Category, Product } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { CategoryTable } from '@/components/categories/CategoryTable';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { DeleteCategoryModal } from '@/components/categories/DeleteCategoryModal';
import { CategoryProductsModal } from '@/components/categories/CategoryProductsModal';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import {
  Plus,
  FolderTree,
  Eye,
  EyeOff,
  Package,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Category Form Modal State (Add/Edit Category)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete Category Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Category Products Modal State (view products in category)
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<Category | null>(null);

  // Product Form Modal State (for quick edits or creating product directly from category modal)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialProductCategory, setInitialProductCategory] = useState<string | undefined>(undefined);

  const { addToast } = useUIStore();

  const loadCategories = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.categories.list({ all: true });
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        throw new Error(res.error || 'Gagal mengambil data kategori');
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Koneksi Gagal',
        message: err instanceof Error ? err.message : 'Tidak dapat memuat data kategori dari server.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  // Save (Create or Update) Category
  const handleSaveCategory = async (data: {
    name: string;
    slug: string;
    active: boolean;
    label_en?: string;
    label_id?: string;
  }) => {
    try {
      if (editingCategory) {
        const res = await api.categories.update(editingCategory.id, data);
        if (res.success && res.data) {
          const updated = res.data;
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c))
          );
          addToast({
            type: 'success',
            title: 'Kategori Diperbarui',
            message: `Kategori "${updated.name}" berhasil disimpan.`,
          });
          loadCategories(true);
        } else {
          throw new Error(res.error || 'Gagal memperbarui kategori');
        }
      } else {
        const res = await api.categories.create(data);
        if (res.success && res.data) {
          addToast({
            type: 'success',
            title: 'Kategori Ditambahkan',
            message: `Kategori "${res.data.name}" berhasil dibuat.`,
          });
          loadCategories(true);
        } else {
          throw new Error(res.error || 'Gagal membuat kategori');
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: errMsg,
      });
      throw err;
    }
  };

  // Toggle Active/Inactive Status directly
  const handleToggleActive = async (category: Category) => {
    const nextStatus = !category.active;

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, active: nextStatus } : c))
    );

    try {
      const res = await api.categories.update(category.id, { active: nextStatus });
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Status Kategori Diubah',
          message: `Kategori "${category.name}" ${
            nextStatus ? 'sekarang ditampilkan di toko' : 'telah disembunyikan dari toko'
          }.`,
        });
      } else {
        throw new Error(res.error || 'Gagal mengubah status kategori');
      }
    } catch (err: unknown) {
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, active: category.active } : c))
      );
      addToast({
        type: 'error',
        title: 'Gagal Mengubah Status',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem',
      });
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (category: Category) => {
    if (categories.length <= 1) {
      addToast({
        type: 'warning',
        title: 'Tidak Dapat Dihapus',
        message: 'Kategori terakhir tidak boleh dihapus.',
      });
      return;
    }
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete (with optional moveTo target category)
  const handleConfirmDelete = async (categoryId: string, moveToId?: string) => {
    try {
      const res = await api.categories.delete(categoryId, moveToId);
      if (res.success) {
        const deletedCat = categories.find((c) => c.id === categoryId);
        addToast({
          type: 'info',
          title: 'Kategori Dihapus',
          message: moveToId
            ? `Kategori "${deletedCat?.name}" dihapus. Produk berhasil dipindahkan ke kategori tujuan.`
            : `Kategori "${deletedCat?.name}" berhasil dihapus.`,
        });
        loadCategories(true);
      } else {
        throw new Error(res.error || 'Gagal menghapus kategori');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus kategori';
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: errMsg,
      });
      throw err;
    }
  };

  // Reorder Categories (via Drag or Naik/Turun)
  const handleReorder = async (newOrderedIds: string[]) => {
    if (isReordering) return;

    // Keep backup for rollback
    const previousCategories = [...categories];

    // Optimistically reorder in UI
    const reorderedList = newOrderedIds
      .map((id, index) => {
        const found = categories.find((c) => c.id === id);
        return found ? { ...found, order: index + 1 } : null;
      })
      .filter((c): c is Category => c !== null);

    setCategories(reorderedList);
    setIsReordering(true);

    try {
      const res = await api.categories.reorder(newOrderedIds);
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
        addToast({
          type: 'success',
          title: 'Urutan Disimpan',
          message: 'Urutan kategori berhasil diperbarui dan diterapkan ke filter toko.',
        });
      } else {
        throw new Error(res.error || 'Gagal menyimpan urutan baru');
      }
    } catch (err: unknown) {
      // Rollback to previous order
      setCategories(previousCategories);
      addToast({
        type: 'error',
        title: 'Gagal Mengubah Urutan',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan urutan.',
      });
    } finally {
      setIsReordering(false);
    }
  };

  // Open products in category modal
  const handleOpenProducts = (category: Category) => {
    setSelectedCategoryForProducts(category);
    setIsProductsModalOpen(true);
  };

  // Move product from one category to another
  const handleMoveProduct = async (
    productId: string,
    fromCategory: Category,
    targetCategory: Category
  ) => {
    try {
      const res = await api.products.update(productId, {
        categoryId: targetCategory.id,
        category: targetCategory.slug,
      });

      if (res.success) {
        // Update product count in local categories state without page reload
        setCategories((prev) =>
          prev.map((c) => {
            if (c.id === fromCategory.id) {
              return { ...c, productCount: Math.max(0, (c.productCount ?? 0) - 1) };
            }
            if (c.id === targetCategory.id) {
              return { ...c, productCount: (c.productCount ?? 0) + 1 };
            }
            return c;
          })
        );

        // Update selectedCategoryForProducts count
        setSelectedCategoryForProducts((prev) =>
          prev && prev.id === fromCategory.id
            ? { ...prev, productCount: Math.max(0, (prev.productCount ?? 0) - 1) }
            : prev
        );

        addToast({
          type: 'success',
          title: 'Produk Dipindahkan',
          message: `Produk berhasil dipindahkan ke kategori "${targetCategory.name}".`,
        });
      } else {
        throw new Error(res.error || 'Gagal memindahkan produk ke kategori baru');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memindahkan produk.';
      addToast({
        type: 'error',
        title: 'Gagal Memindahkan Produk',
        message: msg,
      });
      throw err;
    }
  };

  // Edit product from category products modal
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setInitialProductCategory(undefined);
    setIsProductModalOpen(true);
  };

  // Add new product with specific category pre-selected
  const handleAddNewProduct = (category: Category) => {
    setEditingProduct(null);
    setInitialProductCategory(category.slug);
    setIsProductModalOpen(true);
  };

  // Save product from ProductFormModal
  const handleSaveProduct = async (data: Partial<Product>) => {
    try {
      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, data);
        if (res.success && res.data) {
          addToast({
            type: 'success',
            title: 'Produk Diperbarui',
            message: `Data produk "${res.data.name}" berhasil disimpan.`,
          });
          loadCategories(true);
          // If the products modal is open for a category, refresh it
          if (selectedCategoryForProducts) {
            setSelectedCategoryForProducts({ ...selectedCategoryForProducts });
          }
        } else {
          throw new Error(res.error || 'Gagal memperbarui data produk');
        }
      } else {
        const res = await api.products.create(data);
        if (res.success && res.data) {
          addToast({
            type: 'success',
            title: 'Produk Ditambahkan',
            message: `Produk baru "${res.data.name}" berhasil dibuat.`,
          });
          loadCategories(true);
          if (selectedCategoryForProducts) {
            setSelectedCategoryForProducts({
              ...selectedCategoryForProducts,
              productCount: (selectedCategoryForProducts.productCount ?? 0) + 1,
            });
          }
        } else {
          throw new Error(res.error || 'Gagal menambahkan produk baru');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      addToast({
        type: 'error',
        title: 'Gagal Menyimpan Produk',
        message: msg,
      });
      throw err;
    }
  };

  // Quick statistics
  const activeCount = categories.filter((c) => c.active).length;
  const hiddenCount = categories.filter((c) => !c.active).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif text-white font-medium">Kategori</h2>
            <span className="text-xs text-gold font-mono font-bold px-2 py-0.5 rounded bg-gold/10 border border-gold/30">
              Taxonomy
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Kelola hierarki produk busana, status tampil di etalase toko, dan urutan filter
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="btn btn-secondary btn-sm"
            title="Segarkan data kategori"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan
          </button>

          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            + Tambah Kategori
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold/20 text-gold border border-gold/30">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{categories.length}</p>
            <p className="text-[11px] text-gray-400">Total Kategori</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{activeCount}</p>
            <p className="text-[11px] text-gray-400">Tampil di Toko</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-700/30 text-zinc-300 border border-zinc-600/30">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{hiddenCount}</p>
            <p className="text-[11px] text-gray-400">Disembunyikan</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{totalProducts}</p>
            <p className="text-[11px] text-gray-400">Produk Terkategori</p>
          </div>
        </div>
      </div>

      {/* Main Categories Table or Loading */}
      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <CategoryTable
          categories={categories}
          onEdit={handleOpenEdit}
          onToggleActive={handleToggleActive}
          onDelete={handleOpenDelete}
          onReorder={handleReorder}
          onOpenProducts={handleOpenProducts}
          isReordering={isReordering}
        />
      )}

      {/* Create / Edit Category Modal */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
        existingCategories={categories}
      />

      {/* Delete / Move Products Modal */}
      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        category={deletingCategory}
        otherCategories={categories.filter((c) => c.id !== deletingCategory?.id)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Category Products Modal (List products in category) */}
      <CategoryProductsModal
        isOpen={isProductsModalOpen}
        onClose={() => setIsProductsModalOpen(false)}
        category={selectedCategoryForProducts}
        allCategories={categories}
        onMoveProduct={handleMoveProduct}
        onEditProduct={handleEditProduct}
        onAddNewProduct={handleAddNewProduct}
      />

      {/* Product Form Modal (For editing or creating product from within category modal) */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        categories={categories}
        initialCategory={initialProductCategory}
      />
    </div>
  );
}
