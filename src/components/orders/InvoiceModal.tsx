'use client';

import React from 'react';
import type { Order } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { formatPrice, formatDate } from '@/lib/utils';
import { Printer, ExternalLink } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    // Generate clean, dedicated print iframe to completely isolate from dashboard layout
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const itemsHtml = order.items
      .map((item) => {
        const price = item.price ?? item.product?.price ?? 0;
        const totalItem = price * item.quantity;
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 8px; vertical-align: top;">
              <div style="font-weight: 700; color: #111827; font-size: 13px;">${item.product?.name || 'Produk LUXE'}</div>
              <div style="font-family: monospace; font-size: 10px; color: #6b7280; margin-top: 2px;">SKU: ${item.productId}</div>
            </td>
            <td style="padding: 10px 8px; vertical-align: top; color: #374151; font-size: 12px;">
              ${item.size || '-'} / ${item.color || '-'}
            </td>
            <td style="padding: 10px 8px; vertical-align: top; text-align: right; color: #374151; font-size: 12px;">
              ${formatPrice(price)}
            </td>
            <td style="padding: 10px 8px; vertical-align: top; text-align: center; font-weight: 700; color: #111827; font-size: 12px;">
              ${item.quantity}
            </td>
            <td style="padding: 10px 8px; vertical-align: top; text-align: right; font-weight: 700; color: #111827; font-size: 13px;">
              ${formatPrice(totalItem)}
            </td>
          </tr>
        `;
      })
      .join('');

    const invoiceContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Faktur INV-${order.id.toUpperCase()}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #ffffff;
            color: #111827;
            font-size: 12px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-box {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000000; line-height: 1;">LUXE</h1>
              <p style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #b45309; margin-top: 3px;">
                HAUTE COUTURE & LUXURY GOODS
              </p>
              <div style="font-size: 11px; color: #4b5563; margin-top: 8px; line-height: 1.4;">
                <p>Plaza Senayan Level 2, Jl. Asia Afrika No. 8</p>
                <p>Jakarta Pusat 10270, DKI Jakarta, Indonesia</p>
                <p>Email: concierge@luxe.com • Telp: +62 21 5790 0000</p>
              </div>
            </div>

            <div style="text-align: right;">
              <div style="display: inline-block; padding: 4px 12px; background: #111827; color: #ffffff; font-weight: 700; font-size: 11px; letter-spacing: 1px; border-radius: 4px; text-transform: uppercase; margin-bottom: 6px;">
                FAKTUR & PACKING SLIP
              </div>
              <p style="font-family: monospace; font-size: 14px; font-weight: 700; color: #111827;">INV-${order.id.toUpperCase()}</p>
              <p style="font-size: 11px; color: #4b5563; margin-top: 4px;">
                Tanggal: <strong>${formatDate(order.createdAt)}</strong>
              </p>
              <p style="font-size: 11px; color: #4b5563;">
                Metode Bayar: <strong style="text-transform: uppercase;">${order.paymentMethod.replace('_', ' ')}</strong>
              </p>
              <p style="font-size: 11px; margin-top: 2px;">
                Status: <strong style="color: ${order.paymentStatus === 'paid' ? '#059669' : '#d97706'}; text-transform: uppercase;">
                  ${order.paymentStatus === 'paid' ? 'LUNAS (PAID)' : 'BELUM BAYAR (PENDING)'}
                </strong>
              </p>
            </div>
          </div>

          <!-- Customer & Shipping Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px;">
            <div style="background: #f9fafb; padding: 12px 14px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">
                Tujuan Pengiriman
              </p>
              <p style="font-size: 13px; font-weight: 700; color: #111827;">${order.address?.fullName || 'Customer'}</p>
              <p style="font-size: 12px; color: #374151; margin-top: 2px;">${order.address?.street || '-'}</p>
              <p style="font-size: 12px; color: #374151;">
                ${order.address?.city || ''}, ${order.address?.province || ''} ${order.address?.postalCode || ''}
              </p>
              <p style="font-size: 12px; color: #374151; margin-top: 4px;">
                No. Telepon: <strong>${order.address?.phone || '-'}</strong>
              </p>
            </div>

            <div style="background: #f9fafb; padding: 12px 14px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px;">
                Informasi Pemesanan
              </p>
              <p style="font-size: 12px; color: #374151;">ID Pesanan: <strong style="font-family: monospace;">#${order.id}</strong></p>
              <p style="font-size: 12px; color: #374151;">Customer ID: <strong style="font-family: monospace;">${order.userId}</strong></p>
              <p style="font-size: 12px; color: #374151;">Status Fulfillment: <strong style="text-transform: uppercase; color: #111827;">${order.orderStatus}</strong></p>
              ${
                order.notes
                  ? `<p style="font-size: 11px; color: #b45309; margin-top: 4px; font-style: italic;">Catatan: "${order.notes}"</p>`
                  : ''
              }
            </div>
          </div>

          <!-- Products Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #111827; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">
                <th style="padding: 8px 10px; text-align: left;">Deskripsi Produk</th>
                <th style="padding: 8px 10px; text-align: left;">Varian</th>
                <th style="padding: 8px 10px; text-align: right;">Harga Satuan</th>
                <th style="padding: 8px 10px; text-align: center;">Jumlah</th>
                <th style="padding: 8px 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Calculation -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 280px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #4b5563;">
                <span>Subtotal Barang:</span>
                <span style="font-weight: 600; color: #111827;">${formatPrice(order.subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #4b5563;">
                <span>Biaya Pengiriman:</span>
                <span style="font-weight: 600; color: #111827;">
                  ${order.shipping === 0 ? 'GRATIS (VIP)' : formatPrice(order.shipping)}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #4b5563;">
                <span>Pajak (PPN 10%):</span>
                <span style="font-weight: 600; color: #111827;">${formatPrice(order.tax)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #111827; margin-top: 4px; font-size: 14px; font-weight: 700; color: #111827;">
                <span>Total Tagihan:</span>
                <span style="color: #b45309;">${formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <!-- Signatures & Verification -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 11px; color: #4b5563;">
            <div>
              <p style="font-weight: 700; text-transform: uppercase; color: #111827; margin-bottom: 45px;">
                Petugas Packing & Fulfillment:
              </p>
              <div style="border-bottom: 1px solid #9ca3af; width: 180px; margin-bottom: 4px;"></div>
              <p style="font-size: 10px; color: #6b7280;">Nama & Tanda Tangan</p>
            </div>

            <div style="text-align: right; max-width: 320px;">
              <p style="font-style: italic; color: #4b5563;">
                Terima kasih atas pesanan Anda di LUXE Haute Couture.
              </p>
              <p style="font-size: 10px; color: #9ca3af; margin-top: 4px;">
                Dokumen dicetak secara resmi oleh LUXE Fulfillment Backoffice Portal.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(invoiceContent);
    doc.close();

    // Trigger isolated print
    printFrame.contentWindow?.focus();
    setTimeout(() => {
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1500);
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faktur & Slip Pengiriman Resmi"
      subtitle={`No. Faktur: INV-${order.id.toUpperCase()}`}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-gray-400 hidden sm:inline">
            Faktur format resmi LUXE — siap cetak atau ekspor ke PDF (A4).
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              Tutup
            </button>
            <button onClick={handlePrint} className="btn btn-primary btn-sm shadow-gold">
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Faktur Sekarang (A4 / PDF)
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Modal On-Screen Preview */}
        <div
          id="printable-invoice"
          className="bg-white text-gray-900 p-8 rounded-xl shadow-lg border border-gray-300 font-sans text-xs"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-5 mb-5">
            <div>
              <h1 className="font-serif text-3xl font-bold tracking-widest text-black">LUXE</h1>
              <p className="text-[10px] tracking-wider text-amber-700 font-bold uppercase mt-0.5">
                Haute Couture & Luxury Goods
              </p>
              <div className="text-[11px] text-gray-600 mt-2 space-y-0.5">
                <p>Plaza Senayan Level 2, Jl. Asia Afrika No. 8</p>
                <p>Jakarta Pusat 10270, Indonesia</p>
                <p>Email: concierge@luxe.com • Telp: +62 21 5790 0000</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-black text-white font-mono text-xs font-bold uppercase rounded mb-2">
                FAKTUR RESMI
              </span>
              <p className="text-sm font-bold font-mono text-black">INV-{order.id.toUpperCase()}</p>
              <p className="text-xs text-gray-600 mt-1">
                Tanggal: <strong>{formatDate(order.createdAt)}</strong>
              </p>
              <p className="text-xs text-gray-600">
                Metode Bayar:{' '}
                <strong className="uppercase">{order.paymentMethod.replace('_', ' ')}</strong>
              </p>
              <p className="text-xs text-gray-600">
                Status:{' '}
                <strong
                  className={
                    order.paymentStatus === 'paid'
                      ? 'text-emerald-700 uppercase font-bold'
                      : 'text-amber-700 uppercase font-bold'
                  }
                >
                  {order.paymentStatus === 'paid' ? 'LUNAS (PAID)' : 'BELUM BAYAR'}
                </strong>
              </p>
            </div>
          </div>

          {/* Customer & Shipping Addresses */}
          <div className="grid grid-cols-2 gap-6 border-b border-gray-200 pb-5 mb-5">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px] mb-1">
                Tujuan Pengiriman
              </p>
              <p className="text-sm font-bold text-black">{order.address?.fullName || 'Customer'}</p>
              <p className="text-gray-700 mt-0.5">{order.address?.street}</p>
              <p className="text-gray-700">
                {order.address?.city}, {order.address?.province} {order.address?.postalCode}
              </p>
              <p className="text-gray-700 mt-1">No. Telepon: {order.address?.phone || '-'}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px] mb-1">
                Informasi Pesanan
              </p>
              <p className="text-gray-700">
                ID Pesanan: <strong className="font-mono">#{order.id}</strong>
              </p>
              <p className="text-gray-700">
                Customer ID: <strong className="font-mono">{order.userId}</strong>
              </p>
              <p className="text-gray-700">
                Status Pengiriman: <strong className="uppercase">{order.orderStatus}</strong>
              </p>
              {order.notes && (
                <p className="text-amber-800 mt-1 italic">Catatan: &ldquo;{order.notes}&rdquo;</p>
              )}
            </div>
          </div>

          {/* Item Table */}
          <table className="w-full text-xs text-left mb-5 border-collapse">
            <thead>
              <tr className="bg-black text-white font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Deskripsi Produk</th>
                <th className="py-2.5 px-3">Varian</th>
                <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                <th className="py-2.5 px-3 text-center">Jumlah</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item, idx) => {
                const price = item.price ?? item.product?.price ?? 0;
                return (
                  <tr key={idx}>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-black">{item.product?.name || 'Item'}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{item.productId}</p>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {item.size || '-'} / {item.color || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{formatPrice(price)}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-black">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-black">
                      {formatPrice(price * item.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Calculation */}
          <div className="flex justify-end border-t-2 border-black pt-4 mb-6">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal Produk:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Biaya Pengiriman:</span>
                <span>{order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Pajak (PPN 10%):</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="border-t border-gray-400 pt-2 flex justify-between text-sm font-bold text-black">
                <span>Total Tagihan:</span>
                <span className="text-amber-700">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="flex justify-between items-end border-t border-gray-200 pt-5 text-[11px] text-gray-600">
            <div>
              <p className="font-bold text-black uppercase mb-10">Petugas Fulfillment / Packing:</p>
              <div className="border-b border-gray-400 w-44 mb-1"></div>
              <p className="font-mono text-[10px]">Tanggal & Tanda Tangan</p>
            </div>
            <div className="text-right">
              <p className="italic text-gray-500">
                Terima kasih atas kepercayaan Anda berbelanja busana mahakarya di LUXE.
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Dokumen ini sah dicetak oleh Sistem LUXE Backoffice
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
