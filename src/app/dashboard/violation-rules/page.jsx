'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Inbox, Filter, ShieldAlert, Loader2, X } from 'lucide-react';
import api from '../../../lib/axios';

export default function ViolationRulesPage() {
  const [rules, setRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '' });

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    violation_name: '',
    points: '',
    category: 'Ringan'
  });

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/violation-rules');
      setRules(response.data);
    } catch (error) {
      console.error('Gagal mengambil data aturan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/violation-rules', {
        ...formData,
        points: Number(formData.points) // Pastikan poin berupa angka
      });
      setFormData({ violation_name: '', points: '', category: 'Ringan' });
      setIsModalOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Gagal menyimpan aturan', error);
      alert(error.response?.data?.message || 'Gagal menyimpan aturan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aturan pelanggaran ini?')) return;
    try {
      await api.delete(`/violation-rules/${id}`);
      fetchData();
    } catch (error) {
      console.error('Gagal menghapus aturan', error);
    }
  };

  // Filter Role: Hanya admin dan guru_bk yang bisa manage (tambah/edit/hapus)
  const canManageData = ['admin', 'bk', 'guru_bk'].includes(currentUser.role);

  // Logika Filter & Search
  const filteredRules = rules.filter(rule => {
    const matchSearch = rule.violation_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter ? rule.category === categoryFilter : true;
    return matchSearch && matchCategory;
  });

  // Helper untuk warna badge kategori
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Berat': return 'bg-red-100 text-red-700 border-red-200';
      case 'Sedang': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200'; // Ringan
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Aturan Pelanggaran</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar jenis pelanggaran, bobot poin, dan kategorinya.</p>
        </div>
        {canManageData && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Aturan
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Cari nama pelanggaran..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none">
            <option value="">Semua Kategori</option>
            <option value="Ringan">Ringan</option>
            <option value="Sedang">Sedang</option>
            <option value="Berat">Berat</option>
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
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Nama Pelanggaran</th>
                <th className="px-6 py-4 font-semibold text-center">Bobot Poin</th>
                {canManageData && <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={canManageData ? 5 : 4} className="px-6 py-12 text-center text-slate-500"><div className="flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 mr-3"/> Memuat data...</div></td></tr>
              ) : filteredRules.length > 0 ? (
                filteredRules.map((rule, index) => (
                  <tr key={rule._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getCategoryBadge(rule.category)}`}>
                        {rule.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{rule.violation_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {rule.points}
                      </span>
                    </td>
                    {canManageData && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(rule._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={canManageData ? 5 : 4} className="px-6 py-12 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><ShieldAlert className="w-12 h-12 mb-3 text-slate-300" /><p className="text-base font-medium text-slate-600">Tidak ada aturan ditemukan</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Tambah Aturan Pelanggaran</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelanggaran</label><input type="text" required value={formData.violation_name} onChange={e => setFormData({...formData, violation_name: e.target.value})} placeholder="Contoh: Terlambat > 15 Menit" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="Ringan">Ringan</option><option value="Sedang">Sedang</option><option value="Berat">Berat</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Bobot Poin</label><input type="number" required min="1" value={formData.points} onChange={e => setFormData({...formData, points: e.target.value})} placeholder="Misal: 10" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              </div>
              <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Simpan Aturan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}