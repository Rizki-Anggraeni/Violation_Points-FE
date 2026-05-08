'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserCircle, Edit, AlertTriangle, ShieldCheck, History, CalendarCheck2, Loader2, BookWarning } from 'lucide-react';
import api from '../../../../../lib/axios';

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
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const studentRes = await api.get(`/students/${id}`);
        setStudent(studentRes.data);

        // Fetch all and filter client-side as per existing API structure
        const violationsRes = await api.get('/violations');
        const studentViolations = violationsRes.data
          .filter(v => v.student_id?._id === id)
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
        setViolations(studentViolations);

        const attendancesRes = await api.get('/attendances');
        const studentAttendances = attendancesRes.data
          .filter(a => a.student_id?._id === id)
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first
        setAttendances(studentAttendances);

      } catch (error) {
        console.error("Gagal mengambil data detail siswa:", error);
        setStudent(null); // Set student to null on error to show not found message
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Bagian Atas (Profil & Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Biodata Kiri */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="flex-shrink-0">
            <UserCircle className="w-20 h-20 text-slate-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{student.name}</h1>
            <p className="text-sm text-slate-500">NIS: {student.nis}</p>
            <p className="text-sm text-slate-500">Kelas: {student.class_id?.name || 'Belum ada kelas'}</p>
          </div>
        </div>

        {/* Status Kedisiplinan Kanan */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-slate-800">Status Kedisiplinan</h2>
              <p className="text-sm text-slate-500">Ringkasan poin pelanggaran siswa.</p>
            </div>
            <button 
              onClick={() => router.push(`/dashboard/siswa/edit/${id}`)} // Assuming an edit page exists
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 rounded-lg transition-colors"
              title="Edit Data Siswa"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">Total Poin</p>
              <p className={`text-6xl font-bold tracking-tighter ${progressBarColor.replace('bg-', 'text-')}`}>{totalPoints}</p>
            </div>
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${warningStatus.color}`}>
                  <warningStatus.icon className="w-3.5 h-3.5" />
                  {warningStatus.text}
                </span>
                <span className="text-sm font-medium text-slate-500">Target: 100 Poin</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-3 rounded-full ${progressBarColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(totalPoints, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
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
              <BookWarning className="w-5 h-5 text-red-600" />
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 rounded-lg">
              <CalendarCheck2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Riwayat Presensi</h3>
              <p className="text-xs text-slate-500">Catatan kehadiran harian.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {attendances.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3">Tanggal</th>
                    <th className="text-left font-semibold px-5 py-3">Jam</th>
                    <th className="text-center font-semibold px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendances.map(a => (
                    <tr key={a._id}>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-500">{formatDate(a.date)}</td>
                      <td className="px-5 py-3 font-medium text-slate-700">{a.schedule_id?.start_time ? `${a.schedule_id.start_time} - ${a.schedule_id.end_time}` : '-'}</td>
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
              <EmptyState icon={CalendarCheck2} message="Belum ada data presensi untuk siswa ini." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}