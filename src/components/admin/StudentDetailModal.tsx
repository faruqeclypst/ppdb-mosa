import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';

export type PPDBData = {
  uid: string;
  school: 'mosa' | 'fajar';
  email: string;
  jalur: 'prestasi' | 'reguler' | 'undangan' | 'pjj';
  pjjSchool?: string;
  namaSiswa: string;
  nik: string;
  nisn: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  anakKe: string;
  jumlahSaudara: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  asalSekolah: string;
  asalSekolahManual?: string;

  nilaiAgama2: string;
  nilaiAgama3: string;
  nilaiAgama4: string;
  nilaiBindo2: string;
  nilaiBindo3: string;
  nilaiBindo4: string;
  nilaiBing2: string;
  nilaiBing3: string;
  nilaiBing4: string;
  nilaiMtk2: string;
  nilaiMtk3: string;
  nilaiMtk4: string;
  nilaiIpa2: string;
  nilaiIpa3: string;
  nilaiIpa4: string;

  namaAyah: string;
  pekerjaanAyah: string;
  instansiAyah: string;
  hpAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  instansiIbu: string;
  hpIbu: string;

  rekomendasi?: string;
  raport2?: string;
  raport3?: string;
  raport4?: string;
  photo?: string;
  sertifikat?: string;
  ijazah?: string;
  kartuKeluarga?: string;
  aktaKelahiran?: string;
  lampiranA?: string;
  lampiranB?: string;

  status: 'pending' | 'submitted' | 'draft';
  adminStatus?: 'diterima' | 'ditolak';
  createdAt: string;
  lastUpdated?: string;
  submittedAt?: string;
  alasanPenolakan?: string;
  registrationNumber?: string;
  reRegistered?: boolean;
  reRegisteredAt?: string;
};

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
}

