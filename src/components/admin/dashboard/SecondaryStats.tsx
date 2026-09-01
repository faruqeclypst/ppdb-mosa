import React from 'react';
import { 
  TrophyIcon, 
  AcademicCapIcon, 
  SparklesIcon, 
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../../../types/ppdb';

interface SecondaryStatsProps {
  stats: DashboardStats;
}

const SecondaryStats: React.FC<SecondaryStatsProps> = ({ stats }) => {
  const jalurItems = [
    {
      id: 'prestasi',
      label: 'Jalur Prestasi',
      desc: 'Olimpiade & Bakat Minat',
      value: stats.jalurPrestasi,
      icon: TrophyIcon,
      accent: 'text-blue-700',
      iconBg: 'bg-blue-50 text-blue-700 border border-blue-200/60',
      barColor: 'bg-blue-600',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      id: 'reguler',
      label: 'Jalur Reguler',
      desc: 'Tes Akademik & Rapor',
      value: stats.jalurReguler,
      icon: AcademicCapIcon,
      accent: 'text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      barColor: 'bg-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      id: 'undangan',
      label: 'Jalur Undangan',
      desc: 'Rekomendasi Sekolah Asal',
      value: stats.jalurUndangan,
      icon: SparklesIcon,
      accent: 'text-purple-700',
      iconBg: 'bg-purple-50 text-purple-700 border border-purple-200/60',
      barColor: 'bg-purple-600',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  ];

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Track Distribution (Bento 5 Cols) */}
      <div className="lg:col-span-5 rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowTrendingUpIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                  Distribusi Jalur Seleksi
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Komposisi pendaftar berdasarkan jalur
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              3 Jalur
            </span>
          </div>

          <div className="space-y-3">
            {jalurItems.map((item) => {
              const pct = stats.totalPendaftar > 0 
                ? ((item.value / stats.totalPendaftar) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={item.id} className="p-3.5 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900">{item.label}</h4>
                        <p className="text-[10px] text-zinc-500 font-medium">{item.desc}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-zinc-900">{item.value}</span>
                      <span className="text-[10px] text-zinc-500 block font-semibold">{pct}%</span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-200/60 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${item.barColor}`}
                      style={{ 
                        width: `${pct}%`,
                        minWidth: item.value > 0 ? '6%' : '0%'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[11px] text-zinc-400 font-medium text-center border-t border-zinc-100">
            Total {stats.totalPendaftar} berkas pendaftaran jalur reguler diterima
          </div>
        </div>
      </div>

      {/* 2. Recent Applicants Activity Feed (Bento 7 Cols) */}
      <div className="lg:col-span-7 rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] h-full flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 tracking-tight">
                  Pendaftar Terbaru
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Aktivitas pengiriman berkas terkini
                </p>
              </div>
            </div>

            <Link 
              to="/admin/pendaftar"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-emerald-50"
            >
              <span>Lihat Semua</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentPendaftar.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Belum ada aktivitas pendaftaran terbaru
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats.recentPendaftar.map((item, idx) => {
                const initial = item.namaSiswa ? item.namaSiswa.charAt(0).toUpperCase() : '?';
                const jalurBadgeClass = 
                  item.jalur === 'prestasi' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                  item.jalur === 'reguler' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  'bg-purple-50 text-purple-800 border-purple-200';

                return (
                  <div 
                    key={idx}
                    className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate">
                          {item.namaSiswa || 'Calon Siswa'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${jalurBadgeClass}`}>
                            {item.jalur ? item.jalur.toUpperCase() : '-'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium truncate">
                            {formatDateTime(item.submittedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/admin/pendaftar"
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors shrink-0"
                      title="Buka Data"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 text-[11px] text-zinc-400 font-medium flex items-center justify-between border-t border-zinc-100">
            <span>Sinkronisasi otomatis</span>
            <span className="text-emerald-700 font-bold">Real-time Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecondaryStats;
