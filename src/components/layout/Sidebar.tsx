'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  Settings,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { api } from '@/lib/api';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [ordersRes, prodsRes] = await Promise.all([
          api.orders.list(),
          api.products.list(),
        ]);

        if (ordersRes.success && ordersRes.data?.orders) {
          const pending = ordersRes.data.orders.filter((o) => o.orderStatus === 'pending').length;
          setPendingOrdersCount(pending);
        }

        if (prodsRes.success && prodsRes.data?.products) {
          const lowStock = prodsRes.data.products.filter((p) => p.stock <= 5).length;
          setLowStockCount(lowStock);
        }
      } catch {
        // Silently ignore counter failures
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    router.push('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Katalog Produk',
      href: '/products',
      icon: Package,
    },
    {
      label: 'Pesanan',
      href: '/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeVariant: 'warning',
    },
    {
      label: 'Inventaris & Stok',
      href: '/inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeVariant: 'error',
    },
    {
      label: 'Pelanggan',
      href: '/customers',
      icon: Users,
    },
    {
      label: 'Pengaturan Toko',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`no-print fixed top-0 left-0 bottom-0 z-40 bg-[#0d0d0d] border-r border-[#222222] transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-[#222222] bg-[#101010]">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold to-[#9a7a30] flex items-center justify-center font-serif text-black font-bold text-lg shadow-gold shrink-0">
            L
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-serif text-lg tracking-widest text-white font-medium">LUXE</span>
              <span className="text-[10px] uppercase tracking-wider text-gold font-semibold -mt-1">
                Backoffice
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors shrink-0"
          title={sidebarCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/30 shadow-[0_0_15px_rgba(201,168,76,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-[#161616]'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-gold' : 'text-gray-400 group-hover:text-white'}`} />
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeVariant === 'error'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[#222222]">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gold hover:bg-[#161616] transition-all group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Buka Toko Online (Storefront)"
          >
            <ExternalLink className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-gold" />
            {!sidebarCollapsed && <span>Buka Storefront</span>}
          </a>
        </div>
      </nav>

      {/* Admin User Card Footer */}
      <div className="p-3 border-t border-[#222222] bg-[#0c0c0c]">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-[#262626]">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-xs font-bold text-gold shrink-0">
                <ShieldCheck className="w-4 h-4 text-gold" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-gold uppercase tracking-wider font-semibold">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
