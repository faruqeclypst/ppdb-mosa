import React, { useState, useEffect } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { showAlert } from '../ui/Alert';
import { 
  CheckCircleIcon, 
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  XCircleIcon,
  ChevronDownIcon,
  TrashIcon,
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Tabs from '../ui/Tabs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';

type PPDBData = {
  uid: string;
  email: string;
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
  nilaiAgama5: string;
  nilaiBindo2: string;
  nilaiBindo3: string;
  nilaiBindo4: string;
  nilaiBindo5: string;
  nilaiBing2: string;
  nilaiBing3: string;
  nilaiBing4: string;
  nilaiBing5: string;
  nilaiMtk2: string;
  nilaiMtk3: string;
  nilaiMtk4: string;
  nilaiMtk5: string;
  nilaiIpa2: string;
  nilaiIpa3: string;
  nilaiIpa4: string;
  nilaiIpa5: string;

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
  raport5?: string;
  photo?: string;
  sertifikat?: string;

  // Status dan Metadata
  status: 'pending' | 'submitted' | 'draft';
  adminStatus?: 'diterima' | 'ditolak';
  createdAt: string;
  lastUpdated?: string;
  submittedAt?: string;
  alasanPenolakan?: string;
};

type BadgeProps = {
  status: PPDBData['status'];
  adminStatus?: PPDBData['adminStatus'];
  className?: string;
};

const StatusBadge: React.FC<BadgeProps> = ({ status, adminStatus, className }) => {
  const getStatusLabel = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' ? 'Diterima' : 'Ditolak';
    }

    switch (status) {
      case 'pending':
        return 'Draft';
      case 'submitted':
        return 'Pending';
      case 'draft':
        return 'Reset'; // Ubah label draft menjadi reset
      default:
        return status;
    }
  };

  const getStatusColor = (status: PPDBData['status'], adminStatus?: PPDBData['adminStatus']) => {
    if (adminStatus) {
      return adminStatus === 'diterima' 
        ? 'text-green-600 bg-green-50'
        : 'text-red-600 bg-red-50';
    }

    switch (status) {
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      case 'submitted':
        return 'text-yellow-600 bg-yellow-50';
      case 'draft':
        return 'text-purple-600 bg-purple-50'; // Ubah warna untuk status reset
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-1 rounded-full text-sm font-medium',
      getStatusColor(status, adminStatus),
      className
    )}>
      {getStatusLabel(status, adminStatus)}
    </span>
  );
};

const getJalurLabel = (jalur: PPDBData['jalur']) => {
  const labels = {
    prestasi: 'Prestasi',
    reguler: 'Reguler', 
    undangan: 'Undangan'
  };
  return labels[jalur];
};

// Update customScrollbarStyles
const customScrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: none;  /* Firefox */
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
  }
  .custom-scrollbar::-webkit-scrollbar {
    display: none; /* WebKit */
  }
