import React from 'react';
import Container from '../ui/Container';
import { motion } from 'framer-motion';
import type { PPDBSettings } from '../../types/settings';
import {
  DocumentCheckIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon} from '@heroicons/react/24/outline';

type InfoPPDBSectionProps = {
  settings: PPDBSettings | null;
};

const InfoPPDBSection: React.FC<InfoPPDBSectionProps> = ({ settings }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getActiveJalur = () => {
    if (!settings) return [];

    const jalur = [];
    if (settings.jalurPrestasi.isActive) {
      jalur.push({
        name: 'Prestasi',
        description: 'Jalur khusus bagi siswa berprestasi akademik dan non-akademik',
        period: `${formatDate(settings.jalurPrestasi.start)} - ${formatDate(settings.jalurPrestasi.end)}`,
        testDate: settings.jalurPrestasi.testDate,
        icon: AcademicCapIcon,
        bgColor: 'bg-blue-500',
        requirements: [
          'Nilai Rapor Semester 2-4',
          'Sertifikat Prestasi',
          'Surat Rekomendasi'
        ]
      });
    }
    if (settings.jalurReguler.isActive) {
      jalur.push({
        name: 'Reguler',
        description: 'Jalur umum untuk seluruh calon peserta didik',
        period: `${formatDate(settings.jalurReguler.start)} - ${formatDate(settings.jalurReguler.end)}`,
        testDate: settings.jalurReguler.testDate,
        icon: UserGroupIcon,
        bgColor: 'bg-green-500',
        requirements: [
          'Nilai Rapor Semester 3-5',
          'Surat Keterangan Sehat',
          'Kartu Keluarga'
        ]
      });
    }
    if (settings.jalurUndangan.isActive) {
      jalur.push({
        name: 'Undangan',
        description: 'Jalur khusus berdasarkan rekomendasi sekolah asal',
        period: `${formatDate(settings.jalurUndangan.start)} - ${formatDate(settings.jalurUndangan.end)}`,
        icon: DocumentTextIcon,
        bgColor: 'bg-purple-500',
        requirements: [
          'Surat Undangan',
          'Nilai Rapor Semester 2-4',
          'Surat Rekomendasi'
        ]
      });
    }
    return jalur;
  };

  // Memoize hasil getActiveJalur
  const activeJalur = React.useMemo(() => getActiveJalur(), [settings]);

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 via-white to-blue-50">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Informasi PPDB{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              {settings?.academicYear || '2025/2026'}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Penerimaan Peserta Didik Baru SMAN Modal Bangsa
          </p>
        </motion.div>

        {/* Jalur Pendaftaran */}
        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeJalur.map((jalur, index) => (
              <motion.div
                key={jalur.name}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }
                  }
                }}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                layoutId={`jalur-${jalur.name}`}
              >
                {/* Header */}
                <div className={`${jalur.bgColor} p-6 rounded-t-2xl`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h4 className="text-2xl font-bold mb-2">Jalur {jalur.name}</h4>
                      <p className="text-white/80 text-sm">{jalur.description}</p>
                    </div>
                    <jalur.icon className="w-12 h-12 opacity-90" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Periode */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <h5 className="font-semibold text-gray-900">Periode Pendaftaran</h5>
                    </div>
                    <p className="text-gray-600 ml-7">{jalur.period}</p>
                  </div>

                  {/* Tanggal Tes */}
                  {jalur.testDate && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <h5 className="font-semibold text-gray-900">Tanggal Tes</h5>
                      </div>
                      <p className="text-gray-600 ml-7">{formatDate(jalur.testDate)}</p>
                    </div>
                  )}

                  {/* Persyaratan */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DocumentCheckIcon className="w-5 h-5 text-gray-400" />
                      <h5 className="font-semibold text-gray-900">Persyaratan Utama</h5>
                    </div>
                    <ul className="space-y-2 ml-7">
                      {jalur.requirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-24">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center mb-16"
          >
            <span className="border-b-4 border-blue-500 pb-2">Timeline PPDB</span>
          </motion.h3>
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></div>
              {activeJalur.map((jalur, index) => (
                <motion.div
                  key={jalur.name}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: {
                        duration: 0.5,
                        delay: index * 0.2,
                        ease: "easeOut"
                      }
                    }
                  }}
                  className={`relative flex items-center mb-16 ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                  layoutId={`timeline-${jalur.name}`}
                >
                  <div className="w-full md:w-5/12">
                    <div className={`${jalur.bgColor} p-6 rounded-2xl text-white`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <jalur.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-xl font-bold">Jalur {jalur.name}</h4>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-white/80 text-sm">Periode Pendaftaran</p>
                          <p className="font-medium">{jalur.period}</p>
                        </div>
                        {jalur.testDate && (
                          <div>
                            <p className="text-white/80 text-sm">Tanggal Tes</p>
                            <p className="font-medium">{formatDate(jalur.testDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full border-4 border-blue-500 shadow"></div>
                </motion.div>
              ))}
              {settings?.announcementDate && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: "easeOut" }
                    }
                  }}
                  className="relative flex justify-center"
                  layoutId="announcement"
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl text-white max-w-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <DocumentCheckIcon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold">Pengumuman</h4>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Tanggal Pengumuman</p>
                      <p className="font-medium">{formatDate(settings.announcementDate)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Kontak */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, ease: "easeOut" }
            }
          }}
          className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg"
          layoutId="contact-section"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h4 className="text-3xl font-bold text-gray-900 mb-4">
              Butuh Bantuan?
            </h4>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
              Tim support kami siap membantu menjawab pertanyaan seputar PPDB SMAN Modal Bangsa. 
              Silakan hubungi admin kami melalui WhatsApp.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings?.contactWhatsapp && (
                <>
                  {settings.contactWhatsapp.admin1?.name && settings.contactWhatsapp.admin1?.whatsapp && (
                    <motion.a 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      href={`https://wa.me/${settings.contactWhatsapp.admin1.whatsapp?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <PhoneIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-lg mb-1">
                          {settings.contactWhatsapp.admin1.name}
                        </p>
                        <p className="text-sm text-gray-500">Admin PPDB</p>
                      </div>
                    </motion.a>
                  )}

                  {settings.contactWhatsapp.admin2?.name && settings.contactWhatsapp.admin2?.whatsapp && (
                    <motion.a 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      href={`https://wa.me/${settings.contactWhatsapp.admin2.whatsapp?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <PhoneIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-lg mb-1">
                          {settings.contactWhatsapp.admin2.name}
                        </p>
                        <p className="text-sm text-gray-500">Admin PPDB</p>
                      </div>
                    </motion.a>
                  )}

                  {settings.contactWhatsapp.admin3?.name && settings.contactWhatsapp.admin3?.whatsapp && (
                    <motion.a 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      href={`https://wa.me/${settings.contactWhatsapp.admin3.whatsapp?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <PhoneIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-lg mb-1">
                          {settings.contactWhatsapp.admin3.name}
                        </p>
                        <p className="text-sm text-gray-500">Admin PPDB</p>
                      </div>
                    </motion.a>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

// Wrap komponen dengan React.memo untuk mencegah render ulang yang tidak perlu
export default React.memo(InfoPPDBSection); 