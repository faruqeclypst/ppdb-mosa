import React from 'react';
import Card from '../../ui/Card';
import { AcademicCapIcon, UserGroupIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';
import { JALUR_COLORS } from './SecondaryStats';
import { calculateJalurAverage } from './AverageScores';

interface SubjectAveragesByJalurProps {
  data: PPDBData[];
}

const SubjectAveragesByJalur: React.FC<SubjectAveragesByJalurProps> = ({ data }) => {
  const jalurs = [
    { 
      label: 'Prestasi', 
      jalur: 'prestasi' as const,
      colors: JALUR_COLORS.prestasi,
      icon: <AcademicCapIcon className="w-4 h-4" />
    },
    { 
      label: 'Reguler', 
      jalur: 'reguler' as const,
      colors: JALUR_COLORS.reguler,
      icon: <UserGroupIcon className="w-4 h-4" />
    },
    { 
      label: 'Undangan', 
      jalur: 'undangan' as const,
      colors: JALUR_COLORS.undangan,
      icon: <DocumentTextIcon className="w-4 h-4" />
    },
    { 
      label: 'PJJ', 
      jalur: 'pjj' as const,
      colors: JALUR_COLORS.pjj,
      icon: <ChartBarIcon className="w-4 h-4" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6">
      {jalurs.map((jalurItem, idx) => (
        <Card key={idx} className="p-2 md:p-4 lg:p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3 md:mb-6">
            <div className={`p-1.5 md:p-2 ${jalurItem.colors.bg} rounded-lg`}>
              {React.cloneElement(jalurItem.icon as React.ReactElement, {
                className: `w-4 h-4 md:w-5 md:h-5 ${jalurItem.colors.text}`
              })}
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-gray-900">Jalur {jalurItem.label}</h3>
              <p className="text-xs md:text-sm text-gray-600">
                {data.filter(d => d.jalur === jalurItem.jalur).length} Pendaftar
              </p>
            </div>
          </div>

          <div className="space-y-2 md:space-y-4 flex-1">
            {[
              { label: 'Agama', field: 'nilaiAgama' },
              { label: 'B. Indonesia', field: 'nilaiBindo' },
              { label: 'B. Inggris', field: 'nilaiBing' },
              { label: 'Matematika', field: 'nilaiMtk' },
              { label: 'IPA', field: 'nilaiIpa' }
            ].map((mapel, mapelIdx) => {
              const jalurData = data.filter(d => d.jalur === jalurItem.jalur);
              const mapelAvg = jalurData.length > 0 
                ? jalurData.reduce((acc, item) => {
                    const sem2 = parseFloat(item[`${mapel.field}2` as keyof PPDBData] as string) || 0;
                    const sem3 = parseFloat(item[`${mapel.field}3` as keyof PPDBData] as string) || 0;
                    const sem4 = parseFloat(item[`${mapel.field}4` as keyof PPDBData] as string) || 0;
                    return acc + ((sem2 + sem3 + sem4) / 3);
                  }, 0) / jalurData.length
                : 0;

              return (
                <div key={mapelIdx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${jalurItem.colors.accent}`} />
                    <span className="text-xs md:text-sm font-medium text-gray-700">
                      {mapel.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 md:w-32 bg-gray-100 rounded-full h-1">
                      <div 
                        className={`${jalurItem.colors.accent} h-1 rounded-full transition-all duration-500`}
                        style={{ width: `${(mapelAvg / 100) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs md:text-sm font-semibold ${jalurItem.colors.text} min-w-[32px] text-right`}>
                      {mapelAvg.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-gray-600">Rata-rata Keseluruhan</span>
              <span className={`text-sm md:text-lg font-bold ${jalurItem.colors.text}`}>
                {calculateJalurAverage(data, jalurItem.jalur).toFixed(1)}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SubjectAveragesByJalur;
