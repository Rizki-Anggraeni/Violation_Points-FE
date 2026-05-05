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
  ChevronDown,
  ChevronUp,
  Database,
  FileText,
  Search,
  User
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({ master: false, laporan: false });
  const [role, setRole] = useState('');
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Hapus cookies token dengan set expires ke masa lalu
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/auth/login');
  };

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Menentukan menu berdasarkan role pengguna
  const getMenuItems = () => {
    const baseMenus = [
      { name: 'Dashboard', href: role === 'ortu' ? '/dashboard/ortu' : '/dashboard', icon: Home },
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseMenus,
          {
            name: 'Data Master', icon: Database, key: 'master',
            children: [
              { name: 'Siswa', href: '/dashboard/students', icon: Users },
              { name: 'Kelas', href: '/dashboard/classes', icon: Home },
              { name: 'Jadwal', href: '/dashboard/schedules', icon: Calendar },
              { name: 'Aturan Pelanggaran', href: '/dashboard/violation-rules', icon: Settings },
            ]
          },
          {
            name: 'Laporan', icon: FileText, key: 'laporan',
            children: [
              { name: 'Presensi', href: '/dashboard/attendances', icon: CheckSquare },
              { name: 'Pelanggaran', href: '/dashboard/violations', icon: AlertTriangle },
            ]
          }
        ];
      case 'guru_bk':
        return [
          ...baseMenus,
          { name: 'Data Siswa', href: '/dashboard/students', icon: Users },
          {
            name: 'Laporan', icon: FileText, key: 'laporan',
            children: [{ name: 'Pelanggaran', href: '/dashboard/violations', icon: AlertTriangle }]
          }
        ];
      case 'wali_kelas':
        return [
          ...baseMenus,
          { name: 'Siswa Kelasku', href: '/dashboard/students', icon: Users },
          { name: 'Rekap Presensi', href: '/dashboard/attendances', icon: CheckSquare },
          { name: 'Riwayat Pelanggaran', href: '/dashboard/violations', icon: AlertTriangle },
        ];
      case 'sekretaris':
        return [
          ...baseMenus,
          { name: 'Jadwal Pelajaran', href: '/dashboard/schedules', icon: Calendar },
          { name: 'Input Presensi', href: '/dashboard/attendances', icon: CheckSquare },
        ];
      case 'ortu':
        return [
          ...baseMenus,
          { name: 'Presensi Anak', href: '/dashboard/ortu/attendances', icon: CheckSquare },
          { name: 'Pelanggaran Anak', href: '/dashboard/ortu/violations', icon: AlertTriangle },
        ];
      default: // guru biasa
        return [
          ...baseMenus,
          { name: 'Jadwal Mengajar', href: '/dashboard/schedules', icon: Calendar },
          { name: 'Presensi Kelas', href: '/dashboard/attendances', icon: CheckSquare },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Area */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950">
          <span className="text-xl font-bold text-white tracking-wider">Sistem Poin</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
      <Sidebar role={role} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isStrictlyActive = item.href === '/dashboard' || item.href === '/dashboard/ortu' 
                ? pathname === item.href
                : (item.href && pathname.startsWith(item.href));

              return item.children ? (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleDropdown(item.key)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group hover:bg-slate-800 hover:text-white"
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3 text-slate-400 group-hover:text-slate-300" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {openDropdowns[item.key] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {/* Dropdown Content */}
                  {openDropdowns[item.key] && (
                    <div className="pl-11 pr-3 py-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname.startsWith(child.href) ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={item.name} href={item.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  isStrictlyActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}>
                  <Icon className={`w-5 h-5 mr-3 ${isStrictlyActive ? 'text-blue-200' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 bg-slate-950">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 shrink-0 bg-white shadow-sm border-b border-slate-200 flex items-center px-4 lg:px-8 z-10">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none mr-4">
              <Menu size={24} />
            </button>
          </div>

          {/* Search Input Tengah */}
          <div className="flex-1 max-w-2xl mx-auto px-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari sesuatu..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          {/* Profile Info Kanan */}
          <div className="flex items-center justify-end ml-auto">
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 uppercase">{role.replace(/_/g, ' ')}</p>
              </div>
              <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                <User className="w-5 h-5" />
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}