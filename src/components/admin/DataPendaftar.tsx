import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { showAlert } from '../ui/Alert';
import { 
  CheckCircleIcon, 
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Tabs from '../ui/Tabs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

type PPDBData = {
  uid: string;
  // Informasi Siswa
  jalur: 'prestasi' | 'reguler' | 'undangan';
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

  // Status dan Metadata
  status: 'pending' | 'diterima' | 'ditolak';
  createdAt: string;
  lastUpdated?: string;
  submittedAt?: string;

  // Files
  rekomendasi?: string;
  raport2?: string;
  raport3?: string;
  raport4?: string;
  photo?: string;
};

const getJalurLabel = (jalur: PPDBData['jalur']) => {
  const labels = {
    prestasi: 'Prestasi',
    reguler: 'Reguler', 
    undangan: 'Undangan'
  };
  return labels[jalur];
};

const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
`;

const DataPendaftar: React.FC = () => {
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'diterima' | 'ditolak'>('all');
  const [jalurFilter, setJalurFilter] = useState<'all' | 'prestasi' | 'reguler' | 'undangan'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = customScrollbarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const loadData = async () => {
    try {
      const ppdbRef = ref(db, 'ppdb');
      const snapshot = await get(ppdbRef);
      
      if (snapshot.exists()) {
        const data = Object.entries(snapshot.val()).map(([uid, value]) => ({
          uid,
          ...(value as Omit<PPDBData, 'uid'>)
        }));
        setPendaftar(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('error', 'Gagal memuat data pendaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'diterima' | 'ditolak') => {
    if (!selectedData || modalLoading) return;

    setModalLoading(true);
    try {
      await update(ref(db, `ppdb/${selectedData.uid}`), {
        status,
        updatedAt: new Date().toISOString()
      });

      showAlert('success', `Status pendaftar berhasil diubah menjadi ${status}`);
      setShowStatusModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      showAlert('error', 'Gagal mengubah status pendaftar');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredData = () => {
    let filtered = [...pendaftar];

    // Filter berdasarkan search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nisn.includes(searchQuery) ||
        item.asalSekolah.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter berdasarkan status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter berdasarkan jalur
    if (jalurFilter !== 'all') {
      filtered = filtered.filter(item => item.jalur === jalurFilter);
    }

    // Sort berdasarkan tanggal
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const headers = ['No', 'Nama', 'NISN', 'Jalur', 'Asal Sekolah', 'Status', 'Tanggal Daftar', 'Aksi'];

  // Tambahkan fungsi export Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Pendaftar PPDB');

      // Styling untuk header
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '4B5563' } },
        alignment: { 
          horizontal: 'center' as const,
          vertical: 'middle' as const 
        },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        }
      };

      // Definisi kolom dengan width yang sesuai
      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'NISN', key: 'nisn', width: 15 },
        { header: 'Nama Lengkap', key: 'namaSiswa', width: 30 },
        { header: 'Jalur', key: 'jalur', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'NIK', key: 'nik', width: 20 },
        { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 },
        { header: 'Tempat Lahir', key: 'tempatLahir', width: 20 },
        { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
        { header: 'Anak Ke', key: 'anakKe', width: 10 },
        { header: 'Jumlah Saudara', key: 'jumlahSaudara', width: 15 },
        { header: 'Alamat', key: 'alamat', width: 40 },
        { header: 'Kecamatan', key: 'kecamatan', width: 20 },
        { header: 'Kabupaten', key: 'kabupaten', width: 20 },
        { header: 'Asal Sekolah', key: 'asalSekolah', width: 30 },
        { header: 'Kabupaten Sekolah', key: 'kabupatenAsalSekolah', width: 20 },
        // Nilai Akademik
        { header: 'Agama Sem 2', key: 'nilaiAgama2', width: 12 },
        { header: 'Agama Sem 3', key: 'nilaiAgama3', width: 12 },
        { header: 'Agama Sem 4', key: 'nilaiAgama4', width: 12 },
        { header: 'B.Indo Sem 2', key: 'nilaiBindo2', width: 12 },
        { header: 'B.Indo Sem 3', key: 'nilaiBindo3', width: 12 },
        { header: 'B.Indo Sem 4', key: 'nilaiBindo4', width: 12 },
        { header: 'B.Ing Sem 2', key: 'nilaiBing2', width: 12 },
        { header: 'B.Ing Sem 3', key: 'nilaiBing3', width: 12 },
        { header: 'B.Ing Sem 4', key: 'nilaiBing4', width: 12 },
        { header: 'MTK Sem 2', key: 'nilaiMtk2', width: 12 },
        { header: 'MTK Sem 3', key: 'nilaiMtk3', width: 12 },
        { header: 'MTK Sem 4', key: 'nilaiMtk4', width: 12 },
        { header: 'IPA Sem 2', key: 'nilaiIpa2', width: 12 },
        { header: 'IPA Sem 3', key: 'nilaiIpa3', width: 12 },
        { header: 'IPA Sem 4', key: 'nilaiIpa4', width: 12 },
        // Data Orang Tua - Ayah
        { header: 'Nama Ayah', key: 'namaAyah', width: 30 },
        { header: 'Pekerjaan Ayah', key: 'pekerjaanAyah', width: 20 },
        { header: 'Instansi Ayah', key: 'instansiAyah', width: 30 },
        { header: 'No HP Ayah', key: 'hpAyah', width: 20 },
        
        // Data Orang Tua - Ibu
        { header: 'Nama Ibu', key: 'namaIbu', width: 30 },
        { header: 'Pekerjaan Ibu', key: 'pekerjaanIbu', width: 20 },
        { header: 'Instansi Ibu', key: 'instansiIbu', width: 30 },
        { header: 'No HP Ibu', key: 'hpIbu', width: 20 },

        // Dokumen (ubah dari link menjadi status ketersediaan)
        { header: 'Surat Rekomendasi', key: 'rekomendasi', width: 20 },
        { header: 'Raport Sem 2', key: 'raport2', width: 20 },
        { header: 'Raport Sem 3', key: 'raport3', width: 20 },
        { header: 'Raport Sem 4', key: 'raport4', width: 20 },
        { header: 'Pas Foto', key: 'photo', width: 20 },

        // Metadata
        { header: 'Tanggal Daftar', key: 'createdAt', width: 20 },
        { header: 'Terakhir Diupdate', key: 'lastUpdated', width: 20 }
      ];

      // Apply header styling
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Freeze panes
      worksheet.views = [
        { 
          state: 'frozen', 
          xSplit: 5, // Freeze sampai kolom status (5 kolom pertama)
          ySplit: 1, 
          activeCell: 'A2' 
        }
      ];

      // Add data
      const data = getFilteredData().map((item, index) => ({
        no: index + 1,
        nisn: item.nisn,
        namaSiswa: item.namaSiswa,
        jalur: getJalurLabel(item.jalur),
        status: item.status.toUpperCase(),
        nik: item.nik,
        jenisKelamin: item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        tempatLahir: item.tempatLahir,
        tanggalLahir: new Date(item.tanggalLahir).toLocaleDateString('id-ID'),
        anakKe: item.anakKe,
        jumlahSaudara: item.jumlahSaudara,
        alamat: item.alamat,
        kecamatan: item.kecamatan,
        kabupaten: item.kabupaten,
        asalSekolah: item.asalSekolah,
        kabupatenAsalSekolah: item.kabupatenAsalSekolah,
        // Nilai Akademik
        nilaiAgama2: item.nilaiAgama2,
        nilaiAgama3: item.nilaiAgama3,
        nilaiAgama4: item.nilaiAgama4,
        nilaiBindo2: item.nilaiBindo2,
        nilaiBindo3: item.nilaiBindo3,
        nilaiBindo4: item.nilaiBindo4,
        nilaiBing2: item.nilaiBing2,
        nilaiBing3: item.nilaiBing3,
        nilaiBing4: item.nilaiBing4,
        nilaiMtk2: item.nilaiMtk2,
        nilaiMtk3: item.nilaiMtk3,
        nilaiMtk4: item.nilaiMtk4,
        nilaiIpa2: item.nilaiIpa2,
        nilaiIpa3: item.nilaiIpa3,
        nilaiIpa4: item.nilaiIpa4,
        // Data Orang Tua - Ayah
        namaAyah: item.namaAyah,
        pekerjaanAyah: item.pekerjaanAyah,
        instansiAyah: item.instansiAyah,
        hpAyah: item.hpAyah,
        
        // Data Orang Tua - Ibu
        namaIbu: item.namaIbu,
        pekerjaanIbu: item.pekerjaanIbu,
        instansiIbu: item.instansiIbu,
        hpIbu: item.hpIbu,

        // Dokumen (ubah dari link menjadi status)
        rekomendasi: item.rekomendasi ? '✓ Ada' : '✗ Tidak Ada',
        raport2: item.raport2 ? '✓ Ada' : '✗ Tidak Ada',
        raport3: item.raport3 ? '✓ Ada' : '✗ Tidak Ada',
        raport4: item.raport4 ? '✓ Ada' : '✗ Tidak Ada',
        photo: item.photo ? '✓ Ada' : '✗ Tidak Ada',

        // Metadata
        createdAt: new Date(item.createdAt).toLocaleString('id-ID'),
        lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('id-ID') : '-'
      }));

      worksheet.addRows(data);

      // Definisikan posisi kolom dokumen di luar loop
      const docColumnStart = 44; // Posisi awal kolom dokumen
      const docColumnEnd = 48;   // Posisi akhir kolom dokumen

      // Style untuk seluruh cell
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' as const },
            left: { style: 'thin' as const },
            bottom: { style: 'thin' as const },
            right: { style: 'thin' as const }
          };
          cell.alignment = { vertical: 'middle' as const };
          
          // Styling untuk status
          if (colNumber === 5 && rowNumber > 1) {
            const status = cell.value as string;
            if (status === 'DITERIMA') {
              cell.fill = { 
                type: 'pattern' as const, 
                pattern: 'solid' as const, 
                fgColor: { argb: 'C6E0B4' } 
              };
            } else if (status === 'DITOLAK') {
              cell.fill = { 
                type: 'pattern' as const, 
                pattern: 'solid' as const, 
                fgColor: { argb: 'FFB6C1' } 
              };
            } else if (status === 'PENDING') {
              cell.fill = { 
                type: 'pattern' as const, 
                pattern: 'solid' as const, 
                fgColor: { argb: 'FFE699' } 
              };
            }
          }

          // Styling untuk kolom dokumen
          if (rowNumber > 1 && colNumber >= docColumnStart && colNumber <= docColumnEnd) {
            const value = cell.value as string;
            if (value.includes('✓')) {
              cell.font = { color: { argb: '008000' } }; // Hijau untuk Ada
            } else if (value.includes('✗')) {
              cell.font = { color: { argb: 'FF0000' } }; // Merah untuk Tidak Ada
            }
            cell.alignment = { 
              vertical: 'middle' as const,
              horizontal: 'center' as const
            };
          }
        });
      });

      // Tambahkan keterangan di bawah tabel
      const lastRow = worksheet.lastRow!.number + 2;
      worksheet.addRow([]);
      worksheet.addRow(['Keterangan:']);
      worksheet.addRow(['1. Status dokumen:']);
      worksheet.addRow(['   - ✓ Ada: Dokumen telah diupload']);
      worksheet.addRow(['   - ✗ Tidak Ada: Dokumen belum diupload']);
      worksheet.addRow(['2. Status pendaftaran ditandai dengan warna:']);
      worksheet.addRow(['   - Hijau: Diterima']);
      worksheet.addRow(['   - Kuning: Pending']);
      worksheet.addRow(['   - Merah: Ditolak']);

      // Style keterangan
      for (let i = lastRow; i < lastRow + 7; i++) {
        const row = worksheet.getRow(i);
        row.font = { size: 10 };
        if (i === lastRow + 1) { // Judul keterangan
          row.font = { bold: true, size: 10 };
        }
      }

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Data_Pendaftar_PPDB_${new Date().toLocaleDateString('id-ID')}.xlsx`);

      showAlert('success', 'Data berhasil diexport ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert('error', 'Gagal mengexport data ke Excel');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Data Pendaftar PPDB</h1>
        <p className="text-gray-600">Kelola data pendaftar PPDB</p>
      </div>

      {/* Filter dan Search */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, NISN, atau sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Status */}
            <div className="relative">
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="diterima">Diterima</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>

            {/* Filter Jalur */}
            <div className="relative">
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={jalurFilter}
                onChange={(e) => setJalurFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">Semua Jalur</option>
                <option value="prestasi">Jalur Prestasi</option>
                <option value="reguler">Jalur Reguler</option>
                <option value="undangan">Jalur Undangan</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
            </div>

            {/* Export to Excel */}
            <div className="flex justify-between items-center mb-4">
              <Button
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export to Excel
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{getFilteredData().length}</span> pendaftar
            </div>
            <div className="text-sm text-yellow-600">
              Pending: <span className="font-semibold">
                {getFilteredData().filter(item => item.status === 'pending').length}
              </span>
            </div>
            <div className="text-sm text-green-600">
              Diterima: <span className="font-semibold">
                {getFilteredData().filter(item => item.status === 'diterima').length}
              </span>
            </div>
            <div className="text-sm text-red-600">
              Ditolak: <span className="font-semibold">
                {getFilteredData().filter(item => item.status === 'ditolak').length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {getFilteredData().length > 0 ? (
          <Table headers={headers} data={getFilteredData().map((item, index) => [
            <span className="text-gray-600">{index + 1}</span>,
            item.namaSiswa,
            item.nisn,
            getJalurLabel(item.jalur),
            item.asalSekolah,
            <Badge key={item.uid} status={item.status} />,
            new Date(item.createdAt).toLocaleDateString('id-ID'),
            <div key={item.uid} className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedData(item);
                  setShowDetailModal(true);
                }}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                title="Lihat Detail"
              >
                <EyeIcon className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => {
                  setSelectedData(item);
                  setShowStatusModal(true);
                }}
                className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                title="Ubah Status"
              >
                <CheckCircleIcon className="w-4 h-4" />
              </Button>
            </div>
          ])} />
        ) : (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data yang sesuai dengan filter
          </div>
        )}
      </Card>

      {/* Modal Detail */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size="xl"
        className="z-[60]"
      >
        <div className="p-6 w-full min-h-[600px]">
          {/* Header Modal */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedData?.namaSiswa}
                </h3>
                <Badge status={selectedData?.status || 'pending'} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">NISN:</span>
                  <span>{selectedData?.nisn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Jalur:</span>
                  <span>{getJalurLabel(selectedData?.jalur || 'reguler')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Terdaftar:</span>
                  <span>{new Date(selectedData?.createdAt || '').toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowStatusModal(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                Ubah Status
              </Button>
              <Button
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Tutup
              </Button>
            </div>
          </div>

          {/* Content */}
          {selectedData && (
            <div className="h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
              <Tabs
                tabs={[
                  {
                    label: "Biodata",
                    content: (
                      <div className="p-4 space-y-6 min-h-[400px]">
                        {/* Foto dan Info Utama */}
                        <div className="flex gap-6">
                          {/* Pas Foto */}
                          <div className="flex-shrink-0">
                            {selectedData.photo ? (
                              <div className="relative group">
                                <div 
                                  className="w-32 h-40 rounded-lg overflow-hidden shadow-lg border border-gray-200 cursor-pointer"
                                  onClick={() => setShowPhotoModal(true)}
                                >
                                  <img 
                                    src={selectedData.photo}
                                    alt="Pas Foto"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => setShowPhotoModal(true)}
                                      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full"
                                      title="Lihat Foto"
                                    >
                                      <EyeIcon className="w-5 h-5" />
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadFile(selectedData.photo!, 'photo.jpg');
                                      }}
                                      className="bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full"
                                      title="Download Foto"
                                    >
                                      <DocumentArrowDownIcon className="w-5 h-5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-32 h-40 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                <p className="text-sm text-gray-500 text-center px-2">
                                  Foto belum diupload
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Info Utama */}
                          <div className="flex-1">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                              <InfoItem label="NIK" value={selectedData.nik} />
                              <InfoItem label="Jenis Kelamin" value={selectedData.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                              <InfoItem 
                                label="Tempat, Tanggal Lahir" 
                                value={`${selectedData.tempatLahir}, ${new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}`}
                              />
                              <InfoItem label="Anak ke / Jumlah Saudara" value={`${selectedData.anakKe} dari ${selectedData.jumlahSaudara}`} />
                            </div>
                          </div>
                        </div>

                        {/* Alamat */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Alamat</h4>
                          <div className="space-y-2">
                            <InfoItem label="Alamat Lengkap" value={selectedData.alamat} />
                            <div className="grid grid-cols-2 gap-4">
                              <InfoItem label="Kecamatan" value={selectedData.kecamatan} />
                              <InfoItem label="Kabupaten" value={selectedData.kabupaten} />
                            </div>
                          </div>
                        </div>

                        {/* Asal Sekolah */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Asal Sekolah</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="Nama Sekolah" value={selectedData.asalSekolah} />
                            <InfoItem label="Kabupaten" value={selectedData.kabupatenAsalSekolah} />
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: "Nilai Akademik",
                    content: (
                      <div className="p-4 min-h-[400px]">
                        {/* Semester */}
                        <div className="grid grid-cols-3 gap-4">
                          {['2', '3', '4'].map((semester) => (
                            <div key={semester} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3">Semester {semester}</h4>
                              <div className="space-y-2">
                                {[
                                  { label: 'Pendidikan Agama', key: `nilaiAgama${semester}` },
                                  { label: 'Bahasa Indonesia', key: `nilaiBindo${semester}` },
                                  { label: 'Bahasa Inggris', key: `nilaiBing${semester}` },
                                  { label: 'Matematika', key: `nilaiMtk${semester}` },
                                  { label: 'IPA', key: `nilaiIpa${semester}` }
                                ].map(({ label, key }) => (
                                  <div key={key} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                                    <span className="text-sm text-gray-600">{label}</span>
                                    <span className="font-medium text-gray-900">{selectedData[key as keyof PPDBData]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Dokumen */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 pb-2 border-b">Dokumen Akademik</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { key: 'raport2', label: 'Raport Semester 2' },
                              { key: 'raport3', label: 'Raport Semester 3' },
                              { key: 'raport4', label: 'Raport Semester 4' },
                              { key: 'rekomendasi', label: 'Surat Rekomendasi' }
                            ].map(({ key, label }) => (
                              selectedData[key as keyof PPDBData] && (
                                <Button
                                  key={key}
                                  onClick={() => handleDownloadFile(selectedData[key as keyof PPDBData] as string, `${key}.pdf`)}
                                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-3 p-4 rounded-lg"
                                >
                                  <DocumentArrowDownIcon className="w-5 h-5 text-blue-500" />
                                  <span>{label}</span>
                                </Button>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: "Data Orang Tua",
                    content: (
                      <div className="p-4 min-h-[400px]">
                        <div className="grid grid-cols-2 gap-6">
                          {[
                            { title: 'Data Ayah', prefix: 'Ayah' },
                            { title: 'Data Ibu', prefix: 'Ibu' }
                          ].map(({ title, prefix }) => (
                            <div key={title} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
                              <div className="space-y-3">
                                <InfoItem 
                                  label="Nama Lengkap" 
                                  value={selectedData[`nama${prefix}` as keyof PPDBData] as string} 
                                />
                                <InfoItem 
                                  label="Pekerjaan" 
                                  value={selectedData[`pekerjaan${prefix}` as keyof PPDBData] as string} 
                                />
                                <InfoItem 
                                  label="Instansi" 
                                  value={selectedData[`instansi${prefix}` as keyof PPDBData] as string} 
                                />
                                <InfoItem 
                                  label="No. HP/WA" 
                                  value={selectedData[`hp${prefix}` as keyof PPDBData] as string} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Update Status */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        className="z-[60]"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ubah Status Pendaftar
            </h3>
            <p className="text-gray-600 mt-2">
              Pendaftar: <span className="font-medium">{selectedData?.namaSiswa}</span>
              <br />
              NISN: <span className="font-medium">{selectedData?.nisn}</span>
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div 
              onClick={() => !modalLoading && handleUpdateStatus('diterima')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                modalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'
              } ${selectedData?.status === 'diterima' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedData?.status === 'diterima' ? 'bg-green-500' : 'border-2 border-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">Terima</p>
                  <p className="text-sm text-gray-500">Pendaftar dinyatakan diterima</p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => !modalLoading && handleUpdateStatus('ditolak')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                modalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
              } ${selectedData?.status === 'ditolak' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedData?.status === 'ditolak' ? 'bg-red-500' : 'border-2 border-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">Tolak</p>
                  <p className="text-sm text-gray-500">Pendaftar dinyatakan tidak diterima</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowStatusModal(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={modalLoading}
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal untuk menampilkan foto besar */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        size="sm"
        className="z-[70]"
      >
        <div className="relative bg-black">
          {/* Tombol close di pojok kanan atas */}
          <button
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          {/* Foto */}
          <div className="flex items-center justify-center">
            <img
              src={selectedData?.photo}
              alt="Pas Foto"
              className="w-full h-auto"
            />
          </div>
          
          {/* Footer dengan nama siswa */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-center font-medium">
              Pas Foto: {selectedData?.namaSiswa}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="font-medium text-gray-900">{value}</p>
  </div>
);

export default DataPendaftar