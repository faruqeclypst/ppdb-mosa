import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

type PPDBData = {
  // Informasi Siswa
  jalur: string;
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

const DataPendaftar: React.FC = () => {
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ppdbRef = ref(db, 'ppdb');
        const snapshot = await get(ppdbRef);
        if (snapshot.exists()) {
          const data = Object.values(snapshot.val()) as PPDBData[];
          setPendaftar(data.filter(d => d.status === 'submitted'));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const headers = ['NISN', 'Nama Siswa', 'Jenis Kelamin', 'Tanggal Daftar', 'Aksi'];

  const data = pendaftar.map(p => [
    p.nisn,
    p.namaSiswa,
    p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
    new Date(p.submittedAt).toLocaleDateString('id-ID'),
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

    return (
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="full"
      >
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedData.namaSiswa}
                </h2>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    NISN: {selectedData.nisn} • Terdaftar: {new Date(selectedData.submittedAt).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Lahir: {selectedData.tempatLahir}, {new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Asal Sekolah: {selectedData.asalSekolah}, {selectedData.kabupatenAsalSekolah}
                  </p>
                </div>
              </div>
              {selectedData.photo && (
                <img 
                  src={selectedData.photo} 
                  alt="Pas Foto" 
                  className="w-24 h-32 object-cover rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Kolom 1: Data Pribadi & Alamat */}
              <div className="space-y-6">
                <DetailCard title="Data Pribadi">
                  <div className="space-y-3">
                    <DetailItem label="NIK" value={selectedData.nik} />
                    <DetailItem label="NISN" value={selectedData.nisn} />
                    <DetailItem 
                      label="Jenis Kelamin" 
                      value={selectedData.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} 
                    />
                    <DetailItem 
                      label="TTL" 
                      value={`${selectedData.tempatLahir}, ${new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID')}`} 
                    />
                    <DetailItem label="Anak ke-" value={selectedData.anakKe} />
                    <DetailItem label="Jumlah Saudara" value={selectedData.jumlahSaudara} />
                  </div>
                </DetailCard>

                <DetailCard title="Alamat">
                  <div className="space-y-3">
                    <DetailItem label="Alamat Lengkap" value={selectedData.alamat} />
                    <DetailItem label="Kecamatan" value={selectedData.kecamatan} />
                    <DetailItem label="Kabupaten" value={selectedData.kabupaten} />
                  </div>
                </DetailCard>

                <DetailCard title="Asal Sekolah">
                  <div className="space-y-3">
                    <DetailItem label="Nama Sekolah" value={selectedData.asalSekolah} />
                    <DetailItem label="Kabupaten" value={selectedData.kabupatenAsalSekolah} />
                  </div>
                </DetailCard>
              </div>

              {/* Kolom 2: Nilai Akademik */}
              <div className="space-y-6">
                <DetailCard title="Nilai Akademik">
                  <div className="space-y-6">
                    {/* Semester 2 */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Semester 2</h4>
                      <div className="grid grid-cols-5 gap-4">
                        <DetailItem 
                          label="Agama" 
                          value={selectedData[`nilaiAgama2` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="B. Indonesia" 
                          value={selectedData[`nilaiBindo2` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="B. Inggris" 
                          value={selectedData[`nilaiBing2` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="Matematika" 
                          value={selectedData[`nilaiMtk2` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="IPA" 
                          value={selectedData[`nilaiIpa2` as keyof typeof selectedData] || '-'} 
                        />
                      </div>
                    </div>

                    {/* Semester 3 */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Semester 3</h4>
                      <div className="grid grid-cols-5 gap-4">
                        <DetailItem 
                          label="Agama" 
                          value={selectedData[`nilaiAgama3` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="B. Indonesia" 
                          value={selectedData[`nilaiBindo3` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="B. Inggris" 
                          value={selectedData[`nilaiBing3` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="Matematika" 
                          value={selectedData[`nilaiMtk3` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="IPA" 
                          value={selectedData[`nilaiIpa3` as keyof typeof selectedData] || '-'} 
                        />
                      </div>
                    </div>

                    {/* Semester 4 */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Semester 4</h4>
                      <div className="grid grid-cols-5 gap-4">
                        <DetailItem 
                          label="Agama" 
                          value={selectedData[`nilaiAgama4` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="B. Indonesia" 
                          value={selectedData[`nilaiBindo4` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="B. Inggris" 
                          value={selectedData[`nilaiBing4` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="Matematika" 
                          value={selectedData[`nilaiMtk4` as keyof typeof selectedData] || '-'} 
                        />
                        <DetailItem 
                          label="IPA" 
                          value={selectedData[`nilaiIpa4` as keyof typeof selectedData] || '-'} 
                        />
                      </div>
                    </div>
                  </div>
                </DetailCard>
              </div>

              {/* Kolom 3: Data Orang Tua & Dokumen */}
              <div className="space-y-6">
                <DetailCard title="Data Orang Tua">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Data Ayah</h4>
                      <div className="space-y-2">
                        <DetailItem label="Nama Lengkap" value={selectedData.namaAyah} />
                        <DetailItem label="Pekerjaan" value={selectedData.pekerjaanAyah} />
                        <DetailItem label="Instansi" value={selectedData.instansiAyah} />
                        <DetailItem label="No. HP" value={selectedData.hpAyah} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Data Ibu</h4>
                      <div className="space-y-2">
                        <DetailItem label="Nama Lengkap" value={selectedData.namaIbu} />
                        <DetailItem label="Pekerjaan" value={selectedData.pekerjaanIbu} />
                        <DetailItem label="Instansi" value={selectedData.instansiIbu} />
                        <DetailItem label="No. HP" value={selectedData.hpIbu} />
                      </div>
                    </div>
                  </div>
                </DetailCard>

                <DetailCard title="Dokumen">
                  <div className="space-y-3">
                    {[
                      { key: 'rekomendasi', label: 'Surat Rekomendasi' },
                      { key: 'raport2', label: 'Raport Semester 2' },
                      { key: 'raport3', label: 'Raport Semester 3' },
                      { key: 'raport4', label: 'Raport Semester 4' }
                    ].map(({ key, label }) => (
                      selectedData[key as keyof typeof selectedData] && (
                        <a 
                          key={key}
                          href={selectedData[key as keyof typeof selectedData] as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                          <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )
                    ))}
                  </div>
                </DetailCard>

                <DetailCard title="Status Pendaftaran">
                  <div className="space-y-3">
                    <DetailItem 
                      label="Tanggal Daftar" 
                      value={new Date(selectedData.submittedAt).toLocaleString('id-ID')} 
                    />
                    <DetailItem 
                      label="Terakhir Diperbarui" 
                      value={new Date(selectedData.lastUpdated).toLocaleString('id-ID')} 
                    />
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
        <Table headers={headers} data={data} />
      </div>

      {renderDetailModal()}
    </div>
  );
};

export default DataPendaftar; 