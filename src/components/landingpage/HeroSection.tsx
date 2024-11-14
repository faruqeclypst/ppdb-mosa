import React from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components
const BackgroundOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{ 
      backgroundImage: "url('/src/assets/hero-bg.jpg')",
      backgroundAttachment: "fixed"
    }}>
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-blue-900/80" />
  </div>
);

const StatsItem: React.FC<{ value: string; label: string; delay: number }> = 
  ({ value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="text-center px-6 py-4 bg-white/5 backdrop-blur-sm rounded-lg"
  >
    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm sm:text-base text-gray-300/90 font-medium">{label}</div>
  </motion.div>
);

// Main Component
const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-10">
      <BackgroundOverlay />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center px-4 sm:px-6 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-6"
          >
            <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <span className="text-white/90 text-sm font-medium">
                Penerimaan Siswa Baru 2024/2025 Telah Dibuka
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Selamat Datang di{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400 block mt-2">
                SMAN Modal Bangsa
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
              Membentuk generasi unggul dengan pendidikan berkualitas dan karakter yang kuat 
              melalui program pembelajaran yang terintegrasi dan inovatif.
            </p>

            <div className="flex flex-wrap gap-4 pt-6 justify-center lg:justify-start">
              <Link to="/register">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-base font-semibold rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                  Daftar Sekarang
                </Button>
              </Link>
              <Link to="/about">
                <Button className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-base font-semibold rounded-lg transition-all duration-300">
                  Info PPDB
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transform -translate-y-1/2"></div>
              <img 
                src="/src/assets/hero-illustration.webp" 
                alt="Education Illustration"
                className="relative w-full h-auto max-w-lg mx-auto drop-shadow-2xl rounded-lg"
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-12 lg:mt-16 max-w-4xl mx-auto px-4"
        >
          <StatsItem value="500+" label="Siswa Aktif" delay={0.2} />
          <StatsItem value="50+" label="Tenaga Pengajar" delay={0.4} />
          <StatsItem value="95%" label="Tingkat Kelulusan" delay={0.6} />
        </motion.div>
      </Container>
    </section>
  );
};

export default HeroSection; 