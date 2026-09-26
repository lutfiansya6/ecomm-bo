'use client';

import React, { useState } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import {
  formatPrice,
  formatDate,
  getOrderStatusBadge,
  getPaymentStatusBadge,
} from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Eye,
  Printer,
  ChevronRight,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
  onQuickStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}

export function OrderTable({
  orders,
  onViewOrder,
  onPrintInvoice,
  onQuickStatusChange,
}: OrderTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filtered = orders
    .filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.address?.fullName.toLowerCase().includes(search.toLowerCase()) ||
        o.address?.city.toLowerCase().includes(search.toLowerCase()) ||
        o.address?.phone.includes(search);

      const matchStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
      const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID pesanan, nama pembeli, no telp, kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input select text-sm"
          >
            <option value="all">Semua Status Pesanan</option>
            <option value="pending">Pending (Menunggu)</option>
            <option value="confirmed">Confirmed (Dikonfirmasi)</option>
            <option value="shipped">Shipped (Dikirim)</option>
            <option value="delivered">Delivered (Selesai)</option>
            <option value="cancelled">Cancelled (Dibatalkan)</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input select text-sm"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="paid">Sudah Dibayar (Lunas)</option>
            <option value="pending">Belum Dibayar</option>
            <option value="failed">Gagal Bayar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID Pesanan</th>
              <th>Waktu Transaksi</th>
              <th>Pelanggan</th>
              <th>Ringkasan Item</th>
              <th>Total Pembayaran</th>
              <th>Metode Bayar</th>
              <th>Status Bayar</th>
              <th>Status Order</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  Tidak ada pesanan yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const orderBadge = getOrderStatusBadge(order.orderStatus);
                const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
                const totalItemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <tr key={order.id}>
                    <td>
                      <button
                        onClick={() => onViewOrder(order)}
                        className="font-mono text-xs font-semibold text-gold hover:underline"
                      >
                        #{order.id}
                      </button>
                    </td>

                    <td className="text-xs text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>

                    <td>
                      <div className="font-medium text-white text-sm">
                        {order.address?.fullName || 'Customer'}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {order.address?.phone || '-'} • {order.address?.city || '-'}
                      </div>
                    </td>

                    <td>
                      <div className="text-xs text-gray-200">
                        <span className="font-semibold text-gold">{totalItemCount} pcs</span>
                        <span className="text-gray-400 ml-1">
                          ({order.items[0]?.product?.name || 'Item'}
                          {order.items.length > 1 ? ` +${order.items.length - 1}` : ''})
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="font-bold text-white text-sm">
                        {formatPrice(order.total)}
                      </div>
                    </td>

                    <td>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#181818] border border-[#262626] text-gray-300">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <Badge variant={paymentBadge.variant}>{paymentBadge.label}</Badge>
                    </td>

                    <td>
                      <Badge variant={orderBadge.variant}>{orderBadge.label}</Badge>
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-400 border border-[#2a2a2a] transition-all"
                          title="Lihat Detail Pesanan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintInvoice(order)}
                          className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-gold/20 hover:text-gold text-gray-400 border border-[#2a2a2a] transition-all"
                          title="Cetak Faktur / Slip Pengiriman"
                        >
                          <Printer className="w-4 h-4" />
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
