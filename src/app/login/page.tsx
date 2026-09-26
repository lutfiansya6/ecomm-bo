'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { api } from '@/lib/api';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, initialize } = useAuthStore();
  const { addToast } = useUIStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initialize();
    const token = localStorage.getItem('luxe_admin_token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [initialize, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.auth.login({ email, password });
      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Email atau kata sandi tidak valid.');
        return;
      }

      if (res.data.user.role !== 'admin') {
        setErrorMsg('Akses ditolak: Akun ini tidak memiliki hak akses administrator.');
        return;
      }

      setAuth(res.data.user, res.data.token);
      addToast({
        type: 'success',
        title: 'Login Berhasil',
        message: `Selamat datang kembali, ${res.data.user.name}`,
      });

      router.push('/dashboard');
    } catch {
      setErrorMsg('Gagal terhubung ke server backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@luxe.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Gold Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#9a7a30]/10 via-[#c9a84c]/15 to-transparent rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="card p-8 bg-[#101010]/90 backdrop-blur-xl border-[#262626] shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-[#9a7a30] flex items-center justify-center font-serif text-black font-bold text-2xl shadow-gold mb-4">
              L
            </div>
            <h1 className="font-serif text-2xl text-white tracking-widest uppercase font-medium">
              LUXE
            </h1>
            <p className="text-xs uppercase tracking-widest text-gold font-semibold mt-0.5">
              Backoffice Portal
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Masuk dengan akun administrator untuk mengelola toko
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fadeIn">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="input-label">Alamat Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@luxe.com"
                  className="input pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                'Memverifikasi Akses...'
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Demo Autofill Shortcut */}
          <div className="mt-6 pt-5 border-t border-[#222222] text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-2 text-xs text-gold hover:text-gold-light hover:underline font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Isi Otomatis Akun Admin Demo (admin@luxe.com)
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-500 font-mono">
          LUXE Haute Couture Platform © 2026
        </div>
      </div>
    </div>
  );
}
