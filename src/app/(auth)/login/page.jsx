'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { User, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sesuaikan URL backend sesuai dengan port yang berjalan (biasanya localhost:3000)
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
      });

      const { token } = response.data;

      // Simpan token JWT ke localStorage dan Cookies (untuk diakses oleh Middleware)
      localStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;

      // Decode JWT untuk mendapatkan role (Tanpa perlu library tambahan untuk format standar)
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const userRole = decodedPayload.role;

      // Arahkan user sesuai dengan role-nya
      if (userRole === 'orang_tua') {
        router.push('/dashboard/wali-murid');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* --- Kolom Kiri: Ilustrasi Sekolah (Tersembunyi di Mobile) --- */}
      <div className="hidden md:flex md:w-1/2 bg-blue-50/50 items-center justify-center p-8 relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="w-full max-w-lg relative aspect-4/3">
          <Image
            src="/images/sekolah.png"
            alt="Ilustrasi Sekolah"
            fill
            className="object-contain drop-shadow-xl"
            priority
          />
        </div>
      </div>

      {/* --- Kolom Kanan: Form Login --- */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 lg:py-16 shadow-2xl md:shadow-none z-10">
        
        <div className="w-full max-w-md mx-auto">
          {/* Logo & Nama Aplikasi */}
          <div className="flex items-center gap-3 mb-12">
            <div className="relative w-10 h-10">
              <Image 
                src="/images/Logo-SMK.png" 
                alt="Logo SMK" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">
              Pencatatan Poin Pelanggaran SMK
            </span>
          </div>

          {/* Typography */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Welcome Back :)
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Silakan masuk ke akun Anda untuk mengelola sistem pencatatan poin pelanggaran siswa.
            </p>
          </div>

          {/* Pesan Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md -xl p-3 text-center animate-in fade-in duration-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Input Email / NIS / Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Username / Email / NIS</label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm"
                  required
                />
                {/* Indikator Centang Hijau jika terisi */}
                {username.length > 2 && (
                  <div className="absolute right-4 text-emerald-500 animate-in zoom-in duration-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Row Pilihan */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded-md  border-slate-300 text-blue-600 focus:ring-blue-500/30 transition-colors cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                  Remember Me
                </span>
              </label>
              <Link href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                Forget Password?
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-md -full shadow-lg shadow-blue-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Login Now'
                )}
              </button>
              <Link
                href="/register"
                className="flex-1 py-3.5 px-6 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] text-slate-700 font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 flex justify-center items-center"
              >
                Create Account
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}