'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Inbox, Filter, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/axios';

export default function DataSiswaPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '' });

  const [successMessage, setSuccessMessage] = useState('');
  // Modal & Form States (Pastikan ini berada di dalam DataSiswaPage)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    class_id: '',
    parrent_phone: ''
  });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
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

    fetchData();
  }, []);

  const handleEditClick = (student) => {
    setFormData({
      nis: student.nis,
      name: student.name,
      class_id: student.class_id?._id || student.class_id,
      parrent_phone: student.parrent_phone || ''
    });
    setEditId(student._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/students/${editId}`, formData);
      } else {
        await api.post('/students', formData);
      }
      setFormData({ nis: '', name: '', class_id: '', parrent_phone: '' });
      setEditId(null);
      setIsModalOpen(false);
      fetchData(); // Refresh data
      showSuccess(editId ? 'Data siswa berhasil diperbarui!' : 'Data siswa berhasil ditambahkan!');
    } catch (error) {
      console.error('Gagal menyimpan data siswa', error);
      alert(error.response?.data?.message || 'Gagal menyimpan siswa');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/students/${deleteId}`);
      fetchData();
      showSuccess('Data siswa berhasil dihapus!');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Gagal menghapus siswa', error);
      alert('Gagal menghapus siswa');
    }
  };

  // Hak akses CRUD Data Siswa (Hanya admin & guru bk)
  const canManageData = ['admin', 'bk', 'guru_bk'].includes(currentUser.role);
  const showClassFilter = !['wali_kelas', 'sekretaris'].includes(currentUser.role);

  // Logika Filter dan Search di sisi klien
  const filteredStudents = students.filter(student => {
    const matchSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) || student.nis?.includes(searchQuery);
    const className = student.class_id?.name || '';
    const matchClass = classFilter ? className === classFilter : true;
    return matchSearch && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi Sukses */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium pr-2">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto pl-2 border-l border-emerald-400/50 hover:text-emerald-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Siswa</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data siswa, kelas, dan informasi personal.</p>
        </div>
        {canManageData && (
          <button onClick={() => {
            setFormData({ nis: '', name: '', class_id: '', parrent_phone: '' });
            setEditId(null);
            setIsModalOpen(true);
          }} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
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
        {showClassFilter && (
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
        )}
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
                  <td colSpan={canManageData ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
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
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    <Link href={`/dashboard/siswa/${student._id}`} className="hover:text-blue-600 hover:underline transition-colors" title="Lihat Detail Siswa">
                      {student.name}
                    </Link>
                  </td>
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
                          <button onClick={() => handleEditClick(student)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirmDelete(student._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
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

      {/* Modal Form Tambah Siswa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">NIS</label><input type="text" required value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} placeholder="Nomor Induk Siswa" className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Siswa" className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label><select required value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})} className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="">-- Pilih Kelas --</option>{classes.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">No. HP Orang Tua (Opsional)</label><input type="text" value={formData.parrent_phone} onChange={e => setFormData({...formData, parrent_phone: e.target.value})} placeholder="08123456789" className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">{editId ? 'Simpan Perubahan' : 'Simpan Siswa'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden text-center p-6 zoom-in-95 animate-in duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteId(null); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">Batal</button>
              <button onClick={executeDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}