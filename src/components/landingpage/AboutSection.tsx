import React from 'react';
import Container from '../ui/Container';
import { motion } from 'framer-motion';

const AboutSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden"
          >
            <div className="relative w-full max-w-md mx-auto lg:mx-0">
              {/* Student Image */}
              <img 
                src="/images/siswa.png" 
                alt="Siswa SMAN Modal Bangsa"
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <p className="text-blue-600 font-semibold text-lg mb-2">Tentang Sekolah</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                SMAN Modal Bangsa Aceh
              </h2>
              <div className="w-16 h-1 bg-blue-600 mt-4" />
            </div>

            <p className="text-lg text-gray-700 leading-relaxed">
              SMAN Modal Bangsa adalah sekolah berasrama di Aceh yang dikenal sebagai sekolah unggul nomor 1 di Aceh. 
              Dengan sistem pendidikan terpadu dan lingkungan asrama yang mendukung, kami membentuk generasi 
              pemimpin masa depan yang cerdas, berkarakter, dan berprestasi. Bergabunglah bersama kami untuk 
              meraih masa depan yang gemilang.
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default AboutSection;
