import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { showAlert } from '../ui/Alert';
import { deleteFromR2, testR2Connection } from '../../services/cloudflareR2';
import { 
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  TrashIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Tabs from '../ui/Tabs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';

// Di bagian atas file, tambahkan type untuk school
type School = 'mosa' | 'fajar';
type SchoolFilter = School | 'all';

type PPDBData = {
  uid: string;
  school: 'mosa' | 'fajar';
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
  sertifikat?: string;

  // Status dan Metadata
  status: 'pending' | 'submitted' | 'draft';
  adminStatus?: 'diterima' | 'ditolak';
  createdAt: string;
  lastUpdated?: string;
  submittedAt?: string;
  alasanPenolakan?: string;
  // Tambah field untuk tracking admin
  updatedBy?: {
    email: string;
    name?: string;
    school: 'mosa' | 'fajar';
    timestamp: string;
  };
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
        return 'Draft';
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
        return 'text-purple-600 bg-purple-50';
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

// SchoolBadge untuk menampilkan sekolah - HIDDEN (sama seperti DataPendaftar)
// export const SchoolBadge: React.FC<{ school: PPDBData['school'] }> = ({ school }) => {
//   const getSchoolColor = (school: PPDBData['school']) => {
//     switch (school) {
//       case 'mosa':
//         return 'text-blue-600 bg-blue-50 border-blue-200';
//       case 'fajar':
//         return 'text-green-600 bg-green-50 border-green-200';
//       default:
//         return 'text-gray-600 bg-gray-50 border-gray-200';
//     }
//   };

//   const getSchoolLabel = (school: PPDBData['school']) => {
//     switch (school) {
//       case 'mosa':
//         return 'SMAN Modal Bangsa';
//       case 'fajar':
//         return 'SMAN 10 Fajar Harapan';
//       default:
//         return school;
//     }
//   };

//   return (
//     <span className={classNames(
//       'px-2 py-1 rounded-full text-xs font-medium border',
//       getSchoolColor(school)
//     )}>
//       {getSchoolLabel(school)}
//     </span>
//   );
// };

const DataDraft: React.FC = () => {
  const { userRole } = useAuth();
  
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jalurFilter, setJalurFilter] = useState<'all' | 'prestasi' | 'reguler' | 'undangan'>('all');
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<SchoolFilter>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionDropdown) {
        const target = event.target as Element;
        if (!target.closest('.action-dropdown')) {
          setShowActionDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionDropdown]);

  const loadData = async () => {
    try {
      if (!userRole) return;

      if (userRole.isMaster) {
        // Load data dari kedua sekolah
        const mosaRef = ref(db, 'ppdb_mosa');
        const fajarRef = ref(db, 'ppdb_fajar');
        
        const [mosaSnapshot, fajarSnapshot] = await Promise.all([
          get(mosaRef),
          get(fajarRef)
        ]);
        
        // Untuk data MOSA
        const mosaData: PPDBData[] = mosaSnapshot.exists() ? 
          Object.entries(mosaSnapshot.val()).map(([uid, value]) => ({
            uid,
            school: 'mosa' as const,
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          })) : [];
        
        // Untuk data Fajar Harapan
        const fajarData: PPDBData[] = fajarSnapshot.exists() ? 
          Object.entries(fajarSnapshot.val()).map(([uid, value]) => ({
            uid,
            school: 'fajar' as const,
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          })) : [];
        
        setPendaftar([...mosaData, ...fajarData]);
      } else {
        // Load data sesuai sekolah admin
        const ppdbRef = ref(db, `ppdb_${userRole.school}`);
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data: PPDBData[] = Object.entries(snapshot.val())
            .map(([uid, value]) => ({
              uid,
              school: userRole.school as 'mosa' | 'fajar',
              ...(value as Omit<PPDBData, 'uid' | 'school'>)
            }));
          setPendaftar(data);
        } else {
          setPendaftar([]);
        }
      }

      console.log('Loaded Draft Data:', pendaftar);
    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('error', 'Gagal memuat data draft');
    }
  };

  // Filter data untuk menampilkan hanya status draft
  const getFilteredData = () => {
    return pendaftar
      .filter(item => item.status === 'draft' || item.status === 'pending') // Hanya draft dan pending
      .filter(item => {
        const matchSearch = 
          (item.namaSiswa?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (item.nisn || '').includes(searchQuery) ||
          (item.asalSekolah?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        const matchJalur = 
          jalurFilter === 'all' ? true : item.jalur === jalurFilter;
        const matchSchool = 
          schoolFilter === 'all' ? true : item.school === schoolFilter;
        
        return matchSearch && matchJalur && matchSchool;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt);
        const dateB = new Date(b.submittedAt || b.createdAt);
        return sortBy === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      });
  };

  // Helper function untuk format tanggal
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return '-';
      }

      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${day} ${month} - ${hours}.${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return '-';
    }
  };

  // Helper function untuk status kelengkapan
  const getStatusKelengkapan = (data: PPDBData) => {
    const fieldsToCheck = [
      // Data pribadi wajib
      data.namaSiswa,
      data.nisn,
      data.nik,
      data.jenisKelamin,
      data.tempatLahir,
      data.tanggalLahir,
      data.alamat,
      // Data sekolah
      data.asalSekolah,
      data.jalur,
      // Data orang tua
      data.namaAyah,
      data.pekerjaanAyah,
      data.instansiAyah,
      data.hpAyah,
      data.namaIbu,
      data.pekerjaanIbu,
      data.instansiIbu,
      data.hpIbu,
      // Nilai akademik
      data.nilaiAgama2,
      data.nilaiBindo2,
      data.nilaiBing2,
      data.nilaiMtk2,
      data.nilaiIpa2,
      data.nilaiAgama3,
      data.nilaiBindo3,
      data.nilaiBing3,
      data.nilaiMtk3,
      data.nilaiIpa3,
      data.nilaiAgama4,
      data.nilaiBindo4,
      data.nilaiBing4,
      data.nilaiMtk4,
      data.nilaiIpa4,
      // Dokumen wajib
      data.photo,
      data.rekomendasi,
      data.raport2,
      data.raport3,
      data.raport4
    ];

    // Dokumen khusus jalur prestasi
    if (data.jalur === 'prestasi' && data.sertifikat) {
      fieldsToCheck.push(data.sertifikat);
    }

    const filledFields = fieldsToCheck.filter(field => field && field !== '').length;
    const totalFields = fieldsToCheck.length;
    const percentage = Math.round((filledFields / totalFields) * 100);

    if (percentage >= 90) return 'Lengkap';
    if (percentage >= 70) return 'Hampir Lengkap';
    if (percentage >= 50) return 'Setengah';
    if (percentage > 0) return 'Sebagian';
    return 'Kosong';
  };

  // Headers untuk tabel (sama seperti DataPendaftar tanpa kolom sekolah)
  const headers = [
    'No',
    'Nama',
    // Kolom sekolah disembunyikan seperti di DataPendaftar
    'Jalur',
    'Asal Sekolah', 
    'Status Kelengkapan',
    'Status',
    'Tanggal Buat',
    'Aksi'
  ].map(header => ({
    content: (
      <div className="text-left">
        <span className="font-medium text-gray-700">{header}</span>
      </div>
    )
  }));

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Draft');
      
      // Header
      const columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Lengkap', key: 'namaSiswa', width: 40 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'NISN', key: 'nisn', width: 20 },
        { header: 'Jalur', key: 'jalur', width: 15 },
        { header: 'Status Kelengkapan', key: 'statusKelengkapan', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Tanggal Buat', key: 'createdAt', width: 20 },
        { header: 'Terakhir Update', key: 'lastUpdated', width: 20 }
      ];

      worksheet.columns = columns;

      // Add data
      const data = getFilteredData();
      const rowData = data.map((item, index) => ({
        no: index + 1,
        namaSiswa: item.namaSiswa || '-',
        email: item.email || '-',
        nisn: item.nisn || '-',
        jalur: item.jalur ? item.jalur.charAt(0).toUpperCase() + item.jalur.slice(1) : '-',
        statusKelengkapan: getStatusKelengkapan(item),
        status: item.status === 'draft' ? 'Draft' : 'Pending',
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-',
        lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('id-ID') : '-'
      }));

      worksheet.addRows(rowData);

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const fileName = userRole?.isMaster 
        ? `Data_Draft_PPDB_Semua_Sekolah_${new Date().toLocaleDateString('id-ID')}.xlsx`
        : `Data_Draft_PPDB_${userRole?.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan'}_${new Date().toLocaleDateString('id-ID')}.xlsx`;

      saveAs(blob, fileName);
      showAlert('success', 'Data draft berhasil diexport ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert('error', 'Gagal mengexport data draft ke Excel');
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

    // Helper function to safely get numeric value
    const getSafeNumericValue = (value: any) => {
      if (!value || value === '' || value === null || value === undefined) {
        return 0;
      }
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    };

    return (
      <div className="bg-white shadow-sm border rounded-xl p-5 h-[300px]">
        <table className="w-full mb-4">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-gray-500 pb-4">Mapel</th>
              {semesters.map(semester => (
                <th key={semester} className="text-center text-sm font-medium text-gray-500 pb-4">Sem {semester}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mapelList.map(({ label, key }) => (
              <tr key={key} className="border-t">
                <td className="py-3 text-sm font-medium text-gray-600">{label}</td>
                {semesters.map(semester => {
                  const fieldKey = `${key}${semester}` as keyof PPDBData;
                  const rawValue = data[fieldKey];
                  const nilai = getSafeNumericValue(rawValue);
                  return (
                    <td key={semester} className="text-center">
                      <span className={classNames(
                        'inline-block px-3 py-1 rounded-full text-sm font-medium',
                        nilai >= 83 ? 'bg-green-100 text-green-700' :
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

  const renderDetailDokumen = (data: PPDBData) => {
    const semesters = ['2', '3', '4'];

    return (
      <div className={classNames(
        "bg-white shadow-sm border rounded-xl p-5",
        isMobile() ? 'h-auto' : 'h-[300px]'
      )}>
        <div className={`${isMobile() ? 'space-y-4' : 'grid grid-cols-2 gap-6 h-full'}`}>
          {/* Kolom 1: Dokumen Wajib */}
          <div className="flex flex-col h-full">
            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Wajib</h4>
            <div className="space-y-3 flex-1">
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
            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">Dokumen Raport</h4>
            <div className={`${isMobile() ? 'grid grid-cols-2 gap-3' : 'space-y-3'} flex-1`}>
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
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Always ensure we have exactly itemsPerPage rows by adding empty rows if needed
    const emptyRowsNeeded = itemsPerPage - pageData.length;
    if (emptyRowsNeeded > 0 && pageData.length > 0) {
      // Add empty placeholder objects for remaining rows
      for (let i = 0; i < emptyRowsNeeded; i++) {
        pageData.push(null as any); // null indicates empty row
      }
    }
    
    return pageData;
  };

  // Fungsi untuk mendapatkan total halaman
  const getTotalPages = () => {
    return Math.ceil(getFilteredData().length / itemsPerPage);
  };

  // Tambahkan helper function untuk deteksi mobile
  const isMobile = () => {
    return window.innerWidth <= 640; // Menggunakan breakpoint sm
  };

  // Helper function to extract file key from R2 URL
  const extractFileKeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const fileKey = urlObj.pathname.substring(1);
      return fileKey;
    } catch (error) {
      console.error('Error extracting file key from URL:', url, error);
      return null;
    }
  };

  const handleDeleteData = async () => {
    if (!selectedData || modalLoading) return;

    setModalLoading(true);
    try {
      // List of file URLs to delete from R2
      const filesToDelete: string[] = [];
      
      // Collect all file URLs from the selected data
      if (selectedData.photo) filesToDelete.push(selectedData.photo);
      if (selectedData.rekomendasi) filesToDelete.push(selectedData.rekomendasi);
      if (selectedData.raport2) filesToDelete.push(selectedData.raport2);
      if (selectedData.raport3) filesToDelete.push(selectedData.raport3);
      if (selectedData.raport4) filesToDelete.push(selectedData.raport4);
      if (selectedData.sertifikat) filesToDelete.push(selectedData.sertifikat);

      // Delete files from Cloudflare R2 first
      if (filesToDelete.length > 0) {
        console.log('Starting file deletion process...');
        console.log('Files to delete from R2:', filesToDelete);
        
        // Test R2 connection first
        console.log('Testing R2 connection...');
        const connectionTest = await testR2Connection();
        console.log('R2 connection test result:', connectionTest);
        
        if (!connectionTest.success) {
          console.warn('R2 connection test failed, but continuing with deletion attempt:', connectionTest.message);
        }
        
        const deletePromises = filesToDelete.map(async (fileUrl, index) => {
          try {
            console.log(`Processing file ${index + 1}/${filesToDelete.length}:`, fileUrl);
            
            const fileKey = extractFileKeyFromUrl(fileUrl);
            if (!fileKey) {
              console.warn('Could not extract file key from URL:', fileUrl);
              return { success: false, fileUrl, error: 'Could not extract file key' };
            }
            
            console.log('Attempting to delete from R2 with key:', fileKey);
            await deleteFromR2(fileKey);
            console.log('✅ Successfully deleted file from R2:', fileKey);
            
            return { success: true, fileUrl, fileKey };
          } catch (error) {
            console.error('❌ Failed to delete file from R2:', fileUrl);
            console.error('Error details:', error);
            return { success: false, fileUrl, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        });
        
        // Wait for all file deletions to complete
        const results = await Promise.allSettled(deletePromises);
        
        // Log summary of deletion results
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        console.log(`File deletion summary: ${successful} successful, ${failed} failed`);
        
        if (failed > 0) {
          console.warn('Some files could not be deleted from R2 storage, but database cleanup will continue.');
          const failedFiles = results
            .filter(r => r.status === 'fulfilled' && !r.value.success)
            .map(r => r.status === 'fulfilled' ? r.value.fileUrl : 'unknown');
          console.warn('Failed files:', failedFiles);
        }
      }

      // Delete data from Realtime Database
      await remove(ref(db, `ppdb_${selectedData.school}/${selectedData.uid}`));

      // Update local state
      setPendaftar(prev => prev.filter(item => item.uid !== selectedData.uid));
      
      showAlert('success', 'Data draft berhasil dihapus');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setSelectedData(null);
    } catch (error) {
      console.error('Error deleting draft data:', error);
      showAlert('error', 'Gagal menghapus data draft');
    } finally {
      setModalLoading(false);
    }
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
          <p className="font-medium text-gray-900 text-sm mb-1">{item.namaSiswa || 'Draft Kosong'}</p>
          <p className="text-xs text-gray-500">{item.nisn || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} className="text-xs" />
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
            {item.jalur && (
              <div>
                <p className="text-xs text-gray-500">Jalur</p>
                <JalurBadge jalur={item.jalur} />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Asal Sekolah</p>
              <p className="text-sm text-gray-900">{item.asalSekolah || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status Kelengkapan</p>
              <button
                className="text-sm text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedData(item);
                  setShowDetailModal(true);
                  setExpandedRow(null);
                }}
              >
                {getStatusKelengkapan(item)}
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tanggal Buat</p>
              <p className="text-sm text-gray-900">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              onClick={() => {
                setSelectedData(item);
                setShowDetailModal(true);
                setExpandedRow(null);
              }}
              className="flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-xs transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              <span>Detail</span>
            </Button>
            
            <Button
              onClick={() => {
                setSelectedData(item);
                setShowDeleteModal(true);
                setExpandedRow(null);
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

  if (pendaftar.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-xl p-8 border shadow-sm">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Data Draft
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {userRole?.isMaster 
                ? "Belum ada data draft di kedua sekolah"
                : `Belum ada data draft di ${userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Filter dan Search - Enhanced UI sama seperti DataPendaftar */}
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
              label="Total Draft"
              value={getFilteredData().length}
              icon={<DocumentTextIcon className="w-5 h-5 text-orange-600" />}
              className="bg-orange-50 border-orange-200"
              valueColor="text-orange-600"
            />
            <StatCard
              label="Draft Kosong"
              value={getFilteredData().filter(item => 
                !item.namaSiswa || item.namaSiswa.trim() === ''
              ).length}
              icon={<ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />}
              className="bg-yellow-50 border-yellow-200"
              valueColor="text-yellow-600"
            />
            <StatCard
              label="Draft Lengkap"
              value={getFilteredData().filter(item => 
                getStatusKelengkapan(item) === 'Lengkap'
              ).length}
              icon={<ClockIcon className="w-5 h-5 text-green-600" />}
              className="bg-green-50 border-green-200"
              valueColor="text-green-600"
            />
            <StatCard
              label="Total Users"
              value={getFilteredData().filter(item => item.email).length}
              icon={<UserGroupIcon className="w-5 h-5 text-blue-600" />}
              className="bg-blue-50 border-blue-200"
              valueColor="text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Table/List View */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        {getFilteredData().length > 0 ? (
          <>
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
              {getFilteredData().map(renderMobileRow)}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <Table 
                headers={headers}
                data={getPaginatedData().map((item, index) => {
                  // Handle empty rows (null items)
                  if (!item) {
                    return Array(headers.length).fill(
                      <div className="text-left text-gray-300 py-3">
                        &nbsp;
                      </div>
                    );
                  }
                  
                  return [
                    // No
                    <div className="text-left text-gray-600">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </div>,
                    // Nama
                    <div className="text-left truncate max-w-[150px]" title={item.namaSiswa}>
                      {item.namaSiswa || 'Draft Kosong'}
                    </div>,
                    // Sekolah (hidden seperti DataPendaftar)
                    // Jalur
                    <div className="text-left">
                      {item.jalur ? <JalurBadge jalur={item.jalur} /> : <span className="text-gray-400">-</span>}
                    </div>,
                    // Asal Sekolah
                    <div className="text-left truncate max-w-[150px]" title={item.asalSekolah}>
                      {item.asalSekolah || '-'}
                    </div>,
                    // Status Kelengkapan - Clickable
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedData(item);
                          setShowDetailModal(true);
                        }}
                        className="cursor-pointer focus:outline-none text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {getStatusKelengkapan(item)}
                      </button>
                    </div>,
                    // Status
                    <div className="text-left">
                      <StatusBadge status={item.status} className="text-xs" />
                    </div>,
                    // Tanggal Buat
                    <div className="text-left">
                      {formatDateTime(item.createdAt)}
                    </div>,
                    // Aksi - Dropdown
                    <div className="text-left relative action-dropdown">
                      <button
                        onClick={() => setShowActionDropdown(showActionDropdown === item.uid ? null : item.uid)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm transition-colors border"
                        title="Menu Aksi"
                      >
                        <span>Aksi</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${showActionDropdown === item.uid ? 'rotate-180' : ''}`} />
                      </button>

                      {showActionDropdown === item.uid && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                          <button
                            onClick={() => {
                              setSelectedData(item);
                              setShowDetailModal(true);
                              setShowActionDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Lihat Detail
                          </button>
                          <button
                            onClick={() => {
                              setSelectedData(item);
                              setShowDeleteModal(true);
                              setShowActionDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Hapus Data
                          </button>
                        </div>
                      )}
                    </div>
                  ];
                })}
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
          <div className="p-8 text-center">
            <div className="max-w-sm mx-auto">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Data Draft Tidak Ditemukan
              </h3>
              <p className="text-gray-500 mb-4">
                Tidak ada data draft yang sesuai dengan filter yang dipilih
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setJalurFilter('all');
                  setSchoolFilter('all');
                }}
                className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail - Sama seperti DataPendaftar */}
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
                    {selectedData?.namaSiswa || 'Draft Kosong'}
                  </h3>
                  {/* Status badge */}
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Draft
                  </span>
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
                  <span>{selectedData?.nisn || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">Email:</span>
                  <span>{selectedData?.email || '-'}</span>
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
                  <span className="font-medium">Tanggal Buat:</span>
                  <span>
                    {formatDateTime(selectedData?.createdAt)}
                  </span>
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
                          <div className={`${isMobile() ? 'mb-3 flex justify-center' : 'w-32 flex-shrink-0'}`}>
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
                            <div className="bg-gray-50 p-4 rounded-lg h-40">
                              <div className={`grid ${isMobile() ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-x-8 gap-y-4'}`}>
                                <InfoItem label="NIK" value={selectedData?.nik} />
                                <InfoItem label="Jenis Kelamin" value={selectedData?.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                                <InfoItem 
                                  label="Tempat, Tanggal Lahir" 
                                  value={`${selectedData?.tempatLahir || '-'}, ${selectedData?.tanggalLahir ? new Date(selectedData.tanggalLahir).toLocaleDateString('id-ID') : '-'}`}
                                />
                                <InfoItem label="Anak ke / Jumlah Saudara" value={`${selectedData?.anakKe || '-'} dari ${selectedData?.jumlahSaudara || '-'}`} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Alamat & Sekolah sections */}
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
                          <div>
                            <InfoItem label="Nama Sekolah" value={selectedData?.asalSekolah} />
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
                                    Semester 2-4 ({getJalurLabel(selectedData?.jalur || 'reguler')})
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
              Pas Foto: {selectedData?.namaSiswa || 'Draft'}
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
              Hapus Data Draft
            </h3>
            <p className="text-gray-600 mt-2">
              Apakah Anda yakin ingin menghapus data draft{' '}
              <span className="font-medium">{selectedData?.namaSiswa || 'ini'}</span>?
              <br />
              <span className="text-sm text-red-500 mt-2 block">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh data.
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
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm sm:text-base font-medium text-gray-900">{value || '-'}</p>
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

export default DataDraft;