'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Inbox, Filter } from 'lucide-react';
import api from '../../../lib/axios';

export default function DataSiswaPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ role: payload.role });
      } catch (e) {
        console.error('Gagal memproses token');
      }
    }

    const fetchData = async () => {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          api.get('/students'),
          api.get('/classes')
        ]);
        setStudents(studentsRes.data);
        setClasses(classesRes.data);
      } catch (error) {
        console.error('Gagal mengambil data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hak akses CRUD Data Siswa (Hanya admin & guru bk)
  const canManageData = ['admin', 'bk', 'guru_bk'].includes(currentUser.role);

  // Logika Filter dan Search di sisi klien
  const filteredStudents = students.filter(student => {
    const matchSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.nis?.includes(searchQuery);
    const className = student.class_id?.name || '';
    const matchClass = classFilter ? className === classFilter : true;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Siswa</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data siswa, kelas, dan informasi personal.</p>
        </div>
        {canManageData && (
          <button className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none"
          >
            <option value="">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls.name}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold w-16">No</th>
                <th className="px-6 py-4 font-semibold">NIS</th>
                <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold text-center">Total Poin</th>
                {canManageData && <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                       Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium">{student.nis}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{student.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {student.class_id?.name || 'Tanpa Kelas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.total_points > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {student.total_points} Poin
                      </span>
                    </td>
                    {canManageData && (
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
                    )}
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={canManageData ? "6" : "5"} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Inbox className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-600">Tidak ada data siswa</p>
                      <p className="text-sm mt-1">Coba sesuaikan filter atau pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
        {!isLoading && filteredStudents.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredStudents.length}</span> dari <span className="font-medium text-slate-700">{students.length}</span> siswa
            </span>
          </div>
        )}
      </div>
    </div>
  );
}