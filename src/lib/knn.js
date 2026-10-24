import api from './axios';

export const TRAINING_DATA = [
  // KELAS AMAN (Tertib & Disiplin)
  { points: 0, alpa: 0, late: 0, label: 'Aman' },
  { points: 5, alpa: 0, late: 1, label: 'Aman' },
  { points: 5, alpa: 1, late: 0, label: 'Aman' },
  { points: 10, alpa: 0, late: 1, label: 'Aman' },
  { points: 10, alpa: 1, late: 0, label: 'Aman' },
  { points: 15, alpa: 0, late: 2, label: 'Aman' },
  { points: 15, alpa: 1, late: 1, label: 'Aman' },

  // KELAS WASPADA (Mulai Bermasalah / Butuh Pemantauan)
  { points: 20, alpa: 2, late: 2, label: 'Waspada' },
  { points: 25, alpa: 1, late: 3, label: 'Waspada' },
  { points: 30, alpa: 3, late: 1, label: 'Waspada' },
  { points: 35, alpa: 2, late: 3, label: 'Waspada' },
  { points: 40, alpa: 3, late: 2, label: 'Waspada' },
  { points: 45, alpa: 2, late: 4, label: 'Waspada' },
  { points: 20, alpa: 4, late: 2, label: 'Waspada' },

  // KELAS RAWAN (Tindakan Pelanggaran/Alpa Berat / Butuh Intervensi BK Segera)
  { points: 50, alpa: 4, late: 4, label: 'Rawan' },
  { points: 60, alpa: 5, late: 3, label: 'Rawan' },
  { points: 70, alpa: 6, late: 5, label: 'Rawan' },
  { points: 75, alpa: 5, late: 6, label: 'Rawan' },
  { points: 85, alpa: 7, late: 5, label: 'Rawan' },
  { points: 100, alpa: 8, late: 7, label: 'Rawan' }
];

export const FEATURE_BOUNDS = {
  points: { min: 0, max: 100 },
  alpa: { min: 0, max: 10 },
  late: { min: 0, max: 10 }
};

