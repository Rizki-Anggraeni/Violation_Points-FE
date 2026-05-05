'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, CheckSquare, Info } from 'lucide-react';

// --- Mock Data ---
const mockSchedules = [
  { id: 1, time: '07:00 - 08:30', subject: 'Matematika', className: 'X RPL 1' },
  { id: 2, time: '08:30 - 10:00', subject: 'Bahasa Indonesia', className: 'X RPL 1' },
  { id: 3, time: '10:30 - 12:00', subject: 'Pemrograman Web', className: 'X RPL 2' },
];

const mockStudents = [
  { id: 's1', name: 'Ahmad Fauzi', nis: '1001' },
  { id: 's2', name: 'Budi Santoso', nis: '1002' },
  { id: 's3', name: 'Dewi Lestari', nis: '1003' },
  { id: 's4', name: 'Siti Aminah', nis: '1004' },
  { id: 's5', name: 'Zaki Pratama', nis: '1005' },
];

const STATUS_OPTIONS = [
  { key: 'Hadir', alias: 'H', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200', active: 'bg-emerald-500 text-white border-emerald-500' },
  { key: 'Sakit', alias: 'S', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
  { key: 'Izin', alias: 'I', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200', active: 'bg-blue-500 text-white border-blue-500' },
  { key: 'Alpa', alias: 'A', color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200', active: 'bg-red-500 text-white border-red-500' },
];

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS_HEADER = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function PresensiPage() {
  // State Kalender
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State Pilihan Jadwal & Presensi
  const [selectedSchedule, setSelectedSchedule] = useState(mockSchedules[0]);
  const [attendances, setAttendances] = useState({});

  // Fungsi Navigasi Kalender
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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

  // Fungsi Presensi
  const handleStatusChange = (studentId, status) => {
    setAttendances(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllHadir = () => {
    const allHadir = {};
    mockStudents.forEach(student => {
      allHadir[student.id] = 'Hadir';
    });
    setAttendances(allHadir);
  };

  const formatDate = (date) => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Input Presensi Siswa</h2>
        <p className="text-sm text-slate-500 mt-1">Catat kehadiran harian siswa berdasarkan jadwal pelajaran.</p>
      </div>

      {/* Top Section (2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kiri: Widget Kalender */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-emerald-500" />
              Kalender
            </h3>
            <div className="flex items-center space-x-2">
              <button onClick={prevMonth} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-slate-700 w-24 text-center">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_HEADER.map(day => (
              <div key={day} className="text-xs font-semibold text-slate-400 py-1">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="p-2"></div>
            ))}
            {days.map(day => (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`p-2 w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200
                  ${isSelected(day) 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' 
                    : isToday(day) 
                      ? 'bg-slate-100 text-emerald-600 font-bold' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Kanan: Tabel Mata Pelajaran */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-bold text-slate-800">Jadwal Mengajar Anda</h3>
            <p className="text-xs text-slate-500 mt-1">Pilih jadwal untuk membuka form presensi.</p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              {mockSchedules.map((schedule) => {
                const isActive = selectedSchedule?.id === schedule.id;
                return (
                  <div 
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isActive ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {schedule.subject}
                      </span>
                      <span className="text-xs font-medium text-slate-500 mt-1">
                        {schedule.time}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-md ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {schedule.className}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section (Tabel Presensi Utama) */}
      {selectedSchedule && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Tabel */}
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Data Siswa Kelas {selectedSchedule.className} - {selectedSchedule.subject}
              </h3>
              <div className="flex items-center mt-2 space-x-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CalendarIcon className="w-3 h-3 mr-1.5" />
                  {formatDate(selectedDate)}
                </span>
                <span className="flex items-center text-xs font-medium text-slate-500">
                  <Info className="w-3.5 h-3.5 mr-1 text-red-500" />
                  Status 'Alpa' akan menambah poin pelanggaran siswa.
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleMarkAllHadir}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm whitespace-nowrap"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Pilih Semua Hadir
            </button>
          </div>

          {/* Tabel Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-6 py-4 font-semibold w-16">No</th>
                  <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                  <th className="px-6 py-4 font-semibold text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-50">
                {mockStudents.map((student, index) => {
                  const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const currentStatus = attendances[student.id];

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs mr-3 shadow-sm border border-slate-200">
                            {initials}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{student.name}</span>
                            <span className="text-xs text-slate-400 font-medium mt-0.5">NIS: {student.nis}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {STATUS_OPTIONS.map((opt) => {
                            const isSelected = currentStatus === opt.key;
                            return (
                              <button
                                key={opt.key}
                                onClick={() => handleStatusChange(student.id, opt.key)}
                                title={opt.key}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200 border shadow-sm
                                  ${isSelected ? opt.active : `bg-white ${opt.color} opacity-70 hover:opacity-100`}
                                `}
                              >
                                {opt.alias}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Action */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => alert('Fitur simpan akan disambungkan ke API backend!')}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Simpan Presensi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}