import React from 'react';
import Container from '../ui/Container';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type FAQItem = {
  question: string;
  answer: string;
  category: 'pendaftaran' | 'persyaratan' | 'biaya' | 'pengumuman';
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Apa saja jalur masuk yang tersedia?",
    answer: "SMAN Modal Bangsa menyediakan 3 jalur masuk:\n\n• Jalur Prestasi: Untuk siswa berprestasi akademik/non-akademik\n• Jalur Reguler: Seleksi umum berdasarkan nilai akademik\n• Jalur Undangan: Khusus rekomendasi dari sekolah asal\n\nSetiap jalur memiliki kuota dan persyaratan khusus yang berbeda.",
    category: "pendaftaran"
  },
  {
    question: "Bagaimana cara mendaftar PPDB Online?",
    answer: "Pendaftaran dapat dilakukan melalui website ini dengan mengklik tombol 'Daftar Sekarang'. Ikuti langkah-langkah yang ada dan lengkapi dokumen yang diperlukan.",
    category: "pendaftaran"
  },
  {
    question: "Berapa nilai minimal untuk mendaftar?",
    answer: "Nilai minimal untuk mendaftar berbeda-beda setiap jalur:\n\n• Jalur Prestasi: Minimal rata-rata 83 untuk semester 2-4\n• Jalur Reguler: Minimal rata-rata 83 untuk semester 3-5\n• Jalur Undangan: Minimal rata-rata 83 untuk semester 2-4",
    category: "persyaratan"
  },
  {
    question: "Mata pelajaran apa saja yang diperhitungkan?",
    answer: "Mata pelajaran yang diperhitungkan adalah:\n\n• Matematika\n• IPA (Fisika & Biologi)\n• Bahasa Inggris\n• Bahasa Indonesia\n\nNilai rata-rata dari mata pelajaran tersebut akan menjadi pertimbangan dalam seleksi.",
    category: "persyaratan"
  },
  {
    question: "Apa saja persyaratan yang dibutuhkan?",
    answer: "Persyaratan umum meliputi:\n\n• Nilai rapor sesuai jalur pendaftaran\n• Pas foto terbaru berlatar biru (3x4)\n• Surat rekomendasi dari sekolah\n• Fotokopi Kartu Keluarga\n• Fotokopi Akta Kelahiran\n• Sertifikat prestasi (untuk jalur prestasi)",
    category: "persyaratan"
  },
  {
    question: "Bagaimana dengan prestasi non-akademik?",
    answer: "Prestasi non-akademik yang diperhitungkan meliputi:\n\n• Juara 1-3 tingkat Kabupaten/Kota\n• Juara 1-3 tingkat Provinsi\n• Juara 1-3 tingkat Nasional\n• Prestasi Internasional\n\nSemua prestasi harus dibuktikan dengan sertifikat asli.",
    category: "persyaratan"
  },
  {
    question: "Kapan pengumuman hasil seleksi?",
    answer: "Pengumuman hasil seleksi akan disampaikan melalui website dan papan pengumuman sekolah sesuai jadwal yang telah ditentukan. Peserta yang diterima wajib melakukan daftar ulang maksimal 3 hari setelah pengumuman.",
    category: "pengumuman"
  },
  {
    question: "Apakah ada biaya pendaftaran?",
    answer: "Pendaftaran PPDB di SMAN Modal Bangsa tidak dipungut biaya (gratis).",
    category: "biaya"
  },
  {
    question: "Berapa biaya daftar ulang?",
    answer: "Biaya daftar ulang meliputi:\n\n• Seragam sekolah\n• Seragam olahraga\n• Buku pelajaran\n• Biaya asrama 1 semester\n\nRincian biaya akan diinformasikan saat pengumuman kelulusan.",
    category: "biaya"
  },
  {
    question: "Bagaimana tahapan tes seleksi?",
    answer: "Tahapan tes seleksi terdiri dari:\n\n• Tes Akademik (Matematika, IPA, Bahasa Inggris)\n• Tes Potensi Akademik (TPA)\n• Tes Baca Al-Qur'an\n• Wawancara Siswa\n• Wawancara Orang Tua\n\nSemua tes dilaksanakan secara offline di kampus SMAN Modal Bangsa sesuai jadwal yang ditentukan.",
    category: "pendaftaran"
  }
];

const categoryColors = {
  pendaftaran: 'from-blue-500 to-blue-600',
  persyaratan: 'from-green-500 to-green-600',
  biaya: 'from-purple-500 to-purple-600',
  pengumuman: 'from-yellow-500 to-yellow-600'
};

