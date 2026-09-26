'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initialize();
    setMounted(true);
    const token = localStorage.getItem('luxe_admin_token');
    if (!token) {
      router.replace('/login');
    }
  }, [initialize, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center font-serif text-gold text-lg animate-pulse">
            L
          </div>
          <span className="text-xs text-gray-500 font-mono tracking-wider uppercase">
            Memuat Administrasi...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f3f3f3]">
      <Sidebar />
      <div
        className={`transition-all duration-300 min-h-screen flex flex-col ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Topbar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
