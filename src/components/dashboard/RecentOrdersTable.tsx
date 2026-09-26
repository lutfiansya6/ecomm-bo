import React from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
import { formatPrice, formatDateShort, getOrderStatusBadge } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, ShoppingBag } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: Order[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-[#262626] flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Pesanan Terkini</h3>
          <p className="text-xs text-gray-400 mt-0.5">Aktivitas transaksi pesanan terbaru</p>
        </div>
        <Link
          href="/orders"
          className="text-xs font-semibold text-gold hover:text-gold-light flex items-center gap-1 transition-colors"
        >
          Lihat Semua
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Pelanggan</th>
              <th>Item</th>
              <th>Total</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Belum ada transaksi pesanan
                </td>
              </tr>
            ) : (
              recent.map((order) => {
                const statusBadge = getOrderStatusBadge(order.orderStatus);
                const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/orders?selected=${order.id}`}
                        className="font-mono text-xs font-semibold text-gold hover:underline"
                      >
                        #{order.id}
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium text-white">{order.address?.fullName || 'Customer'}</div>
                      <div className="text-[11px] text-gray-400">{order.address?.city || '-'}</div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-300">
                        {totalItems} item ({order.items[0]?.product?.name || 'Produk'}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''})
                      </span>
                    </td>
                    <td className="font-semibold text-white">
                      {formatPrice(order.total)}
                    </td>
                    <td>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#1c1c1c] text-gray-300 border border-[#2a2a2a]">
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </td>
                    <td className="text-xs text-gray-400">
                      {formatDateShort(order.createdAt)}
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
