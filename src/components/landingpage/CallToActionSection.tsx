import React from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, AcademicCapIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';

const CallToActionSection: React.FC = () => {
  const stats = [
    {
      icon: <AcademicCapIcon className="w-8 h-8" />,
      value: "100%",
      label: "Tingkat Kelulusan"
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      value: "1500+",
      label: "Alumni Sukses"
    },
    {
      icon: <TrophyIcon className="w-8 h-8" />,
      value: "100+",
      label: "Prestasi"
    }
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background dengan gradient dan pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[length:16px_16px]" />
      </div>
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      <Container className="relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-6">
            {/* Heading */}
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Bergabung Bersama{' '}
              <span className="relative inline-block">
                SMAN Modal Bangsa
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-yellow-400 rounded-full" />
              </span>
            </h2>
            
            {/* Description */}
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Wujudkan impian untuk menjadi bagian dari sekolah unggulan dengan sistem pendidikan berasrama
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="text-white/80 mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-blue-100 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link to="/register">
                <Button className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 
                                 px-6 py-3 text-base font-semibold rounded-xl flex items-center gap-2 
                                 shadow-lg hover:shadow-xl transition-all duration-300">
                  Daftar Sekarang
                  <ArrowRightIcon className="w-5 h-5" />
                </Button>
              </Link>

              <Link to="/info-ppdb">
                <Button className="w-full sm:w-auto bg-transparent border-2 border-white/20 
                                 text-white hover:bg-white/10 px-6 py-3 text-base font-semibold 
                                 rounded-xl backdrop-blur-sm transition-all duration-300">
                  Info PPDB
                </Button>
              </Link>
            </div>

            {/* Additional Text */}
            <p className="text-blue-100 text-sm pt-4">
              Pendaftaran dibuka sampai dengan 30 April 2024
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default CallToActionSection; 