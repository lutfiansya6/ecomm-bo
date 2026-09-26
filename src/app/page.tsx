'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const router = useRouter();
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
    const token = localStorage.getItem('luxe_admin_token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [initialize, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center font-serif text-gold text-2xl animate-pulse">
          L
        </div>
        <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">
          Memuat LUXE Backoffice...
        </p>
      </div>
    </div>
  );
}
