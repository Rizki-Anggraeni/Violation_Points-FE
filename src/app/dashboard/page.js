'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  BarChart3, 
  Eye, 
  Plus, 
  MoreVertical, 
  BookOpen,
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Phone,
  X,
  Info,
  Activity,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { getStudentRiskData } from '../../lib/knn';

// Helper untuk mendapatkan tanggal awal pekan (Senin)
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(new Date(d.setDate(diff)).setHours(0, 0, 0, 0));
};

// Helper untuk memformat tanggal ke YYYY-MM-DD untuk input date
const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [role] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.role || '';
        } catch (e) {
          console.error('Gagal memproses token');
        }
      }
    }
    return '';
  });
  const [students, setStudents] = useState([]);
  const [violations, setViolations] = useState([]);
  const [knnData, setKnnData] = useState([]);
  const [knnStats, setKnnStats] = useState(null);
  const [selectedKnnDetail, setSelectedKnnDetail] = useState(null);
  const [isKnnModalOpen, setIsKnnModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (role === 'orang_tua') {
      router.push('/dashboard/wali-murid');
      return;
    }

    let ignore = false;
    const fetchDashboardData = async () => {
      try {
        const [stuRes, vioRes] = await Promise.all([
            api.get('/students'),
            api.get('/violations')
        ]);
        if (!ignore) {
          setStudents(stuRes.data);
          setViolations(vioRes.data);
        }

        // Fetch data deteksi kerawanan KNN khusus Guru BK dan Admin
        if (role === 'admin' || role === 'guru_bk' || role === 'bk') {
          try {
            const knnRes = await getStudentRiskData(5);
            if (!ignore && knnRes?.success) {
              setKnnData(knnRes.data || []);
              setKnnStats(knnRes.stats || null);
            }
          } catch (knnErr) {
            console.error('Gagal mengambil data risiko KNN:', knnErr);
          }
        }
      } catch (e) {
        if (!ignore) {
          console.error('Gagal memuat data dashboard', e);
        }
      } finally {
        if (!ignore) {
          setIsMounted(true);
        }
      }
    };
    
    fetchDashboardData();

    return () => {
      ignore = true;
    };
  }, [role, router]);

  if (!isMounted) return null;

  if (role === 'wali_kelas' || role === 'sekretaris') {
    return <WaliKelasDashboard role={role} />;
  }

  if (role === 'orang_tua') {
    return null;
  }

  // Kalkulasi Data Admin/Guru BK
  const totalSiswa = students.length;
  const now = new Date();
  const currentMonthViolations = violations.filter(v => new Date(v.date).getMonth() === now.getMonth() && new Date(v.date).getFullYear() === now.getFullYear());
  
  const pelanggaranBulanIni = currentMonthViolations.length;
  const kasusBerat = currentMonthViolations.filter(v => v.rule_id?.category === 'Berat').length;
  const siswaPeringatan = students.filter(s => s.total_points >= 50).length;

  const monthlyPoints = Array(12).fill(0);
  violations.forEach(v => {
      const d = new Date(v.date);
      if (d.getFullYear() === now.getFullYear()) {
          monthlyPoints[d.getMonth()] += (v.rule_id?.points || 0);
      }
  });
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const calculatedBarData = monthNames.map((name, i) => ({ name, poin: monthlyPoints[i] }));

  const categoryCount = { Ringan: 0, Sedang: 0, Berat: 0 };
  violations.forEach(v => {
      if (v.rule_id?.category) {
          categoryCount[v.rule_id.category]++;
      }
  });
  const calculatedPieData = [
    { name: 'Berat', value: categoryCount.Berat, fill: '#ef4444' },
    { name: 'Sedang', value: categoryCount.Sedang, fill: '#f59e0b' },
    { name: 'Ringan', value: categoryCount.Ringan, fill: '#3b82f6' },
  ];
  
  const filteredCalculatedPieData = calculatedPieData.filter(item => item.value > 0);

  const calculatedRecent = [...violations].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const topRawanList = knnData
    .filter(item => item.classification?.label === 'Rawan' || item.classification?.label === 'Waspada')
    .slice(0, 5);

  const openKnnModal = (item) => {
    setSelectedKnnDetail(item);
    setIsKnnModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Siswa" value={totalSiswa} icon={Users} color="text-slate-700" bg="bg-slate-100" />
        <StatCard title="Pelanggaran (Bulan Ini)" value={pelanggaranBulanIni} icon={TrendingUp} color="text-slate-700" bg="bg-slate-100" />
        <StatCard title="Kasus Berat" value={kasusBerat} icon={AlertTriangle} color="text-slate-700" bg="bg-slate-100" />
        <StatCard title="Siswa Peringatan" value={siswaPeringatan} icon={ShieldAlert} color="text-slate-700" bg="bg-slate-100" />
      </div>

      {/* SECTION KHUSUS GURU BK & ADMIN: Deteksi Tingkat Kerawanan Siswa (BK) */}
      {(role === 'admin' || role === 'guru_bk' || role === 'bk') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Sistem Deteksi Dini Bimbingan Konseling (BK)
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Peta Kerawanan Siswa Terhadap Pelanggaran
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Membantu Guru BK mendeteksi siswa yang berpotensi mengulangi pelanggaran berikutnya dengan memadukan akumulasi poin, rekap alpa, dan keterlambatan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/student-risk"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
              >
                Lihat Peta Lengkap
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Stats Bar */}
          {knnStats && (
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
              <div className="p-4 text-center">
                <span className="text-xs font-semibold text-rose-600 block uppercase tracking-wider">Kategori Rawan</span>
                <span className="text-2xl font-bold text-rose-700">{knnStats.total_rawan}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{knnStats.percentage_rawan}% butuh tindakan segera</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-semibold text-amber-600 block uppercase tracking-wider">Kategori Waspada</span>
                <span className="text-2xl font-bold text-amber-700">{knnStats.total_waspada}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{knnStats.percentage_waspada}% perlu dipantau</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-xs font-semibold text-emerald-600 block uppercase tracking-wider">Kategori Aman</span>
                <span className="text-2xl font-bold text-emerald-700">{knnStats.total_aman}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{knnStats.percentage_aman}% tertib disiplin</span>
              </div>
            </div>
          )}

          {/* Top Siswa Rawan / Prioritas Intervensi */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Siswa Prioritas Penanganan BK (Risiko Paling Tinggi)
              </h4>
              <span className="text-xs text-slate-400">
                Ditampilkan 5 siswa teratas
              </span>
            </div>

            {topRawanList.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-800">
                  Kedisiplinan Siswa Terpantau Baik
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Tidak ada siswa dalam kategori Rawan saat ini. Seluruh siswa terpantau dalam batas aman dan waspada.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-3">Nama & Kelas</th>
                      <th className="px-4 py-3 text-center">Poin Pelanggaran</th>
                      <th className="px-4 py-3 text-center">Alpa</th>
                      <th className="px-4 py-3 text-center">Terlambat</th>
                      <th className="px-4 py-3">Tingkat Risiko Pelanggaran</th>
                      <th className="px-4 py-3">Tindakan Disarankan</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topRawanList.map((item, idx) => {
                      const isRawan = item.classification?.label === 'Rawan';
                      return (
                        <tr key={item.student._id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <div>{item.student.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Kelas: {item.student.class_name} | NIS: {item.student.nis}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                              item.metrics.points >= 50 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {item.metrics.points} Poin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-rose-600">
                            {item.metrics.alpa > 0 ? `${item.metrics.alpa} hari` : '0'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-amber-600">
                            {item.metrics.late > 0 ? `${item.metrics.late}x` : '0'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  isRawan ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {item.classification?.label}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {item.classification?.confidence} yakin
                                </span>
                              </div>
                              <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isRawan ? 'bg-rose-500' : 'bg-amber-500'}`}
                                  style={{ width: isRawan ? '90%' : '55%' }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs text-xs text-slate-600">
                            <p className="line-clamp-2 leading-relaxed">
                              {item.classification?.recommendation}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openKnnModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                              >
                                <Info className="w-3.5 h-3.5" />
                                Penjelasan
                              </button>
                              {item.student.parrent_phone && (
                                <a
                                  href={`https://wa.me/${item.student.parrent_phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                                  title="WhatsApp Orang Tua"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Area Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Statistik Pelanggaran per Bulan</h3>
          <div className="h-72 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={calculatedBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="poin" fill="#475569" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Proporsi Kategori</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie 
                    data={filteredCalculatedPieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : ''}
                  >
                    {filteredCalculatedPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    payload={calculatedPieData.map(item => ({
                      id: item.name,
                      type: 'circle',
                      value: item.name,
                      color: item.fill
                    }))}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Pelanggaran Terakhir */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">Pelanggaran Terakhir</h3>
          <div className="flex items-center gap-4">
            <Link 
               href="/dashboard/violations?action=add"
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
            <Plus className="w-5 h-5 mr-1.5" />
              Tambah Catatan Pelanggaran
            </Link>
            <Link href="/dashboard/violations" className="text-sm font-medium text-black hover:text-blue-700">Lihat Semua</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                <th className="px-6 py-3 font-medium">Nama Siswa</th>
                <th className="px-6 py-3 font-medium">Judul Pelanggaran</th>
                <th className="px-6 py-3 font-medium">Poin</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {calculatedRecent.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{item.student_id?.name || 'Siswa Dihapus'}</td>
                  <td className="px-6 py-4">{item.rule_id?.violation_name || 'Aturan Dihapus'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      +{item.rule_id?.points || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Penjelasan Kasus Ramah Orang Awam */}
      {isKnnModalOpen && selectedKnnDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto zoom-in-95 animate-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Penjelasan Kerawanan Siswa</h3>
                  <p className="text-xs text-slate-500">Hasil analisis kecerdasan buatan berbasis data sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setIsKnnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profil Siswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg">{selectedKnnDetail.student.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Kelas: <b>{selectedKnnDetail.student.class_name}</b> | NIS: <b>{selectedKnnDetail.student.nis}</b>
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    selectedKnnDetail.classification.label === 'Rawan' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    selectedKnnDetail.classification.label === 'Waspada' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    Status: {selectedKnnDetail.classification.label}
                  </span>
                </div>
              </div>

              {/* Mengapa Siswa Masuk Kategori Ini? */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Mengapa Siswa Dinilai {selectedKnnDetail.classification.label}?
                </h5>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {selectedKnnDetail.classification.friendly?.whyReason || 
                   `Siswa memiliki akumulasi ${selectedKnnDetail.metrics.points} poin pelanggaran, serta tercatat ${selectedKnnDetail.metrics.alpa} kali alpa dan ${selectedKnnDetail.metrics.late} kali terlambat.`}
                </p>
              </div>

              {/* 3 Angka Catatan Perilaku Siswa */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Catatan Perilaku Siswa di Sekolah
                </h5>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Poin Pelanggaran</span>
                    <span className="text-xl font-extrabold text-slate-800">
                      {selectedKnnDetail.metrics.points}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Batas SP: 100 Poin</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Alpa / Bolos</span>
                    <span className="text-xl font-extrabold text-rose-600">
                      {selectedKnnDetail.metrics.alpa}x
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tanpa Keterangan</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Keterlambatan</span>
                    <span className="text-xl font-extrabold text-amber-600">
                      {selectedKnnDetail.metrics.late}x
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Datang Terlambat</span>
                  </div>
                </div>
              </div>

              {/* Rencana Tindakan untuk Guru BK */}
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-700" />
                  Rencana Tindakan Guru BK (Solusi)
                </h5>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  {selectedKnnDetail.classification.recommendation}
                </p>
              </div>

              {/* Tombol Hubungi Ortu Jika Ada Nomor */}
              {selectedKnnDetail.student.parrent_phone && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs text-emerald-900">
                    <span className="font-bold block">Nomor HP Orang Tua:</span>
                    <span>{selectedKnnDetail.student.parrent_phone}</span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedKnnDetail.student.parrent_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Kirim Pesan WhatsApp
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Sistem Bimbingan Konseling SMKN Pringsurat
              </span>
              <button
                type="button"
                onClick={() => setIsKnnModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${color} ${bg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      </div>
    </div>
  );
}

function WaliKelasDashboard({ role }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [violations, setViolations] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const fetchWkData = async () => {
        try {
            const [stuRes, vioRes, attRes, schRes] = await Promise.all([
                api.get('/students'),
                api.get('/violations'),
                api.get('/attendances'),
                api.get('/schedules')
            ]);
            setStudents(stuRes.data);
            setViolations(vioRes.data);
            setAttendances(attRes.data);
            setSchedules(schRes.data);
        } catch(e) { console.error('Gagal memuat data wali kelas', e) }
    }
    fetchWkData();
  }, []);

  // Kalkulasi
  const totalSiswa = students.length;
  const now = new Date();
  const currentMonthViolations = violations.filter(v => new Date(v.date).getMonth() === now.getMonth() && new Date(v.date).getFullYear() === now.getFullYear());
  
  const poinBulanIni = currentMonthViolations.reduce((acc, v) => acc + (v.rule_id?.points || 0), 0);
  const kasusBerat = currentMonthViolations.filter(v => v.rule_id?.category === 'Berat').length;
  const siswaPantauan = students.filter(s => s.total_points >= 20).length;

  const attCount = { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };

  // Kalkulasi data kehadiran per hari untuk satu pekan
  const startOfWeek = getStartOfWeek(selectedDate);
  const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalisasi tanggal hari ini

  const attendanceDataByWeek = weekDays.map((dayName, index) => {
    const currentDay = new Date(startOfWeek);
    currentDay.setDate(startOfWeek.getDate() + index);

    // Jangan hitung persentase untuk hari di masa depan
    if (currentDay > today) {
      return { name: dayName.substring(0, 3), Kehadiran: 0 };
    }

    const dayAttendances = attendances.filter(a => {
      const attDate = new Date(a.date);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === currentDay.getTime();
    });

    // Akumulasi data status presensi untuk pie chart (hanya untuk pekan yang dipilih)
    dayAttendances.forEach(a => {
      if (attCount[a.status] !== undefined) attCount[a.status]++;
    });

    const hadirCount = dayAttendances.filter(a => a.status === 'Hadir').length;
    const totalRecords = dayAttendances.length;
    const percentage = totalRecords > 0 ? Math.round((hadirCount / totalRecords) * 100) : 0;
    return { name: dayName.substring(0, 3), Kehadiran: percentage };
  });

  const attendancePieData = [
      { name: 'Hadir', value: attCount.Hadir, fill: '#10b981' },
      { name: 'Sakit', value: attCount.Sakit, fill: '#f59e0b' },
      { name: 'Izin', value: attCount.Izin, fill: '#3b82f6' },
      { name: 'Alpa', value: attCount.Alpa, fill: '#ef4444' },
  ];
  
  const filteredAttendancePieData = attendancePieData.filter(item => item.value > 0);

  const wkViolations = [...violations].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Ekstrak nama kelas secara dinamis dari data siswa (karena 1 wali kelas / sekretaris memegang 1 kelas)
  let classNameInfo = 'Kelas Anda';
  if (students.length > 0) {
    const student = students[0];
    const cls = student.class_id || student.class; // Menyesuaikan dengan field relasi di Database
    if (cls) {
      classNameInfo = typeof cls === 'string' ? cls : (cls.class_name || cls.className || cls.name || classNameInfo);
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard {role === 'wali_kelas' ? 'Wali Kelas' : 'Sekretaris'}</h2>
          <p className="text-sm text-slate-500 mt-1">Pantau statistik dan kehadiran siswa di kelas Anda.</p>
        </div>
        <Link href="/dashboard/classes" className="inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm w-full sm:w-auto">
          <BookOpen className="w-4 h-4 mr-2" />
          Lihat Jadwal Kelas
        </Link>
      </div>

      {/* Row 1: Grid Statistik Modern */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Siswa Kelas" value={totalSiswa} icon={Users} color="text-slate-600" bg="bg-slate-50" />
        <StatCard title="Poin Bulan Ini" value={poinBulanIni} icon={BarChart3} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Kasus Berat" value={kasusBerat} icon={ShieldAlert} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Siswa dlm Pantauan" value={siswaPantauan} icon={Eye} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Row 2: Grafik Berdampingan Modern */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-slate-800">Persentase Kehadiran Pekan Ini</h3>
            <input 
              type="date"
              value={formatDateForInput(selectedDate)} 
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
            />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={attendanceDataByWeek} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value}%`, 'Kehadiran']} />
                <Bar dataKey="Kehadiran" name="Persentase Hadir" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Status Presensi Minggu Ini</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                  <Pie 
                    data={filteredAttendancePieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : ''}
                  >
                  {filteredAttendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  payload={attendancePieData.map(item => ({
                    id: item.name,
                    type: 'circle',
                    value: item.name,
                    color: item.fill
                  }))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Tabel Pelanggaran Terakhir */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">
            Pelanggaran Terakhir ({classNameInfo})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-150">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="px-6 py-4 font-medium w-16">No</th>
                <th className="px-6 py-4 font-medium">Nama Siswa</th>
                <th className="px-6 py-4 font-medium">Judul Pelanggaran</th>
                <th className="px-6 py-4 font-medium text-center">Poin</th>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-50">
              {wkViolations.map((item, index) => {
                // Mendapatkan inisial dari nama (Contoh: "Budi Santoso" -> "BS")
                const studentName = item.student_id?.name || 'Siswa Dihapus';
                const initials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                let badgeColor = 'bg-indigo-100 text-indigo-700';
                if (item.category === 'Sedang') badgeColor = 'bg-amber-100 text-amber-700';
                if (item.category === 'Berat') badgeColor = 'bg-red-100 text-red-700';

                return (
                  <tr key={item._id || index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs mr-3">
                          {initials}
                        </span>
                          <span className="font-medium text-slate-800">{item.student_id?.name || 'Siswa Dihapus'}</span>
                      </div>
                    </td>
                      <td className="px-6 py-4">{item.rule_id?.violation_name || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                          +{item.rule_id?.points || 0}
                      </span>
                    </td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}