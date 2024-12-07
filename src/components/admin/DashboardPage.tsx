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
  XCircleIcon,
  ChevronDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';

type PPDBData = {
  uid: string;
  jalur: 'prestasi' | 'reguler' | 'undangan';
  namaSiswa: string;
  nisn: string;
  asalSekolah: string;
  nilaiAgama2: string;
  nilaiAgama3: string;
  nilaiAgama4: string;
  nilaiBindo2: string;
  nilaiBindo3: string;
  nilaiBindo4: string;
  nilaiBing2: string;
  nilaiBing3: string;
  nilaiBing4: string;
  nilaiMtk2: string;
  nilaiMtk3: string;
  nilaiMtk4: string;
  nilaiIpa2: string;
  nilaiIpa3: string;
  nilaiIpa4: string;
  submittedAt?: string;
  status?: 'draft' | 'pending' | 'submitted' | 'diterima' | 'ditolak';
  adminStatus?: 'diterima' | 'ditolak';
  createdAt: string;
};

type StatItem = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
};

type RecentPendaftar = {
  namaSiswa: string;
  jalur: string;
  submittedAt: string | undefined;
};

type DashboardStats = {
  totalPendaftar: number;
  pendaftarBaru: number;
  pendaftarDiterima: number;
  pendaftarDitolak: number;
  jalurPrestasi: number;
  jalurReguler: number;
  jalurUndangan: number;
  recentPendaftar: RecentPendaftar[];
};

type StudentWithAverage = PPDBData & {
  average: number;
};

type BadgeProps = {
  status: PPDBData['status'];
  adminStatus?: PPDBData['adminStatus'];
  className?: string;
};

const StatusBadge: React.FC<BadgeProps> = ({ status, adminStatus, className }) => {
  const getStatusLabel = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' ? 'Diterima' : 'Ditolak';
    }
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Pending';
      default:
        return status || 'Unknown';
    }
  };

  const getStatusColor = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' 
        ? 'text-green-600 bg-green-50'
        : 'text-red-600 bg-red-50';
    }
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'submitted':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-1 rounded-full text-sm font-medium',
      getStatusColor(status, adminStatus),
      className
    )}>
      {getStatusLabel(status, adminStatus)}
    </span>
  );
};

const getJalurLabel = (jalur: PPDBData['jalur']) => {
  const labels = {
    prestasi: 'Prestasi',
    reguler: 'Reguler', 
    undangan: 'Undangan'
  };
  return labels[jalur];
};

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

const calculateJalurAverage = (data: PPDBData[], jalur: string) => {
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

// Tambahkan konstanta untuk warna jalur
const JALUR_COLORS = {
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
  }
};

