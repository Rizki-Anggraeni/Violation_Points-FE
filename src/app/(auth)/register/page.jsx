'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { User, Lock, ArrowLeft, AlertCircle, PartyPopper, BookUser, PlusCircle, Trash2 } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nisList, setNisList] = useState(['']); // State array untuk menampung banyak NIS
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }
    // Validasi agar tidak ada input NIS yang kosong
    if (nisList.some(nis => nis.trim() === '')) {
      setError('Semua kolom NIS Murid harus diisi.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mengirim data username, password, dan nis ke backend
      // Endpoint disesuaikan dengan /api/users/register-ortu atau rute yang relevan
      const payload = {
        username: username,
        password: password,
        role: 'orang_tua',
        // Mengirim semua NIS yang valid (tidak kosong dan sudah di-trim)
        student_nis: nisList.map(n => n.trim()).filter(n => n !== '')
      };

      // Sesuaikan endpoint jika perlu
      const response = await axios.post('http://localhost:3000/api/auth/register', payload);

      setSuccess(response.data.message + ' Anda akan diarahkan ke halaman login.');

      // Arahkan ke halaman login setelah 3 detik
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal mendaftar. Terjadi kesalahan pada server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk mengubah nilai NIS pada index tertentu
  const handleNisChange = (index, value) => {
    const newNisList = [...nisList];
    newNisList[index] = value;
    setNisList(newNisList);
  };

  // Fungsi untuk menambah input NIS baru
  const addNisInput = () => {
    setNisList([...nisList, '']);
  };

  // Fungsi untuk menghapus input NIS pada index tertentu
  const removeNisInput = (index) => {
    setNisList(nisList.filter((_, i) => i !== index));
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

      {/* --- Kolom Kanan: Form Register --- */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 shadow-2xl md:shadow-none z-10 overflow-y-auto">
        
        <div className="w-full max-w-md mx-auto">
          {/* Logo & Nama Aplikasi */}
          <div className="flex items-center gap-3 mb-10">
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
              Buat Akun Baru
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Lengkapi form di bawah ini untuk mendaftarkan akun Anda ke dalam sistem.
            </p>
          </div>

          {/* Pesan Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 flex items-center gap-3 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pesan Sukses */}
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-xl p-3 flex items-center gap-3 animate-in fade-in duration-300">
              <PartyPopper className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
              <div className="relative flex items-center group">
                <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Buat username Anda"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Input Password & Konfirmasi (Bersebelahan) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative flex items-center group">
                  <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Konfirmasi</label>
                <div className="relative flex items-center group">
                  <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm" required />
                </div>
              </div>
            </div>

            {/* Input NIS Murid (Dinamis) */}
            <div className="space-y-3 pt-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">NIS Anak</label>
              {nisList.map((nis, index) => (
                <div key={index} className="relative flex items-center group">
                  <div className="absolute left-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <BookUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => handleNisChange(index, e.target.value)}
                    placeholder={`NIS Anak ke-${index + 1}`}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400 shadow-sm"
                    required
                  />
                  {/* Tombol Hapus hanya muncul jika ada lebih dari 1 input */}
                  {nisList.length > 1 && (
                    <button type="button" onClick={() => removeNisInput(index)} className="absolute right-4 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {/* Tombol Tambah Anak */}
              <button
                type="button"
                onClick={addNisInput}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl border-2 border-dashed border-blue-200 transition-all focus:outline-none flex justify-center items-center gap-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Tambah NIS Anak
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 space-y-4">
              <button type="submit" disabled={isLoading || success} className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all focus:outline-none flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
              
              <Link href="/login" className="w-full py-3.5 px-6 bg-white border-2 border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold rounded-full transition-all focus:outline-none flex justify-center items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Login
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}