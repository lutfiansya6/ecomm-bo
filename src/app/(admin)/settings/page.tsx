'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import {
  Settings,
  Shield,
  Server,
  DollarSign,
  Store,
  CheckCircle2,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();
  const router = useRouter();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latency, setLatency] = useState<number>(0);
  const [testing, setTesting] = useState(false);

  const checkHealth = async () => {
    setTesting(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/products?limit=1');
      const end = performance.now();
      if (res.ok) {
        setBackendStatus('online');
        setLatency(Math.round(end - start));
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleLogout = () => {
    logout();
    addToast({
      type: 'info',
      title: 'Telah Keluar',
      message: 'Sesi administrator Anda telah diakhiri dengan aman.',
    });
    router.push('/login');
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif text-white font-medium">
          Pengaturan Toko & Status Sistem
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Konfigurasi operasional, parameter keuangan, dan status integrasi backend
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Architecture & Health */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#262626]">
            <Server className="w-5 h-5 text-gold" />
            <h3 className="text-base font-semibold text-white">Status Infrastruktur & API</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#262626]">
              <div>
                <p className="font-semibold text-white">Backend API Server</p>
                <p className="text-gray-400 font-mono text-[11px]">http://localhost:3001/api</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="font-mono text-gray-200">
                  {backendStatus === 'online' ? `Online (${latency}ms)` : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#262626]">
              <div>
                <p className="font-semibold text-white">Backoffice Portal (Admin)</p>
                <p className="text-gray-400 font-mono text-[11px]">http://localhost:3002</p>
              </div>
              <span className="text-emerald-400 font-semibold">Active Port 3002</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#262626]">
              <div>
                <p className="font-semibold text-white">Storefront (Frontend Pelanggan)</p>
                <p className="text-gray-400 font-mono text-[11px]">http://localhost:3000</p>
              </div>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="text-gold hover:underline font-medium"
              >
                Buka Toko →
              </a>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={testing}
            className="btn btn-secondary btn-sm w-full"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Menguji Konektivitas...' : 'Tes Ulang Koneksi Backend'}
          </button>
        </div>

        {/* Financial & Shipping Configuration */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#262626]">
            <DollarSign className="w-5 h-5 text-gold" />
            <h3 className="text-base font-semibold text-white">Parameter Transaksi Toko</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex justify-between items-center">
              <div>
                <p className="font-medium text-white">Mata Uang Transaksi</p>
                <p className="text-gray-400 text-[11px]">Format nilai moneter katalog</p>
              </div>
              <span className="font-mono font-bold text-gold">IDR (Rp)</span>
            </div>

            <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex justify-between items-center">
              <div>
                <p className="font-medium text-white">Tarif Pajak (PPN)</p>
                <p className="text-gray-400 text-[11px]">Dikenakan otomatis saat checkout</p>
              </div>
              <span className="font-mono font-bold text-white">10%</span>
            </div>

            <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex justify-between items-center">
              <div>
                <p className="font-medium text-white">Ambang Batas Gratis Ongkir VIP</p>
                <p className="text-gray-400 text-[11px]">Bebas ongkir jika belanja mencapai batas</p>
              </div>
              <span className="font-mono font-bold text-emerald-400">Rp 5.000.000</span>
            </div>

            <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex justify-between items-center">
              <div>
                <p className="font-medium text-white">Tarif Pengiriman Standar</p>
                <p className="text-gray-400 text-[11px]">Untuk transaksi di bawah Rp 5.000.000</p>
              </div>
              <span className="font-mono font-bold text-white">Rp 50.000</span>
            </div>
          </div>
        </div>

        {/* Store Profile */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#262626]">
            <Store className="w-5 h-5 text-gold" />
            <h3 className="text-base font-semibold text-white">Profil Butik & Bisnis</h3>
          </div>

          <div className="text-xs space-y-2 text-gray-300">
            <p><strong>Nama Brand:</strong> LUXE Haute Couture</p>
            <p><strong>Lokasi Flagship:</strong> Plaza Senayan Level 2, Jakarta Pusat</p>
            <p><strong>Kontak Layanan:</strong> concierge@luxe.com • +62 21 5790 0000</p>
            <p><strong>Kategori Utama:</strong> Dress, Blazer, Bag, Shoes, Coat, Accessories</p>
            <div className="p-3 rounded-xl bg-[#161616] border border-[#262626] mt-3 text-gray-400 text-[11px] leading-relaxed">
              Data backend saat ini menggunakan in-memory storage yang dimuat dari seed JSON di server backend.
            </div>
          </div>
        </div>

        {/* Administrator Profile */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#262626]">
            <Shield className="w-5 h-5 text-gold" />
            <h3 className="text-base font-semibold text-white">Akun Administrator Aktif</h3>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-xl bg-[#141414] border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center font-bold text-sm text-gold">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="text-xs">
              <p className="text-sm font-bold text-white">{user?.name || 'Admin LUXE'}</p>
              <p className="text-gray-400 font-mono">{user?.email || 'admin@luxe.com'}</p>
              <span className="inline-block mt-1 badge badge-gold text-[10px]">
                {user?.role || 'admin'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm w-full"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Keluar dari Sesi Administrasi
          </button>
        </div>
      </div>
    </div>
  );
}
