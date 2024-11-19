import React, { useState } from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { getPPDBStatus } from '../../utils/ppdbStatus';
import Modal from '../ui/Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';

const HeroSection: React.FC = () => {
  const [showPPDBClosedModal, setShowPPDBClosedModal] = useState(false);
  const navigate = useNavigate();

  const handleRegisterClick = async () => {
    const isPPDBActive = await getPPDBStatus();
    if (!isPPDBActive) {
      setShowPPDBClosedModal(true);
      return;
    }
    navigate('/register');
  };

  return (
    <section className="relative min-h-screen w-full flex items-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/src/assets/hero-bg.jpg')",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-blue-900/80" />
      </div>

      {/* Content */}
      <Container className="relative z-10 h-full flex items-center">
        {/* Spacer div untuk memberikan jarak dari header */}
        <div className="absolute top-0 left-0 right-0 h-24" /> {/* Header spacing */}
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full pt-16"> {/* Tambahkan padding top */}
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              PPDB 2025/2026{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                  SMAN Modal Bangsa
                </span>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Membentuk generasi unggul dengan pendidikan berkualitas dan karakter yang kuat 
              melalui program pembelajaran yang terintegrasi dan inovatif.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center lg:justify-start">
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleRegisterClick}
                    className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 group"
                  >
                    Daftar Sekarang
                    <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>

              <Link to="/info-ppdb">
                <Button className="w-full sm:w-auto bg-transparent border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300">
                  Info PPDB
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transform -translate-y-1/2" />
              <img 
                src="/src/assets/mosa.png" 
                alt="Education Illustration"
                className="relative w-full h-auto max-w-lg mx-auto drop-shadow-2xl rounded-2xl"
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