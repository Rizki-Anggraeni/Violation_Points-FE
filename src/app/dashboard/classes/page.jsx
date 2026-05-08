'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Calendar, Clock, BookOpen, User as UserIcon, ChevronRight, ArrowLeft, X, Loader2, Inbox, CheckCircle } from 'lucide-react';
import api from '../../../lib/axios';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export default function DataKelasJadwalPage() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState({ role: '', id: '', class_id: '' });
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editScheduleId, setEditScheduleId] = useState(null);
  const [isDeleteScheduleModalOpen, setIsDeleteScheduleModalOpen] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState(null);
  
  // Form States
  const [newClassName, setNewClassName] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    subject: '', day: 'Senin', start_time: '', end_time: ''
  });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    let role = 'admin'; // Default dummy jika belum login
    let id = 'admin-1';
    let class_id = 'c1';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        role = payload.role;
        id = payload.id;
        class_id = payload.class_id || 'c1';
      } catch (e) {
        console.error('Gagal memproses token');
      }
    }

    setCurrentUser({ role, id, class_id });

    // Jika user adalah wali kelas, otomatis pilih dan buka jadwal kelas ampuannya
    if (role === 'wali_kelas') {
      setSelectedClassId(class_id);
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clsRes, schRes] = await Promise.all([
        api.get('/classes'),
        api.get('/schedules')
      ]);
      setClasses(clsRes.data);
      setSchedules(schRes.data);
    } catch (error) {
      console.error('Gagal mengambil data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', { name: newClassName });
      setNewClassName('');
      setIsClassModalOpen(false);
      fetchData();
      showSuccess('Kelas baru berhasil ditambahkan!');
    } catch (error) {
      console.error('Gagal menambah kelas', error);
    }
  };

  const handleEditScheduleClick = (schedule) => {
    setScheduleForm({
      subject: schedule.subject,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time
    });
    setEditScheduleId(schedule._id);
    setIsScheduleModalOpen(true);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editScheduleId) {
        await api.put(`/schedules/${editScheduleId}`, { ...scheduleForm, class_id: selectedClassId });
      } else {
        await api.post('/schedules', { ...scheduleForm, class_id: selectedClassId });
      }
      setScheduleForm({ subject: '', day: 'Senin', start_time: '', end_time: '' });
      setEditScheduleId(null);
      setIsScheduleModalOpen(false);
      fetchData();
      showSuccess(editScheduleId ? 'Jadwal berhasil diperbarui!' : 'Jadwal baru berhasil ditambahkan!');
    } catch (error) {
      console.error('Gagal menambah jadwal', error);
    }
  };

  const confirmDeleteSchedule = (id) => {
    setDeleteScheduleId(id);
    setIsDeleteScheduleModalOpen(true);
  };

  const executeDeleteSchedule = async () => {
    if (!deleteScheduleId) return;
    try {
      await api.delete(`/schedules/${deleteScheduleId}`);
      fetchData();
      showSuccess('Jadwal berhasil dihapus!');
      setIsDeleteScheduleModalOpen(false);
      setDeleteScheduleId(null);
    } catch (error) {
      console.error('Gagal menghapus jadwal', error);
    }
  };

  // Variabel hak akses
  const canSeeClassList = ['admin', 'bk', 'guru_bk'].includes(currentUser.role);
  const canManageData = canSeeClassList || (currentUser.role === 'wali_kelas');

  // Logika Filter untuk tabel jadwal
  const visibleSchedules = schedules.filter((schedule) => {
    const sClassId = schedule.class_id?._id || schedule.class_id;
    if (sClassId !== selectedClassId) return false; // Hanya tampilkan jadwal untuk kelas terpilih

    const searchLower = searchQuery.toLowerCase();
    return (
      schedule.subject?.toLowerCase().includes(searchLower)
    );
  });

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
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Kelas & Jadwal</h2>
          <p className="text-sm text-slate-500 mt-1">
            {selectedClassId ? `Menampilkan jadwal pelajaran untuk kelas terpilih.` : `Pilih kelas untuk melihat dan mengelola jadwal pelajaran.`}
          </p>
        </div>
        
        <div className="flex gap-3">
          {!selectedClassId && canSeeClassList && (
            <button onClick={() => setIsClassModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kelas
            </button>
          )}
          {canManageData && selectedClassId && (
            <button onClick={() => {
              setScheduleForm({ subject: '', day: 'Senin', start_time: '', end_time: '' });
              setEditScheduleId(null);
              setIsScheduleModalOpen(true);
            }} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* KONDISI 1: Tampilkan Grid Kelas (Jika Role = Admin/BK & Belum ada kelas terpilih) */}
      {!selectedClassId && canSeeClassList ? isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-500"><Loader2 className="animate-spin w-8 h-8 mr-3"/> Memuat data kelas...</div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls._id} onClick={() => setSelectedClassId(cls._id)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-blue-300 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{cls.name}</h3>
                    <p className="text-sm text-slate-500">Lihat Jadwal</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <Inbox className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">Belum Ada Data Kelas</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">Anda belum menambahkan kelas apa pun. Silakan klik tombol "Tambah Kelas" di pojok kanan atas terlebih dahulu.</p>
        </div>
      ) : (
        /* KONDISI 2: Tampilkan Tabel Jadwal (Jika Kelas Terpilih) */
        <div className="space-y-6">
          {/* Tombol Kembali & Search Bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {canSeeClassList ? (
              <button onClick={() => setSelectedClassId(null)} className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Kelas
              </button>
            ) : (
              <div className="flex items-center text-slate-700 bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm">
                <BookOpen className="w-5 h-5 mr-3 text-blue-500" />
                <span className="font-medium">Kelas Ampu: <span className="font-bold text-blue-600">{classes.find(c => c._id === selectedClassId)?.name || ''}</span></span>
              </div>
            )}

            <div className="relative w-full sm:max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari mata pelajaran atau guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 shadow-sm rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          {/* Tabel Jadwal per Hari */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-slate-500"><Loader2 className="animate-spin w-8 h-8 mr-3"/> Memuat jadwal...</div>
          ) : DAYS.map(day => {
            const daySchedules = visibleSchedules
              .filter(s => s.day === day)
              .sort((a,b) => (a.start_time || '').localeCompare(b.start_time || '')); // Diurutkan jamnya
            
            return (
              <div key={day} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-base font-semibold text-slate-800">{day}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-semibold tracking-wide text-slate-500 uppercase border-b border-slate-100 bg-white">
                        <th className="px-6 py-3 w-1/4">Waktu</th>
                        <th className="px-6 py-3 w-1/3">Mata Pelajaran</th>
                        <th className="px-6 py-3">Guru Pengajar</th>
                        {canManageData && <th className="px-6 py-3 text-center w-24">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {daySchedules.length > 0 ? (
                        daySchedules.map((schedule) => (
                          <tr key={schedule._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3">
                              <div className="flex items-center text-sm text-slate-600">
                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                {schedule.start_time} - {schedule.end_time}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-sm font-semibold text-slate-800">{schedule.subject}</span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center text-sm text-slate-600">
                                <UserIcon className="w-4 h-4 mr-2 text-slate-400" />
                                -
                              </div>
                            </td>
                            {canManageData && (
                              <td className="px-6 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleEditScheduleClick(schedule)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => confirmDeleteSchedule(schedule._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={canManageData ? 4 : 3} className="px-6 py-6 text-center text-sm text-slate-400 italic bg-slate-50/50">
                            Tidak ada jadwal di hari {day}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Tambah Kelas */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Tambah Kelas Baru</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                <input type="text" required value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="Contoh: X RPL 1" className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Simpan Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Jadwal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editScheduleId ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}</h3>
              <button onClick={() => { setIsScheduleModalOpen(false); setEditScheduleId(null); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
                <input type="text" required value={scheduleForm.subject} onChange={e => setScheduleForm({...scheduleForm, subject: e.target.value})} className="w-full px-3 py-2 text-slate-800 placeholder-slate-400 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
                <select value={scheduleForm.day} onChange={e => setScheduleForm({...scheduleForm, day: e.target.value})} className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                  <input type="time" required value={scheduleForm.start_time} onChange={e => setScheduleForm({...scheduleForm, start_time: e.target.value})} className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                  <input type="time" required value={scheduleForm.end_time} onChange={e => setScheduleForm({...scheduleForm, end_time: e.target.value})} className="w-full px-3 py-2 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"/>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">{editScheduleId ? 'Simpan Perubahan' : 'Simpan Jadwal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Jadwal */}
      {isDeleteScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden text-center p-6 zoom-in-95 animate-in duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus jadwal pelajaran ini?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setIsDeleteScheduleModalOpen(false); setDeleteScheduleId(null); }} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">Batal</button>
              <button onClick={executeDeleteSchedule} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}