'use client';
import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Search, Loader2, BookAlert, Calendar, User, FileText, X, CheckCircle, Edit, Trash2 } from 'lucide-react';
import api from '../../../lib/axios';

// Helper component for empty states in tables
const EmptyState = ({ icon: Icon, message }) => (
  <div className="text-center py-10 px-6">
    <Icon className="mx-auto h-12 w-12 text-slate-300" />
    <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
  </div>
);

export default function ViolationsLogPage() {
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [rulesList, setRulesList] = useState([]);
  const [formData, setFormData] = useState({ student_id: '', rule_id: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State untuk Fitur Edit & Hapus
  const [editId, setEditId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // State untuk Live Search Dropdown Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [ruleSearch, setRuleSearch] = useState('');
  const [isRuleDropdownOpen, setIsRuleDropdownOpen] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  useEffect(() => {
    const fetchViolations = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/violations');
        // Urutkan dari yang paling baru
        const sortedData = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setViolations(sortedData);
      } catch (error) {
        console.error("Gagal mengambil data pelanggaran:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViolations();

    // Ambil role dari token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch (e) {}
    }

    // Cek parameter URL dari dashboard (misal: /dashboard/violations?action=add)
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add') {
      handleAddClick();
      // Bersihkan parameter dari URL setelah modal terbuka
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Ambil data form (siswa & aturan) saat modal mulai dibuka
  useEffect(() => {
    if (isModalOpen && students.length === 0) {
      const fetchFormData = async () => {
        try {
          const [studentsRes, rulesRes] = await Promise.all([
            api.get('/students'),
            api.get('/violation-rules')
          ]);
          setStudents(studentsRes.data);
          setRulesList(rulesRes.data);
        } catch (err) {
          console.error("Gagal mengambil data form", err);
        }
      };
      fetchFormData();
    }
  }, [isModalOpen, students.length]);

  // Handler untuk membuka modal tambah
  const handleAddClick = () => {
    setEditId(null);
    setFormData({ student_id: '', rule_id: '', date: new Date().toISOString().split('T')[0], description: '' });
    setStudentSearch('');
    setRuleSearch('');
    setIsModalOpen(true);
  };

  // Handler untuk membuka modal edit
  const handleEditClick = (v) => {
    setEditId(v._id);
    setFormData({
      student_id: v.student_id?._id || '',
      rule_id: v.rule_id?._id || '',
      date: new Date(v.date).toISOString().split('T')[0],
      description: v.description || ''
    });
    setStudentSearch(v.student_id ? `${v.student_id.name} (NIS: ${v.student_id.nis})` : '');
    setRuleSearch(v.rule_id ? `${v.rule_id.violation_name} (+${v.rule_id.points} Poin)` : '');
    setIsModalOpen(true);
  };

  const handleSubmitViolation = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.rule_id) {
      alert('Silakan pilih Siswa dan Jenis Pelanggaran dari daftar rekomendasi.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        await api.put(`/violations/${editId}`, formData);
        showSuccess('Data pelanggaran berhasil diperbarui!');
      } else {
        await api.post('/violations', formData);
        showSuccess('Data pelanggaran berhasil dicatat!');
      }
      
      setIsModalOpen(false);
      setEditId(null);
      
      const response = await api.get('/violations');
      setViolations(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Gagal menyimpan pelanggaran:", error);
      alert(error.response?.data?.message || 'Terjadi kesalahan sistem saat menyimpan pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk menghapus
  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/violations/${deleteId}`);
      showSuccess('Catatan pelanggaran berhasil dihapus!');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      const response = await api.get('/violations');
      setViolations(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert(error.response?.data?.message || 'Gagal menghapus pelanggaran');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filter data berdasarkan input search (cari nama atau nama pelanggaran)
  const filteredViolations = violations.filter(v =>
    v.student_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.rule_id?.violation_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter data dropdown pada modal
  const filteredStudentsList = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.nis.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredRulesList = rulesList.filter(r =>
    r.violation_name.toLowerCase().includes(ruleSearch.toLowerCase())
  );

  const canAddViolation = ['admin', 'guru_bk'].includes(userRole);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Log Pelanggaran
          </h1>
          <p className="text-sm text-slate-500 mt-1">Daftar riwayat pelanggaran kedisiplinan siswa.</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau pelanggaran..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 text-slate-500 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          {canAddViolation && (
            <button 
              onClick={handleAddClick}
              className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Catat Pelanggaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredViolations.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left font-semibold px-5 py-4">Tanggal</th>
                  <th className="text-left font-semibold px-5 py-4">Siswa</th>
                  <th className="text-left font-semibold px-5 py-4">Pelanggaran</th>
                  <th className="text-center font-semibold px-5 py-4">Poin</th>
                  <th className="text-left font-semibold px-5 py-4">Pelapor</th>
                  {canAddViolation && <th className="text-center font-semibold px-5 py-4 w-28">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredViolations.map(v => (
                  <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(v.date)}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {v.student_id?.name || 'Siswa Dihapus'}
                      </div>
                      <div className="text-xs text-slate-500 font-normal mt-0.5 ml-6">
                        NIS: {v.student_id?.nis || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2 max-w-xs">
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-700 font-medium line-clamp-2">
                          {v.rule_id?.violation_name || 'Aturan Dihapus'}
                        </span>
                      </div>
                      {v.description && (
                        <p className="text-xs text-slate-500 mt-1 ml-6 line-clamp-1 italic">
                          "{v.description}"
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full text-xs min-w-[3rem]">
                        +{v.rule_id?.points || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {v.reported_by?.username || '-'}
                    </td>
                    {canAddViolation && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEditClick(v)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirmDelete(v._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={BookAlert} message={searchTerm ? "Tidak ada pelanggaran yang cocok dengan pencarian." : "Belum ada riwayat pelanggaran tercatat."} />
          )}
        </div>
      </div>

      {/* Modal Form Tambah Pelanggaran */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800">{editId ? 'Edit Pelanggaran' : 'Catat Pelanggaran Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitViolation} className="p-6 space-y-4 overflow-y-auto">
              {/* Live Search Pilihan Siswa */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa</label>
                <input
                  type="text"
                  required={!formData.student_id}
                  placeholder="Ketik nama atau NIS siswa..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setIsStudentDropdownOpen(true);
                    setFormData({ ...formData, student_id: '' });
                  }}
                  onFocus={() => setIsStudentDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsStudentDropdownOpen(false), 200)}
                  className="w-full px-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {isStudentDropdownOpen && (
                  <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {filteredStudentsList.length > 0 ? filteredStudentsList.map(s => (
                      <li key={s._id} className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer text-slate-800 text-sm border-b border-slate-50 last:border-0"
                          onMouseDown={() => { setFormData({ ...formData, student_id: s._id }); setStudentSearch(`${s.name} (NIS: ${s.nis})`); setIsStudentDropdownOpen(false); }}>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-slate-500">NIS: {s.nis}</div>
                      </li>
                    )) : <li className="px-3 py-2 text-slate-500 text-sm">Siswa tidak ditemukan</li>}
                  </ul>
                )}
              </div>
              
              {/* Live Search Pilihan Aturan */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pelanggaran</label>
                <input
                  type="text"
                  required={!formData.rule_id}
                  placeholder="Ketik jenis pelanggaran..."
                  value={ruleSearch}
                  onChange={(e) => {
                    setRuleSearch(e.target.value);
                    setIsRuleDropdownOpen(true);
                    setFormData({ ...formData, rule_id: '' });
                  }}
                  onFocus={() => setIsRuleDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsRuleDropdownOpen(false), 200)}
                  className="w-full px-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {isRuleDropdownOpen && (
                  <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {filteredRulesList.length > 0 ? filteredRulesList.map(r => (
                      <li key={r._id} className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer text-slate-800 text-sm border-b border-slate-50 last:border-0 flex justify-between items-center"
                          onMouseDown={() => { setFormData({ ...formData, rule_id: r._id }); setRuleSearch(`${r.violation_name} (+${r.points} Poin)`); setIsRuleDropdownOpen(false); }}>
                        <span className="line-clamp-2 pr-2">{r.violation_name}</span>
                        <span className="text-red-600 font-bold text-xs shrink-0 bg-red-50 px-2 py-0.5 rounded-md">+{r.points}</span>
                      </li>
                    )) : <li className="px-3 py-2 text-slate-500 text-sm">Aturan tidak ditemukan</li>}
                  </ul>
                )}
              </div>
              {/* Input Tanggal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Kejadian</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              {/* Input Keterangan Opsional */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan (Opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Tulis detail kronologi atau catatan di sini..."
                  rows="3"
                  className="w-full px-3 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                ></textarea>
              </div>
              {/* Aksi Form */}
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm disabled:opacity-50 transition-colors flex items-center">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editId ? 'Simpan Perubahan' : 'Simpan Pelanggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden text-center p-6 zoom-in-95 animate-in duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Pelanggaran</h3>
            <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus data pelanggaran ini? Aksi ini akan mengembalikan total poin siswa.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteId(null); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">
                Batal
              </button>
              <button onClick={executeDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}