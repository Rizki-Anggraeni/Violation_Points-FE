'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import {
  Home,
  Users,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  User
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      } catch (e) {
        console.error('Gagal memproses token');
      }
    }

    // Cek apakah ada pesan error dari middleware di URL
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('error') === 'unauthorized') {
      setNotification('Akses ditolak. Anda tidak memiliki wewenang untuk membuka halaman tersebut.');
      // Bersihkan URL dari parameter error tanpa me-reload halaman
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setTimeout(() => setNotification(''), 4000); // Hilangkan notifikasi setelah 4 detik
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Hapus cookies token dengan set expires ke masa lalu
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Toast Notifikasi Penolakan Akses */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100] bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium pr-2">{notification}</span>
          <button onClick={() => setNotification('')} className="ml-auto pl-2 border-l border-red-400/50 hover:text-red-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar role={role} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 shrink-0 bg-white shadow-sm border-b border-slate-200 flex items-center px-4 lg:px-8 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none mr-4">
              <Menu size={24} />
            </button>
          </div>

        {/* Search Input Kiri/Tengah */}
        <div className="flex-1 max-w-xl px-4 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Cari data siswa atau kelas..."
              className="w-full pl-10 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
              />
            {headerSearch && (
              <button onClick={() => setHeaderSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            </div>
          </div>

        {/* Profile Info Kanan */}
        <div className="flex items-center justify-end ml-auto relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-3 focus:outline-none">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">Guru Agung Rizki</p>
              <p className="text-xs text-slate-500 uppercase">{role.replace(/_/g, ' ')}</p>
            </div>
            <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border border-emerald-200 shadow-sm">
              GA
            </span>
          </button>

          {/* Dropdown Profile Menu */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-semibold text-slate-700">Guru Agung Rizki</p>
                <p className="text-xs text-slate-500 uppercase">{role.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </button>
            </div>
          )}
        </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}