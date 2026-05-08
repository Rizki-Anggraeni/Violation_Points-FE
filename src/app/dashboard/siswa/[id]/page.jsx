'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserCircle, Edit, AlertTriangle, ShieldCheck, CalendarCheck2, Loader2, BookAlert, Trash2, X } from 'lucide-react';
import api from '../../../../lib/axios';

// Helper component for empty states in tables
const EmptyState = ({ icon: Icon, message }) => (
  <div className="text-center py-10 px-6">
    <Icon className="mx-auto h-12 w-12 text-slate-300" />
    <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
  </div>
);

export default function StudentDetailPage() {
  const [student, setStudent] = useState(null);
  const [violations, setViolations] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);
  const [currentUser, setCurrentUser] = useState({ role: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [violationFormData, setViolationFormData] = useState({ rule_id: '', description: '', date: '' });
  const [rules, setRules] = useState([]);
  
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [studentFormData, setStudentFormData] = useState({ nis: '', name: '', class_id: '', parrent_phone: '' });
  const [classes, setClasses] = useState([]);
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (!id) return;

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
      setIsLoading(true);
      try {
        const studentRes = await api.get(`/students/${id}`);
        setStudent(studentRes.data);

        const rulesRes = await api.get('/violation-rules');
        setRules(rulesRes.data);

        const classesRes = await api.get('/classes');
        setClasses(classesRes.data);

        // Fetch all and filter client-side as per existing API structure
        const violationsRes = await api.get('/violations');
        const studentViolations = violationsRes.data
          .filter(v => (v.student_id?._id || v.student_id) === id)
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
        setViolations(studentViolations);

        const attendancesRes = await api.get('/attendances');
        
        // Normalisasi struktur presensi untuk mendukung format array records maupun flat
        let normalizedAttendances = [];
        attendancesRes.data.forEach(item => {
          if (item.records && Array.isArray(item.records)) {
            const studentRecord = item.records.find(r => (r.student_id?._id || r.student_id) === id);
            if (studentRecord) {
              normalizedAttendances.push({
                _id: `${item._id}_${id}`,
                date: item.date,
                schedule_id: item.schedule_id,
                status: studentRecord.status
              });
            }
          } else if ((item.student_id?._id || item.student_id) === id) {
            normalizedAttendances.push(item);
          }
        });

        setAttendances(normalizedAttendances.sort((a, b) => new Date(b.date) - new Date(a.date)));

      } catch (error) {
        console.error("Gagal mengambil data detail siswa:", error);
        setStudent(null); // Set student to null on error to show not found message
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const refreshData = async () => {
    try {
      const studentRes = await api.get(`/students/${id}`);
      setStudent(studentRes.data);

      const violationsRes = await api.get('/violations');
      const studentViolations = violationsRes.data
        .filter(v => (v.student_id?._id || v.student_id) === id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setViolations(studentViolations);
    } catch (error) {
      console.error("Gagal refresh data:", error);
    }
  };

  const handleEditStudentClick = () => {
    setStudentFormData({
      nis: student.nis || '',
      name: student.name || '',
      class_id: student.class_id?._id || student.class_id || '',
      parrent_phone: student.parrent_phone || ''
    });
    setIsStudentEditModalOpen(true);
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${id}`, studentFormData);
      setIsStudentEditModalOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Gagal mengedit data siswa', error);
      alert('Gagal menyimpan perubahan');
    }
  };

  const handleEditClick = (v) => {
    setViolationFormData({
      rule_id: v.rule_id?._id || '',
      description: v.description || '',
      date: v.date ? new Date(v.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)
    });
    setEditId(v._id);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/violations/${editId}`, { ...violationFormData, student_id: id });
      setIsEditModalOpen(false);
      setEditId(null);
      await refreshData();
    } catch (error) {
      console.error('Gagal mengedit pelanggaran', error);
      alert('Gagal menyimpan perubahan');
    }
  };

  const confirmDelete = (violationId) => {
    setDeleteId(violationId);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/violations/${deleteId}`);
      await refreshData();
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Gagal menghapus log', error);
      alert('Gagal menghapus pelanggaran');
    }
  };

  // Animasi progress bar menggunakan CSS saat data selesai diload
  useEffect(() => {
    if (student) {
      setProgressWidth(Math.min(student.total_points || 0, 100));
    }
  }, [student]);

  const getWarningStatus = (points) => {
    if (points >= 76) return { text: 'Peringatan Keras', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    if (points >= 51) return { text: 'Peringatan 2', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle };
    if (points >= 21) return { text: 'Peringatan 1', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    return { text: 'Aman', color: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck };
  };

  const getProgressBarColor = (points) => {
    if (points >= 76) return 'bg-red-500';
    if (points >= 51) return 'bg-orange-500';
    if (points >= 21) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case 'Hadir': return 'bg-emerald-100 text-emerald-700';
      case 'Sakit': return 'bg-amber-100 text-amber-700';
      case 'Izin': return 'bg-blue-100 text-blue-700';
      case 'Alpa': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredAttendances = attendances.filter(a => {
    if (!selectedDateFilter) return true;
    
    const aDate = new Date(a.date).toISOString().split('T')[0];
    return aDate === selectedDateFilter;
  });

  const canManageData = ['admin', 'bk', 'guru_bk'].includes(currentUser.role);
  const canEditProfile = ['admin', 'bk', 'guru_bk', 'wali_kelas'].includes(currentUser.role);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <UserCircle className="mx-auto h-16 w-16 text-slate-400" />
        <h3 className="mt-4 text-xl font-semibold text-slate-800">Siswa Tidak Ditemukan</h3>
        <p className="mt-2 text-base text-slate-500">Data siswa dengan ID ini tidak dapat ditemukan dalam sistem.</p>
      </div>
    );
  }

  const totalPoints = student.total_points || 0;
  const warningStatus = getWarningStatus(totalPoints);
  const progressBarColor = getProgressBarColor(totalPoints);
  const WarningIcon = warningStatus.icon;

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Bagian Atas (Profil & Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Biodata Kiri */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative h-full flex items-center gap-5">
          {canEditProfile && (
            <button 
              onClick={handleEditStudentClick}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors"
              title="Edit Data Siswa"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          <div className="flex-shrink-0">
            <UserCircle className="w-20 h-20 text-slate-300" />
          </div>
          <div className="pr-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{student.name}</h1>
            <p className="text-sm text-slate-500">NIS: {student.nis}</p>
            <p className="text-sm text-slate-500">Kelas: {student.class_id?.name || 'Belum ada kelas'}</p>
          </div>
        </div>

        {/* Status Kedisiplinan Kanan */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative h-full flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-slate-800">Status Kedisiplinan</h2>
              <p className="text-sm text-slate-500">Ringkasan poin pelanggaran siswa.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Total Poin</p>
              <p className={`text-6xl font-bold tracking-tighter ${progressBarColor.replace('bg-', 'text-')}`}>{totalPoints}</p>
            </div>
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${warningStatus.color}`}>
                  <WarningIcon className="w-3.5 h-3.5" />
                  {warningStatus.text}
                </span>
                <span className="text-sm font-medium text-slate-500">Target: 100 Poin</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full ${progressBarColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bagian Bawah (Riwayat - 2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Riwayat Pelanggaran (Kiri) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-lg">
              <BookAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Riwayat Pelanggaran</h3>
              <p className="text-xs text-slate-500">Daftar kasus yang tercatat.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {violations.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3">Tanggal</th>
                    <th className="text-left font-semibold px-5 py-3">Jenis Pelanggaran</th>
                    <th className="text-center font-semibold px-5 py-3">Poin</th>
                    {canManageData && <th className="text-center font-semibold px-5 py-3">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {violations.map(v => (
                    <tr key={v._id}>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDate(v.date)}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">{v.rule_id?.violation_name || 'Aturan Dihapus'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-bold text-red-600">+{v.rule_id?.points || 0}</span>
                      </td>
                      {canManageData && (
                        <td className="px-5 py-3 text-center whitespace-nowrap">
                          <button onClick={() => handleEditClick(v)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors mr-1" title="Edit Pelanggaran">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirmDelete(v._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus Pelanggaran (Meralat Poin)">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={ShieldCheck} message="Siswa ini tidak memiliki riwayat pelanggaran." />
            )}
          </div>
        </div>

        {/* Riwayat Presensi (Kanan) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 rounded-lg">
                <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Riwayat Presensi</h3>
                <p className="text-xs text-slate-500">Catatan kehadiran harian.</p>
              </div>
            </div>
            {/* Filter Tanggal */}
            <div className="flex justify-end gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                  title="Filter berdasarkan tanggal spesifik"
                />
                {selectedDateFilter && (
                  <button onClick={() => setSelectedDateFilter('')} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 hover:bg-red-50 rounded-lg" title="Hapus filter tanggal">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            {filteredAttendances.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3">Tanggal</th>
                    <th className="text-left font-semibold px-5 py-3">Pelajaran & Jam</th>
                    <th className="text-center font-semibold px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.map(a => (
                    <tr key={a._id}>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                        {formatDate(a.date)}
                        <div className="text-xs text-emerald-600 font-medium mt-0.5">{['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(a.date).getDay()]}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-700">{a.schedule_id?.subject_id?.name || a.schedule_id?.subject_name || a.schedule_id?.subject || 'Sesi Kelas'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{a.schedule_id?.start_time ? `${a.schedule_id.start_time} - ${a.schedule_id.end_time}` : '-'}</div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getAttendanceBadge(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={CalendarCheck2} message={
                selectedDateFilter ? `Tidak ada riwayat presensi pada tanggal ${formatDate(selectedDateFilter)}.` : "Belum ada data presensi untuk siswa ini."
              } />
            )}
          </div>
        </div>
      </div>

      {/* Modal Edit Pelanggaran */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Edit Pelanggaran</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input type="date" required value={violationFormData.date} onChange={e => setViolationFormData({...violationFormData, date: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pelanggaran</label>
                <select required value={violationFormData.rule_id} onChange={e => setViolationFormData({...violationFormData, rule_id: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">-- Pilih Aturan --</option>
                  {rules.map(r => (
                    <option key={r._id} value={r._id}>{r.violation_name} (+{r.points} Poin)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea rows="3" value={violationFormData.description} onChange={e => setViolationFormData({...violationFormData, description: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors">Simpan Perubahan</button>
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
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Pelanggaran</h3>
            <p className="text-sm text-slate-500 mb-6">Yakin ingin menghapus riwayat pelanggaran ini? Poin siswa akan otomatis dikurangi.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteId(null); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">Batal</button>
              <button onClick={executeDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Data Siswa */}
      {isStudentEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Edit Data Siswa</h3>
              <button onClick={() => setIsStudentEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIS</label>
                <input type="text" required value={studentFormData.nis} onChange={e => setStudentFormData({...studentFormData, nis: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={studentFormData.name} onChange={e => setStudentFormData({...studentFormData, name: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                <select required value={studentFormData.class_id} onChange={e => setStudentFormData({...studentFormData, class_id: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. HP Orang Tua (Opsional)</label>
                <input type="text" value={studentFormData.parrent_phone} onChange={e => setStudentFormData({...studentFormData, parrent_phone: e.target.value})} className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}