import React from 'react';
import { 
  AcademicCapIcon, 
  ChartBarIcon, 
  TrophyIcon,
  SparklesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';

interface AverageScoresProps {
  data: PPDBData[];
}

const calculateAverage = (data: PPDBData[], field: string) => {
  const validData = data.filter(item => 
    item.submittedAt && 
    item[`${field}2` as keyof PPDBData] && 
    item[`${field}3` as keyof PPDBData] && 
    item[`${field}4` as keyof PPDBData]
  );
  
  if (validData.length === 0) return 0;

  const sum = validData.reduce((acc, item) => {
    const sem2 = parseFloat(item[`${field}2` as keyof PPDBData] as string) || 0;
    const sem3 = parseFloat(item[`${field}3` as keyof PPDBData] as string) || 0;
    const sem4 = parseFloat(item[`${field}4` as keyof PPDBData] as string) || 0;
    return acc + ((sem2 + sem3 + sem4) / 3);
  }, 0);

  return sum / validData.length;
};

export const calculateJalurAverage = (data: PPDBData[], jalur: string) => {
  const jalurData = data.filter(item => 
    item.submittedAt && 
    item.jalur === jalur
  );
  
  if (jalurData.length === 0) return 0;

  const sum = jalurData.reduce((acc, item) => {
    const fields = ['nilaiAgama', 'nilaiBindo', 'nilaiBing', 'nilaiMtk', 'nilaiIpa'];
    const avgPerField = fields.map(field => {
      const sem2 = parseFloat(item[`${field}2` as keyof PPDBData] as string) || 0;
      const sem3 = parseFloat(item[`${field}3` as keyof PPDBData] as string) || 0;
      const sem4 = parseFloat(item[`${field}4` as keyof PPDBData] as string) || 0;
      return (sem2 + sem3 + sem4) / 3;
    });
    
    return acc + (avgPerField.reduce((a, b) => a + b, 0) / fields.length);
  }, 0);

  return sum / jalurData.length;
};

const AverageScores: React.FC<AverageScoresProps> = ({ data }) => {
  const mapelList = [
    { label: 'Pendidikan Agama', short: 'Agama', avg: calculateAverage(data, 'nilaiAgama'), color: 'emerald' },
    { label: 'Bahasa Indonesia', short: 'B. Indo', avg: calculateAverage(data, 'nilaiBindo'), color: 'blue' },
    { label: 'Bahasa Inggris', short: 'B. Inggris', avg: calculateAverage(data, 'nilaiBing'), color: 'purple' },
    { label: 'Matematika', short: 'MTK', avg: calculateAverage(data, 'nilaiMtk'), color: 'amber' },
    { label: 'Ilmu Pengetahuan Alam', short: 'IPA', avg: calculateAverage(data, 'nilaiIpa'), color: 'teal' }
  ];

  const jalurScores = [
    {
      id: 'prestasi',
      label: 'Jalur Prestasi',
      avg: calculateJalurAverage(data, 'prestasi'),
      count: data.filter(d => d.jalur === 'prestasi').length,
      icon: TrophyIcon,
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      bar: 'bg-blue-600'
    },
    {
      id: 'reguler',
      label: 'Jalur Reguler',
      avg: calculateJalurAverage(data, 'reguler'),
      count: data.filter(d => d.jalur === 'reguler').length,
      icon: AcademicCapIcon,
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      bar: 'bg-emerald-600'
    },
    {
      id: 'undangan',
      label: 'Jalur Undangan',
      avg: calculateJalurAverage(data, 'undangan'),
      count: data.filter(d => d.jalur === 'undangan').length,
      icon: SparklesIcon,
      badge: 'bg-purple-50 text-purple-800 border-purple-200',
      bar: 'bg-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Subject Average Scores (Bento 7 Cols) */}
      <div className="lg:col-span-7 rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <BookOpenIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                  Rata-rata Nilai per Mata Pelajaran
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Akumulasi semester 2, 3, dan 4 pendaftar reguler
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
              5 Mapel
            </span>
          </div>

          <div className="space-y-2.5">
            {mapelList.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-800 truncate">{item.label}</span>
                    <span className="text-sm font-black text-emerald-700">{item.avg.toFixed(1)}</span>
                  </div>

                  <div className="w-full h-2 bg-zinc-200/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (item.avg / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-zinc-400 font-medium flex items-center justify-between border-t border-zinc-100">
            <span>Skala penilaian 0 - 100</span>
            <span className="text-zinc-600 font-semibold">{data.length} Data Rapor Terproses</span>
          </div>
        </div>
      </div>

      {/* 2. Track Average Comparison (Bento 5 Cols) */}
      <div className="lg:col-span-5 rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ChartBarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                  Rata-rata Nilai per Jalur
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Performa akademik berdasarkan jalur masuk
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {jalurScores.map((item) => (
              <div 
                key={item.id}
                className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-zinc-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.badge}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">{item.label}</h4>
                    <p className="text-[10px] text-zinc-500 font-medium">{item.count} Calon Siswa</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-zinc-900">{item.avg.toFixed(1)}</span>
                  <span className="text-[10px] text-zinc-400 block font-medium">Rata-rata Gabungan</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-[11px] text-emerald-900 leading-relaxed font-medium">
            <strong>Analisis:</strong> Digunakan untuk pertimbangan pemeringkatan kuota per jalur seleksi reguler.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AverageScores;
