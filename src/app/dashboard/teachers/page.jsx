'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Inbox, Filter, Loader2, X, CheckCircle } from 'lucide-react';
import api from '../../../lib/axios';

export default function DataWaliKelasPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modal Assign Kelas
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, classRes] = await Promise.all([
        api.get('/users/staff'),
        api.get('/classes')
      ]);
      
      // Filter opsional: jika ingin halaman ini hanya menampilkan wali kelas
      // const onlyWaliKelas = staffRes.data.filter(u => u.role === 'wali_kelas');
      // setTeachers(onlyWaliKelas);
      
      setTeachers(staffRes.data); // Menampilkan wali kelas & sekretaris
      setClasses(classRes.data);
    } catch (error) {
      console.error('Gagal mengambil data staf:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logika Filter dan Search
  const filteredTeachers = teachers.filter(teacher => {
    const matchSearch = teacher.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = classFilter ? teacher.class_id?.name === classFilter : true;
    const matchRole = roleFilter ? teacher.role === roleFilter : true;
    return matchSearch && matchClass && matchRole;
  });

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setSelectedClassId(user.class_id?._id || '');
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser._id}/assign-class`, { 
        class_id: selectedClassId || null 
      });
      setIsAssignModalOpen(false);
      fetchData(); // Refresh data untuk melihat perubahan
    } catch (error) {
      console.error('Gagal menetapkan kelas:', error);
      alert(error.response?.data?.message || 'Gagal menetapkan kelas');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Wali Kelas & Sekretaris</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola akun staf dan tugaskan (assign) mereka ke kelas tertentu.</p>
        </div>
        <button onClick={() => alert('Fitur tambah user akan dibuat di halaman kelola akun.')} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Staf
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari username staf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none"
          >
            <option value="">Semua Peran</option>
            <option value="wali_kelas">Wali Kelas</option>
            <option value="sekretaris">Sekretaris</option>
          </select>
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none"
          >
            <option value="">Semua Kelas</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls.name}>{cls.name}</option>
            ))}
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
                <th className="px-6 py-4 font-semibold">Username Akun</th>
                <th className="px-6 py-4 font-semibold">Peran (Role)</th>
                <th className="px-6 py-4 font-semibold">Status Tugas (Kelas)</th>
                <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                       Memuat data staf...
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher, index) => (
                  <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{teacher.username}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {teacher.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${teacher.class_id ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {teacher.class_id?.name || 'Belum Ditugaskan'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openAssignModal(teacher)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Assign Kelas">
                          <Edit className="w-4 h-4" />
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
                      <p className="text-base font-medium text-slate-600">Tidak ada data staf ditemukan</p>
                      <p className="text-sm mt-1">Coba sesuaikan filter atau pencarian Anda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Section */}
        {!isLoading && filteredTeachers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-700">{filteredTeachers.length}</span> dari <span className="font-medium text-slate-700">{teachers.length}</span> staf
            </span>
          </div>
        )}
      </div>

      {/* Modal Assign Kelas */}
      {isAssignModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Assign Kelas Staf</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Username Akun</p>
                <p className="font-semibold text-slate-800">{selectedUser.username}</p>
                <p className="text-sm text-slate-500 mt-2 mb-1">Peran</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-blue-100 text-blue-700">
                  {selectedUser.role.replace('_', ' ')}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Kelas yang Diampu</label>
                <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full px-3 py-2.5 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Cabut / Kosongkan Tugas --</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">Penting: Setiap kelas hanya boleh memiliki satu wali kelas dan satu sekretaris. Sistem akan menolak jika kelas sudah di-assign ke staf lain dengan peran yang sama.</p>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}