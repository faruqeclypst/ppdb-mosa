import React, { useState, useEffect } from 'react';
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
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import FAQSection from './FAQSection';

type InfoPPDBSectionProps = {
  settings: PPDBSettings | null;
};

const InfoPPDBSection: React.FC<InfoPPDBSectionProps> = ({ settings }) => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    };

    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  const getActiveJalur = () => {
    if (!settings) return [];

    const jalur = [];
    if (settings.jalurPrestasi.isActive) {
      jalur.push({
        name: 'Prestasi',
        description: 'Jalur khusus bagi siswa berprestasi akademik dan non-akademik',
        period: `${formatDate(settings.jalurPrestasi.start)} - ${formatDate(settings.jalurPrestasi.end)}`,
        testDate: settings.jalurPrestasi.testDate || null,
        announcementDate: settings.jalurPrestasi.announcementDate,
        icon: AcademicCapIcon,
        bgColor: 'bg-blue-500',
        requirements: settings.jalurPrestasi.requirements || []
      });
    }
    if (settings.jalurReguler.isActive) {
      jalur.push({
        name: 'Reguler',
        description: 'Jalur umum untuk seluruh calon peserta didik',
        period: `${formatDate(settings.jalurReguler.start)} - ${formatDate(settings.jalurReguler.end)}`,
        testDate: settings.jalurReguler.testDate || null,
        announcementDate: settings.jalurReguler.announcementDate,
        icon: UserGroupIcon,
        bgColor: 'bg-green-500',
        requirements: settings.jalurReguler.requirements || []
      });
    }
    if (settings.jalurUndangan.isActive) {
      jalur.push({
        name: 'Undangan',
        description: 'Jalur khusus berdasarkan rekomendasi sekolah asal',
        period: `${formatDate(settings.jalurUndangan.start)} - ${formatDate(settings.jalurUndangan.end)}`,
        testDate: settings.jalurUndangan.testDate || null,
        announcementDate: settings.jalurUndangan.announcementDate,
        icon: DocumentTextIcon,
        bgColor: 'bg-purple-500',
        requirements: settings.jalurUndangan.requirements || []
      });
    }
    return jalur;
  };

  const activeJalur = React.useMemo(() => getActiveJalur(), [settings]);

  const handleViewRequirements = () => {
    setShowModal(true);
  };

  return (
    <>
      <section className="py-12 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
        <Container>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Jalur PPDB{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                {settings?.academicYear || '2025/2026'}
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Pilih jalur pendaftaran sesuai dengan kriteria dan prestasi Anda
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto flex-grow">
            {/* Jalur Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
              {activeJalur.map((jalur, index) => (
                <motion.div
                  key={jalur.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  {/* Main Card */}
                  <div className={`${jalur.bgColor} rounded-2xl shadow-lg overflow-hidden 
                                  transform transition-all duration-300 hover:scale-[1.02] 
                                  hover:shadow-xl h-full flex flex-col`}>
                    {/* Card Header - Fixed height */}
                    <div className="p-8 text-white">
                      <div className="flex items-center justify-between mb-6">
                        <jalur.icon className="w-12 h-12" />
                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">
                          Jalur {jalur.name}
                        </span>
                      </div>
                      <p className="text-white/90 text-lg line-clamp-3"> {/* Batasi tinggi deskripsi */}
                        {jalur.description}
                      </p>
                    </div>

                    {/* Info Box - Flex grow untuk mengisi sisa ruang */}
                    <div className="bg-white p-6 flex-1 flex flex-col">
                      {/* Content wrapper */}
                      <div className="flex-1 flex flex-col">
                        {/* Period - Fixed height */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                            <h4 className="font-medium text-gray-900">Periode Pendaftaran</h4>
                          </div>
                          <p className="text-gray-600 ml-7">{jalur.period}</p>
                        </div>

                        {/* Test Date - Only show if exists */}
                        {jalur.testDate && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <ClockIcon className="w-5 h-5 text-green-500" />
                              <h4 className="font-medium text-gray-900">Tanggal Tes</h4>
                            </div>
                            <p className="text-gray-600 ml-7">{formatDate(jalur.testDate)}</p>
                          </div>
                        )}

                        {/* Requirements - Flex grow untuk mengisi sisa ruang */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <DocumentCheckIcon className="w-5 h-5 text-purple-500" />
                            <h4 className="font-medium text-gray-900">Persyaratan</h4>
                          </div>
                          <ul className="space-y-2 ml-7">
                            {jalur.requirements?.map((req, i) => (
                              <li key={i} className="text-gray-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                                {req}
                              </li>
                            )) || []}
                          </ul>
                        </div>
                      </div>

                      {/* Action Button - Fixed height */}
                      <Link to="/register">
                        <button className={`w-full mt-6 ${jalur.bgColor} text-white py-3 px-4 
                                         rounded-xl flex items-center justify-center gap-2 
                                         transition-all duration-300 hover:opacity-90`}>
                          <span>Daftar Sekarang</span>
                          <ArrowLongRightIcon className="w-5 h-5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Button Lihat Detail Persyaratan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="my-8 md:my-16 text-center"
            >
              <button
                onClick={handleViewRequirements}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl 
                         hover:bg-blue-700 transition-colors duration-300
                         flex items-center gap-2 mx-auto"
              >
                <DocumentCheckIcon className="w-5 h-5" />
                Lihat Detail Lengkap Persyaratan PPDB
              </button>
            </motion.div>

            {/* Announcement & Contact - Compact Version */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              {/* Announcement */}
              {settings?.jalurPrestasi.announcementDate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <DocumentCheckIcon className="w-8 h-8" />
                      <h3 className="text-xl font-bold">Pengumuman Kelulusan</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Pengumuman per jalur */}
                      {settings.jalurPrestasi.isActive && (
                        <div className="bg-white/10 rounded-xl p-4">
                          <p className="font-medium">Jalur Prestasi</p>
                          <p className="text-sm text-white/80">
                            {formatDate(settings.jalurPrestasi.announcementDate)}
                          </p>
                        </div>
                      )}

                      {settings.jalurReguler.isActive && (
                        <div className="bg-white/10 rounded-xl p-4">
                          <p className="font-medium">Jalur Reguler</p>
                          <p className="text-sm text-white/80">
                            {settings.jalurReguler.announcementDate 
                              ? formatDate(settings.jalurReguler.announcementDate)
                              : '-'}
                          </p>
                        </div>
                      )}

                      {settings.jalurUndangan.isActive && (
                        <div className="bg-white/10 rounded-xl p-4">
                          <p className="font-medium">Jalur Undangan</p>
                          <p className="text-sm text-white/80">
                            {settings.jalurUndangan.announcementDate 
                              ? formatDate(settings.jalurUndangan.announcementDate)
                              : '-'}
                          </p>
                        </div>
                      )}

                      {/* Info tambahan */}
                      <div className="text-xs text-white/90 bg-white/10 rounded-xl p-3">
                        <p className="font-medium">Catatan:</p>
                        <p>Keputusan panitia PPDB bersifat final. Peserta yang tidak melakukan daftar ulang dianggap mengundurkan diri.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Contact - Compact Version */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="h-full"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <PhoneIcon className="w-8 h-8 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900">Kontak Admin</h3>
                  </div>

                  <div className="grid gap-3 flex-1">
                    {settings?.contactWhatsapp && (
                      <>
                        {[
                          settings.contactWhatsapp.admin1,
                          settings.contactWhatsapp.admin2,
                          settings.contactWhatsapp.admin3
                        ]
                          .filter(admin => admin?.name && admin?.whatsapp)
                          .map((admin, index) => (
                            <a
                              key={index}
                              href={`https://wa.me/${admin?.whatsapp?.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 
                                     rounded-xl transition-all duration-300 group"
                            >
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center 
                                            justify-center group-hover:scale-110 transition-transform">
                                <PhoneIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{admin?.name}</p>
                                <p className="text-sm text-gray-600">{admin?.whatsapp}</p>
                              </div>
                            </a>
                          ))}
                      </>
                    )}

                    {/* Additional Info */}
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-blue-900">Jam Layanan</p>
                        <p className="text-xs text-blue-700">08.00 - 16.00 WIB</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-blue-900">Hari Kerja</p>
                        <p className="text-xs text-blue-700">Senin - Sabtu</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>
      <FAQSection />

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
            >
              <span className="text-3xl">&times;</span>
            </button>
            
            {/* Image Container with Scrolling */}
            <div className="overflow-y-auto max-h-[90vh] rounded-xl">
              <img 
                src="/images/info/syarat.webp" 
                alt="Persyaratan PPDB"
                className="w-full h-auto object-contain"
                style={{ minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoPPDBSection; 