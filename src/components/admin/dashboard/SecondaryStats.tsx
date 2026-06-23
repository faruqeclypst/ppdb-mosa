import React from 'react';
import Card from '../../ui/Card';
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../../../types/ppdb';

export const JALUR_COLORS = {
  prestasi: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
    gradient: 'from-blue-50',
    accent: 'bg-blue-500'
  },
  reguler: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-200',
    gradient: 'from-green-50',
    accent: 'bg-green-500'
  },
  undangan: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
    gradient: 'from-purple-50',
    accent: 'bg-purple-500'
  },
  pjj: {
    bg: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-200',
    gradient: 'from-amber-50',
    accent: 'bg-amber-500'
  }
};

interface SecondaryStatsProps {
  stats: DashboardStats;
}

const SecondaryStats: React.FC<SecondaryStatsProps> = ({ stats }) => {
  const getJalurIcon = (jalur?: string) => {
    switch (jalur) {
      case 'prestasi': 
        return (
          <div className={`p-2 ${JALUR_COLORS.prestasi.bg} rounded-lg`}>
            <AcademicCapIcon className={`w-5 h-5 ${JALUR_COLORS.prestasi.text}`} />
          </div>
        );
      case 'reguler': 
        return (
          <div className={`p-2 ${JALUR_COLORS.reguler.bg} rounded-lg`}>
            <UserGroupIcon className={`w-5 h-5 ${JALUR_COLORS.reguler.text}`} />
          </div>
        );
      case 'undangan': 
        return (
          <div className={`p-2 ${JALUR_COLORS.undangan.bg} rounded-lg`}>
            <DocumentTextIcon className={`w-5 h-5 ${JALUR_COLORS.undangan.text}`} />
          </div>
        );
      case 'pjj': 
        return (
          <div className={`p-2 ${JALUR_COLORS.pjj.bg} rounded-lg`}>
            <ChartBarIcon className={`w-5 h-5 ${JALUR_COLORS.pjj.text}`} />
          </div>
        );
      default: 
        return (
          <div className="p-2 bg-gray-100 rounded-lg">
            <UserGroupIcon className="w-5 h-5 text-gray-500" />
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Jalur Stats */}
      <Card className="lg:col-span-1 p-3 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Statistik Pendaftar</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { 
              label: 'Prestasi', 
              value: stats.jalurPrestasi, 
              icon: <AcademicCapIcon className="w-4 h-4 md:w-5 md:h-5" />, 
              colors: JALUR_COLORS.prestasi 
            },
            { 
              label: 'Reguler', 
              value: stats.jalurReguler, 
              icon: <UserGroupIcon className="w-4 h-4 md:w-5 md:h-5" />, 
              colors: JALUR_COLORS.reguler 
            },
            { 
              label: 'Undangan', 
              value: stats.jalurUndangan, 
              icon: <DocumentTextIcon className="w-4 h-4 md:w-5 md:h-5" />, 
              colors: JALUR_COLORS.undangan 
            },
            { 
              label: 'PJJ', 
              value: stats.jalurPjj, 
              icon: <ChartBarIcon className="w-4 h-4 md:w-5 md:h-5" />, 
              colors: JALUR_COLORS.pjj 
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
                  <p className="text-xs text-gray-600">{item.value} Pendaftar</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm md:text-lg font-bold ${item.colors.text}`}>
                  {stats.totalPendaftar > 0 ? ((item.value / stats.totalPendaftar) * 100).toFixed(1) : '0.0'}%
                </p>
                <p className="text-xs text-gray-500">Persentase</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Pendaftar */}
      <Card className="lg:col-span-2 p-3 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Pendaftar Terbaru</h3>
          </div>
          <Link 
            to="/admin/pendaftar"
            className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.recentPendaftar.map((pendaftar, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 md:p-2 bg-white rounded-lg">
                  {getJalurIcon(pendaftar?.jalur)}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">{pendaftar?.namaSiswa || 'Nama tidak tersedia'}</p>
                  <p className="text-xs text-gray-600">
                    Jalur {pendaftar?.jalur ? 
                      pendaftar.jalur.charAt(0).toUpperCase() + pendaftar.jalur.slice(1) 
                      : 'Tidak tersedia'}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {pendaftar?.submittedAt ? 
                  new Date(pendaftar.submittedAt).toLocaleDateString() 
                  : '-'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SecondaryStats;
