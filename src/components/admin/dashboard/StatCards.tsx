import React from 'react';
import { 
  UserGroupIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon
} from '@heroicons/react/24/outline';
import { DashboardStats } from '../../../types/ppdb';

interface StatCardsProps {
  stats: DashboardStats;
}

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Pendaftar',
      subtitle: 'Jalur Utama Reguler',
      value: stats.totalPendaftar,
      icon: UserGroupIcon,
      accent: 'emerald',
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-200/80',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-600',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      title: 'Verifikasi Pending',
      subtitle: 'Menunggu Pemeriksaan',
      value: stats.pendaftarBaru,
      icon: ClockIcon,
      accent: 'amber',
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-200/80',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: 'bg-amber-500',
      iconBg: 'bg-amber-500 text-white'
    },
    {
      title: 'Lulus Seleksi',
      subtitle: 'Memenuhi Syarat',
      value: stats.pendaftarDiterima,
      icon: CheckCircleIcon,
      accent: 'blue',
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-blue-200/80',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      barColor: 'bg-blue-600',
      iconBg: 'bg-blue-600 text-white'
    },
    {
      title: 'Tidak Lulus',
      subtitle: 'Belum Memenuhi',
      value: stats.pendaftarDitolak,
      icon: XCircleIcon,
      accent: 'rose',
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-200/80',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: 'bg-rose-500',
      iconBg: 'bg-rose-500 text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const percentage = stats.totalPendaftar > 0 
          ? ((card.value / stats.totalPendaftar) * 100).toFixed(1) 
          : '0.0';

        return (
          <div 
            key={index}
            className={`relative rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border ${card.borderColor} shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden`}
          >
            {/* Top Ambient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.gradient} rounded-full blur-2xl pointer-events-none`} />

            {/* Inner Content */}
            <div className="p-4 sm:p-5 rounded-[calc(1.5rem-0.25rem)] bg-white relative z-10 flex flex-col justify-between h-full space-y-4">
              {/* Header with Title & Icon */}
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

              {/* Number & Badge */}
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                    {card.value}
                  </span>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${card.badgeBg}`}>
                    {percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
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
                    <span>Progres Kuota</span>
                    <span>{card.value} dari {stats.totalPendaftar}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatCards;
