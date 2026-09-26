import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface LowStockAlertProps {
  products: Product[];
}

export function LowStockAlert({ products }: LowStockAlertProps) {
  const lowStockItems = products.filter((p) => p.stock <= 5);

  if (lowStockItems.length === 0) return null;

  return (
    <div className="card p-5 border-amber-500/30 bg-[#1a140b] shadow-[0_0_20px_rgba(245,158,11,0.08)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-300">
              Peringatan Inventaris: {lowStockItems.length} Produk Kritis
            </h4>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Stok produk berikut tersisa 5 unit atau kurang. Segera lakukan penambahan stok (restock).
            </p>

            <div className="flex flex-wrap gap-3 mt-3">
              {lowStockItems.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#251b0f] border border-amber-500/30 text-xs"
                >
                  <div className="relative w-6 h-6 rounded overflow-hidden bg-black shrink-0">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-800" />
                    )}
                  </div>
                  <span className="text-gray-200 truncate max-w-[120px]">{p.name}</span>
                  <span className="font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded text-[10px]">
                    Sisa {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/inventory"
          className="btn btn-sm btn-outline border-amber-500/50 text-amber-300 hover:bg-amber-500/20 shrink-0"
        >
          Kelola Stok
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
}
