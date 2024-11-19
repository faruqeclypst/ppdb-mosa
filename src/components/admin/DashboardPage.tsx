import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import Card from '../ui/Card';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon
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
    asalSekolah: string;
    jalur: string;
    status: string;
    createdAt: string;
  }>;
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
          
          // Get recent pendaftar
          const recentPendaftar = data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(item => ({
              namaSiswa: item.namaSiswa,
              asalSekolah: item.asalSekolah,
              jalur: item.jalur,
              status: item.status,
              createdAt: item.createdAt
            }));

          setStats({
            totalPendaftar: data.length,
            pendaftarBaru: data.filter(item => item.status === 'pending').length,
            pendaftarDiterima: data.filter(item => item.status === 'diterima').length,
            pendaftarDitolak: data.filter(item => item.status === 'ditolak').length,
            jalurPrestasi: data.filter(item => item.jalur === 'prestasi').length,
            jalurReguler: data.filter(item => item.jalur === 'reguler').length,
            jalurUndangan: data.filter(item => item.jalur === 'undangan').length,
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

  const mainStats = [
    {
      title: 'Total Pendaftar',
      value: stats.totalPendaftar,
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: 'blue',
      desc: 'Total keseluruhan pendaftar'
    },
    {
      title: 'Pendaftar Baru',
      value: stats.pendaftarBaru,
      icon: <ClockIcon className="w-6 h-6" />,
      color: 'yellow',
      desc: 'Menunggu verifikasi'
    },
    {
      title: 'Diterima',
      value: stats.pendaftarDiterima,
      icon: <CheckCircleIcon className="w-6 h-6" />,
      color: 'green',
      desc: 'Pendaftar yang diterima'
    },
    {
      title: 'Ditolak',
      value: stats.pendaftarDitolak,
      icon: <XCircleIcon className="w-6 h-6" />,
      color: 'red',
      desc: 'Pendaftar yang ditolak'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'diterima': return 'text-green-600 bg-green-50';
      case 'ditolak': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getJalurIcon = (jalur: string) => {
    switch (jalur) {
      case 'prestasi': return <AcademicCapIcon className="w-5 h-5 text-blue-500" />;
      case 'reguler': return <UserGroupIcon className="w-5 h-5 text-green-500" />;
      default: return <DocumentTextIcon className="w-5 h-5 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStats.map((stat, index) => (
          <Card 
            key={index}
            className={`p-6 border-l-4 border-${stat.color}-500 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{stat.desc}</p>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
                <div className={`text-${stat.color}-600`}>
                  {stat.icon}
                </div>
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
            <h3 className="font-semibold text-gray-900">Statistik Jalur</h3>
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
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg">
                    {getJalurIcon(pendaftar.jalur)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{pendaftar.namaSiswa}</p>
                    <p className="text-sm text-gray-600">{pendaftar.asalSekolah}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pendaftar.status)}`}>
                    {pendaftar.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(pendaftar.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 