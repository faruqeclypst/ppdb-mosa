import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import { PPDBData } from '../../types/ppdb';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  GlobeAltIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const PJJ_SCHOOLS = [
  { 
    id: 'lhokseumawe',
    name: 'SMAN 6 Lhokseumawe', 
    fullName: 'Kab. Lhokseumawe - SMAN 6 Lhokseumawe (Mitra)',
    location: 'Kota Lhokseumawe',
    type: 'Sekolah Mitra',
    accent: 'blue',
    borderColor: 'border-blue-200/80',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    barColor: 'bg-blue-600'
  },
  { 
    id: 'bireuen',
    name: 'SMAN 1 Simpang Mamplam', 
    fullName: 'Kab. Bireuen - SMAN 1 Simpang Mamplam (Mitra)',
    location: 'Kab. Bireuen',
    type: 'Sekolah Mitra',
    accent: 'emerald',
    borderColor: 'border-emerald-200/80',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barColor: 'bg-emerald-600'
  },
  { 
    id: 'singkil',
    name: 'SMAN 1 Gunung Meriah', 
    fullName: 'Kab. Aceh Singkil - SMAN 1 Gunung Meriah (Mitra)',
    location: 'Kab. Aceh Singkil',
    type: 'Sekolah Mitra',
    accent: 'purple',
    borderColor: 'border-purple-200/80',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    barColor: 'bg-purple-600'
  },
  { 
    id: 'seulimeum',
    name: 'SMAN 1 Seulimeum', 
    fullName: 'Kab. Aceh Besar - SMAN 1 Seulimeum (Mitra)',
    location: 'Kab. Aceh Besar',
    type: 'Sekolah Mitra',
    accent: 'teal',
    borderColor: 'border-teal-200/80',
    badge: 'bg-teal-50 text-teal-800 border-teal-200',
    barColor: 'bg-teal-600'
  },
  { 
    id: 'mosa',
    name: 'SMAN Modal Bangsa (Induk)', 
    fullName: 'Kab. Aceh Besar - SMAN Modal Bangsa (Induk)',
    location: 'Kab. Aceh Besar',
    type: 'Sekolah Induk',
    accent: 'amber',
    borderColor: 'border-amber-200/80',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    barColor: 'bg-amber-600'
  }
];

const DashboardPJJPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pjjData, setPjjData] = useState<PPDBData[]>([]);
  const [totalRegulerCount, setTotalRegulerCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const mosaRef = ref(db, 'ppdb_mosa');
        const fajarRef = ref(db, 'ppdb_fajar');
        
        const [mosaSnapshot, fajarSnapshot] = await Promise.all([
          get(mosaRef),
          get(fajarRef)
        ]);
        
        let allData: PPDBData[] = [];
        
        if (mosaSnapshot.exists()) {
          const mosaData = Object.entries(mosaSnapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as Omit<PPDBData, 'uid'>),
            school: 'mosa' as const
          }));
          allData = [...allData, ...mosaData];
        }
        
        if (fajarSnapshot.exists()) {
          const fajarData = Object.entries(fajarSnapshot.val()).map(([uid, value]) => ({
            uid,
            ...(value as Omit<PPDBData, 'uid'>),
            school: 'fajar' as const
          }));
          allData = [...allData, ...fajarData];
        }

        const submittedData = allData.filter(item => item.submittedAt);
        const pjjItems = submittedData.filter(item => item.jalur === 'pjj');
        const regularItems = submittedData.filter(item => item.jalur !== 'pjj');

        setPjjData(pjjItems);
        setTotalRegulerCount(regularItems.length);
      } catch (error) {
        console.error('Error loading PJJ dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalPendaftar = pjjData.length;
  const pending = pjjData.filter(item => item.status === 'submitted' && !item.adminStatus).length;
  const diterima = pjjData.filter(item => item.adminStatus === 'diterima').length;
  const ditolak = pjjData.filter(item => item.adminStatus === 'ditolak').length;

  const recentPendaftar = [...pjjData]
    .sort((a, b) => new Date(b.submittedAt || '').getTime() - new Date(a.submittedAt || '').getTime())
    .slice(0, 6);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} • ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  if (loading && pjjData.length === 0) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
          <span className="text-xs font-semibold text-zinc-500">Memuat data SPMB PJJ...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pendaftar PJJ',
      subtitle: 'Semua Sekolah Mitra',
      value: totalPendaftar,
      icon: UserGroupIcon,
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-200/80',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: 'bg-amber-600',
      iconBg: 'bg-amber-600 text-white'
    },
    {
      title: 'Verifikasi Pending',
      subtitle: 'Menunggu Pemeriksaan',
      value: pending,
      icon: ClockIcon,
      gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
      borderColor: 'border-yellow-200/80',
      badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      barColor: 'bg-yellow-500',
      iconBg: 'bg-yellow-500 text-white'
    },
    {
      title: 'Lulus Seleksi',
      subtitle: 'Diterima di Mitra/Induk',
      value: diterima,
      icon: CheckCircleIcon,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-600',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      title: 'Tidak Lulus',
      subtitle: 'Belum Memenuhi Syarat',
      value: ditolak,
      icon: XCircleIcon,
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-200/80',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: 'bg-rose-500',
      iconBg: 'bg-rose-500 text-white'
    }
  ];

  return (
    <div className="space-y-6 w-full font-sans">
      {/* ================= HERO COMMAND BAR PJJ ================= */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#241a0e] via-[#1c150c] to-[#120e08] text-white border border-amber-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.18em] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <GlobeAltIcon className="w-3.5 h-3.5" />
                <span>PORTAL PENDIDIKAN JARAK JAUH</span>
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                SMAN Modal Bangsa & 5 Sekolah Mitra
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Dashboard SPMB Pendidikan Jarak Jauh (PJJ)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300/80 leading-relaxed">
              Monitoring pendaftaran calon peserta didik Program PJJ di 5 sekolah mitra binaan SMAN Modal Bangsa.
            </p>
          </div>

          {/* Quick Segmented Portal Switcher */}
          <div className="p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-2 shrink-0 self-start lg:self-center shadow-lg">
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 font-semibold text-xs transition-all"
            >
              <AcademicCapIcon className="w-4 h-4 text-emerald-400" />
              <span>SPMB Reguler</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-1">
                {totalRegulerCount}
              </span>
            </Link>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span>SPMB PJJ</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 ml-1">
                {totalPendaftar}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Main Stat Cards (Double Bezel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const percentage = totalPendaftar > 0 
            ? ((card.value / totalPendaftar) * 100).toFixed(1) 
            : '0.0';

          return (
            <div 
              key={index}
              className={`relative rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border ${card.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.gradient} rounded-full blur-2xl pointer-events-none`} />

              <div className="p-4 sm:p-5 rounded-[calc(1.5rem-0.25rem)] bg-white relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 tracking-tight">
                      {card.title}
                    </h4>
                    <p className="text-[11px] text-zinc-600 font-medium">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${card.iconBg}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                      {card.value}
                    </span>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${card.badgeBg}`}>
                      {percentage}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${card.barColor}`}
                        style={{ 
                          width: `${percentage}%`,
                          minWidth: card.value > 0 ? '8%' : '0%'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                      <span>Progres Kuota PJJ</span>
                      <span>{card.value} dari {totalPendaftar}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. 5 Partner Schools Distribution Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              Distribusi Pendaftar per Sekolah Mitra & Induk PJJ
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Sebaran data dan status seleksi peserta didik di masing-masing sekolah binaan
            </p>
          </div>

          <Link
            to="/admin/pendaftar-pjj"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 hover:bg-amber-100/60"
          >
            <span>Buka Tabel Pendaftar PJJ</span>
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PJJ_SCHOOLS.map((school) => {
            const schoolData = pjjData.filter(d => d.pjjSchool === school.fullName);
            const count = schoolData.length;
            const acceptedCount = schoolData.filter(d => d.adminStatus === 'diterima').length;
            const pendingCount = schoolData.filter(d => d.status === 'submitted' && !d.adminStatus).length;
            const rejectedCount = schoolData.filter(d => d.adminStatus === 'ditolak').length;
            const percentage = totalPendaftar > 0 ? ((count / totalPendaftar) * 100).toFixed(1) : '0.0';

            return (
              <div 
                key={school.id} 
                className={`rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border ${school.borderColor} shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${school.badge}`}>
                        {school.type} • {school.location}
                      </span>
                      <span className="text-base font-black text-zinc-900">{count} Pendaftar</span>
                    </div>

                    <h3 className="text-xs font-bold text-zinc-900 line-clamp-1">{school.name}</h3>

                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden my-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${school.barColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-zinc-50 p-2.5 rounded-2xl border border-zinc-100">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Pending</span>
                        <span className="font-bold text-amber-600">{pendingCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Diterima</span>
                        <span className="font-bold text-emerald-600">{acceptedCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block">Ditolak</span>
                        <span className="font-bold text-rose-600">{rejectedCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
                    <span>Kelulusan Mitra:</span>
                    <span className="font-bold text-zinc-800">
                      {acceptedCount > 0 ? `${((acceptedCount / (count || 1)) * 100).toFixed(0)}% Diterima` : 'Belum Diputuskan'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Recent PJJ Applicants & Quick Actions Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                    Pendaftar PJJ Terbaru
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Calon peserta didik yang baru mengirim berkas
                  </p>
                </div>
              </div>

              <Link
                to="/admin/pendaftar-pjj"
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-amber-50"
              >
                <span>Lihat Semua</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPendaftar.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                Belum ada berkas pendaftaran PJJ yang masuk
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recentPendaftar.map((student, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {student.namaSiswa ? student.namaSiswa.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {student.namaSiswa || 'Calon Siswa PJJ'}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {student.pjjSchool || 'Sekolah Mitra Belum Ditentukan'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        student.adminStatus === 'diterima'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : student.adminStatus === 'ditolak'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {student.adminStatus ? student.adminStatus.toUpperCase() : 'PENDING'}
                      </span>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                        {formatDateTime(student.submittedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-[11px] text-zinc-400 font-medium flex items-center justify-between border-t border-zinc-100">
              <span>Program Sekolah Mitra SPMB MOSA</span>
              <span className="text-amber-700 font-bold">Terintegrasi</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="lg:col-span-4 rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <SparklesIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                    Aksi Cepat PJJ
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Menu pengelolaan utama
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/admin/pendaftar-pjj"
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 font-bold text-xs transition-all border border-amber-200/60"
                >
                  <div className="flex items-center gap-2.5">
                    <UserGroupIcon className="w-4 h-4 text-amber-700" />
                    <span>Tabel Verifikasi PJJ</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-amber-700" />
                </Link>

                <Link
                  to="/admin/draft-pjj"
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition-all border border-zinc-200/60"
                >
                  <div className="flex items-center gap-2.5">
                    <DocumentTextIcon className="w-4 h-4 text-zinc-500" />
                    <span>Draf Formulir PJJ</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-zinc-400" />
                </Link>

                <Link
                  to="/admin/settings"
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-xs transition-all border border-zinc-200/60"
                >
                  <div className="flex items-center gap-2.5">
                    <ChartBarIcon className="w-4 h-4 text-zinc-500" />
                    <span>Jadwal & Kuota PJJ</span>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-zinc-400" />
                </Link>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
              <strong>Info:</strong> Nilai rapor calon siswa PJJ diproses mandiri melalui format verifikasi berkas tanpa mengganggu rata-rata 5 mapel reguler.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPJJPage;
