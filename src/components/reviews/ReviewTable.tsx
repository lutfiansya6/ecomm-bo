'use client';

import React, { useState } from 'react';
import type { Review } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Eye, EyeOff, Trash2, Star } from 'lucide-react';

interface ReviewTableProps {
  reviews: Review[];
  productNames: Record<string, string>;
  onToggleStatus: (review: Review) => void;
  onDelete: (review: Review) => void;
}

export function ReviewTable({
  reviews,
  productNames,
  onToggleStatus,
  onDelete,
}: ReviewTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const filtered = reviews
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .filter((r) => ratingFilter === 'all' || r.rating === Number(ratingFilter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input select text-sm"
            aria-label="Filter status ulasan"
          >
            <option value="all">Semua Status</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="input select text-sm"
            aria-label="Filter rating ulasan"
          >
            <option value="all">Semua Rating</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Bintang
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Pembeli</th>
              <th>Rating</th>
              <th>Komentar</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Tidak ada ulasan yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map((review) => {
                const published = review.status === 'published';
                return (
                  <tr key={review.id}>
                    <td className="text-sm font-medium text-white">
                      {productNames[review.productId] || review.productId}
                    </td>
                    <td className="text-sm text-gray-200">{review.userName}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {review.rating}
                      </span>
                    </td>
                    <td className="text-xs text-gray-300 max-w-xs">
                      {review.comment ? (
                        <span className="line-clamp-2 break-words" title={review.comment}>
                          {review.comment}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="text-xs text-gray-400">{formatDate(review.createdAt)}</td>
                    <td>
                      <Badge variant={published ? 'success' : 'neutral'}>
                        {published ? 'Published' : 'Hidden'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onToggleStatus(review)}
                          className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-400 border border-[#2a2a2a] transition-all"
                          title={published ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onDelete(review)}
                          className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 border border-[#2a2a2a] transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
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
