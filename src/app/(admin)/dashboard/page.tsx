'use client';

import React, { useEffect, useState } from 'react';
import type { Product, Order, User } from '@/types';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { CategoryDistribution } from '@/components/dashboard/CategoryDistribution';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Clock,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [prodsRes, ordersRes, usersRes] = await Promise.all([
        api.products.list(),
        api.orders.list(),
        api.users.list(),
      ]);

      if (prodsRes.success && prodsRes.data?.products) {
        setProducts(prodsRes.data.products);
      }
      if (ordersRes.success && ordersRes.data?.orders) {
        setOrders(ordersRes.data.orders);
      }
      if (usersRes.success && usersRes.data?.users) {
        setUsers(usersRes.data.users);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Compute metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-32 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card h-80 skeleton" />
          <div className="card h-80 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white font-medium">
            Ikhtisar Kinerja Bisnis
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Data real-time disinkronkan langsung dari server transaksi LUXE
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-secondary btn-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memperbarui...' : 'Segarkan Data'}
        </button>
      </div>

      {/* Low Stock Alert if any */}
      <LowStockAlert products={products} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Pendapatan"
          value={formatPrice(totalRevenue)}
          subtext="Pesanan dengan status lunas"
          icon={TrendingUp}
          colorVariant="gold"
        />
        <MetricCard
          label="Total Pesanan"
          value={`${orders.length} Transaksi`}
          subtext={`Nilai rata-rata ${formatPrice(avgOrderValue)}`}
          icon={ShoppingBag}
          colorVariant="emerald"
        />
        <MetricCard
          label="Pesanan Menunggu"
          value={`${pendingOrders} Menunggu`}
          subtext="Membutuhkan konfirmasi fulfillment"
          icon={Clock}
          colorVariant="amber"
        />
        <MetricCard
          label="Katalog Aktif"
          value={`${products.length} SKU`}
          subtext={`${lowStockCount} SKU dengan stok kritis`}
          icon={Package}
          colorVariant="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <CategoryDistribution products={products} />
        </div>
      </div>

      {/* Recent Orders Table */}
      <RecentOrdersTable orders={orders} />
    </div>
  );
}
