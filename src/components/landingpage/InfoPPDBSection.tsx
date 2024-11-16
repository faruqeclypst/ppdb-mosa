import React from 'react';
import Container from '../ui/Container';
import { motion } from 'framer-motion';
import {
  DocumentCheckIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClipboardDocumentCheckIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const InfoPPDBSection: React.FC = () => {
  const requirements = [
    {
      icon: <DocumentCheckIcon className="w-8 h-8" />,
      title: "Persyaratan Umum",
      items: [
        "Memiliki NIK (Opsional)",
        "Memiliki NISN",
        "Mengisi formulir pendaftaran dengan lengkap dan benar",
        "Berusia sesuai ketentuan"
      ]
    },
    {
      icon: <AcademicCapIcon className="w-8 h-8" />,
      title: "Persyaratan Akademik",
      items: [
        "Nilai minimal 85 untuk semua mata pelajaran berikut:",
        "• Pendidikan Agama",
        "• Bahasa Indonesia",
        "• Bahasa Inggris",
        "• Matematika",
        "• IPA",
        "Nilai diambil dari semester 2, 3, dan 4"
      ]
    },
    {
      icon: <DocumentTextIcon className="w-8 h-8" />,
      title: "Dokumen Wajib",
      items: [
        "Surat Rekomendasi/Sertifikat (PDF maks. 500KB)",
        "Raport Semester 2 (PDF maks. 500KB)",
        "Raport Semester 3 (PDF maks. 500KB)",
        "Raport Semester 4 (PDF maks. 500KB)",
        "Pas Foto 3x4 (JPG/PNG maks. 1MB)"
      ]
    }
  ];

  const jalurPendaftaran = [
    {
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
      name: "Jalur Prestasi",
      description: "Untuk siswa dengan prestasi akademik dan non-akademik yang unggul"
    },
    {
      icon: <DocumentDuplicateIcon className="w-6 h-6" />,
      name: "Jalur Zonasi",
      description: "Berdasarkan jarak tempat tinggal ke sekolah"
    },
    {
      icon: <PhotoIcon className="w-6 h-6" />,
      name: "Jalur Afirmasi",
      description: "Untuk siswa dari keluarga tidak mampu dan kelompok tertentu"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4"
          >
            Informasi PPDB 2024/2025
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600"
          >
            Persyaratan dan ketentuan pendaftaran peserta didik baru
            SMAN Modal Bangsa
          </motion.p>
        </div>

        {/* Jalur Pendaftaran */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Jalur Pendaftaran
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {jalurPendaftaran.map((jalur, index) => (
              <motion.div
                key={jalur.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-blue-600">
                    {jalur.icon}
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {jalur.name}
                </h4>
                <p className="text-gray-600">
                  {jalur.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Timeline Pendaftaran
          </h3>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-around items-center space-y-6 md:space-y-0">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">Pendaftaran Dibuka</div>
                <div className="text-2xl font-bold text-blue-600">1 Maret 2024</div>
              </div>
              <div className="h-px md:h-1 w-full md:w-px bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">Pendaftaran Ditutup</div>
                <div className="text-2xl font-bold text-blue-600">30 April 2024</div>
              </div>
              <div className="h-px md:h-1 w-full md:w-px bg-gradient-to-r md:bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">Pengumuman</div>
                <div className="text-2xl font-bold text-blue-600">15 Mei 2024</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Persyaratan */}
        <div className="grid md:grid-cols-3 gap-8">
          {requirements.map((req, index) => (
            <motion.div
              key={req.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <div className="text-blue-600">
                  {req.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {req.title}
              </h3>
              <ul className="space-y-3">
                {req.items.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></div>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600">
            Untuk informasi lebih lanjut, silakan hubungi:
          </p>
          <a 
            href="tel:+628116700050"
            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            +62 811-6700-050
          </a>
        </motion.div>
      </Container>
    </section>
  );
};

export default InfoPPDBSection; 