import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { 
  DocumentArrowDownIcon, 
  PencilSquareIcon, 
  DocumentCheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  AcademicCapIcon,
  UserIcon,
  UserGroupIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import type { PPDBSettings } from '../../types/settings';
import { generateRegistrationCard, generateGraduationLetter } from '../../utils/pdfGenerator';
import { showAlert } from '../ui/Alert';
import { StatusBadge, JalurBadge, SchoolBadge } from './AdminBadges';

import type { PPDBData } from '../../types/ppdb';
export type { PPDBData };

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  onEdit?: (data: PPDBData) => void;
  onForceSubmit?: (data: PPDBData) => void;
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }) + ' WIB';
  } catch (error) {
    return '-';
  }
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  onEdit,
  onForceSubmit
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'orangtua' | 'dokumen' | 'akademik'>('biodata');
  const [ppdbSettings, setPPDBSettings] = useState<PPDBSettings | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('biodata');
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'settings/ppdb');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setPPDBSettings(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading settings in StudentDetailModal:', error);
    }
  };

  if (!selectedData) return null;

  const phoneNum = (selectedData as any).noHp || (selectedData as any).noWa || (selectedData as any).telepon || selectedData.hpAyah || selectedData.hpIbu || '';
  const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
  const waFormatted = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

  const tabs = [
    { id: 'biodata', label: 'Biodata Siswa', icon: UserIcon },
    { id: 'orangtua', label: 'Orang Tua & Wali', icon: UserGroupIcon },
    { id: 'dokumen', label: 'Dokumen Berkas', icon: DocumentTextIcon },
    ...(selectedData.jalur !== 'pjj' ? [{ id: 'akademik', label: 'Nilai Rapor', icon: AcademicCapIcon }] : [])
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="z-[60] overflow-hidden rounded-3xl border border-zinc-200/80 shadow-2xl p-0"
    >
      <div className="flex flex-col h-[580px] sm:h-[620px] max-h-[88vh] bg-white text-zinc-800">
        {/* 1. Modal Hero Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-zinc-50/90 to-white border-b border-zinc-200/80 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Student Avatar & Identity */}
            <div className="flex items-center gap-3.5 min-w-0">
              {selectedData.photo ? (
                <div className="relative group shrink-0">
                  <img
                    src={selectedData.photo}
                    alt={selectedData.namaSiswa}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover border border-zinc-200 shadow-sm"
                  />
                  <a
                    href={selectedData.photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    title="Lihat Foto Asli"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                  {selectedData.namaSiswa ? selectedData.namaSiswa.charAt(0).toUpperCase() : 'S'}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 tracking-tight truncate">
                    {selectedData.namaSiswa || 'Draft Pendaftar'}
                  </h2>
                  <StatusBadge 
                    status={selectedData.status} 
                    adminStatus={selectedData.adminStatus} 
                  />
                  <JalurBadge jalur={selectedData.jalur} />
                  <SchoolBadge school={selectedData.school} />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500 font-medium">
                  {selectedData.registrationNumber && (
                    <span className="font-mono font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded-md border border-zinc-200/60">
                      #{selectedData.registrationNumber}
                    </span>
                  )}
                  <span>NISN: <strong className="text-zinc-700">{selectedData.nisn || '-'}</strong></span>
                  <span>NIK: <strong className="text-zinc-700">{selectedData.nik || '-'}</strong></span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-[11px] text-zinc-400">
                    Daftar: {formatDateTime(selectedData.submittedAt || selectedData.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* WhatsApp Quick Action */}
              {cleanPhone && (
                <a
                  href={`https://wa.me/${waFormatted}?text=Halo%20${encodeURIComponent(selectedData.namaSiswa || '')},%20kami%20dari%20panitia%20SPMB...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  title="Hubungi Calon Siswa via WhatsApp"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}

              {/* Edit Data */}
              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(selectedData);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <PencilSquareIcon className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Edit Data</span>
                </button>
              )}

              {/* Force Submit (if draft) */}
              {selectedData.status === 'draft' && onForceSubmit && (
                <button
                  onClick={() => {
                    onClose();
                    onForceSubmit(selectedData);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <DocumentCheckIcon className="w-4 h-4 text-emerald-300" />
                  <span>Selesaikan Paksa</span>
                </button>
              )}

              {/* Bukti Pendaftaran PDF */}
              <button
                onClick={() => generateRegistrationCard(selectedData as any, showAlert)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                title="Unduh Kartu Bukti Pendaftaran PDF"
              >
                <DocumentArrowDownIcon className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Bukti Daftar</span>
              </button>

              {/* Bukti Lulus PDF (if accepted) */}
              {selectedData.adminStatus === 'diterima' && (
                <button
                  onClick={() => generateGraduationLetter(selectedData as any, showAlert, ppdbSettings)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  title="Unduh Surat Keterangan Kelulusan PDF"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">Surat Lulus</span>
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                title="Tutup Modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Segmented Track Navigation Bar */}
          <div className="flex items-center gap-1.5 p-1 mt-4 bg-zinc-100/90 rounded-2xl border border-zinc-200/60 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={classNames(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
                    isActive
                      ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                      : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  <Icon className={classNames('w-4 h-4', isActive ? 'text-emerald-700' : 'text-zinc-400')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Modal Scrollable Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: BIODATA SISWA */}
          {activeTab === 'biodata' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo & Quick Summary Card */}
              <div className="lg:col-span-1 rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
                <div className="p-4 bg-white rounded-[calc(1rem-0.125rem)] space-y-4 text-center">
                  {selectedData.photo ? (
                    <div className="relative mx-auto w-40 h-52 rounded-2xl overflow-hidden border border-zinc-200 shadow-sm group">
                      <img
                        src={selectedData.photo}
                        alt={selectedData.namaSiswa}
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={selectedData.photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        <span>Buka Ukuran Penuh</span>
                      </a>
                    </div>
                  ) : (
                    <div className="mx-auto w-40 h-52 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <UserIcon className="w-10 h-10 stroke-1" />
                      <span className="text-xs font-medium">Tidak Ada Pas Foto</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-zinc-900">{selectedData.namaSiswa}</h3>
                    <p className="text-xs text-zinc-500 font-medium">{selectedData.email || 'Email belum diisi'}</p>
                  </div>

                  {phoneNum && (
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-center gap-2">
                      <a
                        href={`tel:${phoneNum}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <PhoneIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{phoneNum}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Personal & School Cards */}
              <div className="lg:col-span-2 space-y-4">
                {/* Personal Information Panel */}
                <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
                  <div className="p-4 bg-white rounded-[calc(1rem-0.125rem)] space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                      <IdentificationIcon className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                        Identitas Calon Peserta Didik
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Tempat, Tanggal Lahir</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {selectedData.tempatLahir ? `${selectedData.tempatLahir}, ${new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Jenis Kelamin</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {selectedData.jenisKelamin === 'L' ? 'Laki-laki (L)' : selectedData.jenisKelamin === 'P' ? 'Perempuan (P)' : selectedData.jenisKelamin || '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Susunan Keluarga</span>
                        <span className="text-xs font-bold text-zinc-800">
                          Anak ke-{selectedData.anakKe || '-'} dari {selectedData.jumlahSaudara || '-'} bersaudara
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Kontak Siswa</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {phoneNum || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* School & Address Panel */}
                <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
                  <div className="p-4 bg-white rounded-[calc(1rem-0.125rem)] space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                      <BuildingOfficeIcon className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                        Sekolah Asal & Lokasi Domisili
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Asal Sekolah (SMP/MTs)</span>
                        <span className="text-xs font-bold text-zinc-800">
                          {selectedData.asalSekolah === 'SEKOLAH LAIN'
                            ? (selectedData.asalSekolahManual ? `${selectedData.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN')
                            : selectedData.asalSekolah || '-'}
                        </span>
                      </div>

                      {selectedData.jalur === 'pjj' ? (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Sekolah Mitra PJJ</span>
                          <span className="text-xs font-bold text-emerald-800">
                            {selectedData.pjjSchool || '-'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Kampus Pilihan</span>
                          <span className="text-xs font-bold text-zinc-800">
                            {selectedData.school === 'fajar' ? 'SMAN 10 Fajar Harapan' : 'SMAN Modal Bangsa'}
                          </span>
                        </div>
                      )}

                      {selectedData.adminStatus === 'diterima' && (
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Status Daftar Ulang</span>
                          <span className="text-xs font-bold">
                            {selectedData.reRegistered ? (
                              <span className="text-emerald-700">Sudah ({formatDateTime(selectedData.reRegisteredAt)})</span>
                            ) : (
                              <span className="text-zinc-400">Belum Daftar Ulang</span>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Alamat Domisili</span>
                        <div className="flex items-start gap-1.5 mt-0.5">
                          <MapPinIcon className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-zinc-800 leading-relaxed">
                            {[
                              selectedData.alamat,
                              selectedData.desa ? `Desa/Kel. ${selectedData.desa}` : '',
                              selectedData.kecamatan ? `Kec. ${selectedData.kecamatan}` : '',
                              selectedData.kabupaten,
                              selectedData.provinsi ? `Prov. ${selectedData.provinsi}` : ''
                            ].filter(Boolean).join(', ') || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alasan Memilih Sekolah Panel */}
                <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
                  <div className="p-4 bg-white rounded-[calc(1rem-0.125rem)] space-y-2.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                        Alasan Kuat Memilih Sekolah
                      </h4>
                    </div>

                    <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
                      <p className="text-xs text-zinc-700 italic leading-relaxed whitespace-pre-wrap font-medium">
                        "{selectedData.alasanPilihan || 'Tidak ada catatan alasan memilih sekolah.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA ORANG TUA */}
          {activeTab === 'orangtua' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ayah Card */}
              <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
                <div className="p-5 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shadow-2xs">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">Data Ayah</h4>
                        <p className="text-[10px] text-zinc-400">Informasi orang tua laki-laki</p>
                      </div>
                    </div>
                    {selectedData.hpAyah && (
                      <a
                        href={`https://wa.me/${selectedData.hpAyah.replace(/[^0-9]/g, '')}?text=Halo%20Bapak%20${encodeURIComponent(selectedData.namaAyah || '')}...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shadow-2xs"
                        title="Chat WhatsApp Ayah"
                      >
                        <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Nama Lengkap Ayah</span>
                      <span className="font-bold text-zinc-900 text-sm">{selectedData.namaAyah || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Pekerjaan</span>
                      <span className="font-medium text-zinc-700">{selectedData.pekerjaanAyah || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Instansi / Tempat Kerja</span>
                      <span className="font-medium text-zinc-700">{selectedData.instansiAyah || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Nomor Telepon / WhatsApp</span>
                      {selectedData.hpAyah ? (
                        <a href={`tel:${selectedData.hpAyah}`} className="font-bold text-blue-600 hover:underline">
                          {selectedData.hpAyah}
                        </a>
                      ) : (
                        <span className="font-medium text-zinc-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ibu Card */}
              <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
                <div className="p-5 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100 shadow-2xs">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">Data Ibu</h4>
                        <p className="text-[10px] text-zinc-400">Informasi orang tua perempuan</p>
                      </div>
                    </div>
                    {selectedData.hpIbu && (
                      <a
                        href={`https://wa.me/${selectedData.hpIbu.replace(/[^0-9]/g, '')}?text=Halo%20Ibu%20${encodeURIComponent(selectedData.namaIbu || '')}...`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shadow-2xs"
                        title="Chat WhatsApp Ibu"
                      >
                        <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Nama Lengkap Ibu</span>
                      <span className="font-bold text-zinc-900 text-sm">{selectedData.namaIbu || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Pekerjaan</span>
                      <span className="font-medium text-zinc-700">{selectedData.pekerjaanIbu || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Instansi / Tempat Kerja</span>
                      <span className="font-medium text-zinc-700">{selectedData.instansiIbu || '-'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">Nomor Telepon / WhatsApp</span>
                      {selectedData.hpIbu ? (
                        <a href={`tel:${selectedData.hpIbu}`} className="font-bold text-blue-600 hover:underline">
                          {selectedData.hpIbu}
                        </a>
                      ) : (
                        <span className="font-medium text-zinc-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOKUMEN & BERKAS */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  { label: 'Pas Foto 3x4', key: 'photo', url: selectedData.photo, desc: 'Foto formal calon siswa' },
                  { label: 'Ijazah / SKL SMP', key: 'ijazah', url: selectedData.ijazah, desc: 'Legalisir ijazah SMP/MTs' },
                  { label: 'Kartu Keluarga (KK)', key: 'kartuKeluarga', url: selectedData.kartuKeluarga, desc: 'Dokumen kependudukan keluarga' },
                  { label: 'Akta Kelahiran', key: 'aktaKelahiran', url: selectedData.aktaKelahiran, desc: 'Akta kelahiran resmi calon siswa' },
                  ...(selectedData.jalur === 'prestasi' ? [
                    { label: 'Sertifikat Prestasi', key: 'sertifikat', url: selectedData.sertifikat, desc: 'Bukti juara lomba / olimpiade' }
                  ] : []),
                  ...(selectedData.rekomendasi ? [
                    { label: 'Surat Rekomendasi', key: 'rekomendasi', url: selectedData.rekomendasi, desc: 'Rekomendasi kepala sekolah' }
                  ] : []),
                  ...(selectedData.jalur !== 'pjj' ? [
                    { label: 'Rapor Semester 2', key: 'raport2', url: selectedData.raport2, desc: 'Scan buku rapor semester 2' },
                    { label: 'Rapor Semester 3', key: 'raport3', url: selectedData.raport3, desc: 'Scan buku rapor semester 3' },
                    { label: 'Rapor Semester 4', key: 'raport4', url: selectedData.raport4, desc: 'Scan buku rapor semester 4' }
                  ] : []),
                  ...(selectedData.jalur === 'pjj' ? [
                    { label: 'Lampiran A', key: 'lampiranA', url: selectedData.lampiranA, desc: 'Formulir lampiran A PJJ' },
                    { label: 'Lampiran B', key: 'lampiranB', url: selectedData.lampiranB, desc: 'Formulir lampiran B PJJ' }
                  ] : [])
                ].map(doc => {
                  const hasFile = Boolean(doc.url);
                  return (
                    <div 
                      key={doc.key}
                      className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-colors"
                    >
                      <div className="p-4 bg-white rounded-[calc(1rem-0.125rem)] flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={classNames(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                              hasFile ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                            )}>
                              <DocumentTextIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-xs text-zinc-900">{doc.label}</h5>
                              <p className="text-[10px] text-zinc-400">{doc.desc}</p>
                            </div>
                          </div>
                          <span className={classNames(
                            "px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border",
                            hasFile 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-zinc-50 text-zinc-400 border-zinc-200"
                          )}>
                            {hasFile ? 'Ada' : 'Kosong'}
                          </span>
                        </div>

                        {hasFile ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 w-full py-2 bg-zinc-50 hover:bg-emerald-50 hover:text-emerald-800 text-zinc-700 border border-zinc-200/80 rounded-xl text-xs font-bold transition-colors"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Buka / Unduh Berkas</span>
                          </a>
                        ) : (
                          <div className="py-2 text-center text-zinc-400 text-xs font-medium bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                            Berkas Belum Diunggah
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AKADEMIK / RAPOR */}
          {activeTab === 'akademik' && selectedData.jalur !== 'pjj' && (
            <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 bg-white rounded-[calc(1rem-0.125rem)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                      Matriks Nilai Rapor Semester 2 - 4
                    </h4>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[400px]">
                    <thead>
                      <tr className="bg-zinc-50/90 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                        <th className="px-4 py-2.5">Mata Pelajaran</th>
                        <th className="px-4 py-2.5 text-center">Semester 2</th>
                        <th className="px-4 py-2.5 text-center">Semester 3</th>
                        <th className="px-4 py-2.5 text-center">Semester 4</th>
                        <th className="px-4 py-2.5 text-center">Rata-Rata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs">
                      {[
                        { label: 'Pendidikan Agama', key: 'nilaiAgama' },
                        { label: 'Bahasa Indonesia', key: 'nilaiBindo' },
                        { label: 'Bahasa Inggris', key: 'nilaiBing' },
                        { label: 'Matematika', key: 'nilaiMtk' },
                        { label: 'Ilmu Pengetahuan Alam (IPA)', key: 'nilaiIpa' }
                      ].map(subject => {
                        const v2 = Number(selectedData[`${subject.key}2` as keyof PPDBData]) || 0;
                        const v3 = Number(selectedData[`${subject.key}3` as keyof PPDBData]) || 0;
                        const v4 = Number(selectedData[`${subject.key}4` as keyof PPDBData]) || 0;
                        const count = [v2, v3, v4].filter(v => v > 0).length;
                        const avg = count > 0 ? ((v2 + v3 + v4) / count).toFixed(1) : '-';

                        const getScoreChip = (score: number) => {
                          if (score === 0) return <span className="text-zinc-300">-</span>;
                          return (
                            <span className={classNames(
                              "px-2 py-0.5 rounded-md text-[10px] font-extrabold border shadow-2xs",
                              score >= 85 ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              score >= 75 ? "bg-blue-50 text-blue-800 border-blue-200" :
                              "bg-amber-50 text-amber-800 border-amber-200"
                            )}>
                              {score}
                            </span>
                          );
                        };

                        return (
                          <tr key={subject.key} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-4 py-3 font-bold text-zinc-800">{subject.label}</td>
                            <td className="px-4 py-3 text-center">{getScoreChip(v2)}</td>
                            <td className="px-4 py-3 text-center">{getScoreChip(v3)}</td>
                            <td className="px-4 py-3 text-center">{getScoreChip(v4)}</td>
                            <td className="px-4 py-3 text-center font-bold text-zinc-900">{avg}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer Status */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Terakhir diperbarui: <strong>{formatDateTime(selectedData.lastUpdated || selectedData.createdAt)}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl font-bold text-xs shadow-2xs transition-colors"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentDetailModal;

