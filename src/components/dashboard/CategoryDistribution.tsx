'use client';

import React, { useState, useEffect } from 'react';
import type { Product, Category } from '@/types';
import { api } from '@/lib/api';

interface CategoryDistributionProps {
  products: Product[];
}

const PALETTES = [
  { color: '#fbbf24', bgGradient: 'from-amber-500 to-yellow-300' },
  { color: '#38bdf8', bgGradient: 'from-blue-500 to-cyan-300' },
  { color: '#c084fc', bgGradient: 'from-purple-500 to-fuchsia-300' },
  { color: '#fb7185', bgGradient: 'from-rose-500 to-pink-300' },
  { color: '#fb923c', bgGradient: 'from-orange-500 to-amber-300' },
  { color: '#34d399', bgGradient: 'from-emerald-500 to-teal-300' },
  { color: '#818cf8', bgGradient: 'from-indigo-500 to-violet-300' },
  { color: '#2dd4bf', bgGradient: 'from-teal-500 to-cyan-300' },
];

export function CategoryDistribution({ products }: CategoryDistributionProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.categories.list({ all: true }).then((res) => {
      if (res.success && res.data) {
        setCategories(res.data);
      }
    });
  }, []);

  const total = products.length || 1;

  const counts = categories.map((cat, idx) => {
    const palette = PALETTES[idx % PALETTES.length];
    const count = products.filter(
      (p) => p.categoryId === cat.id || p.category === cat.slug
    ).length;
    const percentage = Math.round((count / total) * 100);
    return {
      key: cat.slug,
      label: cat.name,
      color: palette.color,
      bgGradient: palette.bgGradient,
      count,
      percentage,
      active: cat.active,
    };
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