const getJalurLabel = (jalur: PPDBData['jalur']) => {
  const labels = {
    prestasi: 'Prestasi',
    reguler: 'Reguler', 
    undangan: 'Undangan',
    pjj: 'PJJ'
  };
  return labels[jalur] || jalur;
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  } catch (error) {
    return '-';
  }
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  selectedData
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!selectedData) return null;

  const renderDetailAkademik = () => {
    const semesters = ['2', '3', '4'];
    const mapelList = [
      { label: 'Agama', key: 'nilaiAgama' },
      { label: 'B.Indo', key: 'nilaiBindo' },
      { label: 'B.Ing', key: 'nilaiBing' },
      { label: 'MTK', key: 'nilaiMtk' },
      { label: 'IPA', key: 'nilaiIpa' }
    ];

    const getSafeNumericValue = (value: any) => {
      if (!value || value === '' || value === null || value === undefined) {
        return 0;
      }
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    };

    return (
      <div className="bg-white shadow-sm border rounded-xl p-5 h-auto md:h-[300px] overflow-x-auto">
        <table className="w-full mb-4 min-w-[320px]">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-gray-500 pb-4">Mapel</th>
              {semesters.map(semester => (
                <th key={semester} className="text-center text-sm font-medium text-gray-500 pb-4">
                  Sem {semester}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mapelList.map(({ label, key }) => (
              <tr key={key} className="border-t">
                <td className="py-3 text-sm font-medium text-gray-600">{label}</td>
                {semesters.map(semester => {
                  const fieldKey = `${key}${semester}` as keyof PPDBData;
                  const rawValue = selectedData[fieldKey];
                  const nilai = getSafeNumericValue(rawValue);
                  return (
                    <td key={semester} className="text-center">
                      <span className={classNames(
                        'inline-block px-3 py-1 rounded-full text-sm font-medium',
                        nilai >= 85 ? 'bg-green-100 text-green-700' :
                        nilai > 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      )}>
                        {nilai > 0 ? nilai : '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDetailDokumen = () => {
    const semesters = ['2', '3', '4'];

    if (selectedData.jalur === 'pjj') {
      return (
        <div className={classNames(
          "bg-white shadow-sm border rounded-xl p-5",
          isMobile ? 'h-auto' : 'h-[300px]'
        )}>
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6 h-full'}`}>
            <div className="flex flex-col h-full">
              <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Wajib</h4>
              <div className="space-y-3 flex-1">
                {selectedData.photo && (
                  <a
                    href={selectedData.photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <DocumentArrowDownIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Pas Foto</span>
                  </a>
                )}
                {selectedData.ijazah && (
                  <a
                    href={selectedData.ijazah}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                  >
                    <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <DocumentArrowDownIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs sm:text-sm">FC Ijazah SMP / MTsN</span>
                  </a>
                )}
                {selectedData.kartuKeluarga && (
                  <a
                    href={selectedData.kartuKeluarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                  >
                    <div className="p-1.5 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                      <DocumentArrowDownIcon className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Kartu Keluarga</span>
                  </a>
                )}
                {selectedData.aktaKelahiran && (
                  <a
                    href={selectedData.aktaKelahiran}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                  >
                    <div className="p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <DocumentArrowDownIcon className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Akta Kelahiran</span>
                  </a>
                )}
              </div>
            </div>

            <div className={`${isMobile ? 'mt-4' : ''} flex flex-col h-full`}>
              <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Pendukung</h4>
              <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'space-y-3'} flex-1`}>
                {selectedData.lampiranA && (
                  <a
                    href={selectedData.lampiranA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <DocumentArrowDownIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Lampiran A</span>
                  </a>
                )}
                {selectedData.lampiranB && (
                  <a
                    href={selectedData.lampiranB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <DocumentArrowDownIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Lampiran B</span>
                  </a>
                )}
                {!selectedData.lampiranA && !selectedData.lampiranB && (
                  <span className="text-xs text-gray-500 italic">Tidak ada lampiran pendukung</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={classNames(
        "bg-white shadow-sm border rounded-xl p-5",
        isMobile ? 'h-auto' : 'h-[300px]'
      )}>
        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6 h-full'}`}>
          <div className="flex flex-col h-full">
            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Wajib</h4>
            <div className="space-y-3 flex-1">
              {selectedData.photo && (
                <a
                  href={selectedData.photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                >
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <DocumentArrowDownIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs sm:text-sm">Pas Foto</span>
                </a>
              )}
              {selectedData.rekomendasi && (
                <a
                  href={selectedData.rekomendasi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                >
                  <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <DocumentArrowDownIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs sm:text-sm">Rekom / Prestasi</span>
                </a>
              )}
              {selectedData.jalur === 'prestasi' && selectedData.sertifikat && (
                <a
                  href={selectedData.sertifikat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                >
                  <div className="p-1.5 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <DocumentArrowDownIcon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-xs sm:text-sm">Sertifikat Prestasi</span>
                </a>
              )}
            </div>
          </div>

          <div className={`${isMobile ? 'mt-4' : ''} flex flex-col h-full`}>
            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Raport</h4>
            <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'space-y-3'} flex-1`}>
              {semesters.map((semester) => {
                const raportKey = `raport${semester}` as keyof PPDBData;
                if (selectedData[raportKey]) {
                  return (
                    <a
                      key={semester}
                      href={selectedData[raportKey] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white border hover:bg-gray-50 text-gray-700 flex items-center gap-2 p-2 rounded-lg group"
                    >
                      <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <DocumentArrowDownIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-xs sm:text-sm">Raport Sem {semester}</span>
                    </a>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBiodata = () => (
    <div className={`${isMobile ? 'p-2' : 'p-4'} space-y-4 min-h-[400px]`}>
      <div className={`flex flex-col md:flex-row ${isMobile ? 'gap-4' : 'gap-6'}`}>
        <div className={`${isMobile ? 'flex justify-center' : 'w-32 flex-shrink-0'}`}>
          {selectedData.photo ? (
            <div className="relative group">
              <div className={`${isMobile ? 'w-24 h-32' : 'w-32 h-40'} rounded-lg overflow-hidden border border-gray-200 cursor-pointer`}>
                <img 
                  src={selectedData.photo} 
                  alt="Pas Foto" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <a 
                href={selectedData.photo}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] sm:text-xs font-medium rounded-lg text-center"
              >
                Lihat Ukuran Penuh
              </a>
            </div>
          ) : (
            <div className={`${isMobile ? 'w-24 h-32' : 'w-32 h-40'} rounded-lg bg-gray-150 border border-dashed border-gray-300 flex items-center justify-center`}>
              <span className="text-gray-400 text-xs">No Photo</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">No. Pendaftaran</h4>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedData.registrationNumber || '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">NIK</h4>
              <p className="text-sm text-gray-900 mt-0.5">{selectedData.nik || '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tempat, Tanggal Lahir</h4>
              <p className="text-sm text-gray-900 mt-0.5">
                {selectedData.tempatLahir ? `${selectedData.tempatLahir}, ${new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID')}` : '-'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Jenis Kelamin</h4>
              <p className="text-sm text-gray-900 mt-0.5">{selectedData.jenisKelamin === 'L' ? 'Laki-laki' : selectedData.jenisKelamin === 'P' ? 'Perempuan' : '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Asal Sekolah</h4>
              <p className="text-sm text-gray-900 mt-0.5">
                {selectedData.asalSekolah === 'SEKOLAH LAIN' 
                  ? `${selectedData.asalSekolahManual || 'SEKOLAH LAIN'} (SEKOLAH LAIN)`
                  : selectedData.asalSekolah || '-'
                }
              </p>
            </div>
            {selectedData.jalur === 'pjj' && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sekolah PJJ</h4>
                <p className="text-sm text-gray-900 mt-0.5">{selectedData.pjjSchool || '-'}</p>
              </div>
            )}
            {selectedData.adminStatus === 'diterima' && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daftar Ulang</h4>
                <p className="text-sm font-semibold mt-0.5">
                  {selectedData.reRegistered ? (
                    <span className="text-green-600">Sudah ({formatDateTime(selectedData.reRegisteredAt)})</span>
                  ) : (
                    <span className="text-gray-500">Belum</span>
                  )}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Anak Ke / Saudara</h4>
              <p className="text-sm text-gray-900 mt-0.5">Anak ke-{selectedData.anakKe || '-'} dari {selectedData.jumlahSaudara || '-'} bersaudara</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alamat</h4>
              <p className="text-sm text-gray-900 mt-0.5">
                {selectedData.alamat ? `${selectedData.alamat}, Kec. ${selectedData.kecamatan || '-'}, ${selectedData.kabupaten || '-'}` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-bold text-gray-900 mb-4 text-sm sm:text-base">Data Orang Tua</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4 border">
            <h4 className="font-semibold text-gray-700 text-xs sm:text-sm border-b pb-2 mb-2">Ayah</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Nama:</span> <span className="font-medium">{selectedData.namaAyah || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pekerjaan:</span> <span>{selectedData.pekerjaanAyah || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Instansi:</span> <span>{selectedData.instansiAyah || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">No. HP:</span> <a href={`tel:${selectedData.hpAyah}`} className="text-blue-600 hover:underline">{selectedData.hpAyah || '-'}</a></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border">
            <h4 className="font-semibold text-gray-700 text-xs sm:text-sm border-b pb-2 mb-2">Ibu</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Nama:</span> <span className="font-medium">{selectedData.namaIbu || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pekerjaan:</span> <span>{selectedData.pekerjaanIbu || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Instansi:</span> <span>{selectedData.instansiIbu || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">No. HP:</span> <a href={`tel:${selectedData.hpIbu}`} className="text-blue-600 hover:underline">{selectedData.hpIbu || '-'}</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabsList = [
    { label: "Biodata", mobileLabel: "Biodata", content: renderBiodata() },
    ...(selectedData.jalur !== 'pjj' ? [{ label: "Akademik", mobileLabel: "Akademik", content: renderDetailAkademik() }] : []),
    { label: "Dokumen", mobileLabel: "Dokumen", content: renderDetailDokumen() }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={isMobile ? "full" : "xl"}
      className="z-[60]"
    >
      <div className={`${isMobile ? 'p-4' : 'p-6'} w-full min-h-[550px] relative`}>
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-900`}>
                {selectedData.namaSiswa || 'Draft Pendaftar'}
              </h3>
              {selectedData.adminStatus ? (
                <span className={classNames(
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                  selectedData.adminStatus === 'diterima' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                )}>
                  {selectedData.adminStatus === 'diterima' ? 'Diterima' : 'Ditolak'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                  {selectedData.status === 'draft' ? 'Draft' : 'Pending'}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-xs text-gray-500">
              <span>NISN: {selectedData.nisn || '-'}</span>
              <span>Email: {selectedData.email || '-'}</span>
              <span>Jalur: {getJalurLabel(selectedData.jalur)}</span>
              <span>Registrasi: {formatDateTime(selectedData.submittedAt || selectedData.createdAt)}</span>
            </div>
          </div>
          
          {!isMobile && (
            <Button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-sm rounded-xl border-0"
            >
              Tutup
            </Button>
          )}
        </div>

        <div className={`overflow-y-auto ${isMobile ? 'h-[calc(100vh-180px)] pb-12' : 'max-h-[60vh]'} pr-1`}>
          <Tabs
            tabs={tabsList}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="space-y-4"
          />
        </div>

        {isMobile && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-end">
            <Button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl border-0 font-semibold text-sm"
            >
              Tutup
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StudentDetailModal;
