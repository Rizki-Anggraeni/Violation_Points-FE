'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Inbox, Filter, ShieldAlert, Loader2, X } from 'lucide-react';
import api from '../../../lib/axios';

export default function ViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '' });

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [rules, setRules] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    rule_id: '',
    description: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    let role = '';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        role = payload.role;
        setCurrentUser({ role });
      } catch (e) {
        console.error('Gagal memproses token');
      }
    }
    fetchViolations();
    
    // Hanya ambil data form (siswa & aturan) jika punya akses mengubah data
    if (['admin', 'bk', 'guru_bk'].includes(role)) {
      fetchFormData();
    }
  }, []);

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/violations');
      setViolations(response.data);
    } catch (error) {
      console.error('Gagal mengambil data log pelanggaran:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [studentsRes, rulesRes] = await Promise.all([
        api.get('/students'),
        api.get('/violation-rules')
      ]);
      setStudents(studentsRes.data);
      setRules(rulesRes.data);
    } catch (error) {
      console.error('Gagal mengambil data form:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/violations', formData);
      setFormData({ student_id: '', rule_id: '', description: '' });
      setIsModalOpen(false);
      fetchViolations(); // Refresh data
    } catch (error) {
      console.error('Gagal mencatat pelanggaran', error);
      alert(error.response?.data?.message || 'Gagal mencatat pelanggaran');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus log pelanggaran ini? Poin siswa tidak akan otomatis berkurang di versi ini.')) return;
    try {
      await api.delete(`/violations/${id}`);
      fetchViolations();
    } catch (error) {
      console.error('Gagal menghapus log', error);
    }
  };

  // Hak Akses
  const canManageData = ['admin', 'bk', 'guru_bk'].includes(currentUser.role);

  // Logika Search
  const filteredViolations = violations.filter(v => {
    const searchLower = searchQuery.toLowerCase();
    return (
      v.student_id?.name?.toLowerCase().includes(searchLower) ||
      v.student_id?.nis?.toLowerCase().includes(searchLower) ||
      v.rule_id?.violation_name?.toLowerCase().includes(searchLower)
    );
  });

  // Helper Formatting
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Log Pelanggaran</h2>
          <p className="text-sm text-slate-500 mt-1">Riwayat pelanggaran siswa yang telah dicatat dalam sistem.</p>
        </div>
        {canManageData && (
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Catat Pelanggaran
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Cari nama siswa, NIS, atau pelanggaran..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-semibold w-16">No</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold">Pelanggaran</th>
                <th className="px-6 py-4 font-semibold text-center">Poin</th>
                {canManageData && <th className="px-6 py-4 font-semibold text-center w-20">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={canManageData ? 6 : 5} className="px-6 py-12 text-center text-slate-500"><div className="flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 mr-3"/> Memuat log pelanggaran...</div></td></tr>
              ) : filteredViolations.length > 0 ? (
                filteredViolations.map((v, index) => (
                  <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{formatDate(v.date)}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">{v.student_id?.name || 'Siswa Dihapus'}</span>
                      <span className="text-xs text-slate-500">NIS: {v.student_id?.nis || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 block">{v.rule_id?.violation_name || 'Aturan Dihapus'}</span>
                      <span className="text-xs text-slate-500 line-clamp-1" title={v.description}>{v.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border ${getCategoryBadge(v.rule_id?.category)}`}>
                        +{v.rule_id?.points || 0}
                      </span>
                    </td>
                    {canManageData && (
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleDelete(v._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={canManageData ? 6 : 5} className="px-6 py-12 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><ShieldAlert className="w-12 h-12 mb-3 text-slate-300" /><p className="text-base font-medium text-slate-600">Belum ada riwayat pelanggaran</p></div></td></tr>
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
              <h3 className="font-bold text-slate-800">Catat Pelanggaran</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa</label><select required value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="">-- Pilih Siswa --</option>{students.map(s => (<option key={s._id} value={s._id}>{s.name} ({s.nis})</option>))}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pelanggaran</label><select required value={formData.rule_id} onChange={e => setFormData({...formData, rule_id: e.target.value})} className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"><option value="">-- Pilih Aturan --</option>{rules.map(r => (<option key={r._id} value={r._id}>{r.violation_name} (+{r.points} Poin)</option>))}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Keterangan (Opsional)</label><textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tambahkan catatan khusus jika ada..." className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea></div>
              <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Simpan Pelanggaran</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
