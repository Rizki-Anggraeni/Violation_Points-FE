'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Filter
} from 'lucide-react';
import api from '../../../lib/axios';

export default function ViolationRulesPage() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return { role: payload.role || '' };
        } catch (e) {
          console.error('Gagal decode token pengguna');
        }
      }
    }
    return { role: '' };
  });

  // State untuk Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // State Modal Tambah/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    violation_name: '',
    points: 5,
    category: 'Ringan'
  });

  // State Modal Konfirmasi Hapus
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State Notifikasi Toast
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: 'success', message: '' });
    }, 3500);
  };

  const fetchRules = async () => {
    try {
      const response = await api.get('/violation-rules');
      // Urutkan berdasarkan poin terendah ke tertinggi
      const sortedData = response.data.sort((a, b) => a.points - b.points);
      setRules(sortedData);
    } catch (error) {
      console.error('Error fetching violation rules:', error);
      showToast('error', 'Gagal memuat daftar aturan pelanggaran.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.get('/violation-rules')
      .then((response) => {
        if (!ignore) {
          const sortedData = response.data.sort((a, b) => a.points - b.points);
          setRules(sortedData);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error('Error fetching violation rules:', error);
          showToast('error', 'Gagal memuat daftar aturan pelanggaran.');
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Cek hak akses modifikasi data (Hanya admin & guru BK)
  const canManage = ['admin', 'guru_bk', 'bk'].includes(currentUser.role);

  // Logika Filter & Pencarian
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const filteredRules = rules.filter((rule) => {
    const matchSearch =
      rule.violation_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter ? rule.category === categoryFilter : true;
    return matchSearch && matchCategory;
  });

  // Logika Paginasi
  const totalPages = Math.ceil(filteredRules.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRules.slice(indexOfFirstItem, indexOfLastItem);

  // Buka Modal Tambah
  const handleOpenAddModal = () => {
    setEditId(null);
    setFormData({
      violation_name: '',
      points: 5,
      category: 'Ringan'
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEditModal = (rule) => {
    setEditId(rule._id);
    setFormData({
      violation_name: rule.violation_name,
      points: rule.points,
      category: rule.category
    });
    setIsModalOpen(true);
  };

  // Simpan Data (POST/PUT)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.violation_name.trim()) {
      showToast('error', 'Nama aturan pelanggaran wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        violation_name: formData.violation_name.trim(),
        points: Number(formData.points),
        category: formData.category
      };

      if (editId) {
        await api.put(`/violation-rules/${editId}`, payload);
        showToast('success', 'Aturan pelanggaran berhasil diperbarui!');
      } else {
        await api.post('/violation-rules', payload);
        showToast('success', 'Aturan pelanggaran baru berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      setEditId(null);
      fetchRules();
    } catch (error) {
      console.error('Gagal menyimpan aturan:', error);
      const msg = error.response?.data?.message || 'Gagal menyimpan aturan pelanggaran.';
      showToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Buka Modal Konfirmasi Hapus
  const handleOpenDeleteModal = (rule) => {
    setSelectedRule(rule);
    setIsDeleteModalOpen(true);
  };

  // Eksekusi Hapus Data (DELETE)
  const executeDelete = async () => {
    if (!selectedRule) return;

    try {
      setIsDeleting(true);
      await api.delete(`/violation-rules/${selectedRule._id}`);
      showToast('success', 'Aturan pelanggaran berhasil dihapus.');
      setIsDeleteModalOpen(false);
      setSelectedRule(null);
      fetchRules();
    } catch (error) {
      console.error('Gagal menghapus aturan:', error);
      const msg = error.response?.data?.message || 'Gagal menghapus aturan pelanggaran.';
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Styling Badge Kategori
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Ringan':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Sedang':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Berat':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Toast Notifikasi */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-100 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-5 duration-300 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium pr-2">{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, type: 'success', message: '' })}
            className="ml-auto pl-2 border-l border-white/20 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Aksi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Aturan Pelanggaran</h1>
            <p className="text-slate-500 text-sm mt-1">Daftar jenis tata tertib, kategori tingkat pelanggaran, dan bobot poin.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Input Pencarian */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama aturan..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter Kategori */}
          <div className="relative w-full sm:w-40">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={handleCategoryFilter}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>

          {/* Tombol Tambah Aturan */}
          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Aturan
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-150">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold w-16 text-center">No</th>
                <th className="px-6 py-4 font-semibold">Nama Pelanggaran</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Poin</th>
                {canManage && <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium">Memuat data aturan...</p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((rule, index) => (
                  <tr key={rule._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-center font-medium text-slate-400">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {rule.violation_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadge(rule.category)}`}>
                        {rule.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${rule.points < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {rule.points > 0 ? `+${rule.points}` : rule.points}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Aturan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(rule)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Hapus Aturan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Tidak ada data aturan pelanggaran yang ditemukan.</p>
                    <p className="text-slate-400 text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Paginasi */}
        {!isLoading && filteredRules.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-medium text-slate-800">{indexOfFirstItem + 1}</span> hingga{' '}
              <span className="font-medium text-slate-800">{Math.min(indexOfLastItem, filteredRules.length)}</span> dari{' '}
              <span className="font-medium text-slate-800">{filteredRules.length}</span> aturan
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Aturan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 zoom-in-95 animate-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-lg">
                  {editId ? 'Edit Aturan Pelanggaran' : 'Tambah Aturan Pelanggaran'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Nama Pelanggaran */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nama Pelanggaran <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  value={formData.violation_name}
                  onChange={(e) => setFormData({ ...formData, violation_name: e.target.value })}
                  placeholder="Contoh: Terlambat mengikuti upacara bendera"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white placeholder-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Kategori Pelanggaran */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tingkat Kategori <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ringan', 'Sedang', 'Berat'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.category === cat
                          ? cat === 'Ringan'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : cat === 'Sedang'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-red-500 text-white border-red-500 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bobot Poin */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Bobot Poin <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="Nilai poin (misal: 5, 10, 25)"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white placeholder-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">Poin penalti yang ditambahkan saat siswa melanggar aturan ini.</p>
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Simpan Perubahan' : 'Tambah Aturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {isDeleteModalOpen && selectedRule && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6 zoom-in-95 animate-in duration-200 border border-slate-100">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Hapus Aturan?</h3>
            <p className="text-sm text-slate-500 mb-2">
              Apakah Anda yakin ingin menghapus aturan:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium mb-6">
              &ldquo;{selectedRule.violation_name}&rdquo; (+{selectedRule.points} Poin)
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedRule(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}