`;

// Tambahkan tipe untuk sorting
type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

// Tambahkan komponen JalurBadge
const JalurBadge: React.FC<{ jalur: PPDBData['jalur'] }> = ({ jalur }) => {
  const getJalurColor = (jalur: PPDBData['jalur']) => {
    switch (jalur) {
      case 'prestasi':
        return 'text-blue-600 bg-blue-50';
      case 'reguler':
        return 'text-green-600 bg-green-50';
      case 'undangan':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <span className={classNames(
      'px-2 py-1 rounded-full text-sm font-medium',
      getJalurColor(jalur)
    )}>
      {getJalurLabel(jalur)}
    </span>
  );
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Jumlah item per halaman
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'diterima' | 'ditolak' | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

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
        const data = Object.entries(snapshot.val())
          .map(([uid, value]) => ({
            uid,
            ...(value as Omit<PPDBData, 'uid'>)
          }))
          .filter(entry => entry.submittedAt); // Only include entries that have been submitted
        setPendaftar(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('error', 'Gagal memuat data pendaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'diterima' | 'ditolak', alasanPenolakan?: string) => {
    if (!selectedData || modalLoading) return;

    // Validasi alasan penolakan
    if (status === 'ditolak' && !alasanPenolakan?.trim()) {
      showAlert('error', 'Mohon isi alasan penolakan');
      return;
    }

    setModalLoading(true);
    try {
      // Jika status draft/reset, ubah juga status menjadi submitted
      const updateData: any = {
        adminStatus: status,
        alasanPenolakan: status === 'ditolak' ? alasanPenolakan : null,
        updatedAt: new Date().toISOString()
      };

      // Jika status masih draft (setelah reset), ubah menjadi submitted
      if (selectedData.status === 'draft') {
        updateData.status = 'submitted';
        updateData.wasReset = false; // Hapus flag wasReset
        updateData.submittedAt = new Date().toISOString();
      }

      await update(ref(db, `ppdb/${selectedData.uid}`), updateData);

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
      filtered = filtered.filter(item => {
        if (statusFilter === 'pending') {
          return item.status === 'submitted' && !item.adminStatus;
        }
        return item.adminStatus === statusFilter;
      });
    }

    // Filter berdasarkan jalur
    if (jalurFilter !== 'all') {
      filtered = filtered.filter(item => item.jalur === jalurFilter);
    }

    // Terapkan sorting dari sortConfig
    if (sortConfig) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'namaSiswa') {
          return sortConfig.direction === 'asc' 
            ? a.namaSiswa.localeCompare(b.namaSiswa)
            : b.namaSiswa.localeCompare(a.namaSiswa);
        }
        if (sortConfig.key === 'nisn') {
          return sortConfig.direction === 'asc'
            ? a.nisn.localeCompare(b.nisn)
            : b.nisn.localeCompare(a.nisn);
        }
        if (sortConfig.key === 'jalur') {
          return sortConfig.direction === 'asc'
            ? a.jalur.localeCompare(b.jalur)
            : b.jalur.localeCompare(a.jalur);
        }
        if (sortConfig.key === 'asalSekolah') {
          return sortConfig.direction === 'asc'
            ? a.asalSekolah.localeCompare(b.asalSekolah)
            : b.asalSekolah.localeCompare(a.asalSekolah);
        }
        if (sortConfig.key === 'status') {
          return sortConfig.direction === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        if (sortConfig.key === 'submittedAt') {
          return sortConfig.direction === 'asc'
            ? new Date(a.submittedAt || a.createdAt).getTime() - new Date(b.submittedAt || b.createdAt).getTime()
            : new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime();
        }
        return 0;
      });
    } else {
      // Sort default berdasarkan tanggal submit
      filtered.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt).getTime();
        const dateB = new Date(b.submittedAt || b.createdAt).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
    }

    return filtered;
  };

  // Tambahkan fungsi untuk sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Modifikasi headers untuk menambahkan sorting
  const headers = [
    { label: 'No', key: '' },
    { label: 'Nama', key: 'namaSiswa' },
    { label: 'NISN', key: 'nisn' },
    { label: 'Jalur', key: 'jalur' },
    { label: 'Asal Sekolah', key: 'asalSekolah' },
    { label: 'Status', key: 'status' },
    { label: 'Tanggal Daftar PPDB', key: 'submittedAt' },
    { label: 'Aksi', key: '' }
  ];

  // Tambahkan fungsi export Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Pisahkan data berdasarkan jalur
      const allData = getFilteredData();
      const dataPrestasi = allData.filter(item => item.jalur === 'prestasi');
      const dataReguler = allData.filter(item => item.jalur === 'reguler');
      const dataUndangan = allData.filter(item => item.jalur === 'undangan');

      // Fungsi helper untuk setup worksheet
      const setupWorksheet = (name: string, data: PPDBData[]) => {
        const worksheet = workbook.addWorksheet(name);

        // Styling untuk header
        const headerStyle = {
          font: { bold: true, color: { argb: 'FFFFFF' } },
          fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '4B5563' } },
          alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
          border: {
            top: { style: 'thin' as const },
            left: { style: 'thin' as const },
            bottom: { style: 'thin' as const },
            right: { style: 'thin' as const }
          }
        };

        // Definisi kolom dengan width yang lebih proporsional
        worksheet.columns = [
          { header: 'No', key: 'no', width: 5 },
          { header: 'NISN', key: 'nisn', width: 15 },
          { header: 'Nama Lengkap', key: 'namaSiswa', width: 40 },
          { header: 'Email', key: 'email', width: 35 }, // Tambah kolom email
          { header: 'Jalur', key: 'jalur', width: 15 },
          { header: 'Status Keputusan', key: 'adminStatus', width: 18 },
          { header: 'Alasan Penolakan', key: 'alasanPenolakan', width: 50 },
          { header: 'NIK', key: 'nik', width: 20 },
          { header: 'Jenis Kelamin', key: 'jenisKelamin', width: 15 },
          { header: 'Tempat Lahir', key: 'tempatLahir', width: 30 },
          { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 15 },
          { header: 'Anak Ke', key: 'anakKe', width: 10 },
          { header: 'Jumlah Saudara', key: 'jumlahSaudara', width: 18 },
          { header: 'Alamat', key: 'alamat', width: 50 },
          { header: 'Kecamatan', key: 'kecamatan', width: 25 },
          { header: 'Kabupaten', key: 'kabupaten', width: 25 },
          { header: 'Asal Sekolah', key: 'asalSekolah', width: 40 },
          { header: 'Kabupaten Sekolah', key: 'kabupatenAsalSekolah', width: 25 },
          // Nilai Akademik - Seragamkan lebar kolom nilai
          { header: 'Agama Sem 2', key: 'nilaiAgama2', width: 14 },
          { header: 'Agama Sem 3', key: 'nilaiAgama3', width: 14 },
          { header: 'Agama Sem 4', key: 'nilaiAgama4', width: 14 },
          { header: 'B.Indo Sem 2', key: 'nilaiBindo2', width: 14 },
          { header: 'B.Indo Sem 3', key: 'nilaiBindo3', width: 14 },
          { header: 'B.Indo Sem 4', key: 'nilaiBindo4', width: 14 },
          { header: 'B.Ing Sem 2', key: 'nilaiBing2', width: 14 },
          { header: 'B.Ing Sem 3', key: 'nilaiBing3', width: 14 },
          { header: 'B.Ing Sem 4', key: 'nilaiBing4', width: 14 },
          { header: 'MTK Sem 2', key: 'nilaiMtk2', width: 14 },
          { header: 'MTK Sem 3', key: 'nilaiMtk3', width: 14 },
          { header: 'MTK Sem 4', key: 'nilaiMtk4', width: 14 },
          { header: 'IPA Sem 2', key: 'nilaiIpa2', width: 14 },
          { header: 'IPA Sem 3', key: 'nilaiIpa3', width: 14 },
          { header: 'IPA Sem 4', key: 'nilaiIpa4', width: 14 },
          // Data Orang Tua
          { header: 'Nama Ayah', key: 'namaAyah', width: 40 },
          { header: 'Pekerjaan Ayah', key: 'pekerjaanAyah', width: 30 },
          { header: 'Instansi Ayah', key: 'instansiAyah', width: 40 },
          { header: 'No HP Ayah', key: 'hpAyah', width: 18 },
          { header: 'Nama Ibu', key: 'namaIbu', width: 40 },
          { header: 'Pekerjaan Ibu', key: 'pekerjaanIbu', width: 30 },
          { header: 'Instansi Ibu', key: 'instansiIbu', width: 40 },
          { header: 'No HP Ibu', key: 'hpIbu', width: 18 },
          // Dokumen
          { header: 'Foto', key: 'photo', width: 15 },
          { header: 'Rekomendasi', key: 'rekomendasi', width: 15 },
          { header: 'Raport 2', key: 'raport2', width: 15 },
          { header: 'Raport 3', key: 'raport3', width: 15 },
          { header: 'Raport 4', key: 'raport4', width: 15 },
          // Metadata
          { header: 'Tanggal Daftar', key: 'createdAt', width: 20 },
          { header: 'Terakhir Diupdate', key: 'lastUpdated', width: 20 }
        ];

        // Apply header styling
        worksheet.getRow(1).eachCell((cell) => {
          cell.style = headerStyle;
        });

        // Freeze panes
        worksheet.views = [{ 
          state: 'frozen', 
          xSplit: 6, // Update dari 5 ke 6 untuk mencakup kolom email
          ySplit: 1, 
          activeCell: 'A2' 
        }];

        // Add data dengan format dokumen yang disingkat dan link aktif
        const rowData = data.map((item, index) => ({
          no: index + 1,
          nisn: item.nisn,
          namaSiswa: item.namaSiswa,
          email: item.email, // Tambah email
          jalur: item.jalur.charAt(0).toUpperCase() + item.jalur.slice(1),
          // Format status keputusan admin
          adminStatus: item.adminStatus ? 
                      item.adminStatus === 'diterima' ? 'DITERIMA' : 'DITOLAK' : 
                      'PENDING',
          // Tambahkan alasan penolakan
          alasanPenolakan: item.alasanPenolakan || '-',
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
          // Data Orang Tua
          namaAyah: item.namaAyah,
          pekerjaanAyah: item.pekerjaanAyah,
          instansiAyah: item.instansiAyah,
          hpAyah: item.hpAyah,
          namaIbu: item.namaIbu,
          pekerjaanIbu: item.pekerjaanIbu,
          instansiIbu: item.instansiIbu,
          hpIbu: item.hpIbu,
          // Dokumen dengan link aktif
          photo: {
            text: item.photo ? 'Lihat Dokumen' : '-',
            hyperlink: item.photo || '',
            tooltip: 'Klik untuk melihat dokumen'
          },
          rekomendasi: {
            text: item.rekomendasi ? 'Lihat Dokumen' : '-',
            hyperlink: item.rekomendasi || '',
            tooltip: 'Klik untuk melihat dokumen'
          },
          raport2: {
            text: item.raport2 ? 'Lihat Dokumen' : '-',
            hyperlink: item.raport2 || '',
            tooltip: 'Klik untuk melihat dokumen'
          },
          raport3: {
            text: item.raport3 ? 'Lihat Dokumen' : '-',
            hyperlink: item.raport3 || '',
            tooltip: 'Klik untuk melihat dokumen'
          },
          raport4: {
            text: item.raport4 ? 'Lihat Dokumen' : '-',
            hyperlink: item.raport4 || '',
            tooltip: 'Klik untuk melihat dokumen'
          },
          // Metadata
          createdAt: new Date(item.createdAt).toLocaleString('id-ID'),
          lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('id-ID') : '-'
        }));

        worksheet.addRows(rowData);

        // Style untuk seluruh cell
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header row
            row.eachCell((cell, colNumber) => {
              cell.border = {
                top: { style: 'thin' as const },
                left: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                right: { style: 'thin' as const }
              };

              // Default alignment
              cell.alignment = { vertical: 'middle' as const };

              // Center alignment untuk kolom tertentu
              const centerColumns = [
                1,  // No
                5,  // Jalur
                6,  // Status Keputusan
                9,  // Jenis Kelamin
                12, // Anak Ke
                13, // Jumlah Saudara
                // Nilai semester (19-33)
                ...Array.from({length: 15}, (_, i) => i + 19),
                // Dokumen (44-48)
                44, // Foto
                45, // Rekomendasi
                46, // Raport 2
                47, // Raport 3
                48  // Raport 4
              ];

              if (centerColumns.includes(colNumber)) {
                cell.alignment = {
                  vertical: 'middle' as const,
                  horizontal: 'center' as const
                };
              }

              // Style untuk jalur (kolom 5)
              if (colNumber === 5) {
                const jalurValue = cell.value as string;
                if (jalurValue === 'Prestasi') {
                  cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'DBEAFE' } }; // Light blue
                  cell.font = { color: { argb: '1E40AF' }, bold: true }; // Dark blue + bold
                } else if (jalurValue === 'Reguler') {
                  cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'DCFCE7' } }; // Light green
                  cell.font = { color: { argb: '166534' }, bold: true }; // Dark green + bold
                } else if (jalurValue === 'Undangan') {
                  cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'F3E8FF' } }; // Light purple
                  cell.font = { color: { argb: '6B21A8' }, bold: true }; // Dark purple + bold
                }
              }

              // Style untuk status admin (kolom 6)
              if (colNumber === 6) {
                const statusValue = cell.value as string;
                if (statusValue === 'DITERIMA') {
                  cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'DCFCE7' } }; // Light green
                  cell.font = { color: { argb: '166534' }, bold: true }; // Dark green
                } else if (statusValue === 'DITOLAK') {
                  cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FEE2E2' } }; // Light red
                  cell.font = { color: { argb: 'B91C1C' }, bold: true }; // Dark red
                } else if (statusValue === 'PENDING') {
                  cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FEF3C7' } }; // Light yellow
                  cell.font = { color: { argb: 'B45309' }, bold: true }; // Dark yellow
                }
              }

              // Style untuk alasan penolakan (kolom 7)
              if (colNumber === 7) {
                cell.alignment = { 
                  vertical: 'middle' as const,
                  wrapText: true // Enable text wrapping
                };
              }

              // Style untuk dokumen
              if (colNumber >= 44 && colNumber <= 48) {
                const cellValue = cell.value as any;
                if (cellValue && typeof cellValue === 'object' && 'hyperlink' in cellValue) {
                  cell.font = { 
                    color: { argb: '0000FF' }, 
                    underline: true 
                  };
                }
              }
            });
          }
        });

        // Add summary at the bottom
        const lastRow = worksheet.lastRow!.number + 2;
        worksheet.addRow(['Total Data:', data.length]);
        worksheet.getRow(lastRow).font = { bold: true };
      };

      // Setup worksheet untuk semua jalur
      setupWorksheet('Semua Jalur', allData);
      setupWorksheet('Jalur Prestasi', dataPrestasi);
      setupWorksheet('Jalur Reguler', dataReguler);
      setupWorksheet('Jalur Undangan', dataUndangan);

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `Data_Pendaftar_PPDB_${new Date().toLocaleDateString('id-ID')}.xlsx`);

      showAlert('success', 'Data berhasil diexport ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert('error', 'Gagal mengexport data ke Excel');
    }
  };

  const renderDetailAkademik = (data: PPDBData) => {
    const semesters = ['2', '3', '4'];

    const mapelList = [
      { label: 'Agama', key: 'nilaiAgama' },
      { label: 'B.Indo', key: 'nilaiBindo' },
      { label: 'B.Ing', key: 'nilaiBing' },
      { label: 'MTK', key: 'nilaiMtk' },
      { label: 'IPA', key: 'nilaiIpa' }
    ];

    return (
      <div className="bg-white shadow-sm border rounded-xl p-5 h-[300px]"> {/* Sesuaikan padding */}
        <table className="w-full mb-4"> {/* Tambah margin bottom */}
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-gray-500 pb-4">Mapel</th> {/* Sesuaikan padding */}
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
                <td className="py-3 text-sm font-medium text-gray-600">{label}</td> {/* Sesuaikan padding */}
                {semesters.map(semester => {
                  const nilai = Number(data[`${key}${semester}` as keyof PPDBData]);
                  return (
                    <td key={semester} className="text-center">
                      <span className={classNames(
                        'inline-block px-3 py-1 rounded-full text-sm font-medium',
                        nilai >= 83
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}>
                        {nilai}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-auto pt-2"> {/* Gunakan mt-auto untuk posisi bottom */}
          <span className="text-sm text-gray-500">
            Nilai Minimum: <span className="font-medium text-gray-700">83</span>
          </span>
        </div>
      </div>
    );
  };

  const renderDetailDokumen = (data: PPDBData) => {
    const semesters = ['2', '3', '4'];

    return (
      <div className={classNames(
        "bg-white shadow-sm border rounded-xl p-5", // Sesuaikan padding
        isMobile() ? 'h-auto' : 'h-[300px]'
      )}>
        <div className={`${isMobile() ? 'space-y-4' : 'grid grid-cols-2 gap-6 h-full'}`}> {/* Sesuaikan gap */}
          {/* Kolom 1: Dokumen Wajib */}
          <div className="flex flex-col h-full">
            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Wajib</h4> {/* Sesuaikan margin */}
            <div className="space-y-3 flex-1"> {/* Sesuaikan spacing */}
              {data.photo && (
                <a
                  href={data.photo}
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
              {data.rekomendasi && (
                <a
                  href={data.rekomendasi}
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
              {data.jalur === 'prestasi' && data.sertifikat && (
                <a
                  href={data.sertifikat}
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

          {/* Kolom 2: Dokumen Raport */}
          <div className={`${isMobile() ? 'mt-4' : ''} flex flex-col h-full`}>
            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Raport</h4> {/* Sesuaikan margin */}
            <div className={`${isMobile() ? 'grid grid-cols-2 gap-3' : 'space-y-3'} flex-1`}> {/* Sesuaikan spacing */}
              {semesters.map((semester) => {
                const raportKey = `raport${semester}` as keyof PPDBData;
                if (data[raportKey]) {
                  return (
                    <a
                      key={semester}
                      href={data[raportKey] as string}
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

  // Fungsi untuk mendapatkan data yang sudah dipaginasi
  const getPaginatedData = () => {
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  // Fungsi untuk mendapatkan total halaman
  const getTotalPages = () => {
    return Math.ceil(getFilteredData().length / itemsPerPage);
  };

  // Tambahkan helper function untuk deteksi mobile
  const isMobile = () => {
    return window.innerWidth <= 640; // Menggunakan breakpoint sm
  };

  const renderMobileRow = (item: PPDBData) => (
    <div key={item.uid} className="border-b last:border-b-0">
      <div 
        onClick={() => setExpandedRow(expandedRow === item.uid ? null : item.uid)}
        className={classNames(
          "flex items-center justify-between p-3 cursor-pointer",
          expandedRow === item.uid ? "bg-gray-50" : "hover:bg-gray-50"
        )}
      >
        <div>
          <p className="font-medium text-gray-900 text-sm mb-1">{item.namaSiswa}</p>
          <p className="text-xs text-gray-500">{item.nisn}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge 
            status={item.status}
            adminStatus={item.adminStatus}
            className="text-xs"
          />
          <ChevronDownIcon 
            className={classNames(
              "w-4 h-4 text-gray-400 transition-transform",
              expandedRow === item.uid ? "transform rotate-180" : ""
            )}
          />
        </div>
      </div>

      {/* Dropdown Content */}
      {expandedRow === item.uid && (
        <div className="px-3 pb-3 space-y-3 bg-gray-50">
          {/* Info List */}
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Jalur</p>
              <JalurBadge jalur={item.jalur} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Asal Sekolah</p>
              <p className="text-sm text-gray-900">{item.asalSekolah}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tanggal Submit</p>
              <p className="text-sm text-gray-900">
                {formatDateTime(item.submittedAt || item.createdAt)}
              </p>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              onClick={() => {
                setSelectedData(item);
                setShowDetailModal(true);
              }}
              className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-xs transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              <span>Detail</span>
            </Button>
            
            <Button
              onClick={() => handleOpenStatusModal(item)}
              className="flex items-center justify-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 py-2 rounded-lg text-xs transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Status</span>
            </Button>
            
            <Button
              onClick={() => {
                setSelectedData(item);
                setShowDeleteModal(true);
              }}
              className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-xs transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Hapus</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const handleDeleteData = async () => {
    if (!selectedData || modalLoading) return;

    setModalLoading(true);
    try {
      // Hapus data dari Realtime Database
      await remove(ref(db, `ppdb/${selectedData.uid}`));

      // Hapus akun dari Firebase Auth
      const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: selectedData.uid,
          }),
        }
      );

      if (!response.ok) {
        console.error('Error deleting auth account:', await response.json());
      }

      // Update state lokal setelah penghapusan berhasil
      setPendaftar(prev => prev.filter(item => item.uid !== selectedData.uid));
      
      showAlert('success', 'Data pendaftar berhasil dihapus');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setSelectedData(null);
    } catch (error) {
      console.error('Error deleting data:', error);
      showAlert('error', 'Gagal menghapus data pendaftar');
    } finally {
      setModalLoading(false);
    }
  };

  // Tambahkan fungsi formatDateTime untuk menampilkan tanggal dan waktu
  const formatDateTime = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    };

    return new Date(dateStr).toLocaleString('id-ID', options);
  };

  // Update saat membuka modal status
  const handleOpenStatusModal = (data: PPDBData) => {
    setSelectedData(data);
    // Pre-select existing admin status if exists
    setSelectedStatus(data.adminStatus || null);
    // Pre-fill rejection reason if exists
    setAlasanPenolakan(data.alasanPenolakan || '');
    setShowStatusModal(true);
  };

  // Update saat menutup modal
  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedStatus(null);
    setAlasanPenolakan('');
    setSelectedData(null);
  };

  const handleResetData = async () => {
    if (!selectedData || modalLoading) return;

    setModalLoading(true);
    try {
      // Update status pendaftar menjadi draft dan hapus status admin
      await update(ref(db, `ppdb/${selectedData.uid}`), {
        status: 'draft',
        adminStatus: null,
        alasanPenolakan: null,
        lastUpdated: new Date().toISOString(),
        isReset: true, // Tambahkan flag untuk menandai akun di reset
        resetAt: new Date().toISOString()
      });

      showAlert('success', 'Data pendaftar berhasil direset');
      setShowResetModal(false);
      loadData();
    } catch (error) {
      console.error('Error resetting data:', error);
      showAlert('error', 'Gagal mereset data pendaftar');
    } finally {
      setModalLoading(false);
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Filter dan Search - Enhanced UI */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <div className="space-y-6">
          {/* Search Bar & Export Button */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari Nama Siswa, NISN atau Sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-2 px-4 text-sm"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span className="hidden md:inline">Export Excel</span>
              <span className="md:hidden">Export</span>
            </Button>
          </div>

          {/* Filter Pills & Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Status Filter */}
              <div className="relative group">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="diterima">Diterima</option>
                  <option value="ditolak">Ditolak</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <div className="w-4 h-4 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <FunnelIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Jalur Filter */}
              <div className="relative group">
                <select
                  value={jalurFilter}
                  onChange={(e) => setJalurFilter(e.target.value as any)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="all">Semua Jalur</option>
                  <option value="prestasi">Prestasi</option>
                  <option value="reguler">Reguler</option>
                  <option value="undangan">Undangan</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <div className="w-4 h-4 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <FunnelIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Sort */}
              <div className="relative group col-span-2 md:col-span-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <div className="w-4 h-4 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <FunnelIcon className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Pendaftar"
              value={getFilteredData().length}
              icon={<UserGroupIcon className="w-5 h-5 text-blue-600" />}
              className="bg-blue-50 border-blue-200"
              valueColor="text-blue-600"
            />
            <StatCard
              label="Pending"
              value={getFilteredData().filter(item => 
                item.status === 'submitted' && !item.adminStatus
              ).length}
              icon={<ClockIcon className="w-5 h-5 text-yellow-600" />}
              className="bg-yellow-50 border-yellow-200"
              valueColor="text-yellow-600"
            />
            <StatCard
              label="Diterima"
              value={getFilteredData().filter(item => item.adminStatus === 'diterima').length}
              icon={<CheckCircleIcon className="w-5 h-5 text-green-600" />}
              className="bg-green-50 border-green-200"
              valueColor="text-green-600"
            />
            <StatCard
              label="Ditolak"
              value={getFilteredData().filter(item => item.adminStatus === 'ditolak').length}
              icon={<XCircleIcon className="w-5 h-5 text-red-600" />}
              className="bg-red-50 border-red-200"
              valueColor="text-red-600"
            />
          </div>
        </div>
      </div>

      {/* Table/List View */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        {getFilteredData().length > 0 ? (
          <>
            {/* Mobile View */}
            <div className="md:hidden">
              <div className="divide-y">
                {getPaginatedData().map(renderMobileRow)}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <Table 
                headers={headers.map(header => 
                  header.key ? {
                    content: (
                      <button
                        onClick={() => header.key && handleSort(header.key)}
                        className="flex items-center gap-1 hover:text-blue-600"
                      >
                        {header.label}
                        {sortConfig?.key === header.key && (
                          <ChevronUpIcon 
                            className={`w-4 h-4 transition-transform ${
                              sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>
                    )
                  } : header.label
                )}
                data={getPaginatedData().map((item, index) => [
                  <span className="text-gray-600">
                    {((currentPage - 1) * itemsPerPage) + index + 1}
                  </span>,
                  <div className="truncate max-w-[150px]" title={item.namaSiswa}>
                    {item.namaSiswa}
                  </div>,
                  <div>{item.nisn}</div>,
                  <JalurBadge jalur={item.jalur} />,
                  <div className="truncate max-w-[150px]" title={item.asalSekolah}>
                    {item.asalSekolah}
                  </div>,
                  <StatusBadge 
                    key={item.uid} 
                    status={item.status}
                    adminStatus={item.adminStatus}
                  />,
                  <span>{formatDateTime(item.submittedAt || item.createdAt)}</span>,
                  <div key={item.uid} className="flex items-center gap-1.5">
                    {/* Tombol Lihat Detail */}
                    <Button
                      onClick={() => {
                        setSelectedData(item);
                        setShowDetailModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm transition-colors"
                      title="Lihat Detail"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span className="hidden lg:inline">Detail</span>
                    </Button>

                    {/* Tombol Ubah Status */}
                    <Button
                      onClick={() => handleOpenStatusModal(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg text-sm transition-colors"
                      title="Ubah Status"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="hidden lg:inline">Status</span>
                    </Button>

                    {/* Tombol Hapus */}
                    <Button
                      onClick={() => {
                        setSelectedData(item);
                        setShowDeleteModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors"
                      title="Hapus Data"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="hidden lg:inline">Hapus</span>
                    </Button>

                    {/* Tombol Reset */}
                    <Button
                      onClick={() => {
                        setSelectedData(item);
                        setShowResetModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm transition-colors"
                      title="Reset Data"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span className="hidden lg:inline">Reset</span>
                    </Button>
                  </div>
                ])}
              />
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={getTotalPages()}
              onPageChange={setCurrentPage}
              totalItems={getFilteredData().length}
              itemsPerPage={itemsPerPage}
            />
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="max-w-sm mx-auto">
              <p className="mb-2">Tidak ada data yang sesuai dengan filter</p>
              <p className="text-sm text-gray-400">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        size={isMobile() ? "full" : "xl"}
        className="z-[60]"
      >
        <div className={`${isMobile() ? 'p-3' : 'p-6'} w-full min-h-[600px]`}>
          {/* Header Modal */}
          <div className={`flex flex-col ${isMobile() ? 'gap-2' : 'justify-between items-start'} mb-4 pb-3 border-b`}>
            <div className="w-full">
              <div className={`flex ${isMobile() ? 'items-center' : 'items-center justify-between'}`}>
                <div className="flex items-center gap-2">
                  <h3 className={`${isMobile() ? 'text-base' : 'text-xl'} font-bold text-gray-900`}>
                    {selectedData?.namaSiswa}
                  </h3>
                  {/* Status badge */}
                  {selectedData?.adminStatus ? (
                    <span className={classNames(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      selectedData.adminStatus === 'diterima' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}>
                      {selectedData.adminStatus === 'diterima' ? 'Diterima' : 'Ditolak'}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
                
                {/* Tombol tutup hanya tampil di desktop */}
                {!isMobile() && (
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 text-sm"
                  >
                    Tutup
                  </Button>
                )}
              </div>
              
              <div className={`mt-1.5 flex ${isMobile() ? 'flex-col gap-1' : 'items-center gap-4'} text-xs text-gray-600`}>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">NISN:</span>
                  <span>{selectedData?.nisn}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Email:</span>
                  <span>{selectedData?.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Jalur:</span>
                  <span className={classNames(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    selectedData?.jalur === 'prestasi' 
                      ? 'bg-blue-100 text-blue-800'
                      : selectedData?.jalur === 'reguler'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  )}>
                    {getJalurLabel(selectedData?.jalur || 'reguler')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Tanggal Daftar:</span>
                  <span>{new Date(selectedData?.createdAt || '').toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Tombol tutup untuk mobile di bagian bawah */}
            {isMobile() && (
              <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t z-10">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 text-sm"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {selectedData && (
            <div className={`
              ${isMobile() ? 'h-[calc(100vh-160px)] pb-16' : 'h-[calc(100vh-280px)]'} 
              overflow-y-auto hide-scrollbar
            `}>
              <Tabs
                tabs={[
                  {
                    label: "Biodata",
                    content: (
                      <div className={`${isMobile() ? 'p-2' : 'p-4'} space-y-4 min-h-[400px]`}>
                        {/* Foto dan Info Utama */}
                        <div className={`flex ${isMobile() ? 'flex-col' : 'gap-6'}`}>
                          {/* Pas Foto */}
                          <div className={`${isMobile() ? 'mb-3 flex justify-center' : 'flex-shrink-0'}`}>
                            {selectedData?.photo ? (
                              <div className="relative group">
                                <div 
                                  className={`${isMobile() ? 'w-24 h-32' : 'w-32 h-40'} rounded-lg overflow-hidden border border-gray-200 cursor-pointer`}
                                  onClick={() => setShowPhotoModal(true)}
                                >
                                  <img 
                                    src={selectedData.photo}
                                    alt="Pas Foto"
                                    className="w-full h-full object-cover"
                                  />
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
                            <div className="bg-gray-50 p-4 rounded-lg"> {/* Tambah background dan padding */}
                              <div className={`grid ${isMobile() ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-x-8 gap-y-4'}`}>
                                <InfoItem label="NIK" value={selectedData?.nik} />
                                <InfoItem label="Jenis Kelamin" value={selectedData?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                <InfoItem 
                                  label="Tempat, Tanggal Lahir" 
                                  value={`${selectedData?.tempatLahir}, ${new Date(selectedData?.tanggalLahir || '').toLocaleDateString('id-ID')}`}
                                />
                                <InfoItem label="Anak ke / Jumlah Saudara" value={`${selectedData?.anakKe} dari ${selectedData?.jumlahSaudara}`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Alamat & Sekolah sections dengan padding & spacing yang lebih kecil untuk mobile */}
                        <div className={`bg-gray-50 ${isMobile() ? 'p-2.5 rounded-md' : 'p-4 rounded-lg'}`}>
                          <h4 className={`font-medium text-gray-900 ${isMobile() ? 'mb-2 text-sm' : 'mb-3'}`}>Alamat</h4>
                          <div className="space-y-2">
                            <InfoItem label="Alamat Lengkap" value={selectedData?.alamat} />
                            <div className={`grid ${isMobile() ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                              <InfoItem label="Kecamatan" value={selectedData?.kecamatan} />
                              <InfoItem label="Kabupaten" value={selectedData?.kabupaten} />
                            </div>
                          </div>
                        </div>

                        <div className={`bg-gray-50 ${isMobile() ? 'p-2.5 rounded-md' : 'p-4 rounded-lg'}`}>
                          <h4 className={`font-medium text-gray-900 ${isMobile() ? 'mb-2 text-sm' : 'mb-3'}`}>Asal Sekolah</h4>
                          <div className={`grid ${isMobile() ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'}`}>
                            <InfoItem label="Nama Sekolah" value={selectedData?.asalSekolah} />
                            <InfoItem label="Kabupaten" value={selectedData?.kabupatenAsalSekolah} />
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: "Akademik",
                    content: (
                      <div className={`${isMobile() ? 'p-2' : 'p-4'} min-h-[400px]`}>
                        <div className={`grid grid-cols-1 ${!isMobile() && 'lg:grid-cols-2'} gap-4`}>
                          {/* Nilai Akademik */}
                          <div>
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200 mb-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                  <AcademicCapIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Nilai Akademik</h4>
                                  <p className="text-sm text-blue-700">
                                    Semester {selectedData?.jalur === 'reguler' ? '3-5' : '2-4'} ({getJalurLabel(selectedData?.jalur || 'reguler')})
                                  </p>
                                </div>
                              </div>
                            </div>

                            {renderDetailAkademik(selectedData)}
                          </div>

                          {/* Dokumen */}
                          <div className={isMobile() ? 'mt-4' : ''}>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl border border-green-200 mb-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500 rounded-lg">
                                  <DocumentArrowDownIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Dokumen</h4>
                                  <p className="text-sm text-green-700">
                                    Klik untuk mengunduh dokumen
                                  </p>
                                </div>
                              </div>
                            </div>

                            {renderDetailDokumen(selectedData)}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    label: "Orang Tua",
                    content: (
                      <div className={`${isMobile() ? 'p-2' : 'p-4'} min-h-[400px]`}>
                        <div className={`grid ${isMobile() ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                          {[
                            { title: 'Data Ayah', prefix: 'Ayah' },
                            { title: 'Data Ibu', prefix: 'Ibu' }
                          ].map(({ title, prefix }) => (
                            <div key={title} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
                              <div className="space-y-3">
                                <InfoItem 
                                  label="Nama Lengkap" 
                                  value={selectedData?.[`nama${prefix}` as keyof PPDBData] as string} 
                                />
                                <InfoItem 
                                  label="Pekerjaan" 
                                  value={selectedData?.[`pekerjaan${prefix}` as keyof PPDBData] as string} 
                                />
                                <InfoItem 
                                  label="Instansi" 
                                  value={selectedData?.[`instansi${prefix}` as keyof PPDBData] as string} 
                                />
                                <InfoItem 
                                  label="No. HP/WA" 
                                  value={selectedData?.[`hp${prefix}` as keyof PPDBData] as string} 
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
                className={isMobile() ? "flex-nowrap overflow-x-auto whitespace-nowrap hide-scrollbar" : ""}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Update Status */}
      <Modal
        isOpen={showStatusModal}
        onClose={handleCloseStatusModal}
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
            {/* Opsi Terima */}
            <div 
              onClick={() => !modalLoading && setSelectedStatus('diterima')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                modalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'
              } ${selectedStatus === 'diterima' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedStatus === 'diterima' ? 'bg-green-500' : 'border-2 border-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">Terima</p>
                  <p className="text-sm text-gray-500">Pendaftar dinyatakan diterima</p>
                </div>
              </div>
            </div>

            {/* Opsi Tolak */}
            <div className="space-y-3">
              <div 
                onClick={() => !modalLoading && setSelectedStatus('ditolak')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  modalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
                } ${selectedStatus === 'ditolak' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    selectedStatus === 'ditolak' ? 'bg-red-500' : 'border-2 border-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">Tolak</p>
                    <p className="text-sm text-gray-500">Pendaftar dinyatakan tidak diterima</p>
                  </div>
                </div>
              </div>

              {/* Input alasan penolakan - tampil jika status Tolak dipilih atau ada alasan penolakan */}
              {(selectedStatus === 'ditolak' || alasanPenolakan) && (
                <div className="px-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="alasanPenolakan"
                    value={alasanPenolakan}
                    onChange={(e) => setAlasanPenolakan(e.target.value)}
                    placeholder="Tuliskan alasan penolakan di sini..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                  {selectedStatus === 'ditolak' && !alasanPenolakan.trim() && (
                    <p className="mt-1 text-sm text-red-500">
                      Alasan penolakan wajib diisi
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleCloseStatusModal}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={modalLoading}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (selectedStatus === 'diterima') {
                  handleUpdateStatus('diterima');
                } else if (selectedStatus === 'ditolak') {
                  handleUpdateStatus('ditolak', alasanPenolakan);
                }
              }}
              className={`${
                selectedStatus === 'diterima' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              } text-white`}
              disabled={
                modalLoading || 
                !selectedStatus || 
                (selectedStatus === 'ditolak' && !alasanPenolakan.trim())
              }
            >
              {modalLoading ? 'Memproses...' : 'Simpan Status'}
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

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation(''); // Reset input saat modal ditutup
        }}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Hapus Data Pendaftar
            </h3>
            <p className="text-gray-600 mt-2">
              Apakah Anda yakin ingin menghapus data pendaftar{' '}
              <span className="font-medium">{selectedData?.namaSiswa}</span>?
              <br />
              <span className="text-sm text-red-500 mt-2 block">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus akun pendaftar.
              </span>
            </p>
          </div>

          {/* Input Konfirmasi */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-2">
              Ketik "hapus data" untuk mengkonfirmasi:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="hapus data"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation(''); // Reset input saat batal
              }}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={modalLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteData}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={modalLoading || deleteConfirmation !== 'hapus data'}
            >
              {modalLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </div>
              ) : (
                'Hapus'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Reset */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <ArrowPathIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reset Data Pendaftar
            </h3>
            <p className="text-gray-600">
              Pendaftar: <span className="font-medium">{selectedData?.namaSiswa}</span>
              <br />
              NISN: <span className="font-medium">{selectedData?.nisn}</span>
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-yellow-800">
              Tindakan ini akan:
            </p>
            <ul className="list-disc ml-4 mt-2 text-sm text-yellow-700">
              <li>Mengubah status pendaftar menjadi reset / draft</li>
              <li>Menghapus status keputusan admin</li>
              <li>Memungkinkan pendaftar untuk mengirim ulang formulir</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowResetModal(false)}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleResetData}
              className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
              disabled={modalLoading}
            >
              {modalLoading ? 'Memproses...' : 'Ya, Reset Data'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm sm:text-base font-medium text-gray-900">{value}</p>
  </div>
);

// New StatCard Component
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
  valueColor?: string;
}> = ({ label, value, icon, className, valueColor = "text-gray-900" }) => (
  <div className={classNames(
    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
    className
  )}>
    <div className="p-2 rounded-lg">
      {icon}
    </div>
    <div>
      <p className={classNames("text-xl font-semibold", valueColor)}>
        {value}
      </p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  </div>
);

export default DataPendaftar