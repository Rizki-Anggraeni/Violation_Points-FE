'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  HelpCircle, 
  Phone, 
  Loader2, 
  X, 
  Brain,
  Info,
  Calendar,
  Clock,
  User,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getStudentRiskData } from '../../../lib/knn';

export default function StudentRiskPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    total_rawan: 0,
    total_waspada: 0,
    total_aman: 0,
    percentage_rawan: 0,
    percentage_waspada: 0,
    percentage_aman: 0,
    k_used: 5
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');
  const [classesList, setClassesList] = useState([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [kValue, setKValue] = useState(5);
  const [showGuideBanner, setShowGuideBanner] = useState(true);

  useEffect(() => {
    let ignore = false;

    getStudentRiskData(kValue)
      .then((res) => {
        if (!ignore && res) {
          setData(res.data || []);
          setStats(res.stats || {});
          const uniqueClasses = Array.from(
            new Set(
              (res.data || [])
                .map(item => item.student?.class_name)
                .filter(Boolean)
            )
          ).sort();
          setClassesList(uniqueClasses);
        }
      })
      .catch((error) => {
        if (!ignore) {
          console.error('Gagal mengambil data risiko siswa:', error);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [kValue]);

  // Filter pencarian & status
  const filteredData = data.filter((item) => {
    const sName = item.student?.name?.toLowerCase() || '';
    const sNis = item.student?.nis?.toLowerCase() || '';
    const sClass = item.student?.class_name || '';
    const sLabel = item.classification?.label || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = sName.includes(query) || sNis.includes(query);
    const matchesStatus = statusFilter === 'Semua' || sLabel === statusFilter;
    const matchesClass = classFilter === 'Semua' || sClass === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  const openDetailModal = (item) => {
    setSelectedStudentDetail(item);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (label) => {
    switch (label) {
      case 'Rawan':
        return {
          title: 'RAWAN',
          sub: 'Tindakan Segera',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          barColor: 'bg-rose-500',
          percent: 90,
          desc: 'Berisiko tinggi mengulangi pelanggaran'
        };
      case 'Waspada':
        return {
          title: 'WASPADA',
          sub: 'Perlu Pemantauan',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          barColor: 'bg-amber-500',
          percent: 55,
          desc: 'Mulai menunjukkan penurunan kedisiplinan'
        };
      case 'Aman':
      default:
        return {
          title: 'AMAN',
          sub: 'Tertib Disiplin',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          barColor: 'bg-emerald-500',
          percent: 15,
          desc: 'Kedisiplinan sangat baik'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Utama Ramah Pengguna */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-indigo-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Sistem Deteksi Dini Bimbingan Konseling (BK)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Peta Kerawanan Siswa Terhadap Pelanggaran
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
              Membantu Guru BK dan Wali Kelas mendeteksi siswa yang berisiko mengulangi pelanggaran berikutnya dengan memadukan data <b>poin pelanggaran</b>, <b>ketidakhadiran tanpa keterangan (alpa)</b>, dan <b>keterlambatan</b>.
            </p>
          </div>

          {/* Pengaturan Sensitivitas Ramah Pengguna */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-left sm:text-right shrink-0">
            <span className="text-xs text-slate-300 block font-medium">Tingkat Ketelitian Analisis</span>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={kValue}
                onChange={(e) => {
                  setIsLoading(true);
                  setKValue(Number(e.target.value));
                }}
                className="bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg px-3 py-1.5 border border-indigo-300/40 outline-none cursor-pointer transition-colors"
              >
                <option value={3}>Sensitivitas Cepat (3 Sampel)</option>
                <option value={5}>Sensitivitas Standar (5 Sampel)</option>
                <option value={7}>Sensitivitas Teliti (7 Sampel)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Panduan Singkat untuk Orang Awam */}
      {showGuideBanner && (
        <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl flex items-start justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <span className="font-bold block text-sm mb-0.5">Panduan Cara Membaca Status:</span>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                <li><b className="text-rose-700">RAWAN (Merah):</b> Siswa yang sangat berisiko mengulangi pelanggaran berat. Perlu segera dipanggil orang tuanya dan diberikan konseling.</li>
                <li><b className="text-amber-700">WASPADA (Kuning):</b> Siswa yang mulai sering melanggar atau bolos. Perlu perhatian wali kelas dan teguran preventif.</li>
                <li><b className="text-emerald-700">AMAN (Hijau):</b> Siswa tertib dan memiliki disiplin yang baik.</li>
              </ul>
            </div>
          </div>
          <button 
            onClick={() => setShowGuideBanner(false)}
            className="text-blue-400 hover:text-blue-600 p-1"
            title="Tutup panduan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ringkasan Status 3 Kotak Warna */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* RAWAN */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Rawan' ? 'Semua' : 'Rawan')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
            statusFilter === 'Rawan' 
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300' 
              : 'bg-white border-rose-200 hover:border-rose-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Kategori Rawan</span>
                <span className="text-xs text-rose-600">Perlu Penanganan Cepat</span>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-slate-800">{stats.total_rawan || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-rose-100">
            {stats.percentage_rawan || 0}% siswa membutuhkan tindakan intervensi Guru BK segera.
          </p>
        </div>

        {/* WASPADA */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Waspada' ? 'Semua' : 'Waspada')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
            statusFilter === 'Waspada' 
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300' 
              : 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Kategori Waspada</span>
                <span className="text-xs text-amber-600">Perlu Pemantauan</span>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-slate-800">{stats.total_waspada || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-amber-100">
            {stats.percentage_waspada || 0}% siswa mulai menunjukkan tren indisipliner.
          </p>
        </div>

        {/* AMAN */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Aman' ? 'Semua' : 'Aman')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
            statusFilter === 'Aman' 
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300' 
              : 'bg-white border-emerald-200 hover:border-emerald-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Kategori Aman</span>
                <span className="text-xs text-emerald-600">Disiplin Terjaga</span>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-slate-800">{stats.total_aman || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-emerald-100">
            {stats.percentage_aman || 0}% siswa memiliki catatan perilaku yang baik.
          </p>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Input Cari Nama */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama siswa atau nomor NIS..."
            className="w-full pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Rawan">Hanya Siswa Rawan</option>
              <option value="Waspada">Hanya Siswa Waspada</option>
              <option value="Aman">Hanya Siswa Aman</option>
            </select>
          </div>

          {/* Kelas Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data Siswa Ramah Pengguna */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Daftar Siswa & Tingkat Kerawanan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Siswa dengan tanda <b>Rawan</b> diprioritaskan di baris paling atas untuk memudahkan penanganan Guru BK.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
            Menampilkan {filteredData.length} siswa
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-sm font-medium">Sedang memproses analisis kerawanan siswa...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Tidak ada siswa yang sesuai dengan filter</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau setelan filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3.5">Nama & Kelas</th>
                  <th className="px-4 py-3.5 text-center">Poin Pelanggaran</th>
                  <th className="px-4 py-3.5 text-center">Alpa</th>
                  <th className="px-4 py-3.5 text-center">Terlambat</th>
                  <th className="px-6 py-3.5">Tingkat Risiko Pelanggaran</th>
                  <th className="px-6 py-3.5">Tindakan Disarankan</th>
                  <th className="px-6 py-3.5 text-center">Aksi Bantuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredData.map((item, idx) => {
                  const badge = getStatusBadge(item.classification?.label);
                  const isRawan = item.classification?.label === 'Rawan';
                  return (
                    <tr key={item.student._id || idx} className="hover:bg-slate-50 transition-colors">
                      {/* Nama & Kelas */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{item.student.name}</div>
                        <div className="text-xs text-slate-500">
                          Kelas: <span className="font-semibold text-slate-700">{item.student.class_name}</span> | NIS: {item.student.nis}
                        </div>
                      </td>

                      {/* Poin Pelanggaran */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.metrics.points >= 50 ? 'bg-rose-100 text-rose-800' :
                          item.metrics.points >= 20 ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.metrics.points} Poin
                        </span>
                      </td>

                      {/* Alpa */}
                      <td className="px-4 py-4 text-center">
                        {item.metrics.alpa > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">
                            {item.metrics.alpa} hari
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0</span>
                        )}
                      </td>

                      {/* Terlambat */}
                      <td className="px-4 py-4 text-center">
                        {item.metrics.late > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                            {item.metrics.late} kali
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0</span>
                        )}
                      </td>

                      {/* Tingkat Risiko */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 min-w-[150px]">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.badge}`}>
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              {badge.title}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {item.classification?.confidence} yakin
                            </span>
                          </div>
                          {/* Visual Risk Bar */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${badge.barColor}`} 
                              style={{ width: `${badge.percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            {badge.desc}
                          </span>
                        </div>
                      </td>

                      {/* Tindakan Disarankan */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className={`text-xs leading-relaxed ${
                          isRawan ? 'text-rose-900 font-medium' : 'text-slate-600'
                        }`}>
                          {item.classification?.recommendation}
                        </p>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                            title="Buka penjelasan kasus siswa ini"
                          >
                            <Info className="w-3.5 h-3.5" />
                            Penjelasan Kasus
                          </button>

                          {item.student.parrent_phone ? (
                            <a
                              href={`https://wa.me/${item.student.parrent_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                              title="Kirim pesan WhatsApp ke Orang Tua"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              WhatsApp Ortu
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">No HP tidak ada</span>
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

      {/* Modal Penjelasan Kasus Ramah Orang Awam */}
      {isDetailModalOpen && selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto zoom-in-95 animate-in duration-200">
            {/* Modal Header */}
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
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Profil Siswa */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-lg">{selectedStudentDetail.student.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Kelas: <b>{selectedStudentDetail.student.class_name}</b> | NIS: <b>{selectedStudentDetail.student.nis}</b>
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedStudentDetail.classification.label).badge}`}>
                    Status: {selectedStudentDetail.classification.label}
                  </span>
                </div>
              </div>

              {/* Mengapa Siswa Ini Masuk Kategori Ini? */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Mengapa Siswa Dinilai {selectedStudentDetail.classification.label}?
                </h5>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {selectedStudentDetail.classification.friendly?.whyReason || 
                   `Siswa memiliki akumulasi ${selectedStudentDetail.metrics.points} poin pelanggaran, serta tercatat ${selectedStudentDetail.metrics.alpa} kali alpa dan ${selectedStudentDetail.metrics.late} kali terlambat.`}
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
                      {selectedStudentDetail.metrics.points}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Batas SP: 100 Poin</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Alpa / Bolos</span>
                    <span className="text-xl font-extrabold text-rose-600">
                      {selectedStudentDetail.metrics.alpa}x
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tanpa Keterangan</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Keterlambatan</span>
                    <span className="text-xl font-extrabold text-amber-600">
                      {selectedStudentDetail.metrics.late}x
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
                  {selectedStudentDetail.classification.recommendation}
                </p>
              </div>

              {/* Tombol Hubungi Ortu Jika Ada Nomor */}
              {selectedStudentDetail.student.parrent_phone && (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs text-emerald-900">
                    <span className="font-bold block">Nomor HP Orang Tua Tersedia:</span>
                    <span>{selectedStudentDetail.student.parrent_phone}</span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedStudentDetail.student.parrent_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Kirim Pesan WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Sistem Bimbingan Konseling SMKN Pringsurat
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
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
