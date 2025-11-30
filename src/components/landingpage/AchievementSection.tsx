import React, { useState, useEffect, useRef } from 'react';
import Container from '../ui/Container';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
// import { ChevronLeftIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';

interface Achievement {
  id: number;
  name: string;
  title: string;
  image: string;
  description: string;
}

const achievements: Achievement[] = [
  {
    id: 1,
    name: "Balqis Daratunnasywa",
    title: "Juara 2 Jurnalistik FLS3N Nasional 2025",
    image: "/images/prestasi/1.webp",
    description: "Juara 2 Jurnalistik FLS3N Nasional 2025"
  },
  {
    id: 2,
    name: "Teuku Fatih Ahmad Hasan",
    title: "Juara 3 Cipta Puisi FLS3N Nasional 2025",
    image: "/images/prestasi/2.webp",
    description: "Juara 3 Cipta Puisi FLS3N Nasional 2025"
  },
  {
    id: 3,
    name: "Rekha Vista, Zalfa Zahiya, Siti Endah Dinara, Tahta Zilli Arsyika, M. Fawwaz Al-Zaidan,Zulfadhli Azmi",
    title: "Mosa Raih Medali Emas pada ajang NSIF (National Science & Innovation Fair)",
    image: "/images/prestasi/3.webp",
    description: "Mosa Raih Medali Emas pada ajang NSIF (National Science & Innovation Fair)"
  },
  {
    id: 4,
    name: "Dzakwan Dhiya Ramadhana",
    title: "Silver Medal OSN FISIKA 2025",
    image: "/images/prestasi/4.webp",
    description: "Silver Medal OSN FISIKA 2025"
  },
  {
    id: 5,
    name: "Ika Putri Maulidza",
    title: "Juara 1 Lomba Menulis Esai Jenjang SMA/SMK Tingkat Provinsi Tahun 2025",
    image: "/images/prestasi/5.webp",
    description: "Juara 1 Lomba Menulis Esai Jenjang SMA/SMK Tingkat Provinsi Tahun 2025"
  },
  {
    id: 6,
    name: "Muhammad Khairil Fata, Farrel Zhafirsya Arief, dan Rafif Juhaidi ",
    title: "Juara 1 Lomba Cerdas Cermat DAMASSQUSS",
    image: "/images/prestasi/6.webp",
    description: "Juara 1 Lomba Cerdas Cermat DAMASSQUSS"
  },
  {
    id: 7,
    name: "Gazali Sulaiman",
    title: "Juara 3 Olimpiade Kimia  Chemistry Fair HMK Universitas Syiah Kuala",
    image: "/images/prestasi/7.webp",
    description: "Juara 3 Olimpiade Kimia  Chemistry Fair HMK Universitas Syiah Kuala"
  }
];

// const stats = [
//   {
//     icon: <UserGroupIcon className="w-8 h-8" />,
//     label: "Tingkat Kab/Kota",
//     value: "213 Siswa",
//     color: "bg-green-100 text-green-600"
//   },
//   {
//     icon: <UserGroupIcon className="w-8 h-8" />,
//     label: "Tingkat Provinsi",
//     value: "110 Siswa",
//     color: "bg-emerald-100 text-emerald-600"
//   },
//   {
//     icon: <UserGroupIcon className="w-8 h-8" />,
//     label: "Tingkat Nasional",
//     value: "56 Siswa",
//     color: "bg-blue-100 text-blue-600"
//   },
//   {
//     icon: <UserGroupIcon className="w-8 h-8" />,
//     label: "Tingkat Internasional",
//     value: "4 Siswa",
//     color: "bg-orange-100 text-orange-600"
//   }
// ];

const AchievementSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listControls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto slide carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto scroll list if more than 6 items
  useEffect(() => {
    if (achievements.length > 6 && containerRef.current) {
      // Wait for DOM to render
      setTimeout(() => {
        const containerHeight = containerRef.current?.scrollHeight || 0;
        const viewportHeight = 500; // Fixed viewport height
        const scrollDistance = containerHeight - viewportHeight;

        if (scrollDistance > 0) {
          listControls.start({
            y: [0, -scrollDistance, 0],
            transition: {
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }
          });
        }
      }, 100);
    }
  }, [listControls]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % achievements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + achievements.length) % achievements.length);
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Data Prestasi
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto" />
        </motion.div>

        {/* Stats Grid */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-full`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div> */}

        {/* Achievement Carousel */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Carousel Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative max-w-md mx-auto">
              {/* Phone Frame */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-50 rounded-3xl p-4 shadow-2xl">
                <div className="rounded-2xl overflow-hidden bg-gray-900">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="relative aspect-[3/4]"
                    >
                      <img
                        src={achievements[currentIndex].image}
                        alt={achievements[currentIndex].name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                        <h3 className="text-white font-bold text-lg mb-1">
                          {achievements[currentIndex].name}
                        </h3>
                        <p className="text-white/90 text-sm">
                          {achievements[currentIndex].title}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Notification Icon */}
              <div className="absolute -top-4 -left-4 bg-blue-500 rounded-full p-4 shadow-lg animate-pulse">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={prevSlide}
                  className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={nextSlide}
                  className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
                  aria-label="Next"
                >
                  <ChevronRightIcon className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Achievement List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Siswa Berprestasi
            </h3>
            <div className="w-16 h-1 bg-blue-600 mb-8" />

            {/* Scrollable List Container */}
            <div 
              className="relative overflow-hidden"
              style={{ height: achievements.length > 6 ? '500px' : 'auto' }}
            >
              <motion.div 
                ref={containerRef}
                className="space-y-4"
                animate={achievements.length > 6 ? listControls : {}}
              >
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 * Math.min(index, 5) }}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setCurrentIndex(index)}
                  >
                    <div className="flex gap-4 items-start">
                      <img
                        src={achievement.image}
                        alt={achievement.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {achievement.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Gradient Overlay for scroll effect */}
              {achievements.length > 6 && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </>
              )}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default AchievementSection;