const categoryIcons = {
  pendaftaran: "🎓",
  persyaratan: "📝",
  biaya: "💰",
  pengumuman: "📢"
};

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const filteredFAQs = selectedCategory 
    ? FAQ_ITEMS.filter(item => item.category === selectedCategory)
    : FAQ_ITEMS;

  // Split FAQs into two columns
  const leftColumnFAQs = filteredFAQs.filter((_, index) => index % 2 === 0);
  const rightColumnFAQs = filteredFAQs.filter((_, index) => index % 2 === 1);

  const categories = Array.from(new Set(FAQ_ITEMS.map(item => item.category)));

  // Tambahkan fungsi toggle
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-gray-50 to-blue-50/30 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full blur-3xl opacity-20" />
      </div>

      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Temukan jawaban untuk pertanyaan umum seputar PPDB SMAN Modal Bangsa
          </p>
        </motion.div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 sm:mb-12">
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all
              ${!selectedCategory 
                ? 'bg-gray-900 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Semua
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                flex items-center gap-2
                ${selectedCategory === category 
                  ? `bg-gradient-to-r ${categoryColors[category]} text-white shadow-lg` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{categoryIcons[category]}</span>
              <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
            </motion.button>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Left & Right Column */}
          {[leftColumnFAQs, rightColumnFAQs].map((columnFAQs, columnIndex) => (
            <div key={columnIndex} className="space-y-4">
              <AnimatePresence>
                {columnFAQs.map((item, index) => (
                  <motion.div
                    key={item.question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <motion.button
                      onClick={() => toggleFAQ(index * 2 + columnIndex)}
                      className="w-full text-left bg-white p-4 sm:p-6 rounded-xl shadow-md hover:shadow-xl 
                               transition-all duration-300 border border-gray-100"
                      whileHover={{ scale: 1.01 }}
                    >
                      {/* Question Header */}
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl sm:text-2xl">{categoryIcons[item.category]}</span>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {item.question}
                          </h3>
                        </div>
                        <ChevronDownIcon 
                          className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0
                          ${openIndex === index * 2 + columnIndex ? 'transform rotate-180' : ''}`}
                        />
                      </div>

                      {/* Answer Content */}
                      <AnimatePresence>
                        {openIndex === index * 2 + columnIndex && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100">
                              {/* Category Badge */}
                              <div className="mb-3">
                                <span className={`
                                  px-3 py-1 rounded-full text-xs font-medium
                                  ${item.category === 'pendaftaran' && 'bg-blue-100 text-blue-700'}
                                  ${item.category === 'persyaratan' && 'bg-green-100 text-green-700'}
                                  ${item.category === 'biaya' && 'bg-purple-100 text-purple-700'}
                                  ${item.category === 'pengumuman' && 'bg-yellow-100 text-yellow-700'}
                                `}>
                                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                </span>
                              </div>

                              {/* Answer Text */}
                              {item.answer.split('\n\n').map((paragraph, idx) => (
                                <div key={idx} className="mb-3 last:mb-0">
                                  {paragraph.includes('•') ? (
                                    <ul className="space-y-2">
                                      {paragraph.split('\n').map((line, lineIdx) => (
                                        <li key={lineIdx} className="flex items-start">
                                          {line.includes('•') ? (
                                            <>
                                              <span className={`
                                                w-1.5 h-1.5 rounded-full mt-2 mr-3 flex-shrink-0
                                                ${item.category === 'pendaftaran' && 'bg-blue-400'}
                                                ${item.category === 'persyaratan' && 'bg-green-400'}
                                                ${item.category === 'biaya' && 'bg-purple-400'}
                                                ${item.category === 'pengumuman' && 'bg-yellow-400'}
                                              `}/>
                                              <span className="text-sm sm:text-base text-gray-700">
                                                {line.replace('•', '').trim()}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-sm sm:text-base text-gray-700">{line}</span>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                      {paragraph}
                                    </p>
                                  )}
                                </div>
                              ))}

                              {/* Info Box - jika diperlukan */}
                              {item.category === 'persyaratan' && (
                                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                                  <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-blue-700">
                                      Pastikan semua dokumen yang diunggah dalam format PDF dan ukuran maksimal 500KB per file.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Warning Box - untuk informasi penting */}
                              {item.category === 'pengumuman' && (
                                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                                  <div className="flex items-start">
                                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-sm text-yellow-700">
                                      Peserta yang tidak melakukan daftar ulang sesuai jadwal dianggap mengundurkan diri.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Success Box - untuk informasi biaya */}
                              {/* {item.category === 'biaya' && (
                                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                                  <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-green-700">
                                      Tersedia program beasiswa untuk siswa berprestasi dan kurang mampu.
                                    </p>
                                  </div>
                                </div>
                              )} */}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FAQSection; 