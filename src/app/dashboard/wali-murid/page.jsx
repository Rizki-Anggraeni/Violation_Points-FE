'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  ShieldAlert, 
  Clock, 
  Info,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle,
  LogOut,
  Key,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';
import ChangePassword from '../../../components/ChangePassword';

export default function DashboardWaliMurid() {
  const [activeTab, setActiveTab] = useState('pelanggaran');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State untuk API Data
  const [studentData, setStudentData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [violations, setViolations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stuRes, attRes, vioRes, schRes] = await Promise.all([
          api.get('/students').catch(() => ({ data: [] })),
          api.get('/attendances').catch(() => ({ data: [] })),
          api.get('/violations').catch(() => ({ data: [] })),
          api.get('/schedules').catch(() => ({ data: [] }))
        ]);
        
        let currentStudent = null;
        if (stuRes.data && Array.isArray(stuRes.data) && stuRes.data.length > 0) {
          currentStudent = stuRes.data[0];
          setStudentData(currentStudent);
        } else if (stuRes.data && !Array.isArray(stuRes.data) && stuRes.data._id) {
          currentStudent = stuRes.data;
          setStudentData(currentStudent);
        }

        if (attRes.data && Array.isArray(attRes.data)) {
          setAttendances(attRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
        if (vioRes.data && Array.isArray(vioRes.data)) {
          setViolations(vioRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }

        if (currentStudent && currentStudent.class_id) {
          const classId = currentStudent.class_id._id || currentStudent.class_id;
          const mySchedules = (schRes.data || []).filter(s => (s.class_id?._id || s.class_id) === classId);
          setSchedules(mySchedules);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-lg w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Siswa Tidak Ditemukan</h2>
          <p className="text-slate-500">Akun Anda belum dihubungkan dengan data siswa yang valid. Silakan hubungi admin sekolah.</p>
        </div>
      </div>
    );
  }

  const student = {
    name: studentData.name,
    nis: studentData.nis,
    className: studentData.class_id?.name || '-',
    homeroomTeacher: 'Wali Kelas',
    homeroomPhone: '6281234567890',
    violationPoints: studentData.total_points || 0,
    maxPoints: 100,
  };

  // Presensi Hari Ini
  const todayStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => new Date(a.date).toISOString().split('T')[0] === todayStr);
  const latestTodayAttendance = todayAttendances.length > 0 ? todayAttendances[0] : null;

  const todayAttendance = latestTodayAttendance ? {
    status: latestTodayAttendance.status,
    time: new Date(latestTodayAttendance.createdAt || latestTodayAttendance.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    message: `Tercatat pada pelajaran ${latestTodayAttendance.schedule_id?.subject || '-'}`
  } : {
    status: 'Belum Ada',
    time: '-',
    message: 'Belum ada catatan kehadiran untuk tanggal ini'
  };

  const recentViolations = violations.slice(0, 5);

  // Riwayat Kehadiran 5 Hari Terakhir (Unik per Hari)
  const uniqueDates = [];
  const weeklyAttendance = [];
  attendances.forEach(a => {
    const dateStr = new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    if (!uniqueDates.includes(dateStr) && weeklyAttendance.length < 5) {
      uniqueDates.push(dateStr);
      weeklyAttendance.push({
        day: new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long' }),
        date: new Date(a.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        status: a.status
      });
    }
  });

  // Kalkulasi poin & status
  const remainingPoints = student.maxPoints - student.violationPoints;
  
  const getStatusInfo = (points) => {
    if (points >= 80) return { text: 'Sangat Baik', color: '#10b981', bg: 'bg-emerald-100', textClass: 'text-emerald-700' };
    if (points >= 50) return { text: 'Perlu Perhatian', color: '#f59e0b', bg: 'bg-amber-100', textClass: 'text-amber-700' };
    return { text: 'Panggilan Orang Tua', color: '#ef4444', bg: 'bg-red-100', textClass: 'text-red-700' };
  };

  const statusInfo = getStatusInfo(remainingPoints);
  
  // Data untuk Grafik Donut / Speedometer
  const pieData = [
    { name: 'Sisa Poin', value: remainingPoints },
    { name: 'Poin Terpakai', value: student.violationPoints }
  ];

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(`Halo Pak/Bu ${student.homeroomTeacher}, saya orang tua dari ${student.name} (${student.className}) ingin berdiskusi mengenai perkembangan anak saya di sekolah...`);
    window.open(`https://wa.me/${student.homeroomPhone}?text=${message}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  // --- LOGIKA KALENDER & JADWAL ---
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAYS_HEADER = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    return day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  // Fungsi untuk mendapatkan status jadwal real-time dari presensi
  const getScheduleStatus = (schedule) => {
    const isTodaySchedule = selectedDate.toDateString() === new Date().toDateString();
    const selectedDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    const att = attendances.find(a => 
      (a.schedule_id?._id || a.schedule_id) === schedule._id && 
      new Date(a.date).toISOString().split('T')[0] === selectedDateStr
    );

    if (att) return att.status;
    
    if (isTodaySchedule) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = (schedule.start_time || '00:00').split(':').map(Number);
      if (currentMinutes < startH * 60 + startM) {
        return 'Belum Mulai';
      }
    }
    return 'Belum Ada Info';
  };

  // Data Jadwal & Presensi Harian dari Backend
  const getSchedule = (date) => {
    const daysList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = daysList[date.getDay()];
    
    return schedules.filter(s => s.day === dayName)
      .sort((a,b) => (a.start_time || '').localeCompare(b.start_time || ''))
      .map((sch, idx) => ({
        id: sch._id || idx,
        period: idx + 1,
        time: `${sch.start_time} - ${sch.end_time}`,
        subject: sch.subject,
        teacher: '-', // Belum disediakan dari backend jadwal default saat ini
        status: getScheduleStatus(sch)
      }));
  };

  const currentSchedules = getSchedule(selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Header Mobile-Friendly */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 pt-8 pb-16 px-4 md:px-8 rounded-b-3xl shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-6 text-center md:text-left">
            Portal Orang Tua
          </h1>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left relative">
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-20 h-20 bg-white rounded-full p-1 flex-shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform relative z-10"
              >
                <UserCircle className="w-full h-full text-slate-300" />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 mt-2 w-48 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsPasswordModalOpen(true);
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <Key className="w-4 h-4 mr-2 text-slate-500" />
                      Ganti Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-white mt-2 md:mt-0">
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-sky-100 font-medium">{student.nis} • Kelas {student.className}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ganti Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setIsPasswordModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
            >
              <X size={20} />
            </button>
            <div className="p-2 pt-6">
               <ChangePassword />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-8 space-y-6">
        
        {/* Card Kehadiran Hari Ini */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            {todayAttendance.status === 'Belum Ada' ? <Clock className="w-6 h-6 text-slate-500" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Kehadiran {isToday(selectedDate.getDate()) ? 'Hari Ini' : 'Terpilih'}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-2 ${todayAttendance.status === 'Belum Ada' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                {todayAttendance.status}
              </span>
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {todayAttendance.message} — <span className="font-medium text-slate-700">{todayAttendance.time}</span>
            </p>
          </div>
        </div>

        {/* Ringkasan Poin (Speedometer) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-4 left-4">
            <h3 className="font-bold text-slate-800">Perilaku Siswa</h3>
          </div>
          
          <div className="h-48 w-full max-w-[250px] mt-6 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={statusInfo.color} />
                  <Cell fill="#f1f5f9" /> {/* Warna sisa/bg */}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 left-0 w-full text-center pb-2">
              <span className="text-4xl font-extrabold text-slate-800">{remainingPoints}</span>
              <span className="text-lg text-slate-400 font-medium">/100</span>
            </div>
          </div>
          
          <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${statusInfo.bg} ${statusInfo.textClass}`}>
            <Info className="w-4 h-4" />
            Status: {statusInfo.text}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Total Pelanggaran: {student.violationPoints} Poin
          </p>
        </div>

        {/* Riwayat Aktivitas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('pelanggaran')}
              className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${
                activeTab === 'pelanggaran' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Pelanggaran
            </button>
            <button 
              onClick={() => setActiveTab('kehadiran')}
              className={`flex-1 py-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${
                activeTab === 'kehadiran' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Kehadiran
            </button>
          </div>

          {/* Tabs Content */}
          <div className="p-0">
            {activeTab === 'pelanggaran' && (
              <div className="divide-y divide-slate-100">
                {recentViolations.length > 0 ? (
                  recentViolations.map((v, idx) => (
                    <div key={v._id || idx} className="p-4 md:p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex flex-shrink-0 items-center justify-center mt-1">
                        <span className="text-red-600 font-bold text-sm">-{v.rule_id?.points || 0}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-700 text-sm">{v.rule_id?.violation_name || 'Pelanggaran'}</h4>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(v.date).toLocaleDateString('id-ID', { 
                            day: 'numeric', month: 'long', year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    <p className="font-medium">Tidak ada pelanggaran tercatat.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kehadiran' && (
              <div className="p-4 md:p-6">
                <h4 className="text-sm font-bold text-slate-700 mb-4 text-center">Kehadiran 1 Minggu Terakhir</h4>
                <div className="flex flex-col gap-3">
                  {weeklyAttendance.length > 0 ? (
                    weeklyAttendance.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full ${
                            record.status === 'Hadir' ? 'bg-emerald-500' :
                            record.status === 'Sakit' ? 'bg-amber-500' : 
                            record.status === 'Izin' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{record.day}</p>
                            <p className="text-xs text-slate-500">{record.date}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          record.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'Sakit' ? 'bg-amber-100 text-amber-700' : 
                          record.status === 'Izin' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {record.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-500 py-4">Belum ada data kehadiran.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fitur Baru: Kalender & Jadwal Interaktif */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kolom Kiri: Widget Kalender */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                Pilih Tanggal
              </h3>
              <div className="flex items-center space-x-2">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 w-20 text-center">
                  {MONTHS[currentMonth.getMonth()].substring(0, 3)} {currentMonth.getFullYear()}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS_HEADER.map(day => (
                <div key={day} className="text-[10px] font-bold text-slate-400 py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {blanks.map(blank => (
                <div key={`blank-${blank}`} className="p-1"></div>
              ))}
              {calendarDays.map(day => (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`p-1.5 w-full aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200
                    ${isSelected(day) 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : isToday(day) 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: List Jadwal Pelajaran */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Jadwal & Presensi</h3>
              <span className="text-xs font-semibold text-slate-500">
                {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()].substring(0, 3)}
              </span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-[280px] custom-scrollbar space-y-3">
              {currentSchedules.length > 0 ? (
                currentSchedules.map((sch) => (
                  <div key={sch.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase">Jam</span>
                      <span className="text-sm font-extrabold">{sch.period}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-800 leading-tight">{sch.subject}</h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{sch.time} • {sch.teacher}</p>
                    </div>
                    <div className="flex items-start gap-1 flex-wrap justify-end">
                      {sch.status === 'Hadir' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Hadir</span>}
                      {sch.status === 'Alpa' && <span title="Berpotensi menambah poin pelanggaran" className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 cursor-help"><XCircle className="w-3 h-3 mr-1" /> Alpa</span>}
                      {sch.status === 'Sakit' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200"><Info className="w-3 h-3 mr-1" /> Sakit</span>}
                      {sch.status === 'Izin' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200"><Info className="w-3 h-3 mr-1" /> Izin</span>}
                      {sch.status === 'Belum Mulai' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><Clock className="w-3 h-3 mr-1" /> Belum Mulai</span>}
                      {sch.status === 'Belum Ada Info' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200"><Info className="w-3 h-3 mr-1" /> Belum Ada Info</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Libur / Kosong</p>
                  <p className="text-xs text-slate-400 mt-1">Tidak ada jadwal tercatat.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fitur Kontak WhatsApp */}
        <button 
          onClick={handleWhatsAppContact}
          className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-between group"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white fill-white/20" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">Hubungi Wali Kelas</h3>
              <p className="text-sky-100 text-xs md:text-sm mt-0.5">
                Tanya perkembangan anak via WhatsApp
              </p>
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" height="20" viewBox="0 0 24 24" 
              fill="none" stroke="currentColor" strokeWidth="2.5" 
              strokeLinecap="round" strokeLinejoin="round" 
              className="group-hover:translate-x-1 transition-transform"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </div>
        </button>

      </div>
    </div>
  );
}