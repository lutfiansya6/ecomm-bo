'use client';

import React, { useState, useEffect } from 'react';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/ui';
import { OrderTable } from '@/components/orders/OrderTable';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { InvoiceModal } from '@/components/orders/InvoiceModal';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const { addToast } = useUIStore();

  const loadOrders = async () => {
    try {
      const res = await api.orders.list();
      if (res.success && res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Koneksi Gagal',
        message: 'Tidak dapat memuat data pesanan dari backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (
    id: string,
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus
  ) => {
    try {
      const res = await api.orders.updateStatus(id, { orderStatus, paymentStatus });
      if (res.success && res.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, orderStatus, paymentStatus } : o))
        );
        if (selectedOrder?.id === id) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, orderStatus, paymentStatus } : null
          );
        }
        addToast({
          type: 'success',
          title: 'Status Diperbarui',
          message: `Pesanan #${id} berhasil diubah menjadi ${orderStatus}.`,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Gagal Update',
        message: 'Tidak dapat memperbarui status pesanan.',
      });
    }
  };

  const handleQuickStatusChange = async (id: string, status: OrderStatus) => {
    await handleUpdateStatus(id, status, 'paid');
  };

  // Status counters
  const pendingCount = orders.filter((o) => o.orderStatus === 'pending').length;
  const confirmedCount = orders.filter((o) => o.orderStatus === 'confirmed').length;
  const shippedCount = orders.filter((o) => o.orderStatus === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'delivered').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif text-white font-medium">
          Manajemen Pesanan & Fulfillment
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Pantau status pemesanan, verifikasi pembayaran, dan cetak faktur pengiriman resmi
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{pendingCount}</p>
            <p className="text-[11px] text-gray-400">Menunggu Konfirmasi</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold/20 text-gold border border-gold/30">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{confirmedCount}</p>
            <p className="text-[11px] text-gray-400">Siap Packing & Kirim</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{shippedCount}</p>
            <p className="text-[11px] text-gray-400">Dalam Pengiriman Kurir</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-tight">{deliveredCount}</p>
            <p className="text-[11px] text-gray-400">Pesanan Selesai</p>
          </div>
        </div>
      </div>

      {/* Main Order Table */}
      {loading ? (
        <div className="card p-8 skeleton h-96" />
      ) : (
        <OrderTable
          orders={orders}
          onViewOrder={(order) => setSelectedOrder(order)}
          onPrintInvoice={(order) => setInvoiceOrder(order)}
          onQuickStatusChange={handleQuickStatusChange}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        onPrintInvoice={(order) => {
          setSelectedOrder(null);
          setInvoiceOrder(order);
        }}
      />

      {/* Invoice Printable Modal */}
      <InvoiceModal
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />
    </div>
  );
}
