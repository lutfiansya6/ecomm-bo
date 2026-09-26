'use client';

import React from 'react';
import type { Product } from '@/types';

interface CategoryDistributionProps {
  products: Product[];
}

export function CategoryDistribution({ products }: CategoryDistributionProps) {
  const categories: { key: string; label: string; color: string; bgGradient: string }[] = [
    {
      key: 'dress',
      label: 'Dresses & Gowns',
      color: '#fbbf24', // Bright Gold
      bgGradient: 'from-amber-500 to-yellow-300',
    },
    {
      key: 'blazer',
      label: 'Tailored Blazers',
      color: '#38bdf8', // Bright Sky Blue
      bgGradient: 'from-blue-500 to-cyan-300',
    },
    {
      key: 'bag',
      label: 'Leather Bags',
      color: '#c084fc', // Bright Purple
      bgGradient: 'from-purple-500 to-fuchsia-300',
    },
    {
      key: 'shoes',
      label: 'Footwear & Heels',
      color: '#fb7185', // Bright Rose
      bgGradient: 'from-rose-500 to-pink-300',
    },
    {
      key: 'coat',
      label: 'Overcoats',
      color: '#fb923c', // Bright Orange
      bgGradient: 'from-orange-500 to-amber-300',
    },
    {
      key: 'accessories',
      label: 'Accessories',
      color: '#34d399', // Bright Mint Green
      bgGradient: 'from-emerald-500 to-teal-300',
    },
  ];

  const total = products.length || 1;

  const counts = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat.key).length;
    const percentage = Math.round((count / total) * 100);
    return { ...cat, count, percentage };
  });

  return (
    <div className="card p-6 bg-gradient-to-b from-[#141414] to-[#101010] border-[#2e2e2e] shadow-xl h-full flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h3 className="text-lg font-semibold text-white tracking-wide">
            Distribusi Kategori
          </h3>
          <p className="text-xs text-gray-400 mt-1">Komposisi portofolio produk aktif</p>
        </div>
        <span className="text-xs text-amber-300 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
          {products.length} SKU
        </span>
      </div>

      <div className="space-y-4 pt-4 flex-1 flex flex-col justify-around">
        {counts.map((cat) => (
          <div key={cat.key} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-200 font-semibold flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px] transition-transform group-hover:scale-125"
                  style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }}
                />
                {cat.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono font-bold">{cat.count} item</span>
                <span
                  className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded"
                  style={{ color: cat.color, backgroundColor: `${cat.color}20` }}
                >
                  {cat.percentage}%
                </span>
              </div>
            </div>

            {/* Bright Illuminated Progress Bar */}
            <div className="w-full h-2.5 bg-[#1f1f1f] rounded-full overflow-hidden p-0.5 border border-[#333333]">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${cat.bgGradient}`}
                style={{
                  width: `${Math.max(5, cat.percentage)}%`,
                  boxShadow: `0 0 10px ${cat.color}80`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
