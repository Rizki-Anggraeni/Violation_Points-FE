'use client';

import React, { useState } from 'react';
import { 
  UserCircle, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  ShieldAlert, 
  Clock, 
  Info
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function DashboardWaliMurid() {
  const [activeTab, setActiveTab] = useState('pelanggaran');

  // Mock Data (Dalam implementasi asli, ini diambil melalui API)
  const student = {
    name: 'Ahmad Budi Santoso',
    nis: '202310045',
    className: 'XI RPL 1',
    homeroomTeacher: 'Bpk. Hendra Wijaya',
    homeroomPhone: '6281234567890',
    violationPoints: 15,
    maxPoints: 100,
  };

  const todayAttendance = {
    status: 'Hadir',
    time: '06:45 WIB',
    message: 'Anak Anda sudah berada di sekolah'
  };

  const recentViolations = [
    { id: 1, date: '2026-05-10', rule: 'Terlambat masuk jam pelajaran pertama', points: 10 },
    { id: 2, date: '2026-05-02', rule: 'Atribut seragam tidak lengkap (Dasi)', points: 5 },
  ];

  const weeklyAttendance = [
    { day: 'Senin', status: 'Hadir', date: '04 Mei' },
    { day: 'Selasa', status: 'Hadir', date: '05 Mei' },
    { day: 'Rabu', status: 'Hadir', date: '06 Mei' },
    { day: 'Kamis', status: 'Sakit', date: '07 Mei' },
    { day: 'Jumat', status: 'Hadir', date: '08 Mei' },
  ];

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Header Mobile-Friendly */}
      <div className="bg-gradient-to-br from-sky-600 to-indigo-700 pt-8 pb-16 px-4 md:px-8 rounded-b-3xl shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl md:text-2xl font-bold mb-6 text-center md:text-left">
            Portal Orang Tua
          </h1>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
            <div className="w-20 h-20 bg-white rounded-full p-1 flex-shrink-0 shadow-lg">
              <UserCircle className="w-full h-full text-slate-300" />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <p className="text-sky-100 font-medium">{student.nis} • Kelas {student.className}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-8 space-y-6">
        
        {/* Card Kehadiran Hari Ini */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Kehadiran Hari Ini
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
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
                  recentViolations.map((v) => (
                    <div key={v.id} className="p-4 md:p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex flex-shrink-0 items-center justify-center mt-1">
                        <span className="text-red-600 font-bold text-sm">-{v.points}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-700 text-sm">{v.rule}</h4>
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
                  {weeklyAttendance.map((record, index) => (
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
                  ))}
                </div>
              </div>
            )}
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