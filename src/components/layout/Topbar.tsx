'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Activity, Bell, Store } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface TopbarProps {
  onAddProduct?: () => void;
}

export function Topbar({ onAddProduct }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 60000);

    // API Ping
    const pingBackend = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/api/products?limit=1');
        const end = performance.now();
        if (res.ok) {
          setApiOnline(true);
          setLatency(Math.round(end - start));
        } else {
          setApiOnline(false);
        }
      } catch {
        setApiOnline(false);
      }
    };

    pingBackend();
    const pingTimer = setInterval(pingBackend, 20000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(pingTimer);
    };
  }, []);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return { title: 'Executive Dashboard', subtitle: 'Ikhtisar performa penjualan & operasional' };
    if (pathname.startsWith('/products')) return { title: 'Katalog & Manajemen Produk', subtitle: 'Kelola SKU, harga, foto, dan stok busana' };
    if (pathname.startsWith('/orders')) return { title: 'Manajemen Pesanan', subtitle: 'Proses fulfillment, pengiriman, dan faktur penjualan' };
    if (pathname.startsWith('/inventory')) return { title: 'Inventaris & Peringatan Stok', subtitle: 'Pantau ketersediaan barang dan lakukan restock' };
    if (pathname.startsWith('/customers')) return { title: 'Direktori Pelanggan', subtitle: 'Daftar pembeli terdaftar dan riwayat pembelanjaan' };
    if (pathname.startsWith('/settings')) return { title: 'Pengaturan Toko & Sistem', subtitle: 'Konfigurasi parameter toko dan status konektivitas API' };
    return { title: 'Backoffice', subtitle: 'Portal Administrasi LUXE' };
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="no-print h-20 bg-[#0d0d0d]/80 backdrop-blur-md border-b border-[#222222] px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Context */}
      <div>
        <h1 className="text-xl font-serif text-white font-medium">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Backend API Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161616] border border-[#262626] text-xs">
          <span className="relative flex h-2 w-2">
            {apiOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
          <span className="text-gray-300 font-mono text-[11px]">
            {apiOnline ? `Backend Online (${latency}ms)` : 'Backend Offline'}
          </span>
        </div>

        {/* Date Display */}
        <div className="hidden md:block text-xs text-gray-400 border-l border-[#262626] pl-4">
          {currentTime}
        </div>

        {/* Quick Add Product Button */}
        {pathname.startsWith('/products') && onAddProduct && (
          <button onClick={onAddProduct} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-1" />
            Tambah Produk
          </button>
        )}

        {/* Storefront Link Icon */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-[#161616] border border-[#262626] text-gray-400 hover:text-gold hover:border-gold/30 transition-all"
          title="Buka Toko Online"
        >
          <Store className="w-4 h-4" />
        </a>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#262626]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold/30 to-[#9a7a30]/20 border border-gold/30 flex items-center justify-center font-bold text-xs text-gold">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
        </div>
      </div>
    </header>
  );
}
