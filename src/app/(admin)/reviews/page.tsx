'use client';

import React, { useState, useEffect } from 'react';
import type { Review } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { ReviewTable } from '@/components/reviews/ReviewTable';
import { Modal } from '@/components/ui/Modal';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useUIStore();

  useEffect(() => {
    const load = async () => {
      try {
        const [reviewsRes, productsRes] = await Promise.all([
          api.reviews.list(),
          api.products.list(),
        ]);
        if (reviewsRes.success && reviewsRes.data) {
          setReviews(reviewsRes.data);
        } else {
          addToast({
            type: 'error',
            title: 'Gagal Memuat',
            message: reviewsRes.error || 'Tidak dapat memuat data ulasan.',
          });
        }
        if (productsRes.success && productsRes.data?.products) {
          setProductNames(
            Object.fromEntries(productsRes.data.products.map((p) => [p.id, p.name]))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleStatus = async (review: Review) => {
    const next = review.status === 'published' ? 'hidden' : 'published';
    const res = await api.reviews.updateStatus(review.id, next);
    if (res.success) {
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: next } : r)));
      addToast({
        type: 'success',
        title: 'Status Diperbarui',
        message: `Ulasan ${next === 'hidden' ? 'disembunyikan' : 'ditampilkan kembali'}.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Gagal Update',
        message: res.error || 'Tidak dapat mengubah status ulasan.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await api.reviews.delete(toDelete.id);
    setDeleting(false);
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== toDelete.id));
      addToast({ type: 'success', title: 'Ulasan Dihapus', message: 'Ulasan berhasil dihapus.' });
      setToDelete(null);
    } else {
      addToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: res.error || 'Tidak dapat menghapus ulasan.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-serif text-white font-medium">Ulasan Pelanggan</h2>
        <p className="text-xs text-gray-400 mt-1">
          Moderasi ulasan produk: sembunyikan atau hapus ulasan yang tidak pantas
        </p>
      </div>

      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <ReviewTable
          reviews={reviews}
          productNames={productNames}
          onToggleStatus={handleToggleStatus}
          onDelete={(r) => setToDelete(r)}
        />
      )}

      <Modal
        isOpen={Boolean(toDelete)}
        onClose={() => !deleting && setToDelete(null)}
        title="Hapus Ulasan?"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setToDelete(null)}
              className="btn btn-secondary btn-sm"
              disabled={deleting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="btn btn-danger btn-sm"
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        }
      >
        {toDelete && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Ulasan dari <span className="font-semibold text-white">{toDelete.userName}</span> untuk{' '}
              <span className="font-semibold text-white">
                {productNames[toDelete.productId] || toDelete.productId}
              </span>{' '}
              akan dihapus permanen.
            </p>
            {toDelete.comment && (
              <p className="p-3 rounded-lg bg-[#181818] border border-[#262626] text-xs text-gray-400 break-words">
                “{toDelete.comment}”
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
