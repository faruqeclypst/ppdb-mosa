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
  TrashIcon,
  ChevronDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import StudentDetailModal from './StudentDetailModal';

// Di bagian atas file, tambahkan type untuk school
type School = 'mosa' | 'fajar';
type SchoolFilter = School | 'all';

type PPDBData = {
  uid: string;
  school: 'mosa' | 'fajar';
  email: string;
  // Informasi Siswa
  jalur: 'prestasi' | 'reguler' | 'undangan' | 'pjj';
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
  ijazah?: string;
  kartuKeluarga?: string;
  lampiranA?: string;
  lampiranB?: string;

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
  registrationNumber?: string;
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
    undangan: 'Undangan',
    pjj: 'PJJ'
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
      case 'pjj':
        return 'text-amber-600 bg-amber-50';
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

interface DataDraftProps {
  mode?: 'regular' | 'pjj';
}

const DataDraft: React.FC<DataDraftProps> = ({ mode = 'regular' }) => {
  const { userRole } = useAuth();
  
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jalurFilter, setJalurFilter] = useState<'all' | 'prestasi' | 'reguler' | 'undangan' | 'pjj'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    no: true,
    name: true,
    jalur: true,
    school: true,
    status: true,
    date: true,
    actions: true
  });
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
    } catch (error) {
      showAlert('error', 'Gagal memuat data draft');
    }
  };

  // Filter data untuk menampilkan hanya status draft
  const getFilteredData = () => {
    return pendaftar
      .filter(item => item.status === 'draft' || item.status === 'pending') // Hanya draft dan pending
      .filter(item => {
        // filter by mode
        if (mode === 'pjj') {
          if (item.jalur !== 'pjj') return false;
        } else {
          if (item.jalur === 'pjj') return false;
        }

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
    let fieldsToCheck: (string | undefined)[] = [
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
    ];

    if (data.jalur === 'pjj') {
      fieldsToCheck = [
        ...fieldsToCheck,
        data.photo,
        data.ijazah,
        data.kartuKeluarga
      ];
    } else {
      fieldsToCheck = [
        ...fieldsToCheck,
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
        jalur: item.jalur ? getJalurLabel(item.jalur) : '-',
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

      const suffix = mode === 'pjj' ? '_PJJ' : '_Reguler';
      const fileName = userRole?.isMaster 
        ? `Data_Draft_PPDB_Semua_Sekolah${suffix}_${new Date().toLocaleDateString('id-ID')}.xlsx`
        : `Data_Draft_PPDB_${userRole?.school === 'mosa' ? 'Modal_Bangsa' : 'Fajar_Harapan'}${suffix}_${new Date().toLocaleDateString('id-ID')}.xlsx`;

      saveAs(blob, fileName);
      showAlert('success', 'Data draft berhasil diexport ke Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert('error', 'Gagal mengexport data draft ke Excel');
    }
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
      if (selectedData.ijazah) filesToDelete.push(selectedData.ijazah);
      if (selectedData.kartuKeluarga) filesToDelete.push(selectedData.kartuKeluarga);
      if (selectedData.lampiranA) filesToDelete.push(selectedData.lampiranA);
      if (selectedData.lampiranB) filesToDelete.push(selectedData.lampiranB);

      // Delete files from Cloudflare R2 first
      if (filesToDelete.length > 0) {
        
        // Test R2 connection first
        const connectionTest = await testR2Connection();
        
        if (!connectionTest.success) {
          console.warn('R2 connection test failed, but continuing with deletion attempt:', connectionTest.message);
        }
        
        const deletePromises = filesToDelete.map(async (fileUrl) => {
          try {
            
            const fileKey = extractFileKeyFromUrl(fileUrl);
            if (!fileKey) {
              console.warn('Could not extract file key from URL:', fileUrl);
              return { success: false, fileUrl, error: 'Could not extract file key' };
            }
            
            await deleteFromR2(fileKey);
            
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
              <p className="text-sm text-gray-900">{item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah || '-'}</p>
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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {mode === 'pjj' ? 'Data Draft Pendaftar PJJ' : 'Data Draft Pendaftar Reguler'}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {mode === 'pjj' 
              ? 'Kelola draft pendaftaran jalur Pendidikan Jarak Jauh' 
              : 'Kelola draft pendaftaran jalur reguler, prestasi, dan undangan'}
          </p>
        </div>
      </div>

      {/* Modern Search & Filter Bar */}
      <div className="bg-white rounded-lg border shadow-sm">
        {/* Top Row */}
        <div className="p-4 flex flex-col md:flex-row gap-3 border-b border-gray-200">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, NISN, atau asal sekolah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            title="Export to Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Dropdown */}
        {showFilterDropdown && (
          <div className="border-b border-gray-200">
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mode !== 'pjj' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={jalurFilter}
                      onChange={(e) => setJalurFilter(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="prestasi">Prestasi</option>
                      <option value="reguler">Reguler</option>
                      <option value="undangan">Undangan</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">All Time</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Display Columns</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'no' as const, label: 'No' },
                    { id: 'name' as const, label: 'Nama' },
                    { id: 'jalur' as const, label: 'Jalur' },
                    { id: 'school' as const, label: 'Asal Sekolah' },
                    { id: 'status' as const, label: 'Status Kelengkapan' },
                    { id: 'date' as const, label: 'Tanggal Buat' },
                    { id: 'actions' as const, label: 'Aksi' },
                  ].map((col) => (
                    <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id]}
                        onChange={(e) => setVisibleColumns(prev => ({
                          ...prev,
                          [col.id]: e.target.checked
                        }))}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> of{' '}
          <span className="font-medium">{getFilteredData().length}</span> results
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
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
                    <div className="text-left truncate max-w-[150px]" title={item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah}>
                      {item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah || '-'}
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

      <StudentDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedData={selectedData as any}
      />

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




export default DataDraft;