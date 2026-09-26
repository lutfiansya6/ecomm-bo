'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  formatPrice,
  formatDate,
  getOrderStatusBadge,
  getPaymentStatusBadge,
} from '@/lib/utils';
import {
  Printer,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Save,
} from 'lucide-react';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdateStatus: (
    id: string,
    orderStatus: OrderStatus,
    paymentStatus: PaymentStatus
  ) => Promise<void>;
  onPrintInvoice: (order: Order) => void;
}

export function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  onPrintInvoice,
}: OrderDetailModalProps) {
  if (!order) return null;

  const [selectedOrderStatus, setSelectedOrderStatus] = useState<OrderStatus>(order.orderStatus);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [updating, setUpdating] = useState(false);

  const orderBadge = getOrderStatusBadge(selectedOrderStatus);
  const paymentBadge = getPaymentStatusBadge(selectedPaymentStatus);

  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      await onUpdateStatus(order.id, selectedOrderStatus, selectedPaymentStatus);
    } finally {
      setUpdating(false);
    }
  };

  const timelineSteps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'pending', label: 'Menunggu', desc: 'Pesanan masuk dari pelanggan' },
    { key: 'confirmed', label: 'Dikonfirmasi', desc: 'Pembayaran diverifikasi & stok dipersiapkan' },
    { key: 'shipped', label: 'Dikirim', desc: 'Diserahkan ke kurir ekspedisi' },
    { key: 'delivered', label: 'Selesai', desc: 'Barang telah diterima pembeli' },
  ];

  const currentStepIndex = timelineSteps.findIndex((s) => s.key === selectedOrderStatus);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Pesanan #${order.id}`}
      subtitle={`Dibuat pada ${formatDate(order.createdAt)}`}
      maxWidth="4xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="text-xs text-gray-400 hidden sm:block">
            Status: <span className="font-semibold text-white uppercase">{selectedOrderStatus}</span> • Pembayaran: <span className="font-semibold text-white uppercase">{selectedPaymentStatus}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={updating}
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveStatus}
              disabled={updating}
              className="btn btn-primary btn-sm shadow-gold"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {updating ? 'Menyimpan...' : 'Simpan Status Pesanan'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Tracker Banner */}
        <div className="card p-5 bg-[#141414] border-gold/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Status Terkini:</span>
              <Badge variant={orderBadge.variant}>{orderBadge.label}</Badge>
              <Badge variant={paymentBadge.variant}>{paymentBadge.label}</Badge>
            </div>

            <button
              onClick={() => onPrintInvoice(order)}
              className="btn btn-outline btn-sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Invoice Resmi
            </button>
          </div>

          {/* Timeline Progress */}
          {selectedOrderStatus !== 'cancelled' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {timelineSteps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-gold/15 border-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]'
                        : isPassed
                        ? 'bg-[#181818] border-emerald-500/40 text-emerald-400'
                        : 'bg-[#121212] border-[#222222] opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-xs font-semibold text-white">{step.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              Pesanan ini telah dibatalkan (Cancelled).
            </div>
          )}
        </div>

        {/* 2-Column Info: Customer & Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <User className="w-4 h-4 text-gold" />
              Informasi Pelanggan
            </div>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-white">{order.address?.fullName}</p>
              <p className="text-gray-400 text-xs">No. Telepon: {order.address?.phone || '-'}</p>
              <p className="text-gray-400 text-xs">User ID: <span className="font-mono text-gray-300">{order.userId}</span></p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <MapPin className="w-4 h-4 text-gold" />
              Alamat Pengiriman
            </div>
            <div className="text-xs text-gray-300 space-y-1 leading-relaxed">
              <p className="font-medium text-white">{order.address?.street}</p>
              <p>{order.address?.city}, {order.address?.province} {order.address?.postalCode}</p>
              <p className="text-gray-400">{order.address?.country || 'Indonesia'}</p>
              {order.notes && (
                <div className="mt-2 p-2 rounded bg-[#181818] border border-[#2a2a2a] text-amber-300/90 text-[11px]">
                  <strong>Catatan Khusus:</strong> {order.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Package className="w-4 h-4 text-gold" />
              Item Pesanan ({order.items.length} item)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Varian</th>
                  <th>Harga Satuan</th>
                  <th>Jumlah</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const price = item.price ?? item.product?.price ?? 0;
                  const itemSubtotal = price * item.quantity;

                  return (
                    <tr key={idx}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-12 rounded bg-[#181818] overflow-hidden shrink-0 border border-[#2a2a2a]">
                            {item.product?.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-800" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {item.product?.name || 'Produk LUXE'}
                            </p>
                            <p className="text-[11px] font-mono text-gray-500">
                              {item.productId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-300">
                          Ukuran: <strong className="text-white">{item.size || 'Default'}</strong> • Warna: <strong className="text-white">{item.color || 'Default'}</strong>
                        </span>
                      </td>
                      <td className="text-xs text-gray-300">
                        {formatPrice(price)}
                      </td>
                      <td className="text-xs font-semibold text-white">
                        {item.quantity}x
                      </td>
                      <td className="text-right font-bold text-white text-sm">
                        {formatPrice(itemSubtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="p-4 bg-[#141414] border-t border-[#262626] flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal Barang:</span>
                <span className="font-semibold text-white">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Biaya Pengiriman:</span>
                <span className="font-semibold text-white">
                  {order.shipping === 0 ? 'GRATIS (VIP)' : formatPrice(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Pajak (PPN 10%):</span>
                <span className="font-semibold text-white">{formatPrice(order.tax)}</span>
              </div>
              <div className="border-t border-[#262626] pt-2 flex justify-between text-sm">
                <span className="font-bold text-white">Total Tagihan:</span>
                <span className="font-bold text-gold text-base">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Update Status Controls */}
        <div className="card p-5 bg-[#141414] border-t-2 border-t-gold space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Perbarui Status Pesanan & Pembayaran
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Status Pemrosesan Pesanan</label>
              <select
                value={selectedOrderStatus}
                onChange={(e) => setSelectedOrderStatus(e.target.value as OrderStatus)}
                className="input select text-sm"
              >
                <option value="pending">Pending (Menunggu Konfirmasi)</option>
                <option value="confirmed">Confirmed (Dikonfirmasi & Siap Packing)</option>
                <option value="shipped">Shipped (Dalam Pengiriman)</option>
                <option value="delivered">Delivered (Telah Diterima)</option>
                <option value="cancelled">Cancelled (Batalkan Pesanan)</option>
              </select>
            </div>

            <div>
              <label className="input-label">Status Pembayaran</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                className="input select text-sm"
              >
                <option value="paid">Paid (Lunas)</option>
                <option value="pending">Pending (Belum Terbayar)</option>
                <option value="failed">Failed (Gagal)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
