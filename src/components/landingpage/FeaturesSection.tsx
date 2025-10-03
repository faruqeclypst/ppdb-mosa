import React from 'react';
import Container from '../ui/Container';
import { motion } from 'framer-motion';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  BuildingLibraryIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

// Types
type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  className?: string;
};

// Constants
const FEATURES: Feature[] = [
  {
    icon: <AcademicCapIcon className="w-8 h-8" />,
    title: "Kurikulum Terbaru",
    description: "Mengimplementasikan kurikulum terkini yang disesuaikan dengan kebutuhan masa depan",
    color: "blue"
  },
  {
    icon: <UserGroupIcon className="w-8 h-8" />,
    title: "Pengajar Profesional",
    description: "Tim pengajar berpengalaman dan tersertifikasi dalam bidangnya",
    color: "green"
  },
  {
    icon: <BuildingLibraryIcon className="w-8 h-8" />,
    title: "Keasramaan",
    description: "Sistem pendidikan berasrama yang mengutamakan pembentukan karakter dan kemandirian",
    color: "purple"
  },
  {
    icon: <BeakerIcon className="w-8 h-8" />,
    title: "Ekstrakurikuler",
    description: "Berbagai kegiatan pengembangan minat dan bakat siswa yang beragam",
    color: "yellow"
  },
  {
    icon: <ComputerDesktopIcon className="w-8 h-8" />,
    title: "Teknologi Terintegrasi",
    description: "Pembelajaran berbasis teknologi dengan sistem informasi akademik terpadu",
    color: "red"
  },
  {
    icon: <RocketLaunchIcon className="w-8 h-8" />,
    title: "Program Unggulan",
    description: "Berbagai program pengembangan bakat dan prestasi siswa",
    color: "indigo"
  }
];

// Components
const FeatureCard: React.FC<Feature & { index: number }> = ({ 
  icon, 
  title, 
  description, 
  color,
  className,
  index 
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500 to-blue-600",
      glow: "group-hover:shadow-blue-500/50"
    },
    green: {
      bg: "bg-gradient-to-br from-green-500 to-green-600",
      glow: "group-hover:shadow-green-500/50"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-500 to-purple-600",
      glow: "group-hover:shadow-purple-500/50"
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      glow: "group-hover:shadow-yellow-500/50"
    },
    red: {
      bg: "bg-gradient-to-br from-red-500 to-red-600",
      glow: "group-hover:shadow-red-500/50"
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      glow: "group-hover:shadow-indigo-500/50"
    }
  };

  const currentColor = colorClasses[color as keyof typeof colorClasses];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      {/* Card */}
      <div className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl ${currentColor.glow} transition-all duration-300 h-full overflow-hidden ${className}`}>
        {/* Gradient Decoration */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${currentColor.bg} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
        
        {/* Icon */}
        <div className="relative mb-4">
          <div className={`inline-flex p-4 rounded-xl ${currentColor.bg} text-white shadow-lg`}>
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="relative">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Hover Effect Arrow */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30" />
      </div>

      <Container className="relative">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold mb-4">
              Mengapa Memilih Kami?
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Keunggulan Kami
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6" />
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Memadukan pendidikan berkualitas dengan fasilitas modern untuk menciptakan
              lingkungan belajar yang optimal dan menghasilkan lulusan berprestasi
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection; 