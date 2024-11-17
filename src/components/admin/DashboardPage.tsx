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
  MapPinIcon,
  DocumentTextIcon
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
  pendaftarLengkap: number;
  pendaftarBelumLengkap: number;
  sekolahTerbanyak: { nama: string; jumlah: number }[];
  kabupatenTerbanyak: { nama: string; jumlah: number }[];
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
    pendaftarLengkap: 0,
    pendaftarBelumLengkap: 0,
    sekolahTerbanyak: [],
    kabupatenTerbanyak: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val()) as any[];
          
          const sekolahCount: { [key: string]: number } = {};
          const kabupatenCount: { [key: string]: number } = {};
          
          data.forEach(item => {
            sekolahCount[item.asalSekolah] = (sekolahCount[item.asalSekolah] || 0) + 1;
            kabupatenCount[item.kabupaten] = (kabupatenCount[item.kabupaten] || 0) + 1;
          });

          const getTop5 = (obj: { [key: string]: number }) => 
            Object.entries(obj)
              .map(([nama, jumlah]) => ({ nama, jumlah }))
              .sort((a, b) => b.jumlah - a.jumlah)
              .slice(0, 5);

          setStats({
            totalPendaftar: data.length,
            pendaftarBaru: data.filter(item => item.status === 'submitted').length,
            pendaftarDiterima: data.filter(item => item.status === 'diterima').length,
            pendaftarDitolak: data.filter(item => item.status === 'ditolak').length,
            jalurPrestasi: data.filter(item => item.jalur === 'prestasi').length,
            jalurReguler: data.filter(item => item.jalur === 'reguler').length,
            jalurUndangan: data.filter(item => item.jalur === 'undangan').length,
            pendaftarLengkap: data.filter(item => 
              item.rekomendasi && item.raport2 && item.raport3 && item.raport4 && item.photo
            ).length,
            pendaftarBelumLengkap: data.filter(item => 
              !item.rekomendasi || !item.raport2 || !item.raport3 || !item.raport4 || !item.photo
            ).length,
            sekolahTerbanyak: getTop5(sekolahCount),
            kabupatenTerbanyak: getTop5(kabupatenCount)
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

  const additionalStats = [
    {
      title: 'Jalur Pendaftaran',
      icon: <AcademicCapIcon className="w-5 h-5" />,
      items: [
        { label: 'Prestasi', value: stats.jalurPrestasi },
        { label: 'Reguler', value: stats.jalurReguler },
        { label: 'Undangan', value: stats.jalurUndangan }
      ]
    },
    {
      title: 'Status Dokumen',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      items: [
        { label: 'Lengkap', value: stats.pendaftarLengkap },
        { label: 'Belum Lengkap', value: stats.pendaftarBelumLengkap }
      ]
    },
    {
      title: 'Asal Sekolah Terbanyak',
      icon: <ChartBarIcon className="w-5 h-5" />,
      items: stats.sekolahTerbanyak.map(item => ({
        label: item.nama,
        value: item.jumlah
      }))
    },
    {
      title: 'Kabupaten Terbanyak',
      icon: <MapPinIcon className="w-5 h-5" />,
      items: stats.kabupatenTerbanyak.map(item => ({
        label: item.nama,
        value: item.jumlah
      }))
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {additionalStats.map((section, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                {section.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate">{item.label}</span>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="flex gap-4">
            <Link 
              to="/admin/pendaftar"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lihat Data Pendaftar
            </Link>
            <Link 
              to="/admin/users"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Kelola Admin
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 