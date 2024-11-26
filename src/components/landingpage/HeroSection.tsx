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
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center justify-items-center w-full">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-4 sm:space-y-6 w-full"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              PPDB {getPPDBYears()}{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  SMAN Modal Bangsa
                </span>
              </span>
            </h1>
            
            {/* Logo untuk Mobile */}
            <div className="lg:hidden flex justify-center items-center my-12">
              <div className="relative w-36 mx-auto">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transform -translate-y-1/2" />
                <img 
                  src="/images/mosa.png" 
                  alt="SMAN Modal Bangsa Logo"
                  className="relative w-full h-auto drop-shadow-2xl rounded-2xl"
                />
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Membentuk generasi unggul dengan pendidikan berkualitas dan karakter yang kuat 
              melalui program pembelajaran yang terintegrasi dan inovatif.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleRegisterClick}
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <span>Daftar PPDB</span>
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
                <Button className="w-full bg-transparent border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2">
                  <span>Info PPDB</span>
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image untuk Desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block w-full flex items-center justify-center"
          >
            <div className="relative w-full max-w-md mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transform -translate-y-1/2" />
              <img 
                src="/images/mosa.png" 
                alt="SMAN Modal Bangsa Logo"
                className="relative w-full h-auto drop-shadow-2xl rounded-2xl transform scale-90" 
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