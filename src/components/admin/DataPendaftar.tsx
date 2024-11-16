import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Switch } from '@headlessui/react';
import { showAlert } from '../ui/Alert';
import Tabs from '../ui/Tabs';

type PPDBData = {
  uid: string;
  // Informasi Siswa
  jalur: string;
  namaSiswa: string;
  nik: string;
  nisn: string;
  email: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  anakKe: string;
  jumlahSaudara: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  kodeKab: string;
  asalSekolah: string;
  kabupatenAsalSekolah: string;

  // Akademik
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

  // Informasi Orang Tua
  namaAyah: string;
  pekerjaanAyah: string;
  instansiAyah: string;
  hpAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  instansiIbu: string;
  hpIbu: string;

  // Files
  rekomendasi?: string;
  raport2?: string;
  raport3?: string;
  raport4?: string;
  photo?: string;

  // Metadata
  status: 'draft' | 'submitted';
  submittedAt: string;
  lastUpdated: string;
};

interface FirebaseAuthResponse {
  email: string;
  requestType: string;
  response: { email: string };
}

const handleResetPassword = async (email: string) => {
  try {
    const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: email,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send reset password email');
    }

    const data: FirebaseAuthResponse = await response.json();
    alert(`Email reset password telah dikirim ke ${data.email}`);
  } catch (error) {
    console.error('Error sending reset password:', error);
    alert('Gagal mengirim email reset password');
  }
};

type DocumentStatus = {
  rekomendasi: boolean;
  raport2: boolean;
  raport3: boolean;
  raport4: boolean;
  photo: boolean;
};

// Pindahkan StatusBadge ke atas sebelum komponen utama
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Diterima':
        return 'bg-green-100 text-green-800';
      case 'Ditolak':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status}
    </span>
  );
};

