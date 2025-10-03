import React, { useState } from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPPDBStatus } from '../../utils/ppdbStatus';
import Modal from '../ui/Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { PPDBSettings } from '../../types/settings';

type HeroSectionProps = {
  settings: PPDBSettings | null;
};

const HeroSection: React.FC<HeroSectionProps> = ({ settings }) => {
  const [showPPDBClosedModal, setShowPPDBClosedModal] = useState(false);
  const navigate = useNavigate();

  const getPPDBYears = () => {
    if (settings?.academicYear) {
      return settings.academicYear;
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    // Jika bulan > 6 (Juli), tampilkan tahun berikutnya
    const startYear = currentDate.getMonth() > 6 ? currentYear + 1 : currentYear;
    return `${startYear}/${startYear + 1}`;
  };

  // Check if any jalur has announcement date set and is active
  const hasAnnouncement = () => {
    if (!settings) return false;
    
    return (
      (settings.jalurPrestasi?.isActive && settings.jalurPrestasi?.announcementDate) ||
      (settings.jalurReguler?.isActive && settings.jalurReguler?.announcementDate) ||
      (settings.jalurUndangan?.isActive && settings.jalurUndangan?.announcementDate)
    );
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
    <section className="relative h-screen w-full flex items-center overflow-hidden">
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
      <Container className="relative z-10 h-full flex items-center py-6">
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full justify-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-3 md:space-y-4 w-full"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  SPMB Online SMAN Modal Bangsa {getPPDBYears()}
                </span>
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-300/90 leading-relaxed max-w-3xl mx-auto">
              Informasi lengkap seputar Jadwal, syarat, alur pendaftaran dan Informasi sekolah.
            </p>

            <div className="flex flex-row gap-2 md:gap-3 pt-2 md:pt-4 justify-center flex-wrap">
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleRegisterClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium rounded-lg shadow-lg transition-all duration-300"
                  >
                    Daftar
                  </Button>
                </motion.div>
              </Link>

              <Link to="/info-ppdb">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium rounded-lg backdrop-blur-sm transition-all duration-300">
                    Info PPDB
                  </Button>
                </motion.div>
              </Link>

              {hasAnnouncement() && (
                <Link to="/info-ppdb">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium rounded-lg backdrop-blur-sm transition-all duration-300">
                      Lihat Pengumuman
                    </Button>
                  </motion.div>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Hero Image - Gambar Lebar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-5xl"
          >
            <div className="relative w-full rounded-xl md:rounded-2xl overflow-hidden">
              <img 
                src="/images/hero-wide.png" 
                alt="Pejabat Pemerintah Sulawesi Tengah"
                className="w-full h-auto object-cover max-h-[45vh]"
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