import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import Card from '../ui/Card';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

type DashboardStats = {
  totalPendaftar: number;
  pendaftarBaru: number;
  pendaftarDiterima: number;
  pendaftarDitolak: number;
  jalurPrestasi: number;
  jalurReguler: number;
  jalurUndangan: number;
  recentPendaftar: Array<{
    namaSiswa: string;
    jalur: string;
    createdAt: string;
  }>;
};

type StatItem = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPendaftar: 0,
    pendaftarBaru: 0,
    pendaftarDiterima: 0,
    pendaftarDitolak: 0,
    jalurPrestasi: 0,
    jalurReguler: 0,
    jalurUndangan: 0,
    recentPendaftar: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val()) as any[];
          
          // Filter hanya pendaftar yang sudah submit (sama seperti di DataPendaftar)
          const submittedData = data.filter(item => item.submittedAt);
          
          // Get recent pendaftar - hanya 3 terbaru dari yang sudah submit
          const recentPendaftar = submittedData
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
            .map(item => ({
              namaSiswa: item.namaSiswa,
              jalur: item.jalur,
              createdAt: item.createdAt
            }));

          setStats({
            totalPendaftar: submittedData.length,
            pendaftarBaru: submittedData.filter(item => item.status === 'submitted').length,
            pendaftarDiterima: submittedData.filter(item => item.status === 'diterima').length,
            pendaftarDitolak: submittedData.filter(item => item.status === 'ditolak').length,
            jalurPrestasi: submittedData.filter(item => item.jalur === 'prestasi').length,
            jalurReguler: submittedData.filter(item => item.jalur === 'reguler').length,
            jalurUndangan: submittedData.filter(item => item.jalur === 'undangan').length,
            recentPendaftar
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const getMainStats = (stats: DashboardStats): StatItem[] => [
    {
      title: 'Total Pendaftar',
      value: stats.totalPendaftar,
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Pendaftar Baru',
      value: stats.pendaftarBaru,
      icon: <ClockIcon className="w-6 h-6" />,
      color: 'yellow'
    },
    {
      title: 'Diterima',
      value: stats.pendaftarDiterima,
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Ditolak',
      value: stats.pendaftarDitolak,
      icon: <XCircleIcon className="w-6 h-6" />,
      color: 'red'
    }
  ];

  const getJalurIcon = (jalur?: string) => {
    switch (jalur) {
      case 'prestasi': return <AcademicCapIcon className="w-5 h-5 text-blue-500" />;
      case 'reguler': return <UserGroupIcon className="w-5 h-5 text-green-500" />;
      case 'undangan': return <DocumentTextIcon className="w-5 h-5 text-purple-500" />;
      default: return <UserGroupIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const mainStats = getMainStats(stats);

  return (
    <div className="p-6">
      {/* Main Stats dengan design baru */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStats.map((stat: StatItem, index: number) => (
          <Card 
            key={index}
            className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300
              ${stat.color === 'blue' ? 'bg-gradient-to-br from-blue-50 via-white to-blue-50' :
                stat.color === 'yellow' ? 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50' :
                stat.color === 'green' ? 'bg-gradient-to-br from-green-50 via-white to-green-50' :
                'bg-gradient-to-br from-red-50 via-white to-red-50'
              }`}
          >
            {/* Decorative pattern */}
            <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 rounded-full 
              bg-gradient-to-br from-white/40 to-white/0 transform rotate-45" />
            
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl
                  ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    stat.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                    stat.color === 'green' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  } transform group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.icon}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500
                  ${stat.color === 'blue' ? 'bg-blue-500' :
                    stat.color === 'yellow' ? 'bg-yellow-500' :
                    stat.color === 'green' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}
                  style={{ 
                    width: `${(stat.value / stats.totalPendaftar * 100) || 0}%`,
                    minWidth: '5%'
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary Stats & Recent Pendaftar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jalur Stats */}
        <Card className="lg:col-span-1 p-6">
          <div className="flex items-center gap-2 mb-6">
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Statistik Pendaftar</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Prestasi', value: stats.jalurPrestasi, icon: <AcademicCapIcon className="w-5 h-5" />, color: 'blue' },
              { label: 'Reguler', value: stats.jalurReguler, icon: <UserGroupIcon className="w-5 h-5" />, color: 'green' },
              { label: 'Undangan', value: stats.jalurUndangan, icon: <DocumentTextIcon className="w-5 h-5" />, color: 'purple' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${item.color}-100 rounded-lg text-${item.color}-600`}>
                    {item.icon}
                  </div>
                  <span className="font-medium text-gray-700">Jalur {item.label}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Pendaftar */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Pendaftar Terbaru</h3>
            </div>
            <Link 
              to="/admin/pendaftar"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recentPendaftar.map((pendaftar, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    {getJalurIcon(pendaftar?.jalur)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{pendaftar?.namaSiswa || 'Nama tidak tersedia'}</p>
                    <p className="text-sm text-gray-600">
                      Jalur {pendaftar?.jalur ? 
                        pendaftar.jalur.charAt(0).toUpperCase() + pendaftar.jalur.slice(1) 
                        : 'Tidak tersedia'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {pendaftar?.createdAt ? 
                    new Date(pendaftar.createdAt).toLocaleDateString() 
                    : '-'}
                </span>
              </div>
            ))}
            {stats.recentPendaftar.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Belum ada pendaftar
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 