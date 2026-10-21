'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { NavigationItem, Category, Product } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { NavbarPreview } from '@/components/navigation/NavbarPreview';
import { NavigationTable } from '@/components/navigation/NavigationTable';
import { NavigationFormModal } from '@/components/navigation/NavigationFormModal';
import { NavigationProductPickerModal } from '@/components/navigation/NavigationProductPickerModal';
import { DeleteNavigationModal } from '@/components/navigation/DeleteNavigationModal';
import {
  Compass,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';

export default function NavigationPage() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Form Modal State (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);

  // Product Picker Modal State (Manage products for a menu)
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [managingProductsItem, setManagingProductsItem] = useState<NavigationItem | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<NavigationItem | null>(null);

  const { addToast } = useUIStore();

  // Load Navigation Items, Categories, and Products
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [navRes, catRes, prodRes] = await Promise.all([
        api.navigation.list(),
        api.categories.list({ all: true }),
        api.products.list(),
      ]);

      if (navRes.success && Array.isArray(navRes.data)) {
        setItems(navRes.data.sort((a, b) => a.order - b.order));
      } else {
        throw new Error(navRes.error || 'Gagal memuat data menu navbar');
      }

      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }

      if (prodRes.success && Array.isArray(prodRes.data?.products)) {
        setProducts(prodRes.data.products);
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Koneksi Gagal',
        message: err instanceof Error ? err.message : 'Tidak dapat memuat data navigasi dari server.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  // Open Manage Products Modal
  const handleOpenManageProducts = (item: NavigationItem) => {
    setManagingProductsItem(item);
    setIsProductPickerOpen(true);
  };

  // Save (Create or Update) Navigation Item
  const handleSaveItem = async (data: {
    label: string;
    label_en?: string;
    label_id?: string;
    accent: boolean;
    active: boolean;
    productIds?: string[];
  }) => {
    try {
      if (editingItem) {
        const res = await api.navigation.update(editingItem.id, data);
        if (res.success && res.data) {
          const updated = res.data;
          setItems((prev) =>
            prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
          );
          addToast({
            type: 'success',
            title: 'Menu Diperbarui',
            message: `Menu navbar "${updated.label}" berhasil disimpan.`,
          });
          loadData(true);
        } else {
          throw new Error(res.error || 'Gagal memperbarui menu navbar');
        }
      } else {
        const res = await api.navigation.create({
          ...data,
          order: items.length + 1,
        });
        if (res.success && res.data) {
          addToast({
            type: 'success',
            title: 'Menu Ditambahkan',
            message: `Menu navbar "${res.data.label}" berhasil dibuat.`,
          });
          loadData(true);
        } else {
          throw new Error(res.error || 'Gagal membuat menu navbar');
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

  // Toggle Active / Inactive
  const handleToggleActive = async (item: NavigationItem) => {
    const nextStatus = !item.active;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, active: nextStatus } : i))
    );

    try {
      const res = await api.navigation.update(item.id, { active: nextStatus });
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Status Menu Diubah',
          message: `Menu "${item.label}" ${
            nextStatus ? 'sekarang ditampilkan di navbar' : 'telah disembunyikan dari navbar'
          }.`,
        });
      } else {
        throw new Error(res.error || 'Gagal mengubah status menu');
      }
    } catch (err: unknown) {
      // Revert optimistic update on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i))
      );
      addToast({
        type: 'error',
        title: 'Gagal Mengubah Status',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem',
      });
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (item: NavigationItem) => {
    if (item.system) {
      addToast({
        type: 'warning',
        title: 'Menu Sistem',
        message: 'Menu sistem tidak bisa dihapus, hanya bisa disembunyikan.',
      });
      return;
    }
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async (id: string) => {
    try {
      const res = await api.navigation.delete(id);
      if (res.success) {
        const deletedItem = items.find((i) => i.id === id);
        addToast({
          type: 'info',
          title: 'Menu Dihapus',
          message: `Menu navbar "${deletedItem?.label || id}" berhasil dihapus.`,
        });
        loadData(true);
      } else {
        throw new Error(res.error || 'Gagal menghapus menu');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus menu navbar';
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: errMsg,
      });
      throw err;
    }
  };

  // Reorder Navigation Items (via Up/Down or Drag & Drop)
  const handleReorder = async (newOrderedIds: string[]) => {
    if (isReordering) return;

    const previousItems = [...items];

    // Optimistic reorder
    const reorderedList = newOrderedIds
      .map((id, index) => {
        const found = items.find((i) => i.id === id);
        return found ? { ...found, order: index + 1 } : null;
      })
      .filter((i): i is NavigationItem => i !== null);

    setItems(reorderedList);
    setIsReordering(true);

    try {
      const res = await api.navigation.reorder(newOrderedIds);
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data.sort((a, b) => a.order - b.order));
        addToast({
          type: 'success',
          title: 'Urutan Disimpan',
          message: 'Urutan menu navbar berhasil diperbarui dan diterapkan ke etalase toko.',
        });
      } else {
        throw new Error(res.error || 'Gagal menyimpan urutan baru');
      }
    } catch (err: unknown) {
      // Revert rollback
      setItems(previousItems);
      addToast({
        type: 'error',
        title: 'Gagal Mengubah Urutan',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan urutan.',
      });
    } finally {
      setIsReordering(false);
    }
  };

  // Quick statistics
  const activeCount = items.filter((i) => i.active).length;
  const hiddenCount = items.filter((i) => !i.active).length;
  const totalAssignedProducts = items.reduce(
    (sum, i) => sum + (i.productCount ?? i.productIds?.length ?? 0),
    0
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif text-white font-medium">Menu Navbar</h2>
            <span className="text-xs text-gold font-mono font-bold px-2 py-0.5 rounded bg-gold/10 border border-gold/30">
              Manual Storefront Navigation
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Atur hierarki dan urutan menu header toko serta pilih produk yang tampil untuk tiap menu secara manual
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="btn btn-secondary btn-sm"
            title="Segarkan data navigasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan
          </button>

          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            + Tambah Menu
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold/20 text-gold border border-gold/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{items.length}</p>
            <p className="text-[11px] text-gray-400">Total Menu</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{activeCount}</p>
            <p className="text-[11px] text-gray-400">Tampil di Navbar</p>
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
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Package className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{totalAssignedProducts}</p>
            <p className="text-[11px] text-gray-400">Produk Ditautkan</p>
          </div>
        </div>
      </div>

      {/* Navbar Live Preview Panel (Label saja, tanpa panah dropdown) */}
      <NavbarPreview items={items} />

      {/* Navigation Items Table */}
      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <NavigationTable
          items={items}
          categories={categories}
          onEdit={handleOpenEdit}
          onManageProducts={handleOpenManageProducts}
          onToggleActive={handleToggleActive}
          onDelete={handleOpenDelete}
          onReorder={handleReorder}
          isReordering={isReordering}
        />
      )}

      {/* Create / Edit Navigation Item Modal */}
      <NavigationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
        existingItems={items}
        allProducts={products}
        categories={categories}
      />

      {/* Manage Products Picker Modal for a Menu */}
      <NavigationProductPickerModal
        isOpen={isProductPickerOpen}
        onClose={() => {
          setIsProductPickerOpen(false);
          setManagingProductsItem(null);
        }}
        item={managingProductsItem}
        allProducts={products}
        categories={categories}
        onSaved={() => {
          loadData(true);
        }}
      />

      {/* Delete Navigation Item Modal */}
      <DeleteNavigationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        item={deletingItem}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
