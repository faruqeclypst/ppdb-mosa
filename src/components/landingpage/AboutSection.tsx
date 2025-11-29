import React from 'react';
import Container from '../ui/Container';
import { motion } from 'framer-motion';

const AboutSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <Container>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -24, scale: 0.99 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-visible"
          >
            <div className="relative w-full max-w-md mx-auto lg:mx-0">
              {/* Decorative rounded background (no shadow) */}
              <div className="absolute -left-6 top-6 w-[420px] h-[520px] rounded-[40px] bg-blue-50 -z-10 hidden md:block" />
              <img
                src="/images/siswa.png"
                alt="Siswa SMAN Modal Bangsa"
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </motion.div>

{/* Text Content */}
<motion.div
  initial={{ opacity: 0, x: 24 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  className="space-y-6"
>
  {/* Card diperbesar */}
  <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 w-full">
    <p className="text-blue-600 font-semibold text-sm mb-3">Tentang Sekolah</p>

    {/* Logo + Judul (lebih besar) */}
    <div className="flex items-center gap-5 mb-4">
      <img
        src="/images/mosa.png"
        alt="Logo SMAN Modal Bangsa"
        className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
      />

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
        SMAN Modal Bangsa Aceh
      </h2>
    </div>

    {/* Divider */}
    <div className="w-24 h-1 bg-blue-600 mb-6 rounded" />

    {/* Paragraph lebih lebar */}
    <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-6">
      Didukung tenaga pendidik profesional, fasilitas pembelajaran modern, serta
      budaya prestasi yang kuat, SMAN Modal Bangsa menjadi rumah bagi calon pemimpin
      masa depan yang siap bersaing di tingkat nasional maupun internasional.
      Di sini, setiap siswa ditempa untuk berpikir kritis, berintegritas, dan berani
      menghadapi tantangan.
    </p>

    {/* Selengkapnya button */}
    <a
      href="#"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium"
    >
      Selengkapnya
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>

    {/* Stats lebih besar & rapi */}
    <div className="mt-8 grid grid-cols-3 gap-6 text-center">
      <div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">1.200+</div>
        <div className="text-sm text-gray-500">Siswa Terdaftar</div>
      </div>

      <div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">85</div>
        <div className="text-sm text-gray-500">Prestasi Nasional</div>
      </div>

      <div>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">10</div>
        <div className="text-sm text-gray-500">Tahun Berdiri</div>
      </div>
    </div>
  </div>

  {/* Text bawah (tetap kecil) */}
  <p className="text-sm text-gray-600 leading-relaxed">
    SMAN Modal Bangsa — Sekolah Para Juara, tempat terbaik membangun masa depan siswa
    yang mandiri, visioner, dan berprestasi.
  </p>
</motion.div>
        </div>
      </Container>
    </section>
  );
};

export default AboutSection;
