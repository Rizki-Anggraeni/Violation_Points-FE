export const barData = [
  { name: 'Jan', poin: 400 }, { name: 'Feb', poin: 300 },
  { name: 'Mar', poin: 600 }, { name: 'Apr', poin: 800 },
  // ... sesuaikan sampai Des
];

export const pieData = [
  { name: 'Berat', value: 400, fill: '#ef4444' },
  { name: 'Sedang', value: 300, fill: '#f59e0b' },
  { name: 'Ringan', value: 300, fill: '#3b82f6' },
];

export const dummyClasses = [
  { id: 'c1', name: 'X RPL 1' },
  { id: 'c2', name: 'X RPL 2' },
  { id: 'c3', name: 'XI TKJ 1' },
  { id: 'c4', name: 'XI TKJ 2' },
];

export const dummySchedules = [
  { id: 1, classId: 'c1', day: 'Senin', startTime: '07:00', endTime: '08:30', subject: 'Matematika', teacherName: 'Budi Santoso, S.Pd', waliKelasId: 'guru-123' },
  { id: 2, classId: 'c1', day: 'Senin', startTime: '08:30', endTime: '10:00', subject: 'Bahasa Indonesia', teacherName: 'Siti Aminah, M.Pd', waliKelasId: 'guru-123' },
  { id: 3, classId: 'c1', day: 'Selasa', startTime: '07:00', endTime: '09:00', subject: 'Pemrograman Web', teacherName: 'Ahmad Fauzi, S.Kom', waliKelasId: 'guru-123' },
  { id: 4, classId: 'c1', day: 'Rabu', startTime: '08:00', endTime: '10:00', subject: 'Bahasa Inggris', teacherName: 'Dewi Lestari, S.Pd', waliKelasId: 'guru-123' },
  { id: 5, classId: 'c2', day: 'Senin', startTime: '07:00', endTime: '09:00', subject: 'Fisika', teacherName: 'Joko Widodo, S.T.', waliKelasId: 'guru-456' },
];

export const dummyStudents = [
  { id: 1, nis: '1001', name: 'Budi Santoso', class_id: { name: 'X RPL 1' }, total_points: 50, gender: 'Laki-laki' },
  { id: 2, nis: '1002', name: 'Siti Aminah', class_id: { name: 'X RPL 2' }, total_points: 10, gender: 'Perempuan' },
  { id: 3, nis: '1003', name: 'Ahmad Fauzi', class_id: { name: 'XI TKJ 1' }, total_points: 0, gender: 'Laki-laki' },
  { id: 4, nis: '1004', name: 'Dewi Lestari', class_id: { name: 'X RPL 1' }, total_points: 5, gender: 'Perempuan' },
];

export const dummyTeachers = [
  { id: 1, nip: '198001012005011001', name: 'Budi Santoso, S.Pd', className: 'X RPL 1' },
  { id: 2, nip: '198202022006022002', name: 'Siti Aminah, M.Kom', className: 'X RPL 2' },
  { id: 3, nip: '197503032004031003', name: 'Ahmad Fauzi, S.T.', className: 'XI TKJ 1' },
  { id: 4, nip: '198804042010042004', name: 'Dewi Lestari, S.Kom', className: 'XI TKJ 2' },
];

export const dummyRecentViolations = [
  { id: 1, name: 'Budi Santoso', violation: 'Merokok di area sekolah', points: 50, date: '12 Okt 2023' },
  { id: 2, name: 'Siti Aminah', violation: 'Terlambat > 15 menit', points: 10, date: '12 Okt 2023' },
  { id: 3, name: 'Ahmad Fauzi', violation: 'Membolos pelajaran', points: 20, date: '11 Okt 2023' },
  { id: 4, name: 'Dewi Lestari', violation: 'Seragam tidak lengkap', points: 5, date: '10 Okt 2023' },
];