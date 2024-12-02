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
    blue: "bg-blue-50 text-blue-600 ring-blue-500/10",
    green: "bg-green-50 text-green-600 ring-green-500/10",
    purple: "bg-purple-50 text-purple-600 ring-purple-500/10",
    yellow: "bg-yellow-50 text-yellow-600 ring-yellow-500/10",
    red: "bg-red-50 text-red-600 ring-red-500/10",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-500/10"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative group"
    >
      <div className="absolute -inset-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg blur opacity-0 group-hover:opacity-10 transition duration-500" />
      <div className={`relative bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col ${className}`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        <p className="text-gray-600 ml-[3.25rem] flex-grow">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// Main Component
const FeaturesSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-blue-50/30 to-white">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 sm:text-4xl mb-4"
          >
            Keunggulan Kami
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-base sm:text-lg text-gray-600"
          >
            Memadukan pendidikan berkualitas dengan fasilitas modern untuk menciptakan
            lingkungan belajar yang optimal
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} className="p-4 sm:p-6" />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturesSection; 