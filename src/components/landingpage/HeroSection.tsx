import React, { useCallback, useMemo, useState } from 'react';
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

const ActionButton: React.FC<{
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ to, onClick, children, className = '', ariaLabel }) => {
  const content = (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onClick}
        className={className}
        aria-label={ariaLabel}
        type="button"
      >
        {children}
      </Button>
    </motion.div>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return content;
};

const HeroSection: React.FC<HeroSectionProps> = ({ settings }) => {
  const [showPPDBClosedModal, setShowPPDBClosedModal] = useState(false);
  const navigate = useNavigate();

  const getPPDBYears = useCallback(() => {
    if (settings?.academicYear) return settings.academicYear;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const startYear = currentDate.getMonth() > 6 ? currentYear + 1 : currentYear;
    return `${startYear}/${startYear + 1}`;
  }, [settings]);

  // tetap sama logika pemeriksaan announcement; memo agar tidak dihitung setiap render
  const hasAnnouncement = useMemo(() => {
    if (!settings) return false;
    return (
      (settings.jalurPrestasi?.isActive && !!settings.jalurPrestasi?.announcementDate) ||
      (settings.jalurReguler?.isActive && !!settings.jalurReguler?.announcementDate) ||
      (settings.jalurUndangan?.isActive && !!settings.jalurUndangan?.announcementDate)
    );
  }, [settings]);

  // Jangan ubah isi fungsi ini (memanggil server via getPPDBStatus)
  const handleRegisterClick = useCallback(async () => {
    const isPPDBActive = await getPPDBStatus();
    if (!isPPDBActive) {
      setShowPPDBClosedModal(true);
      return;
    }
    navigate('/register');
  }, [navigate]);

  return (
    <section className="relative min-h-screen w-full flex items-center overflow-hidden pb-28 md:pb-36">

      {/* Background image + overlay */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: 'cover',
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-blue-900/80" />
      </div>

      <Container className="relative z-10 h-full flex items-center py-6 pt-28 md:pt-32 lg:pt-36">
        <div className="flex flex-col gap-4 md:gap-6 items-center w-full justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-3 md:space-y-4 w-full max-w-4xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  SPMB SMAN Modal Bangsa {getPPDBYears()}
                </span>
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-300/90 leading-relaxed max-w-3xl mx-auto">
            Informasi seputar jadwal, persyaratan, alur pendaftaran, dan profil sekolah.
            </p>

            <div className="flex flex-row gap-2 md:gap-3 pt-2 md:pt-4 justify-center flex-wrap">
              <ActionButton
                to="/register"
                onClick={handleRegisterClick}
                className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium rounded-lg shadow-lg transition-all duration-300"
                ariaLabel="Daftar PPDB"
              >
                Daftar
              </ActionButton>

              <ActionButton
                to="/info-ppdb"
                className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium rounded-lg backdrop-blur-sm transition-all duration-300"
                ariaLabel="Info PPDB"
              >
                Info PPDB
              </ActionButton>

              {hasAnnouncement && (
                <ActionButton
                  to="/info-ppdb"
                  className="bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium rounded-lg backdrop-blur-sm transition-all duration-300"
                  ariaLabel="Lihat Pengumuman"
                >
                  Lihat Pengumuman
                </ActionButton>
              )}
            </div>
          </motion.div>

          {/* Hero Image: gunakan object-contain supaya tidak terpotong saat zoom */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-5xl mx-auto"
          >
            <div className="relative w-full rounded-xl md:rounded-2xl overflow-hidden flex justify-center items-center">
              <img
                src="/images/hero-wide.png"
                alt="Ilustrasi kepala sekolah dan pejabat"
                className="w-full h-auto object-contain"
                style={{ maxHeight: 'min(60vh, 480px)' }}
                loading="lazy"
                draggable={false}
              />
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Modal PPDB Closed */}
      <Modal isOpen={showPPDBClosedModal} onClose={() => setShowPPDBClosedModal(false)}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PPDB Belum Dimulai</h3>
            <p className="text-sm text-gray-600">Mohon maaf, pendaftaran PPDB belum dibuka. Silakan cek kembali nanti.</p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setShowPPDBClosedModal(false)} className="bg-gray-100 text-gray-700 hover:bg-gray-200">
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default HeroSection;