function minMaxNormalize(value, min, max) {
  if (max <= min) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

export function normalizeFeatures({ points, alpa, late }) {
  return [
    minMaxNormalize(points || 0, FEATURE_BOUNDS.points.min, FEATURE_BOUNDS.points.max),
    minMaxNormalize(alpa || 0, FEATURE_BOUNDS.alpa.min, FEATURE_BOUNDS.alpa.max),
    minMaxNormalize(late || 0, FEATURE_BOUNDS.late.min, FEATURE_BOUNDS.late.max)
  ];
}

export function calculateEuclideanDistance(vectorA, vectorB) {
  const sumSquaredDiff = vectorA.reduce((sum, val, idx) => {
    return sum + Math.pow(val - vectorB[idx], 2);
  }, 0);
  return Math.sqrt(sumSquaredDiff);
}

export function getFriendlyExplanation(label, features) {
  const { points = 0, alpa = 0, late = 0 } = features || {};
  switch (label) {
    case 'Rawan':
      return {
        levelName: 'Tinggi (Sangat Rawan)',
        badgeColor: 'rose',
        statusDescription: 'Siswa ini berisiko sangat tinggi mengulangi atau melakukan pelanggaran berikutnya.',
        whyReason: `Memiliki akumulasi ${points} poin pelanggaran, serta tercatat ${alpa} kali alpa dan ${late} kali terlambat. Pola ini sangat menyerupai siswa yang membutuhkan penanganan khusus.`,
        actionPlan: 'Segera lakukan panggilan orang tua ke sekolah dan adakan sesi konseling empat mata dengan Guru BK.',
        urgency: 'Perlu Tindakan Cepat (Hari Ini)',
        riskPercent: 90
      };
    case 'Waspada':
      return {
        levelName: 'Sedang (Perlu Perhatian)',
        badgeColor: 'amber',
        statusDescription: 'Siswa mulai menunjukkan penurunan kedisiplinan dan berisiko melanggar jika dibiarkan.',
        whyReason: `Memiliki akumulasi ${points} poin pelanggaran, ${alpa} kali alpa, dan ${late} kali terlambat. Pola kedisiplinan mulai menurun dari standar yang diharapkan.`,
        actionPlan: 'Berikan teguran lisan secara ramah, koordinasikan dengan Wali Kelas untuk memantau absensi hariannya.',
        urgency: 'Pantau Dalam Minggu Ini',
        riskPercent: 55
      };
    case 'Aman':
    default:
      return {
        levelName: 'Rendah (Aman & Disiplin)',
        badgeColor: 'emerald',
        statusDescription: 'Siswa sangat tertib dan disiplin. Risiko melakukan pelanggaran berikutnya sangat kecil.',
        whyReason: `Akumulasi poin hanya ${points} poin dengan ${alpa} kali alpa dan ${late} kali terlambat. Masih dalam batas wajar toleransi kedisiplinan sekolah.`,
        actionPlan: 'Pertahankan kedisiplinan yang baik, berikan apresiasi, dan lakukan pemantauan rutin bulanan.',
        urgency: 'Kondisi Baik',
        riskPercent: 15
      };
  }
}

export function classifyStudent(studentFeatures, k = 5) {
  const normalizedTarget = normalizeFeatures(studentFeatures);

  const neighbors = TRAINING_DATA.map((sample) => {
    const normalizedSample = normalizeFeatures(sample);
    const distance = calculateEuclideanDistance(normalizedTarget, normalizedSample);
    return {
      sample,
      distance,
      label: sample.label
    };
  });

  neighbors.sort((a, b) => a.distance - b.distance);
  const kNearest = neighbors.slice(0, k);

  const votes = { Aman: 0, Waspada: 0, Rawan: 0 };
  const distanceSum = { Aman: 0, Waspada: 0, Rawan: 0 };

  kNearest.forEach((item) => {
    votes[item.label] = (votes[item.label] || 0) + 1;
    distanceSum[item.label] = (distanceSum[item.label] || 0) + item.distance;
  });

  let predictedLabel = 'Aman';
  let maxVotes = -1;
  let minAvgDist = Infinity;

  for (const [label, count] of Object.entries(votes)) {
    const avgDist = count > 0 ? distanceSum[label] / count : Infinity;
    if (count > maxVotes || (count === maxVotes && avgDist < minAvgDist)) {
      maxVotes = count;
      predictedLabel = label;
      minAvgDist = avgDist;
    }
  }

  const confidenceScore = Math.round((maxVotes / k) * 100);
  const friendly = getFriendlyExplanation(predictedLabel, studentFeatures);

  return {
    label: predictedLabel,
    confidence: `${confidenceScore}%`,
    k_used: k,
    votes,
    friendly,
    recommendation: friendly.actionPlan,
    features: {
      points: studentFeatures.points || 0,
      alpa: studentFeatures.alpa || 0,
      late: studentFeatures.late || 0
    },
    normalized_features: {
      points: Number(normalizedTarget[0].toFixed(3)),
      alpa: Number(normalizedTarget[1].toFixed(3)),
      late: Number(normalizedTarget[2].toFixed(3))
    },
    nearest_neighbors: kNearest.map((n) => ({
      label: n.label,
      distance: Number(n.distance.toFixed(4)),
      sample: n.sample
    }))
  };
}

/**
 * Helper untuk mengambil data risiko siswa dengan fallback otomatis
 * Menjamin tidak pernah crash 404 meskipun backend belum sempat direstart
 */
export async function getStudentRiskData(k = 5) {
  try {
    const res = await api.get(`/bk/student-risk?k=${k}`);
    if (res.data?.success) {
      // Perkaya dengan penjelasan ramah orang awam
      const enriched = {
        ...res.data,
        data: (res.data.data || []).map(item => ({
          ...item,
          classification: {
            ...item.classification,
            friendly: getFriendlyExplanation(item.classification.label, item.metrics)
          }
        }))
      };
      return enriched;
    }
  } catch (error) {
    console.warn('Backend /api/bk/student-risk belum aktif (404), otomatis menggunakan kalkulasi pintar lokal:', error);
  }

  // Fallback: hitung otomatis dari data yang tersedia
  try {
    const [stuRes, attRes, vioRes] = await Promise.all([
      api.get('/students'),
      api.get('/attendances'),
      api.get('/violations')
    ]);

    const students = stuRes.data || [];
    const attendances = attRes.data || [];
    const violations = vioRes.data || [];

    const attendanceMap = {};
    attendances.forEach(att => {
      const sId = att.student_id?._id || att.student_id;
      if (!sId) return;
      const strId = sId.toString();
      if (!attendanceMap[strId]) {
        attendanceMap[strId] = { alpa: 0, late: 0 };
      }
      if (att.status === 'Alpa') attendanceMap[strId].alpa += 1;
      if (att.status === 'Terlambat') attendanceMap[strId].late += 1;
    });

    const violationMap = {};
    violations.forEach(vio => {
      const sId = vio.student_id?._id || vio.student_id;
      if (!sId) return;
      const strId = sId.toString();
      if (!violationMap[strId]) {
        violationMap[strId] = { count: 0, lateViolations: 0 };
      }
      violationMap[strId].count += 1;
      const ruleName = vio.rule_id?.violation_name?.toLowerCase() || '';
      const desc = vio.description?.toLowerCase() || '';
      if (ruleName.includes('terlambat') || desc.includes('terlambat')) {
        violationMap[strId].lateViolations += 1;
      }
    });

    let totalRawan = 0;
    let totalWaspada = 0;
    let totalAman = 0;

    const results = students.map(student => {
      const sId = student._id.toString();
      const attData = attendanceMap[sId] || { alpa: 0, late: 0 };
      const vioData = violationMap[sId] || { count: 0, lateViolations: 0 };

      const points = student.total_points || 0;
      const alpa = attData.alpa || 0;
      const late = (attData.late || 0) + (vioData.lateViolations || 0);

      const classification = classifyStudent({ points, alpa, late }, k);

      if (classification.label === 'Rawan') totalRawan++;
      else if (classification.label === 'Waspada') totalWaspada++;
      else totalAman++;

      return {
        student: {
          _id: student._id,
          nis: student.nis,
          name: student.name,
          class_id: student.class_id?._id || student.class_id,
          class_name: student.class_id?.name || 'Belum Ada Kelas',
          total_points: points,
          parrent_phone: student.parrent_phone || ''
        },
        metrics: {
          points,
          alpa,
          late,
          total_violations: vioData.count
        },
        classification
      };
    });

    const priorityOrder = { Rawan: 1, Waspada: 2, Aman: 3 };
    results.sort((a, b) => {
      const prioDiff = priorityOrder[a.classification.label] - priorityOrder[b.classification.label];
      if (prioDiff !== 0) return prioDiff;
      return b.metrics.points - a.metrics.points;
    });

    const totalStudents = students.length;
    const stats = {
      total_students: totalStudents,
      total_rawan: totalRawan,
      total_waspada: totalWaspada,
      total_aman: totalAman,
      percentage_rawan: totalStudents > 0 ? Number(((totalRawan / totalStudents) * 100).toFixed(1)) : 0,
      percentage_waspada: totalStudents > 0 ? Number(((totalWaspada / totalStudents) * 100).toFixed(1)) : 0,
      percentage_aman: totalStudents > 0 ? Number(((totalAman / totalStudents) * 100).toFixed(1)) : 0,
      k_used: k
    };

    return {
      success: true,
      stats,
      data: results
    };
  } catch (fallbackError) {
    console.error('Gagal mengambil data alternatif:', fallbackError);
    return {
      success: false,
      stats: { total_students: 0, total_rawan: 0, total_waspada: 0, total_aman: 0 },
      data: []
    };
  }
}

