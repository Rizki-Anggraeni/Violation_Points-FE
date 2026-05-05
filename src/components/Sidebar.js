'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronUp,
  X,
  CheckSquare,
  FileText,
  Table
} from 'lucide-react';

export default function Sidebar({ role, onLogout, isOpen, setIsOpen }) {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({
    master: false,
    laporan: false
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Pengecekan role: admin, bk (atau guru_bk), guru, dan wali_kelas bisa melihat Data Master
  const isMasterVisible = role === 'admin' || role === 'bk' || role === 'guru_bk' || role === 'guru' || role === 'wali_kelas';
  const canSeeTeachers = role === 'admin' || role === 'bk' || role === 'guru_bk';

  return (
    <>
      <aside className={`fixed lg:static shrink-0 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo & Nama Instansi */}
      <div className="flex flex-col items-center justify-center py-6 border-b border-slate-100 relative">
        <button onClick={() => setIsOpen && setIsOpen(false)} className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-2 shadow-md">
          <span className="text-white font-extrabold text-lg tracking-wider">PUI</span>
        </div>
        <span className="text-base font-bold text-slate-800 tracking-tight">SMKN 1 Pringsurat</span>
        <span className="text-xs text-slate-500 font-medium mt-1">Sistem Poin Pelanggaran</span>
      </div>

      {/* Menu Navigasi */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-2 px-4">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setIsOpen && setIsOpen(false)}
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              pathname === '/dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mr-3 transition-colors ${pathname === '/dashboard' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>

          {/* Dropdown Data Master */}
          {isMasterVisible && (
            <div className="space-y-1">
              <button
                onClick={() => toggleDropdown('master')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <div className="flex items-center">
                  <Database className="w-5 h-5 mr-3 text-slate-400 transition-colors group-hover:text-blue-500" />
                  <span className="text-sm font-medium">Data Master</span>
                </div>
                {openDropdowns.master ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {/* Isi Dropdown Data Master */}
              {openDropdowns.master && (
                <div className="relative pl-11 pr-3 py-1 space-y-1 mt-1">
                  {/* Garis vertikal indikator */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
                  
                  <Link onClick={() => setIsOpen && setIsOpen(false)} href="/dashboard/students" className={`block px-3 py-2 text-sm rounded-md transition-colors relative ${pathname.startsWith('/dashboard/students') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Data Siswa</Link>
                  {canSeeTeachers && <Link onClick={() => setIsOpen && setIsOpen(false)} href="/dashboard/teachers" className={`block px-3 py-2 text-sm rounded-md transition-colors relative ${pathname.startsWith('/dashboard/teachers') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Data Wali Kelas</Link>}
                  <Link onClick={() => setIsOpen && setIsOpen(false)} href="/dashboard/classes" className={`block px-3 py-2 text-sm rounded-md transition-colors relative ${pathname.startsWith('/dashboard/classes') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Data Kelas & Jadwal</Link>
                  <Link onClick={() => setIsOpen && setIsOpen(false)} href="/dashboard/violation-rules" className={`block px-3 py-2 text-sm rounded-md transition-colors relative ${pathname.startsWith('/dashboard/violation-rules') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Aturan Pelanggaran</Link>
                </div>
              )}
            </div>
          )}

          {/* Menu Input Presensi */}
          {role !== 'orang_tua' && role !== 'guru_bk' && (
            <Link
              href="/dashboard/attendances"
              onClick={() => setIsOpen && setIsOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                pathname.startsWith('/dashboard/presensi') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CheckSquare className={`w-5 h-5 mr-3 transition-colors ${pathname.startsWith('/dashboard/presensi') ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
              <span className="text-sm font-medium">Input Presensi</span>
            </Link>
          )}

          {/* Dropdown Laporan */}
          <div className="space-y-1">
            <button
              onClick={() => toggleDropdown('laporan')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-3 text-slate-400 transition-colors group-hover:text-blue-500" />
                <span className="text-sm font-medium">Laporan</span>
              </div>
              {openDropdowns.laporan ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            
            {/* Isi Dropdown Laporan */}
            {openDropdowns.laporan && (
              <div className="relative pl-11 pr-3 py-1 space-y-1 mt-1">
                {/* Garis vertikal indikator */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>

                <button onClick={() => { setIsOpen && setIsOpen(false); setIsExportModalOpen(true); }} className="w-full text-left block px-3 py-2 text-sm rounded-md transition-colors relative text-slate-500 hover:text-slate-900 hover:bg-slate-50">Rekap Presensi</button>
                <Link onClick={() => setIsOpen && setIsOpen(false)} href="/dashboard/violations" className={`block px-3 py-2 text-sm rounded-md transition-colors relative ${pathname.startsWith('/dashboard/violations') ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Log Pelanggaran</Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Tombol Logout */}
      <div className="p-4 bg-white border-t border-slate-100 mt-auto">
        <button
          onClick={onLogout}
          className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </button>
      </div>
    </aside>

      {/* Modal Export Rekap Presensi */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Export Rekap Presensi</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 text-center">Pilih format file untuk mengunduh data rekap presensi.</p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button onClick={() => alert('Fitur Export PDF akan segera disambungkan ke Backend!')} className="flex flex-col items-center justify-center p-4 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm">
                  <FileText className="w-8 h-8 mb-2" />
                  <span className="font-bold text-sm">PDF</span>
                  <span className="text-[10px] font-medium text-red-500/80">Dokumen</span>
                </button>
                <button onClick={() => alert('Fitur Export Excel akan segera disambungkan ke Backend!')} className="flex flex-col items-center justify-center p-4 border border-emerald-200 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
                  <Table className="w-8 h-8 mb-2" />
                  <span className="font-bold text-sm">Excel</span>
                  <span className="text-[10px] font-medium text-emerald-500/80">Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}