'use client';

import React, { useState } from 'react';
import type { NavigationItem, Category } from '@/types';
import {
  Sparkles,
  ShoppingBag,
  Search,
  User,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface NavbarPreviewProps {
  items: NavigationItem[];
  categories?: Category[];
}

export function NavbarPreview({ items }: NavbarPreviewProps) {
  const [previewLang, setPreviewLang] = useState<'en' | 'id'>('en');

  // Only display active navigation items sorted by order
  const activeItems = items
    .filter((i) => i.active)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="card p-5 space-y-3.5 bg-gradient-to-b from-[#141414] to-[#0f0f0f] border-[#262626] shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222222]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gold/15 text-gold border border-gold/30">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Pratinjau Navbar Toko Online (Storefront)
            </h3>
            <p className="text-[11px] text-gray-400">
              Simulasi tampilan menu di etalase publik berdasarkan urutan dan status aktif saat ini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Switcher for Preview */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#161616] border border-[#2c2c2c] text-[11px]">
            <button
              type="button"
              onClick={() => setPreviewLang('en')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                previewLang === 'en'
                  ? 'bg-gold text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setPreviewLang('id')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                previewLang === 'id'
                  ? 'bg-gold text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ID
            </button>
          </div>

          <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#1b1b1b] border border-[#2e2e2e] text-gray-300">
            {activeItems.length} menu aktif
          </span>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gold hover:underline flex items-center gap-1 font-medium"
          >
            <span>Buka Toko</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Simulated Storefront Navbar Frame */}
      <div className="relative rounded-xl overflow-visible bg-[#0a0a0a] border border-[#2e2e2e] shadow-2xl p-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Store Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-serif text-xl sm:text-2xl tracking-[0.18em] font-medium text-white hover:text-gold transition-colors select-none">
              LUXE
            </span>
          </div>

          {/* Navigation Items (Center) - Label Saja, Tanpa Panah Dropdown */}
          <div className="flex-1 overflow-x-auto no-scrollbar py-1">
            {activeItems.length === 0 ? (
              <p className="text-xs text-amber-400/80 italic text-center py-1">
                Semua menu disembunyikan. Navbar etalase toko akan kosong.
              </p>
            ) : (
              <nav className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6 min-w-max">
                {activeItems.map((item) => (
                  <div key={item.id} className="relative">
                    <div
                      className={`group px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide flex items-center gap-1.5 transition-all cursor-default select-none ${
                        item.accent
                          ? 'text-gold font-semibold bg-gold/10 border border-gold/40 shadow-[0_0_10px_rgba(201,168,76,0.15)]'
                          : 'text-gray-300 hover:text-white hover:bg-[#161616]'
                      }`}
                    >
                      {item.accent && <Sparkles className="w-3 h-3 text-gold shrink-0" />}
                      <span>
                        {previewLang === 'id'
                          ? item.label_id || item.label
                          : item.label_en || item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Dummy Right Action Icons */}
          <div className="hidden sm:flex items-center gap-3 text-gray-400 shrink-0 select-none pointer-events-none opacity-60">
            <Search className="w-4 h-4" />
            <User className="w-4 h-4" />
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-gold text-black font-bold text-[9px] flex items-center justify-center">
                0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
