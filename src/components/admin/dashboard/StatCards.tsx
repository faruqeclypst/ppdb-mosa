import React from 'react';
import Card from '../../ui/Card';
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

type StatItem = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
};

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const mainStats: StatItem[] = [
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {mainStats.map((stat, index) => (
        <Card 
          key={index}
          className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
        >
          <div className="p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${
                stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                stat.color === 'yellow' ? 'bg-yellow-50 text-yellow-600' :
                stat.color === 'green' ? 'bg-green-50 text-green-600' :
                'bg-red-50 text-red-600'
              }`}>
                {React.cloneElement(stat.icon as React.ReactElement, {
                  className: 'w-4 h-4 md:w-5 md:h-5'
                })}
              </div>
              <p className="text-xs md:text-base lg:text-lg font-bold text-gray-900">{stat.title}</p>
            </div>

            <div className="space-y-2 md:space-y-3">
              <div className="flex items-baseline gap-1 md:gap-2">
                <p className="text-sm md:text-lg lg:text-xl font-extrabold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">
                  dari {stats.totalPendaftar}
                </p>
              </div>

              <div className="space-y-1 md:space-y-1.5">
                <div className="w-full h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      stat.color === 'blue' ? 'bg-blue-500' :
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
                <p className={`text-[10px] md:text-xs font-medium ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {((stat.value / stats.totalPendaftar * 100) || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
