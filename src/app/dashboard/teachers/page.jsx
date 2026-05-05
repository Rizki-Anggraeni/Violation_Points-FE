'use client';

import { useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Inbox, Filter } from 'lucide-react';
import { dummyTeachers } from '../../../lib/dummyData';

export default function DataWaliKelasPage() {
  const [teachers, setTeachers] = useState(dummyTeachers);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Logika Filter dan Search
  const filteredTeachers = teachers.filter(teacher => {
    const matchSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || teacher.nip.includes(searchQuery);
    const matchClass = classFilter ? teacher.className === classFilter : true;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Wali Kelas</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data guru yang bertugas sebagai wali kelas.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Wali Kelas
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none"
          >
            <option value="">Semua Kelas</option>
            <option value="X RPL 1">X RPL 1</option>
            <option value="X RPL 2">X RPL 2</option>
            <option value="XI TKJ 1">XI TKJ 1</option>
            <option value="XI TKJ 2">XI TKJ 2</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold w-16">No</th>
                <th className="px-6 py-4 font-semibold">NIP</th>
                <th className="px-6 py-4 font-semibold">Nama Wali Kelas</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium">{teacher.nip}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{teacher.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {teacher.className}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Inbox className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-600">Tidak ada data wali kelas</p>
                      <p className="text-sm mt-1">Coba sesuaikan filter atau pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
        {filteredTeachers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredTeachers.length}</span> dari <span className="font-medium text-slate-700">{teachers.length}</span> wali kelas
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                Sebelumnya
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}