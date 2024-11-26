import React from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, AcademicCapIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/outline';

const CallToActionSection: React.FC = () => {
  const stats = [
    {
      icon: <AcademicCapIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      value: "100%",
      label: "Tingkat Kelulusan"
    },
    {
      icon: <UserGroupIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      value: "1500+",
      label: "Alumni Sukses"
    },
    {
      icon: <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      value: "500+",
      label: "Prestasi"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative py-8 sm:py-12 md:py-24 overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1E40AF,_#1E3A8A_50%,_#1E3A8A)]">
        <div className="absolute inset-0 opacity-20" />
      </div>
      
      {/* Animated Shapes */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"
      />
      
      <Container className="relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center px-4 sm:px-6"
        >
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Enhanced Heading */}
            <motion.h2 
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight"
            >
              Bergabung Bersama{' '}
              <span className="relative inline-block">
                SMAN Modal Bangsa
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full origin-left"
                />
              </span>
            </motion.h2>
            
            {/* Enhanced Description */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 max-w-2xl mx-auto font-light"
            >
              Wujudkan impian untuk menjadi bagian dari sekolah unggulan dengan sistem pendidikan berasrama
            </motion.p>

            {/* Enhanced Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 py-4 sm:py-6 md:py-10"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="group bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6"
                >
                  <motion.div className="text-white/90 mb-2 sm:mb-3">
                    {stat.icon}
                  </motion.div>
                  <motion.div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                    {stat.value}
                  </motion.div>
                  <motion.div className="text-blue-200 text-xs sm:text-sm">
                    {stat.label}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6"
            >
              <Link to="/register" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 
                                   text-gray-900 hover:from-yellow-500 hover:to-yellow-600
                                   px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl 
                                   flex items-center justify-center gap-2">
                    Daftar Sekarang
                    <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </motion.div>
              </Link>

              <Link to="/info-ppdb" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full bg-transparent border-2 border-white/30 
                                   text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-4 
                                   text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl">
                    Info PPDB
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default CallToActionSection;