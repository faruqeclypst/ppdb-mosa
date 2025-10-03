import React, { useState } from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPPDBStatus } from '../../utils/ppdbStatus';
import Modal from '../ui/Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';

const HeroSection: React.FC = () => {
  const [showPPDBClosedModal, setShowPPDBClosedModal] = useState(false);
  const navigate = useNavigate();

  const getPPDBYears = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    // Jika bulan > 6 (Juli), tampilkan tahun berikutnya
    const startYear = currentDate.getMonth() > 6 ? currentYear + 1 : currentYear;
    return `${startYear}/${startYear + 1}`;
  };

  const handleRegisterClick = async () => {
    const isPPDBActive = await getPPDBStatus();
    if (!isPPDBActive) {
      setShowPPDBClosedModal(true);
      return;
    }
    navigate('/register');
  };

  return (
    <section className="relative min-h-[100dvh] w-full flex items-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundAttachment: "scroll"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-blue-900/80" />
      </div>

      {/* Content */}
      <Container className="relative z-10 h-full flex items-center py-20 sm:py-24">
        <div className="flex flex-col gap-8 sm:gap-12 items-center w-full">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-4 sm:space-y-6 w-full"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              Informasi Seputar{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  SPMB Online SMA Sulteng {getPPDBYears()}
                </span>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300/90 leading-relaxed max-w-3xl mx-auto">
              Informasi lengkap seputar Jadwal, syarat, alur pendaftaran dan Informasi sekolah.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 justify-center">
              <Link to="/register" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleRegisterClick}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <span>Masuk</span>
                    <svg 
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </motion.div>
              </Link>

              <Link to="/info-ppdb" className="w-full sm:w-auto">
                <Button className="w-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-lg backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2">
                  <span>Lihat Pengumuman</span>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>

              <Link to="/info-ppdb" className="w-full sm:w-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2">
                  <span>Lihat Kuota Kosong Sekolah</span>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image - Gambar Lebar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-6xl"
          >
            <div className="relative w-full rounded-2xl overflow-hidden">
              <img 
                src="/images/hero-wide.png" 
                alt="Pejabat Pemerintah Sulawesi Tengah"
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Modal PPDB Closed */}
      <Modal
        isOpen={showPPDBClosedModal}
        onClose={() => setShowPPDBClosedModal(false)}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PPDB Belum Dimulai
            </h3>
            <p className="text-sm text-gray-600">
              Mohon maaf, pendaftaran PPDB belum dibuka. Silakan cek kembali nanti.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => setShowPPDBClosedModal(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default HeroSection; 