import React, { useState, useEffect } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import { showAlert } from '../ui/Alert';
import { deleteFromR2, testR2Connection } from '../../services/cloudflareR2';
import { 
  CheckCircleIcon, 
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase/config';
import StudentDetailModal from './StudentDetailModal';

// Shared imports
import { PPDBData, SchoolFilter, SortConfig } from '../../types/ppdb';
import { StatusBadge, JalurBadge } from './AdminBadges';
import { exportPendaftarToExcel } from './utils/exportExcel';
import StatusModal from './modals/StatusModal';
import ReasonModal from './modals/ReasonModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import ResetConfirmModal from './modals/ResetConfirmModal';
import PhotoPreviewModal from './modals/PhotoPreviewModal';

interface DataPendaftarProps {
  mode?: 'regular' | 'pjj';
}

const customScrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .custom-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;

const DataPendaftar: React.FC<DataPendaftarProps> = ({ mode = 'regular' }) => {
  const { userRole } = useAuth();
  
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'diterima' | 'ditolak'>('all');
  const [jalurFilter, setJalurFilter] = useState<'all' | 'prestasi' | 'reguler' | 'undangan' | 'pjj'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [modalLoading, setModalLoading] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    no: true,
    name: true,
    pjjSchool: mode === 'pjj',
    jalur: true,
    school: true,
    status: true,
    reRegistered: true,
    admin: true,
    date: true,
    actions: true
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'diterima' | 'ditolak' | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState<SchoolFilter>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);

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

  // Reset pagination when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, jalurFilter, schoolFilter, sortBy, sortConfig, itemsPerPage]);

  const loadData = async () => {
    try {
      if (!userRole) return;

      if (userRole.isMaster) {
        const mosaRef = ref(db, 'ppdb_mosa');
        const fajarRef = ref(db, 'ppdb_fajar');
        
        const [mosaSnapshot, fajarSnapshot] = await Promise.all([
          get(mosaRef),
          get(fajarRef)
        ]);
        
        const mosaData: PPDBData[] = mosaSnapshot.exists() ? 
          Object.entries(mosaSnapshot.val()).map(([uid, value]) => ({
            uid,
            school: 'mosa' as const,
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          })) : [];
        
        const fajarData: PPDBData[] = fajarSnapshot.exists() ? 
          Object.entries(fajarSnapshot.val()).map(([uid, value]) => ({
            uid,
            school: 'fajar' as const,
            ...(value as Omit<PPDBData, 'uid' | 'school'>)
          })) : [];
        
        setPendaftar([...mosaData, ...fajarData]);
      } else {
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
      showAlert('error', 'Gagal memuat data pendaftar');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedData || modalLoading || !userRole || !selectedStatus) return;

    setModalLoading(true);
    try {
      const currentUser = auth.currentUser;
      const adminRef = ref(db, `admins/${currentUser?.uid}`);
      const adminSnapshot = await get(adminRef);
      const adminData = adminSnapshot.val();

      const updatedBy = {
        email: currentUser?.email || 'unknown',
        school: userRole.isMaster ? 'master' as const : (userRole.school as 'mosa' | 'fajar'),
        timestamp: new Date().toISOString(),
        name: adminData?.fullName || adminData?.name || currentUser?.email?.split('@')[0] || 'Admin'
      };

      const updateData = {
        adminStatus: selectedStatus,
        alasanPenolakan: selectedStatus === 'ditolak' ? alasanPenolakan : null,
        updatedAt: new Date().toISOString(),
        updatedBy
      };

      await update(ref(db, `ppdb_${selectedData.school}/${selectedData.uid}`), updateData);

      showAlert('success', `Status pendaftar berhasil diubah menjadi ${selectedStatus}`);
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
    const filtered = pendaftar
      .filter(item => item.status === 'submitted')
      .filter(item => {
        if (mode === 'pjj') {
          if (item.jalur !== 'pjj') return false;
        } else {
          if (item.jalur === 'pjj') return false;
        }

        const matchSearch = 
          (item.namaSiswa?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (item.nisn || '').includes(searchQuery) ||
          (item.asalSekolah?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        const matchStatus = 
          statusFilter === 'all' ? true : 
          statusFilter === 'pending' ? !item.adminStatus :
          statusFilter === 'diterima' ? item.adminStatus === 'diterima' :
          statusFilter === 'ditolak' ? item.adminStatus === 'ditolak' : true;

        const matchJalur = 
          jalurFilter === 'all' ? true : item.jalur === jalurFilter;
        const matchSchool = 
          schoolFilter === 'all' ? true : item.school === schoolFilter;
        
        return matchSearch && matchStatus && matchJalur && matchSchool;
      });

    const getSortValue = (item: PPDBData, key: string): string | number => {
      switch (key) {
        case 'no':
          return 0;
        case 'name':
          return item.namaSiswa || '';
        case 'jalur':
          return item.jalur || '';
        case 'school':
          return item.asalSekolah || '';
        case 'status': {
          const order: Record<string, number> = { pending: 0, diterima: 1, ditolak: 2 };
          return order[item.adminStatus ?? 'pending'] ?? 0;
        }
        case 'admin':
          return item.updatedBy?.name || item.updatedBy?.email || '';
        case 'date': {
          const date = new Date(item.submittedAt || item.createdAt);
          const time = date.getTime();
          return Number.isFinite(time) ? time : 0;
        }
        default:
          return '';
      }
    };

    const comparePrimitive = (a: string | number, b: string | number) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b), 'id-ID', { sensitivity: 'base' });
    };

    const compareByDateRange = (a: PPDBData, b: PPDBData) => {
      const dateA = getSortValue(a, 'date') as number;
      const dateB = getSortValue(b, 'date') as number;
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    };

    if (sortConfig?.key) {
      const { key, direction } = sortConfig;
      const dir = direction === 'asc' ? 1 : -1;

      return filtered
        .slice()
        .sort((a, b) => {
          const primary = comparePrimitive(getSortValue(a, key), getSortValue(b, key)) * dir;
          if (primary !== 0) return primary;
          if (key === 'date') return 0;
          return compareByDateRange(a, b);
        });
    }

    return filtered.slice().sort(compareByDateRange);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const allHeaders = [
    { key: 'no', label: 'No' },
    { key: 'name', label: 'Nama' },
    ...(mode === 'pjj' ? [{ key: 'pjjSchool', label: 'Sekolah PJJ' }] : []),
    { key: 'jalur', label: 'Jalur' },
    { key: 'school', label: 'Asal Sekolah' },
    { key: 'status', label: 'Status' },
    { key: 'reRegistered', label: 'Daftar Ulang' },
    { key: 'admin', label: 'Pemeriksa' },
    { key: 'date', label: 'Tanggal Kirim' },
    { key: 'actions', label: 'Aksi' }
  ];

  const sortableHeaderKeys = new Set(['name', 'jalur', 'school', 'status', 'admin', 'date']);

  const headers = allHeaders
    .filter(h => visibleColumns[h.key as keyof typeof visibleColumns])
    .map(header => ({
      content: (
        <div className="text-left">
          {sortableHeaderKeys.has(header.key) ? (
            <button
              onClick={() => handleSort(header.key)}
              className="flex items-center gap-1 hover:text-blue-600"
              type="button"
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
          ) : (
            <span className="font-medium text-gray-700">{header.label}</span>
          )}
        </div>
      )
    }));

  const handleExport = () => {
    exportPendaftarToExcel(getFilteredData(), userRole, mode);
  };

  const getPaginatedData = () => {
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    const emptyRowsNeeded = itemsPerPage - pageData.length;
    if (emptyRowsNeeded > 0 && pageData.length > 0) {
      for (let i = 0; i < emptyRowsNeeded; i++) {
        pageData.push(null as any);
      }
    }
    
    return pageData;
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredData().length / itemsPerPage);
  };

  const extractFileKeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error('Error extracting file key from URL:', url, error);
      return null;
    }
  };

  const handleDeleteData = async () => {
    if (!selectedData || modalLoading) return;

    setModalLoading(true);
    try {
      const filesToDelete: string[] = [];
      
      if (selectedData.photo) filesToDelete.push(selectedData.photo);
      if (selectedData.rekomendasi) filesToDelete.push(selectedData.rekomendasi);
      if (selectedData.raport2) filesToDelete.push(selectedData.raport2);
      if (selectedData.raport3) filesToDelete.push(selectedData.raport3);
      if (selectedData.raport4) filesToDelete.push(selectedData.raport4);
      if (selectedData.sertifikat) filesToDelete.push(selectedData.sertifikat);
      if (selectedData.ijazah) filesToDelete.push(selectedData.ijazah);
      if (selectedData.kartuKeluarga) filesToDelete.push(selectedData.kartuKeluarga);
      if (selectedData.aktaKelahiran) filesToDelete.push(selectedData.aktaKelahiran);
      if (selectedData.lampiranA) filesToDelete.push(selectedData.lampiranA);
      if (selectedData.lampiranB) filesToDelete.push(selectedData.lampiranB);

      if (filesToDelete.length > 0) {
        const connectionTest = await testR2Connection();
        if (!connectionTest.success) {
          console.warn('R2 connection test failed, continuing deletion:', connectionTest.message);
        }
        
        const deletePromises = filesToDelete.map(async (fileUrl) => {
          try {
            const fileKey = extractFileKeyFromUrl(fileUrl);
            if (!fileKey) return { success: false, fileUrl };
            await deleteFromR2(fileKey);
            return { success: true, fileUrl };
          } catch (error) {
            console.error('Failed to delete file from R2:', fileUrl, error);
            return { success: false, fileUrl };
          }
        });
        
        await Promise.allSettled(deletePromises);
      }

      await remove(ref(db, `ppdb_${selectedData.school}/${selectedData.uid}`));
      setPendaftar(prev => prev.filter(item => item.uid !== selectedData.uid));
      
      showAlert('success', 'Data pendaftar dan file terkait berhasil dihapus');
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} - ${hours}.${minutes}`;
    } catch (error) {
      return '-';
    }
  };

  const handleOpenStatusModal = (data: PPDBData) => {
    setSelectedData(data);
    setSelectedStatus(data.adminStatus || null);
    setAlasanPenolakan(data.alasanPenolakan || '');
    setShowStatusModal(true);
    setShowActionDropdown(null);
  };

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
      await update(ref(db, `ppdb_${selectedData.school}/${selectedData.uid}`), {
        status: 'draft',
        adminStatus: null,
        alasanPenolakan: null,
        lastUpdated: new Date().toISOString(),
        isReset: true,
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (item.adminStatus) {
                setSelectedData(item);
                setShowReasonModal(true);
              }
            }}
            className={classNames(
              "focus:outline-none",
              item.adminStatus ? "cursor-pointer" : "cursor-default"
            )}
            title={item.adminStatus ? 'Lihat status keputusan' : undefined}
          >
            <StatusBadge 
              status={item.status}
              adminStatus={item.adminStatus}
              className="text-xs"
            />
          </button>
          <ChevronDownIcon 
            className={classNames(
              "w-4 h-4 text-gray-400 transition-transform",
              expandedRow === item.uid ? "transform rotate-180" : ""
            )}
          />
        </div>
      </div>

      {expandedRow === item.uid && (
        <div className="px-3 pb-3 space-y-3 bg-gray-50">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Jalur</p>
              <JalurBadge jalur={item.jalur} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Asal Sekolah</p>
              <p className="text-sm text-gray-900">
                {item.asalSekolah === 'SEKOLAH LAIN' 
                  ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') 
                  : item.asalSekolah}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pemeriksa</p>
              <p className="text-sm text-gray-900">
                {item.updatedBy ? (
                  <>
                    <span className="font-medium">
                      {item.updatedBy.name || item.updatedBy.email.split('@')[0]}
                    </span>
                    {item.updatedBy.school === 'master' && (
                      <div className="text-xs text-blue-600 font-medium">Admin Master</div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </p>
            </div>
            {item.updatedBy && (
              <div>
                <p className="text-xs text-gray-500">Tanggal Kirim</p>
                <p className="text-sm text-gray-900">
                  {formatDateTime(item.updatedBy.timestamp)}
                </p>
              </div>
            )}
            {item.adminStatus === 'diterima' && (
              <div>
                <p className="text-xs text-gray-500">Daftar Ulang</p>
                <p className="text-sm font-semibold">
                  {item.reRegistered ? (
                    <span className="text-green-700">Sudah ({formatDateTime(item.reRegisteredAt)})</span>
                  ) : (
                    <span className="text-gray-500 font-medium">Belum</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <Button
              onClick={() => {
                setSelectedData(item);
                setShowDetailModal(true);
                setShowActionDropdown(null);
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
                setShowActionDropdown(null);
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
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Data Pendaftar
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {userRole?.isMaster 
                ? "Belum ada pendaftar di kedua sekolah"
                : `Belum ada pendaftar di ${userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}`
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
            {mode === 'pjj' ? 'Data Pendaftar Pendidikan Jarak Jauh (PJJ)' : 'Data Pendaftar Reguler'}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {mode === 'pjj' 
              ? 'Kelola data siswa pendaftar jalur Pendidikan Jarak Jauh' 
              : 'Kelola data siswa pendaftar jalur reguler, prestasi, dan undangan'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, atau asal sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex-1 md:flex-none justify-center"
              >
                <FunnelIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex-1 md:flex-none"
                title="Export to Excel"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
              </button>

              <button
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex-1 md:flex-none"
                title="Refresh"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilterDropdown && (
          <div className="border-b border-gray-200">
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="diterima">Diterima</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                {mode !== 'pjj' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={jalurFilter}
                      onChange={(e) => setJalurFilter(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  {allHeaders.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key as keyof typeof visibleColumns]}
                        onChange={(e) => setVisibleColumns(prev => ({
                          ...prev,
                          [col.key]: e.target.checked
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
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        {getFilteredData().length > 0 ? (
          <>
            <div className="md:hidden space-y-3">
              {getFilteredData().map(renderMobileRow)}
            </div>

            <div className="hidden md:block">
              <Table 
                headers={headers}
                data={getPaginatedData().map((item, index) => {
                  if (!item) {
                    return Array(headers.length).fill(
                      <div className="text-left text-gray-300 py-3">&nbsp;</div>
                    );
                  }
                  
                  const allCells = {
                    no: <div className="text-left text-gray-600">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </div>,
                    name: <div className="text-left truncate max-w-[150px]" title={item.namaSiswa}>
                      {item.namaSiswa}
                    </div>,
                    pjjSchool: <div className="text-left font-medium text-emerald-800 truncate max-w-[180px]" title={item.pjjSchool || '-'}>
                      {item.pjjSchool || '-'}
                    </div>,
                    jalur: <div className="text-left">
                      <JalurBadge key={item.uid} jalur={item.jalur} />
                    </div>,
                    school: <div className="text-left truncate max-w-[150px]" title={item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah}>
                      {item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah}
                    </div>,
                    status: <div className="text-left">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.adminStatus) {
                            setSelectedData(item);
                            setShowReasonModal(true);
                          }
                        }}
                        className={classNames(
                          item.adminStatus ? "cursor-pointer" : "cursor-default",
                          "focus:outline-none"
                        )}
                        title={item.adminStatus ? 'Lihat alasan penolakan' : undefined}
                      >
                        <StatusBadge 
                          status={item.status}
                          adminStatus={item.adminStatus}
                          className="text-xs"
                        />
                      </button>
                    </div>,
                    reRegistered: <div className="text-left">
                      {item.adminStatus === 'diterima' ? (
                        item.reRegistered ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200" title={item.reRegisteredAt ? `Daftar ulang pada: ${formatDateTime(item.reRegisteredAt)}` : ''}>
                            Sudah
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Belum
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 font-medium">-</span>
                      )}
                    </div>,
                    admin: <div className="text-left">
                      {item.updatedBy ? (
                        <span className="text-sm font-medium text-gray-900">
                          {item.updatedBy.name || item.updatedBy.email.split('@')[0]}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                      {item.updatedBy?.school === 'master' && (
                        <div className="text-xs text-blue-600 font-medium">Admin Master</div>
                      )}
                    </div>,
                    date: <div className="text-left">
                      {formatDateTime(item.submittedAt || item.createdAt)}
                    </div>,
                    actions: <div className="text-left relative action-dropdown">
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
                              handleOpenStatusModal(item);
                              setShowActionDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Ubah Status
                          </button>
                          {userRole?.isMaster && (
                            <button
                              onClick={() => {
                                setSelectedData(item);
                                setShowResetModal(true);
                                setShowActionDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              Reset Data
                            </button>
                          )}
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
                  };

                  return allHeaders
                    .filter(h => visibleColumns[h.key as keyof typeof visibleColumns])
                    .map(h => allCells[h.key as keyof typeof allCells]);
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
                Data Tidak Ditemukan
              </h3>
              <p className="text-gray-500 mb-4">
                Tidak ada data yang sesuai dengan filter yang dipilih
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
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

      {/* Extracted modals */}
      <StatusModal
        isOpen={showStatusModal}
        onClose={handleCloseStatusModal}
        selectedData={selectedData}
        modalLoading={modalLoading}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        alasanPenolakan={alasanPenolakan}
        setAlasanPenolakan={setAlasanPenolakan}
        onSave={handleUpdateStatus}
      />

      <ReasonModal
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setSelectedData(null);
        }}
        selectedData={selectedData}
        formatDateTime={formatDateTime}
      />

      <PhotoPreviewModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        imageUrl={selectedData?.photo}
        title={selectedData?.namaSiswa}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        selectedData={selectedData}
        modalLoading={modalLoading}
        deleteConfirmation={deleteConfirmation}
        setDeleteConfirmation={setDeleteConfirmation}
        onConfirm={handleDeleteData}
      />

      <ResetConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        selectedData={selectedData}
        modalLoading={modalLoading}
        onConfirm={handleResetData}
      />
    </div>
  );
};

export default DataPendaftar;