// Tambahkan type untuk sorting
type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

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
  const [data, setData] = useState<PPDBData[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [selectedJalur, setSelectedJalur] = useState<'semua' | 'prestasi' | 'reguler' | 'undangan'>('semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val()) as PPDBData[];
          
          // Filter hanya pendaftar yang sudah submit
          const submittedData = data.filter(item => item.submittedAt);
          
          // Get recent pendaftar - sort berdasarkan submittedAt
          const recentPendaftar = submittedData
            .sort((a, b) => new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime())
            .slice(0, 6)
            .map(item => ({
              namaSiswa: item.namaSiswa,
              jalur: item.jalur,
              submittedAt: item.submittedAt || new Date().toISOString()
            }));

          setStats({
            totalPendaftar: submittedData.length,
            // Hitung pendaftar baru/pending: yang sudah submit tapi belum ada adminStatus
            pendaftarBaru: submittedData.filter(item => 
              item.status === 'submitted' && !item.adminStatus
            ).length,
            // Hitung yang diterima berdasarkan adminStatus
            pendaftarDiterima: submittedData.filter(item => 
              item.adminStatus === 'diterima'
            ).length,
            // Hitung yang ditolak berdasarkan adminStatus  
            pendaftarDitolak: submittedData.filter(item => 
              item.adminStatus === 'ditolak'
            ).length,
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const ppdbData = Object.entries(snapshot.val())
            .map(([uid, value]) => ({
              uid,
              ...(value as Omit<PPDBData, 'uid'>)
            }))
            // Filter hanya data yang sudah submit
            .filter(item => item.submittedAt);
          setData(ppdbData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const getMainStats = (stats: DashboardStats): StatItem[] => [
    {
      title: 'Pendaftar',
      value: stats.totalPendaftar,
      icon: <UserGroupIcon className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Pending',
      value: stats.pendaftarBaru,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'yellow'
    },
    {
      title: 'Diterima',
      value: stats.pendaftarDiterima,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: 'green'
    },
    {
      title: 'Ditolak',
      value: stats.pendaftarDitolak,
      icon: <XCircleIcon className="w-5 h-5" />,
      color: 'red'
    }
  ];

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
      default: 
        return (
          <div className="p-2 bg-gray-100 rounded-lg">
            <UserGroupIcon className="w-5 h-5 text-gray-500" />
          </div>
        );
    }
  };

  const calculateStudentAverage = (student: PPDBData) => {
    const subjects = ['nilaiAgama', 'nilaiBindo', 'nilaiBing', 'nilaiMtk', 'nilaiIpa'];
    const semesters = ['2', '3', '4'];
    let totalNilai = 0;
    let totalFields = 0;

    subjects.forEach(subject => {
      semesters.forEach(semester => {
        const nilai = parseFloat(student[`${subject}${semester}` as keyof PPDBData] as string);
        if (!isNaN(nilai)) {
          totalNilai += nilai;
          totalFields++;
        }
      });
    });

    return totalFields > 0 ? totalNilai / totalFields : 0;
  };

  // Tambahkan fungsi untuk handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Update fungsi getTopStudents untuk menerapkan paginasi
  const getTopStudents = (): StudentWithAverage[] => {
    let sortedData = data
      .map(student => ({
        ...student,
        average: calculateStudentAverage(student)
      }))
      // Filter berdasarkan jalur yang dipilih
      .filter(student => selectedJalur === 'semua' ? true : student.jalur === selectedJalur);

    // Terapkan sorting
    if (!sortConfig) {
      sortedData = sortedData.sort((a, b) => b.average - a.average);
    } else {
      sortedData = sortedData.sort((a, b) => {
        if (sortConfig.key === 'namaSiswa') {
          return sortConfig.direction === 'asc' 
            ? a.namaSiswa.localeCompare(b.namaSiswa)
            : b.namaSiswa.localeCompare(a.namaSiswa);
        }
        if (sortConfig.key === 'jalur') {
          return sortConfig.direction === 'asc'
            ? a.jalur.localeCompare(b.jalur)
            : b.jalur.localeCompare(a.jalur);
        }
        if (sortConfig.key === 'asalSekolah') {
          return sortConfig.direction === 'asc'
            ? a.asalSekolah.localeCompare(b.asalSekolah)
            : b.asalSekolah.localeCompare(a.asalSekolah);
        }
        if (sortConfig.key === 'average') {
          return sortConfig.direction === 'asc'
            ? a.average - b.average
            : b.average - a.average;
        }
        return 0;
      });
    }

    // Hitung index untuk paginasi
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sortedData.slice(startIndex, endIndex);
  };

  // Fungsi untuk mendapatkan total halaman
  const getTotalPages = () => {
    const filteredTotal = data
      .filter(student => selectedJalur === 'semua' ? true : student.jalur === selectedJalur)
      .length;
    return Math.ceil(filteredTotal / itemsPerPage);
  };

  // Tambahkan fungsi untuk mendapatkan total data yang difilter
  const getFilteredTotal = () => {
    return data
      .filter(student => selectedJalur === 'semua' ? true : student.jalur === selectedJalur)
      .length;
  };

  // Reset currentPage saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJalur]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const mainStats = getMainStats(stats);

  return (
    <div className="p-6 space-y-6">
      {/* Main Stats dengan design baru */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {mainStats.map((stat: StatItem, index: number) => (
          <Card 
            key={index}
            className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
          >
            <div className="p-3 md:p-6">
              {/* Header */}
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
                  stat.color === 'green' ? 'bg-green-50 text-green-600' :
                  'bg-red-50 text-red-600'
                }`}
                >
                  {React.cloneElement(stat.icon as React.ReactElement, {
                    className: 'w-4 h-4 md:w-5 md:h-5'
                  })}
                </div>
                <p className="text-xs md:text-base lg:text-lg font-bold text-gray-900">{stat.title}</p>
              </div>

              {/* Value & Progress */}
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <p className="text-sm md:text-lg lg:text-xl font-extrabold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-xs text-gray-500">
                    dari {stats.totalPendaftar}
                  </p>
                </div>

                {/* Progress bar dengan label */}
                <div className="space-y-1 md:space-y-1.5">
                  <div className="w-full h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500
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
                  <p className={`text-[10px] md:text-xs font-medium
                    ${stat.color === 'blue' ? 'text-blue-600' :
                      stat.color === 'yellow' ? 'text-yellow-600' :
                      stat.color === 'green' ? 'text-green-600' :
                      'text-red-600'
                    }`}
                  >
                    {((stat.value / stats.totalPendaftar * 100) || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary Stats & Recent Pendaftar */}
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
                    {((item.value / stats.totalPendaftar) * 100).toFixed(1)}%
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
            {stats.recentPendaftar.map((pendaftar: RecentPendaftar, idx: number) => (
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

      {/* Rata-rata Nilai Section */}
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
          <div className="flex items-center justify-between mb-4">
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
              }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 md:p-2 bg-white rounded-lg`}>
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

      {/* Detail Nilai per Jalur dan Mapel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {[
          { 
            label: 'Prestasi', 
            jalur: 'prestasi',
            colors: JALUR_COLORS.prestasi,
            icon: <AcademicCapIcon className="w-4 h-4" />
          },
          { 
            label: 'Reguler', 
            jalur: 'reguler',
            colors: JALUR_COLORS.reguler,
            icon: <UserGroupIcon className="w-4 h-4" />
          },
          { 
            label: 'Undangan', 
            jalur: 'undangan',
            colors: JALUR_COLORS.undangan,
            icon: <DocumentTextIcon className="w-4 h-4" />
          }
        ].map((jalurItem, idx) => (
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

      {/* Top Students Section */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Nilai Rata-rata Tertinggi</h3>
          </div>
          {/* Filter hanya ditampilkan di desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Filter Jalur */}
            <div className="relative">
              <select
                value={selectedJalur}
                onChange={(e) => setSelectedJalur(e.target.value as typeof selectedJalur)}
                className="appearance-none pl-8 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
              >
                <option value="semua">Semua Jalur</option>
                <option value="prestasi">Jalur Prestasi</option>
                <option value="reguler">Jalur Reguler</option>
                <option value="undangan">Jalur Undangan</option>
              </select>
              <FunnelIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Reset Sort Button */}
            {sortConfig && (
              <button
                onClick={() => setSortConfig(null)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1.5" />
                Reset Urutan
              </button>
            )}
          </div>
        </div>

        {/* Tampilkan tabel hanya untuk desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">No</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('namaSiswa')}
                >
                  <div className="flex items-center gap-1">
                    Nama
                    {sortConfig?.key === 'namaSiswa' && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform ${
                          sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th 
                  className={classNames(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500",
                    selectedJalur === 'semua' 
                      ? "cursor-pointer hover:text-blue-600" 
                      : "opacity-50"
                  )}
                  onClick={() => selectedJalur === 'semua' && handleSort('jalur')}
                >
                  <div className="flex items-center gap-1">
                    Jalur
                    {selectedJalur === 'semua' && sortConfig?.key === 'jalur' && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform ${
                          sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('asalSekolah')}
                >
                  <div className="flex items-center gap-1">
                    Asal Sekolah
                    {sortConfig?.key === 'asalSekolah' && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform ${
                          sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
                {/* Header nilai mapel */}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Agama</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">B.Indo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">B.Ing</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">MTK</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">IPA</th>
                <th 
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  onClick={() => handleSort('average')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Rata-rata
                    {sortConfig?.key === 'average' && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 transition-transform ${
                          sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getTopStudents().map((student: StudentWithAverage, index) => {
                // Hitung rata-rata per mapel
                const getSubjectAverage = (subject: string) => {
                  const fieldName = subject === 'B.Indo' ? 'nilaiBindo' :
                                    subject === 'B.Ing' ? 'nilaiBing' :
                                    subject === 'MTK' ? 'nilaiMtk' :
                                    subject === 'IPA' ? 'nilaiIpa' : 'nilaiAgama';
                    
                  const sem2 = parseFloat(student[`${fieldName}2` as keyof PPDBData] as string) || 0;
                  const sem3 = parseFloat(student[`${fieldName}3` as keyof PPDBData] as string) || 0;
                  const sem4 = parseFloat(student[`${fieldName}4` as keyof PPDBData] as string) || 0;
                  return ((sem2 + sem3 + sem4) / 3).toFixed(2);
                };

                return (
                  <tr key={student.uid} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {student.namaSiswa}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={classNames(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        student.jalur === 'prestasi' ? 'bg-blue-100 text-blue-800' :
                        student.jalur === 'reguler' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      )}>
                        {getJalurLabel(student.jalur)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-sm text-gray-500 truncate">
                        {student.asalSekolah}
                      </div>
                    </td>
                    {/* Nilai per mapel */}
                    {['nilaiAgama', 'nilaiBindo', 'nilaiBing', 'nilaiMtk', 'nilaiIpa'].map((subject) => (
                      <td key={subject} className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={classNames(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            parseFloat(getSubjectAverage(subject)) >= 83
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}>
                            {getSubjectAverage(subject)}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {student.average.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <StatusBadge 
                          status={student.status}
                          adminStatus={student.adminStatus}
                          className="text-xs"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Update bagian tampilan mobile */}
        <div className="md:hidden">
          <div className="space-y-3">
            {getTopStudents().map((student: StudentWithAverage, index) => {
              const getSubjectAverage = (subject: string) => {
                const fieldName = subject === 'B.Indo' ? 'nilaiBindo' :
                                 subject === 'B.Ing' ? 'nilaiBing' :
                                 subject === 'MTK' ? 'nilaiMtk' :
                                 subject === 'IPA' ? 'nilaiIpa' : 'nilaiAgama';
                    
                const sem2 = parseFloat(student[`${fieldName}2` as keyof PPDBData] as string) || 0;
                const sem3 = parseFloat(student[`${fieldName}3` as keyof PPDBData] as string) || 0;
                const sem4 = parseFloat(student[`${fieldName}4` as keyof PPDBData] as string) || 0;
                return ((sem2 + sem3 + sem4) / 3).toFixed(2);
              };

              return (
                <div key={student.uid} className="bg-white border rounded-lg shadow-sm">
                  {/* Header - Selalu Terlihat */}
                  <div 
                    className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedStudent(expandedStudent === student.uid ? null : student.uid)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Kiri: Info Siswa */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate mb-1">
                          {student.namaSiswa}
                        </h3>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-gray-500 line-clamp-1">
                            {student.asalSekolah}
                          </span>
                          <span className={classNames(
                            "text-xs font-medium",
                            student.jalur === 'prestasi' ? 'text-blue-600' :
                            student.jalur === 'reguler' ? 'text-green-600' :
                            'text-purple-600'
                          )}>
                            {getJalurLabel(student.jalur)}
                          </span>
                        </div>
                      </div>

                      {/* Kanan: Nomor */}
                      <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium self-center">
                        {((currentPage - 1) * itemsPerPage) + index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedStudent === student.uid && (
                    <div className="border-t">
                      {/* Nilai per mapel */}
                      <div className="p-3 space-y-2">
                        {['Agama', 'B.Indo', 'B.Ing', 'MTK', 'IPA'].map((subject, idx) => {
                          const nilai = getSubjectAverage(subject);
                          return (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                <span className="text-sm text-gray-700">
                                  {subject}
                                </span>
                              </div>
                              <span className={classNames(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                parseFloat(nilai) >= 83
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              )}>
                                {nilai}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 border-t">
                        <span className="text-sm text-gray-700">Status</span>
                        <StatusBadge 
                          status={student.status}
                          adminStatus={student.adminStatus}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination untuk mobile */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={getTotalPages()}
              onPageChange={setCurrentPage}
              totalItems={getFilteredTotal()}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage; 