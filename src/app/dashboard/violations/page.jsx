'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, Inbox, Filter, ShieldAlert, Loader2, X, CheckCircle } from 'lucide-react';
import api from '../../../lib/axios';

export default function ViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '' });
  const [successMessage, setSuccessMessage] = useState('');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [students, setStudents] = useState([]);
  const [rules, setRules] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    rule_id: '',
    description: '',
    date: new Date().toISOString().substring(0, 10)
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [showRuleList, setShowRuleList] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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

      // Cek apakah ada instruksi dari URL untuk otomatis membuka Modal
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('action') === 'new') {
        setFormData({ student_id: '', rule_id: '', description: '', date: new Date().toISOString().substring(0, 10) });
        setStudentSearch('');
        setRuleSearch('');
        setEditId(null);
        setIsModalOpen(true);
        window.history.replaceState({}, '', window.location.pathname); // Bersihkan URL
      }
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

  const handleEditClick = (v) => {
    setFormData({
      student_id: v.student_id?._id || '',
      rule_id: v.rule_id?._id || '',
      description: v.description || '',
      date: v.date ? new Date(v.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)
    });
    setStudentSearch(v.student_id ? `${v.student_id.name} (${v.student_id.nis})` : '');
    setRuleSearch(v.rule_id ? `${v.rule_id.violation_name} (+${v.rule_id.points} Poin)` : '');
    setEditId(v._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) return alert('Silakan pilih siswa dari daftar pencarian.');
    if (!formData.rule_id) return alert('Silakan pilih jenis pelanggaran dari daftar pencarian.');

    try {
      if (editId) {
        await api.put(`/violations/${editId}`, formData);
      } else {
        await api.post('/violations', formData);
      }
      setFormData({ student_id: '', rule_id: '', description: '', date: new Date().toISOString().substring(0, 10) });
      setStudentSearch('');
      setRuleSearch('');
      setEditId(null);
      setIsModalOpen(false);
      fetchViolations(); // Refresh data
      showSuccess(editId ? 'Pelanggaran berhasil diperbarui!' : 'Pelanggaran berhasil dicatat!');
    } catch (error) {
      console.error('Gagal mencatat pelanggaran', error);
      alert(error.response?.data?.message || 'Gagal mencatat pelanggaran');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/violations/${deleteId}`);
      fetchViolations();
      showSuccess('Riwayat pelanggaran berhasil dihapus!');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
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

  const filteredStudentsForDropdown = students.filter(s => 
    s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.nis?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredRulesForDropdown = rules.filter(r => 
    r.violation_name?.toLowerCase().includes(ruleSearch.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Log Pelanggaran</h2>
          <p className="text-sm text-slate-500 mt-1">Riwayat pelanggaran siswa yang telah dicatat dalam sistem.</p>
        </div>
        {canManageData && (
          <button onClick={() => {
            setFormData({ student_id: '', rule_id: '', description: '', date: new Date().toISOString().substring(0, 10) });
            setStudentSearch('');
            setRuleSearch('');
            setEditId(null);
            setIsModalOpen(true);
          }} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
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
                {canManageData && <th className="px-6 py-4 font-semibold text-center w-28">Aksi</th>}
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
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button onClick={() => handleEditClick(v)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors mr-1" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => confirmDelete(v._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-visible animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editId ? 'Edit Data Pelanggaran' : 'Catat Pelanggaran'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setFormData(prev => ({ ...prev, student_id: '' }));
                      setShowStudentList(true);
                    }}
                    onFocus={() => setShowStudentList(true)}
                    onBlur={() => setTimeout(() => setShowStudentList(false), 200)}
                    placeholder="Cari Nama atau NIS..." 
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {showStudentList && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-lg max-h-40 rounded-lg overflow-y-auto py-1 custom-scrollbar">
                    {filteredStudentsForDropdown.length > 0 ? (
                      filteredStudentsForDropdown.map(s => (
                        <li key={s._id} onClick={() => { setFormData(prev => ({ ...prev, student_id: s._id })); setStudentSearch(`${s.name} (${s.nis})`); setShowStudentList(false); }} className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer">
                          <span className="font-semibold">{s.name}</span> <span className="text-slate-500">({s.nis})</span>
                        </li>
                      ))
                    ) : (<li className="px-3 py-2 text-sm text-slate-500 italic">Siswa tidak ditemukan</li>)}
                  </ul>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pelanggaran</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={ruleSearch}
                    onChange={(e) => {
                      setRuleSearch(e.target.value);
                      setFormData(prev => ({ ...prev, rule_id: '' }));
                      setShowRuleList(true);
                    }}
                    onFocus={() => setShowRuleList(true)}
                    onBlur={() => setTimeout(() => setShowRuleList(false), 200)}
                    placeholder="Cari Pelanggaran..." 
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {showRuleList && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-lg max-h-40 rounded-lg overflow-y-auto py-1 custom-scrollbar">
                    {filteredRulesForDropdown.length > 0 ? (
                      filteredRulesForDropdown.map(r => (
                        <li key={r._id} onClick={() => { setFormData(prev => ({ ...prev, rule_id: r._id })); setRuleSearch(`${r.violation_name} (+${r.points} Poin)`); setShowRuleList(false); }} className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                          <span className="truncate pr-2">{r.violation_name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${getCategoryBadge(r.category)}`}>+{r.points}</span>
                        </li>
                      ))
                    ) : (<li className="px-3 py-2 text-sm text-slate-500 italic">Aturan tidak ditemukan</li>)}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan (Opsional)</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tambahkan catatan khusus jika ada..." className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">{editId ? 'Simpan Perubahan' : 'Simpan Pelanggaran'}</button>
              </div>
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
            <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus log pelanggaran ini? Poin siswa akan otomatis disesuaikan.</p>
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
