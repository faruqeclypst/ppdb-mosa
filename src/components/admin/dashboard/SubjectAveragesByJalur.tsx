import React from 'react';
import { AcademicCapIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';
import { calculateJalurAverage } from './AverageScores';

interface SubjectAveragesByJalurProps {
  data: PPDBData[];
}

const SubjectAveragesByJalur: React.FC<SubjectAveragesByJalurProps> = ({ data }) => {
  const jalurs = [
    { 
      label: 'Prestasi', 
      jalur: 'prestasi' as const,
      icon: TrophyIcon,
      accent: 'blue',
      borderColor: 'border-blue-200/80',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      barColor: 'bg-blue-600',
      textColor: 'text-blue-700'
    },
    { 
      label: 'Reguler', 
      jalur: 'reguler' as const,
      icon: AcademicCapIcon,
      accent: 'emerald',
      borderColor: 'border-emerald-200/80',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-600',
      textColor: 'text-emerald-700'
    },
    { 
      label: 'Undangan', 
      jalur: 'undangan' as const,
      icon: SparklesIcon,
      accent: 'purple',
      borderColor: 'border-purple-200/80',
      badge: 'bg-purple-50 text-purple-800 border-purple-200',
      barColor: 'bg-purple-600',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {jalurs.map((jalurItem, idx) => {
        const jalurData = data.filter(d => d.jalur === jalurItem.jalur);
        const overallAvg = calculateJalurAverage(data, jalurItem.jalur);

        return (
          <div 
            key={idx}
            className={`rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border ${jalurItem.borderColor} shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
          >
            <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${jalurItem.badge}`}>
                      <jalurItem.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Jalur {jalurItem.label}</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">{jalurData.length} Pendaftar</p>
                    </div>
                  </div>

                  <span className={`text-base font-black ${jalurItem.textColor}`}>
                    {overallAvg.toFixed(1)}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                  {[
                    { label: 'Agama', field: 'nilaiAgama' },
                    { label: 'B. Indonesia', field: 'nilaiBindo' },
                    { label: 'B. Inggris', field: 'nilaiBing' },
                    { label: 'Matematika', field: 'nilaiMtk' },
                    { label: 'IPA', field: 'nilaiIpa' }
                  ].map((mapel, mapelIdx) => {
                    const mapelAvg = jalurData.length > 0 
                      ? jalurData.reduce((acc, item) => {
                          const sem2 = parseFloat(item[`${mapel.field}2` as keyof PPDBData] as string) || 0;
                          const sem3 = parseFloat(item[`${mapel.field}3` as keyof PPDBData] as string) || 0;
                          const sem4 = parseFloat(item[`${mapel.field}4` as keyof PPDBData] as string) || 0;
                          return acc + ((sem2 + sem3 + sem4) / 3);
                        }, 0) / jalurData.length
                      : 0;

                    return (
                      <div key={mapelIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-zinc-700">{mapel.label}</span>
                          <span className={`font-bold ${jalurItem.textColor}`}>{mapelAvg.toFixed(1)}</span>
                        </div>

                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${jalurItem.barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.min(100, (mapelAvg / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                <span className="font-medium">Rata-rata 5 Mapel</span>
                <span className={`font-black ${jalurItem.textColor}`}>{overallAvg.toFixed(1)} / 100</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubjectAveragesByJalur;
