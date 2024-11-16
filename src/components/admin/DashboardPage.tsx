import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import Card from '../ui/Card';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

type DashboardStats = {
  totalPendaftar: number;
  pendaftarBaru: number;
  pendaftarDiterima: number;
  pendaftarDitolak: number;
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPendaftar: 0,
    pendaftarBaru: 0,
    pendaftarDiterima: 0,
    pendaftarDitolak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val()) as any[];
          
          setStats({
            totalPendaftar: data.length,
            pendaftarBaru: data.filter(item => item.status === 'submitted').length,
            pendaftarDiterima: data.filter(item => item.status === 'diterima').length,
            pendaftarDitolak: data.filter(item => item.status === 'ditolak').length,
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

  const statCards = [
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
        <p className="text-gray-600">Ringkasan data pendaftaran PPDB</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
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

      {/* Grafik atau visualisasi data lainnya bisa ditambahkan di sini */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Statistik Pendaftaran
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Area untuk grafik statistik pendaftaran
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pendaftar Terbaru
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Area untuk daftar pendaftar terbaru
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 