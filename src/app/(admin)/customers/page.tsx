'use client';

import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { formatPrice } from '@/lib/utils';
import { Users, Crown, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUIStore();

  const loadUsers = async () => {
    try {
      const res = await api.users.list();
      if (res.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Koneksi Gagal',
        message: 'Tidak dapat memuat direktori pelanggan.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const customersOnly = users.filter((u) => u.role === 'customer');
  const vipCustomers = customersOnly.filter((u) => (u.totalSpent || 0) >= 10000000);
  const totalCustomerSpend = customersOnly.reduce((sum, u) => sum + (u.totalSpent || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif text-white font-medium">
          Direktori Pelanggan & Klien VIP
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Daftar akun pembeli terdaftar, analitik total belanja, dan segmentasi loyalitas
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-gray-400">Total Akun Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{users.length} Akun</p>
          <p className="text-xs text-gray-400 mt-1">{customersOnly.length} pembeli aktif, {users.length - customersOnly.length} admin</p>
        </div>

        <div className="card p-5 border-gold/30 bg-[#16130b]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-gold">Pelanggan VIP Exclusive</span>
            <div className="w-8 h-8 rounded-lg bg-gold/20 text-gold flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gold mt-2">{vipCustomers.length} VIP</p>
          <p className="text-xs text-gold/70 mt-1">Belanja akumulatif ≥ Rp 10.000.000</p>
        </div>

        <div className="card p-5 border-emerald-500/30 bg-[#0c1810]">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">Total Akumulasi Belanja</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-300 mt-2">{formatPrice(totalCustomerSpend)}</p>
          <p className="text-xs text-emerald-200/60 mt-1">Kontribusi seluruh pembeli terdaftar</p>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <CustomerTable users={users} />
      )}
    </div>
  );
}
