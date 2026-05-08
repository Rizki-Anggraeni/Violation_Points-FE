'use client';

import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, ShieldAlert, BarChart3, Eye, Plus, MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Link from 'next/link';
import api from '../../lib/axios';

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [role, setRole] = useState('');
  const [students, setStudents] = useState([]);
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role);
      } catch (e) {
        console.error('Gagal memproses token');
      }
    }

    const fetchDashboardData = async () => {
      try {
        const [stuRes, vioRes] = await Promise.all([
            api.get('/students'),
            api.get('/violations')
        ]);
        setStudents(stuRes.data);
        setViolations(vioRes.data);
      } catch (e) {
        console.error('Gagal memuat data dashboard', e);
      }
    };
    
    fetchDashboardData();
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (role === 'wali_kelas' || role === 'sekretaris') {
    return <WaliKelasDashboard role={role} />;
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

  const calculatedRecent = [...violations].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

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
                    data={calculatedPieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : ''}
                  >
                    {calculatedPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
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
            <Link href="/dashboard/violations?action=new" className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Catat Pelanggaran Baru
            </Link>
            <Link href="/dashboard/violations" className="text-sm font-medium text-blue-600 hover:text-blue-700">Lihat Semua</Link>
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
  const [selectedDay, setSelectedDay] = useState('Senin');
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
  attendances.forEach(a => {
      if (attCount[a.status] !== undefined) attCount[a.status]++;
  });
  const attendancePieData = [
      { name: 'Hadir', value: attCount.Hadir, fill: '#10b981' },
      { name: 'Sakit', value: attCount.Sakit, fill: '#f59e0b' },
      { name: 'Izin', value: attCount.Izin, fill: '#3b82f6' },
      { name: 'Alpa', value: attCount.Alpa, fill: '#ef4444' },
  ];

  const daySchedules = schedules.filter(s => s.day === selectedDay).sort((a,b) => (a.start_time || '').localeCompare(b.start_time || ''));
  const attendanceDataByDay = daySchedules.map(sch => {
      const hadirCount = attendances.filter(a => (a.schedule_id?._id || a.schedule_id) === sch._id && a.status === 'Hadir').length;
      return { name: sch.subject, hadir: hadirCount };
  });

  const wkViolations = [...violations].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
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
            <h3 className="text-lg font-semibold text-slate-800">Tingkat Kehadiran Harian</h3>
            <select 
              value={selectedDay} 
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-slate-700"
            >
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={attendanceDataByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, Math.max(totalSiswa, 10)]} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="hadir" name="Jml Hadir" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
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
                    data={attendancePieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                    label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(1)}%` : ''}
                  >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Tabel Pelanggaran Terakhir */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {role === 'sekretaris' ? 'Pelanggaran Terakhir' : 'Pelanggaran Terakhir (Kelas A)'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
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
                const initials = item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                let badgeColor = 'bg-indigo-100 text-indigo-700';
                if (item.category === 'Sedang') badgeColor = 'bg-amber-100 text-amber-700';
                if (item.category === 'Berat') badgeColor = 'bg-red-100 text-red-700';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
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