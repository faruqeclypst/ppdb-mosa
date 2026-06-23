import React from 'react';
import Card from '../../ui/Card';
import { AcademicCapIcon, ChartBarIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';
import { JALUR_COLORS } from './SecondaryStats';

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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Rata-rata Nilai per Mapel */}
      <Card className="p-3 md:p-4 lg:p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <AcademicCapIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
          <h3 className="text-sm md:text-base font-semibold text-gray-900">Rata-rata Nilai Per Mapel</h3>
        </div>
        <div className="space-y-3 flex-1">
          {[
            { label: 'Agama', avg: calculateAverage(data, 'nilaiAgama') },
            { label: 'B. Indonesia', avg: calculateAverage(data, 'nilaiBindo') },
            { label: 'B. Inggris', avg: calculateAverage(data, 'nilaiBing') },
            { label: 'Matematika', avg: calculateAverage(data, 'nilaiMtk') },
            { label: 'IPA', avg: calculateAverage(data, 'nilaiIpa') }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-xs md:text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 md:w-32 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(item.avg / 100) * 100}%` }}
                  />
                </div>
                <span className="text-sm md:text-lg font-bold text-blue-600 min-w-[40px] text-right">
                  {item.avg.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rata-rata Nilai per Jalur */}
      <Card className="p-3 md:p-4 lg:p-6 h-full flex flex-col">
        <div className="flex items-between justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Rata-rata Nilai Per Jalur</h3>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {[
            { 
              label: 'Prestasi', 
              avg: calculateJalurAverage(data, 'prestasi'),
              colors: JALUR_COLORS.prestasi,
              icon: <AcademicCapIcon className="w-4 h-4 md:w-5 md:h-5" />
            },
            { 
              label: 'Reguler', 
              avg: calculateJalurAverage(data, 'reguler'),
              colors: JALUR_COLORS.reguler,
              icon: <UserGroupIcon className="w-4 h-4 md:w-5 md:h-5" />
            },
            { 
              label: 'Undangan', 
              avg: calculateJalurAverage(data, 'undangan'),
              colors: JALUR_COLORS.undangan,
              icon: <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5" />
            },
            { 
              label: 'PJJ', 
              avg: calculateJalurAverage(data, 'pjj'),
              colors: JALUR_COLORS.pjj,
              icon: <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5" />
            }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 md:p-2 bg-white rounded-lg">
                  <div className={`p-1.5 md:p-2 ${item.colors.bg} rounded-lg`}>
                    {React.cloneElement(item.icon as React.ReactElement, {
                      className: `w-4 h-4 md:w-5 md:h-5 ${item.colors.text}`
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">Jalur {item.label}</p>
                  <p className="text-xs text-gray-600">
                    {data.filter(d => d.jalur === item.label.toLowerCase()).length} Pendaftar
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm md:text-lg font-bold ${item.colors.text}`}>
                  {item.avg.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">Rata-rata</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AverageScores;
