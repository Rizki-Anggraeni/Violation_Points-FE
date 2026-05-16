'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, CheckSquare, BarChart3, Clock, BookOpen, CalendarDays } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../../lib/axios';

export default function OrtuDashboardPage() {
  const [student, setStudent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [violations, setViolations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Senin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrtuData = async () => {
      try {
        const [stuRes, attRes, vioRes, schRes] = await Promise.all([
          api.get('/students'),
          api.get('/attendances'),
          api.get('/violations'),
          api.get('/schedules')
        ]);
        
        // Endpoint students untuk role orang_tua akan mengembalikan array dengan data anak
        let currentStudent = null;
        if (stuRes.data && stuRes.data.length > 0) {
          currentStudent = stuRes.data[0];
          setStudent(currentStudent);
        }
        
        // Urutkan presensi dari yang terbaru
        setAttendances(attRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        
        // Urutkan pelanggaran dari yang terbaru
        const sortedViolations = vioRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setViolations(sortedViolations);

        // Filter jadwal sesuai dengan kelas anak
        if (currentStudent && currentStudent.class_id) {
          const classId = currentStudent.class_id._id || currentStudent.class_id;
          const mySchedules = schRes.data.filter(s => (s.class_id?._id || s.class_id) === classId);
          setSchedules(mySchedules);
        }
      } catch (error) {
        console.error('Gagal mengambil data orang tua:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set default hari sesuai dengan hari saat ini
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDay = days[new Date().getDay()];
    if (currentDay !== 'Minggu' && currentDay !== 'Sabtu') {
      setSelectedDay(currentDay);
    }
    
    fetchOrtuData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-lg mx-auto mt-10">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Data Siswa Tidak Ditemukan</h2>
        <p className="text-slate-500">Akun Anda belum dihubungkan dengan data siswa yang valid. Silakan hubungi admin sekolah untuk bantuan.</p>
      </div>
    );
  }

  // Kalkulasi Status Presensi
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Profil Siswa */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl shrink-0 border border-emerald-200">
            {student.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              NIS: <span className="font-medium text-slate-700">{student.nis}</span> | Kelas: <span className="font-medium text-slate-700">{student.class_id?.name || '-'}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => document.getElementById('jadwal-pelajaran')?.scrollIntoView({ behavior: 'smooth' })}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-lg transition-colors border border-indigo-200 shadow-sm"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          Lihat Jadwal Anak
        </button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Poin Pelanggaran" value={student.total_points} icon={ShieldAlert} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Total Hadir" value={attCount.Hadir} icon={CheckSquare} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Sakit & Izin" value={attCount.Sakit + attCount.Izin} icon={Calendar} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Total Alpa" value={attCount.Alpa} icon={BarChart3} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* Area Visual & Riwayat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Kehadiran */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Statistik Kehadiran</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={attendancePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
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

        {/* Tabel Riwayat Pelanggaran Terakhir */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Riwayat Pelanggaran Terakhir</h3>
          <div className="overflow-x-auto flex-1">
            {violations.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200">
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Pelanggaran</th>
                    <th className="px-4 py-3 font-medium text-center">Poin</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {violations.slice(0, 5).map(v => (
                    <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(v.date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 line-clamp-2">{v.rule_id?.violation_name || 'Pelanggaran Dihapus'}</div>
                        {v.description && <div className="text-xs text-slate-500 mt-1 italic line-clamp-1">"{v.description}"</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full text-xs min-w-[3rem]">
                          +{v.rule_id?.points || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                <ShieldAlert className="w-12 h-12 text-slate-200 mb-3" />
                <p>Anak Anda belum memiliki catatan pelanggaran.</p>
                <p className="text-xs text-emerald-600 mt-1">Pertahankan kedisiplinan yang baik!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Area Jadwal dan Riwayat Presensi */}
      <div id="jadwal-pelajaran" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-6">
        {/* Jadwal Pelajaran */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
              Jadwal Pelajaran Anak
            </h3>
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
          
          <div className="overflow-y-auto flex-1 max-h-[300px] pr-2 custom-scrollbar">
            {schedules.filter(s => s.day === selectedDay).length > 0 ? (
              <div className="space-y-3">
                {schedules.filter(s => s.day === selectedDay)
                  .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                  .map(sch => (
                  <div key={sch._id} className="flex items-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex flex-col items-center justify-center font-bold text-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-semibold text-slate-800">{sch.subject}</h4>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1" /> {sch.start_time} - {sch.end_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                <CalendarDays className="w-10 h-10 text-slate-200 mb-2" />
                <p>Tidak ada jadwal untuk hari {selectedDay}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Riwayat Presensi Terakhir */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-emerald-500" />
            Riwayat Presensi Terakhir
          </h3>
          <div className="overflow-y-auto flex-1 max-h-[300px] pr-2 custom-scrollbar">
            {attendances.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-y border-slate-200 sticky top-0 z-10">
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Mata Pelajaran</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {attendances.slice(0, 10).map(att => {
                    let statusColor = 'bg-emerald-100 text-emerald-700';
                    if (att.status === 'Sakit') statusColor = 'bg-amber-100 text-amber-700';
                    if (att.status === 'Izin') statusColor = 'bg-blue-100 text-blue-700';
                    if (att.status === 'Alpa') statusColor = 'bg-red-100 text-red-700';

                    return (
                      <tr key={att._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(att.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{att.schedule_id?.subject || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                <CheckSquare className="w-10 h-10 text-slate-200 mb-2" />
                <p>Belum ada catatan presensi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${color} ${bg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
      </div>
    </div>
  );
}