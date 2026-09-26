'use client';

import React, { useState } from 'react';
import type { User } from '@/types';
import { formatPrice, formatDateShort, getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Search, ShoppingBag, Shield, Mail, Calendar } from 'lucide-react';

interface CustomerTableProps {
  users: User[];
}

export function CustomerTable({ users }: CustomerTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4">
      {/* Search & Role Filter */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, alamat email, atau ID user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="w-full md:w-52">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'customer' | 'admin')}
            className="input select text-sm"
          >
            <option value="all">Semua Tipe Akun</option>
            <option value="customer">Customer Saja</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th>Alamat Email</th>
              <th>Tipe Akun</th>
              <th>Total Transaksi</th>
              <th>Total Pengeluaran</th>
              <th>Transaksi Terakhir</th>
              <th>Tanggal Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Tidak ada data pelanggan yang sesuai dengan kriteria.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const totalSpent = user.totalSpent || 0;
                const orderCount = user.orderCount || 0;
                const isVip = totalSpent >= 10000000;

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-[#9a7a30]/10 border border-gold/30 flex items-center justify-center font-bold text-xs text-gold shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-sm">{user.name}</span>
                            {isVip && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-gray-500">{user.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        {user.email}
                      </div>
                    </td>

                    <td>
                      {user.role === 'admin' ? (
                        <Badge variant="gold">Admin</Badge>
                      ) : (
                        <Badge variant="neutral">Customer</Badge>
                      )}
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5 text-xs">
                        <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                        <span className="font-semibold text-white">{orderCount} Pesanan</span>
                      </div>
                    </td>

                    <td className="font-bold text-white text-sm">
                      {formatPrice(totalSpent)}
                    </td>

                    <td className="text-xs text-gray-400">
                      {user.lastOrderDate ? formatDateShort(user.lastOrderDate) : 'Belum pernah'}
                    </td>

                    <td className="text-xs text-gray-400">
                      {formatDateShort(user.createdAt)}
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