const DataPendaftar: React.FC = () => {
  const headers = ['No', 'NISN', 'Nama Siswa', 'Jenis Kelamin', 'Tanggal Daftar', 'Status', 'Aksi'];
  
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [documentStatus, setDocumentStatus] = useState<Record<string, DocumentStatus>>({});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        if (snapshot.exists()) {
          const data = Object.entries(snapshot.val()).map(([uid, value]) => ({
            uid,
            ...value as Omit<PPDBData, 'uid'>
          }));
          setPendaftar(data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadDocumentStatus = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const status: Record<string, DocumentStatus> = {};
          
          Object.keys(data).forEach(uid => {
            status[uid] = {
              rekomendasi: data[uid].dokumenValid?.rekomendasi || false,
              raport2: data[uid].dokumenValid?.raport2 || false,
              raport3: data[uid].dokumenValid?.raport3 || false,
              raport4: data[uid].dokumenValid?.raport4 || false,
              photo: data[uid].dokumenValid?.photo || false,
            };
          });
          
          setDocumentStatus(status);
        }
      } catch (error) {
        console.error('Error loading document status:', error);
      }
    };

    loadDocumentStatus();
  }, []);

  // Fungsi untuk mengecek apakah dokumen sudah dicek
  const isDocumentChecked = (uid: string, documentStatus: Record<string, DocumentStatus>) => {
    const status = documentStatus[uid];
    if (!status) return false;
    return Object.values(status).some(value => value === true || value === false);
  };

  // Fungsi untuk mengecek status dokumen
  const checkDocumentStatus = (uid: string, documentStatus: Record<string, DocumentStatus>) => {
    const status = documentStatus[uid];
    if (!status) return 'Belum dicek';
    if (!isDocumentChecked(uid, documentStatus)) return 'Belum dicek';

    const isAllValid = Object.values(status).every(value => value === true);
    const isAnyInvalid = Object.values(status).some(value => value === false);

    if (isAllValid) return 'Diterima';
    if (isAnyInvalid) return 'Ditolak';
    return 'Belum dicek';
  };

  // Filter data berdasarkan status
  const filterDataByStatus = (status: string) => {
    if (status === 'Semua') return pendaftar;
    return pendaftar.filter(p => {
      const currentStatus = checkDocumentStatus(p.uid, documentStatus);
      return currentStatus === status;
    });
  };

  // Render tabel untuk setiap status
  const renderTable = (data: PPDBData[]) => {
    const tableData = data.map((p, index) => [
      index + 1,
      p.nisn,
      p.namaSiswa, 
      p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      new Date(p.submittedAt).toLocaleDateString('id-ID'),
      <StatusBadge key={`status-${p.uid}`} status={checkDocumentStatus(p.uid, documentStatus)} />,
      <Button
        key={p.nisn}
        onClick={() => {
          setSelectedData(p);
          setShowDetailModal(true);
        }}
        className="bg-blue-500 text-white text-sm"
      >
        Detail
      </Button>
    ]);

    return <Table headers={headers} data={tableData} />;
  };

  const tabs = [
    {
      label: `Semua (${pendaftar.length})`,
      content: renderTable(pendaftar)
    },
    {
      label: `Belum Dicek (${filterDataByStatus('Belum dicek').length})`,
      content: renderTable(filterDataByStatus('Belum dicek'))
    },
    {
      label: `Diterima (${filterDataByStatus('Diterima').length})`,
      content: renderTable(filterDataByStatus('Diterima'))
    },
    {
      label: `Ditolak (${filterDataByStatus('Ditolak').length})`,
      content: renderTable(filterDataByStatus('Ditolak'))
    }
  ];

  // Update handleDocumentStatusChange untuk memperbarui status pendaftar
  const handleDocumentStatusChange = async (
    uid: string, 
    document: keyof DocumentStatus, 
    value: boolean
  ) => {
    try {
      await update(ref(db, `ppdb/${uid}/dokumenValid`), {
        [document]: value
      });

      // Update document status
      setDocumentStatus(prev => ({
        ...prev,
        [uid]: {
          ...prev[uid],
          [document]: value
        }
      }));

      // Update status pendaftar berdasarkan validasi dokumen
      const newStatus = {
        ...documentStatus[uid],
        [document]: value
      };
      
      const isAllValid = Object.values(newStatus).every(v => v === true);
      const isAnyInvalid = Object.values(newStatus).some(v => v === false);

      let pendaftarStatus = 'pending';
      if (isAllValid) pendaftarStatus = 'diterima';
      if (isAnyInvalid) pendaftarStatus = 'ditolak';

      await update(ref(db, `ppdb/${uid}`), {
        status: pendaftarStatus,
        lastUpdated: new Date().toISOString()
      });

      showAlert('success', 'Status dokumen berhasil diperbarui');
    } catch (error) {
      showAlert('error', 'Gagal memperbarui status dokumen');
    }
  };

  const renderDetailModal = () => {
    if (!selectedData) return null;

    const DetailCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-5">{children}</div>
      </div>
    );

    const DetailItem = ({ label, value }: { label: string; value: string | number }) => (
      <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
      </div>
    );

    // Helper untuk menghitung rata-rata nilai per semester
    const calculateAverage = (semester: string) => {
      const values = [
        selectedData[`nilaiAgama${semester}` as keyof typeof selectedData],
        selectedData[`nilaiBindo${semester}` as keyof typeof selectedData],
        selectedData[`nilaiBing${semester}` as keyof typeof selectedData], 
        selectedData[`nilaiMtk${semester}` as keyof typeof selectedData],
        selectedData[`nilaiIpa${semester}` as keyof typeof selectedData]
      ].map(v => parseFloat(v as string));
      
      const validValues = values.filter(v => !isNaN(v));
      return validValues.length ? 
        (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2) : 
        '-';
    };

    // Komponen untuk menampilkan nilai per semester
    const SemesterGrades = ({ semester }: { semester: string }) => (
      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-800">Semester {semester}</h4>
          <span className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
            Rata-rata: {calculateAverage(semester)}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Agama', key: `nilaiAgama${semester}` },
            { label: 'B.Indo', key: `nilaiBindo${semester}` },
            { label: 'B.Ing', key: `nilaiBing${semester}` },
            { label: 'MTK', key: `nilaiMtk${semester}` },
            { label: 'IPA', key: `nilaiIpa${semester}` }
          ].map(({ label, key }) => (
            <div key={key} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="font-medium text-gray-800">
                {selectedData[key as keyof typeof selectedData] || '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // Update bagian nilai akademik
    const academicSection = (
      <DetailCard title="Nilai Akademik">
        <div className="space-y-4">
          <SemesterGrades semester="4" />
          <SemesterGrades semester="3" />
          <SemesterGrades semester="2" />
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Rata-rata Keseluruhan</span>
              <span className="text-lg font-semibold text-blue-700">
                {((
                  parseFloat(calculateAverage('2')) + 
                  parseFloat(calculateAverage('3')) + 
                  parseFloat(calculateAverage('4'))
                ) / 3).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </DetailCard>
    );

    const DocumentToggle = ({ 
      document, 
      url, 
      label 
    }: { 
      document: keyof DocumentStatus; 
      url?: string; 
      label: string;
    }) => (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="font-medium text-gray-700">{label}</p>
          {url && (
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Lihat Dokumen
            </a>
          )}
        </div>
        <Switch
          checked={documentStatus[selectedData.uid]?.[document] || false}
          onChange={(checked) => handleDocumentStatusChange(selectedData.uid, document, checked)}
          className={`${
            documentStatus[selectedData.uid]?.[document] ? 'bg-green-600' : 'bg-gray-300'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
        >
          <span className="sr-only">Validasi dokumen</span>
          <span
            className={`${
              documentStatus[selectedData.uid]?.[document] ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>
    );

    // Update bagian dokumen di modal detail
    const documentSection = (
      <DetailCard title="Dokumen">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Kolom 1 */}
            {selectedData.rekomendasi && (
              <DocumentToggle
                document="rekomendasi"
                url={selectedData.rekomendasi}
                label="Surat Rekomendasi"
              />
            )}
            {selectedData.raport2 && (
              <DocumentToggle
                document="raport2"
                url={selectedData.raport2}
                label="Raport Semester 2"
              />
            )}
            {selectedData.raport3 && (
              <DocumentToggle
                document="raport3"
                url={selectedData.raport3}
                label="Raport Semester 3"
              />
            )}
          </div>
          
          <div className="space-y-4">
            {/* Kolom 2 */}
            {selectedData.raport4 && (
              <DocumentToggle
                document="raport4"
                url={selectedData.raport4}
                label="Raport Semester 4"
              />
            )}
            {selectedData.photo && (
              <DocumentToggle
                document="photo"
                url={selectedData.photo}
                label="Pas Foto"
              />
            )}
          </div>
        </div>
      </DetailCard>
    );

    return (
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="full"
      >
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b sticky top-0 z-10">
            <div className="flex justify-between">
              {/* Kolom Kiri - Info Utama */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedData.namaSiswa}
                      </h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Jalur {selectedData.jalur}
                      </span>
                    </div>
                    
                    {/* Grid Info */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {/* Kolom 1 */}
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          <div>
                            <span className="text-gray-500">NIK:</span>
                            <div className="font-medium text-gray-900">{selectedData.nik}</div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">NISN:</span>
                            <div className="font-medium text-gray-900">{selectedData.nisn}</div>
                          </div>
                        </div>
                      </div>

                      {/* Kolom 2 */}
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">TTL:</span>
                            <div className="font-medium text-gray-900">
                              {selectedData.tempatLahir}, {new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div>
                            <span className="text-gray-500">Asal Sekolah:</span>
                            <div className="font-medium text-gray-900">
                              {selectedData.asalSekolah}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kolom 3 */}
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">Terdaftar:</span>
                            <div className="font-medium text-gray-900">
                              {new Date(selectedData.submittedAt).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <div className="font-medium text-green-600">
                              {selectedData.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rata-rata Nilai dan Reset Password */}
                    <div className="mt-4 flex items-center gap-4">
                      <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
                        <span className="text-xs text-blue-600 font-medium">Rata-rata Keseluruhan:</span>
                        <span className="ml-2 text-sm text-blue-700 font-bold">
                          {((
                            parseFloat(calculateAverage('2')) + 
                            parseFloat(calculateAverage('3')) + 
                            parseFloat(calculateAverage('4'))
                          ) / 3).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedData.email) {
                            if (confirm('Kirim email reset password?')) {
                              handleResetPassword(selectedData.email);
                            }
                          } else {
                            alert('Email tidak tersedia');
                          }
                        }}
                        className="px-3 py-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg 
                                  transition-colors flex items-center gap-2 text-xs font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan - Foto */}
              <div className="ml-6">
                <div className="relative">
                  {selectedData.photo ? (
                    <img 
                      src={selectedData.photo} 
                      alt="Pas Foto" 
                      className="w-32 h-40 object-cover rounded-lg shadow-sm border-2 border-white"
                    />
                  ) : (
                    <div className="w-32 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-0 right-0 text-center">
                    <span className="px-2 py-1 bg-white text-xs font-medium text-gray-600 rounded-full shadow-sm border">
                      ID: {selectedData.nisn}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Kolom 1: Informasi Utama */}
              <div className="space-y-6">
                <DetailCard title="Data Pribadi">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <DetailItem label="NIK" value={selectedData.nik} />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <DetailItem label="NISN" value={selectedData.nisn} />
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem 
                        label="Jenis Kelamin" 
                        value={selectedData.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} 
                      />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem 
                        label="Tempat, Tanggal Lahir" 
                        value={`${selectedData.tempatLahir}, ${new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID')}`} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <DetailItem label="Anak ke-" value={selectedData.anakKe} />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <DetailItem label="Jumlah Saudara" value={selectedData.jumlahSaudara} />
                      </div>
                    </div>
                  </div>
                </DetailCard>

                <DetailCard title="Asal Sekolah">
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem label="Nama Sekolah" value={selectedData.asalSekolah} />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem label="Kabupaten" value={selectedData.kabupatenAsalSekolah} />
                    </div>
                  </div>
                </DetailCard>

                <DetailCard title="Status Pendaftaran">
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem 
                        label="Tanggal Daftar" 
                        value={new Date(selectedData.submittedAt).toLocaleString('id-ID')} 
                      />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem 
                        label="Terakhir Diperbarui" 
                        value={new Date(selectedData.lastUpdated).toLocaleString('id-ID')} 
                      />
                    </div>
                  </div>
                </DetailCard>
              </div>

              {/* Kolom 2: Nilai & Dokumen */}
              <div className="space-y-6">
                {academicSection}

                {documentSection}
              </div>

              {/* Kolom 3: Alamat & Orang Tua */}
              <div className="space-y-6">
                <DetailCard title="Alamat">
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <DetailItem label="Alamat Lengkap" value={selectedData.alamat} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <DetailItem label="Kecamatan" value={selectedData.kecamatan} />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <DetailItem label="Kabupaten" value={selectedData.kabupaten} />
                      </div>
                    </div>
                  </div>
                </DetailCard>

                <DetailCard title="Data Orang Tua">
                  <div className="space-y-6">
                    {/* Data Ayah */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Data Ayah</h4>
                      <div className="grid gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <DetailItem label="Nama Lengkap" value={selectedData.namaAyah} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <DetailItem label="Pekerjaan" value={selectedData.pekerjaanAyah} />
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <DetailItem label="Instansi" value={selectedData.instansiAyah} />
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <DetailItem label="No. HP" value={selectedData.hpAyah} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Data Ibu */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-800">Data Ibu</h4>
                      <div className="grid gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <DetailItem label="Nama Lengkap" value={selectedData.namaIbu} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <DetailItem label="Pekerjaan" value={selectedData.pekerjaanIbu} />
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <DetailItem label="Instansi" value={selectedData.instansiIbu} />
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <DetailItem label="No. HP" value={selectedData.hpIbu} />
                        </div>
                      </div>
                    </div>
                  </div>
                </DetailCard>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end sticky bottom-0">
            <Button
              onClick={() => setShowDetailModal(false)}
              className="bg-white text-gray-700 border shadow-sm hover:bg-gray-50"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Data Pendaftar</h1>
          <div className="flex items-center space-x-4">
            {/* Tambahkan fitur filter/search di sini */}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {renderDetailModal()}
    </div>
  );
};

export default DataPendaftar; 