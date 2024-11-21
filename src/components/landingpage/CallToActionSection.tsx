import React from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <section className="relative py-24 overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1E40AF,_#1E3A8A_50%,_#1E3A8A)]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
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
          className="max-w-4xl mx-auto text-center"
        >
          <div className="space-y-8">
            {/* Enhanced Heading */}
            <motion.h2 
              variants={itemVariants}
              className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight"
            >
              Bergabung Bersama{' '}
              <span className="relative inline-block">
                SMAN Modal Bangsa
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full origin-left"
                />
              </span>
            </motion.h2>
            
            {/* Enhanced Description */}
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-light"
            >
              Wujudkan impian untuk menjadi bagian dari sekolah unggulan dengan sistem pendidikan berasrama
            </motion.p>

            {/* Enhanced Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 py-10"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform transition-all duration-300"
                >
                  <motion.div 
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className="text-white/90 mb-3"
                  >
                    {stat.icon}
                  </motion.div>
                  <motion.div 
                    className="text-3xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300"
                  >
                    {stat.value}
                  </motion.div>
                  <motion.div className="text-blue-200 text-sm">
                    {stat.label}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            >
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 
                                   text-gray-900 hover:from-yellow-500 hover:to-yellow-600
                                   px-8 py-4 text-lg font-semibold rounded-xl flex items-center gap-2 
                                   shadow-lg hover:shadow-xl transition-all duration-300">
                    Daftar Sekarang
                    <ArrowRightIcon className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>

              <Link to="/info-ppdb">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="w-full sm:w-auto bg-transparent border-2 border-white/30 
                                   text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold 
                                   rounded-xl backdrop-blur-sm transition-all duration-300">
                    Info PPDB
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Enhanced Additional Text */}
            <motion.p 
              variants={itemVariants}
              className="text-blue-200 text-sm pt-6 font-light"
            >
              Pendaftaran dibuka sampai dengan 30 April 2024
            </motion.p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default CallToActionSection;