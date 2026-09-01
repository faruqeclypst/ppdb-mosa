import React, { useState, useEffect } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { db } from '../../firebase/config';
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
  TrashIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PencilSquareIcon,
  DocumentCheckIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase/config';
import StudentDetailModal from './StudentDetailModal';
import { generateRegistrationCard, generateGraduationLetter } from '../../utils/pdfGenerator';
import { useRealtimePPDB } from '../../hooks/useRealtimePPDB';
import { syncDataToGoogleSheets } from '../../services/googleSheetsSync';
import RealtimeSpreadsheetModal from './modals/RealtimeSpreadsheetModal';
import EditStudentModal, { KABUPATEN_LIST } from './modals/EditStudentModal';
import ForceSubmitModal from './modals/ForceSubmitModal';
import { generateAtomicRegistrationNumber } from '../../utils/registrationNumber';

import { PPDBData, SchoolFilter, SortConfig } from '../../types/ppdb';
import { StatusBadge, JalurBadge } from './AdminBadges';
import { exportPendaftarToExcel, exportCombinedToExcel } from './utils/exportExcel';
import StatusModal from './modals/StatusModal';
import ReasonModal from './modals/ReasonModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import ResetConfirmModal from './modals/ResetConfirmModal';
import PhotoPreviewModal from './modals/PhotoPreviewModal';
import StudentPhotoAvatar from './StudentPhotoAvatar';

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
  const { user, userRole } = useAuth();
  const { pendaftar, setPendaftar, lastUpdatedTime } = useRealtimePPDB(userRole);
  
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRealtimeModal, setShowRealtimeModal] = useState(false);
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
  const [ppdbSettings, setPpdbSettings] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showForceSubmitModal, setShowForceSubmitModal] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleConfirmForceSubmit = async () => {
    if (!selectedData || modalLoading) return;
    setModalLoading(true);
    try {
      const kabupatenData = KABUPATEN_LIST.find(kab => kab.nama === selectedData.kabupaten);
      const kabupatenKode = kabupatenData?.kode || '00';

      let regNumber = selectedData.registrationNumber || '';
      if (!regNumber) {
        regNumber = await generateAtomicRegistrationNumber(db, selectedData.school, kabupatenKode);
      }

      const now = new Date().toISOString();
      const adminSchool: 'mosa' | 'fajar' | 'master' = 
        userRole?.isMaster || userRole?.school === 'all'
          ? 'master'
          : (userRole?.school === 'fajar' ? 'fajar' : 'mosa');

      const updatedBy = {
        email: user?.email || 'admin@ppdb.sch.id',
        name: user?.displayName || user?.email?.split('@')[0] || 'Admin',
        school: adminSchool,
        timestamp: now
      };

      const updatedData: PPDBData = {
        ...selectedData,
        status: 'submitted',
        submittedAt: now,
        lastUpdated: now,
        registrationNumber: regNumber,
        wasReset: false,
        updatedBy
      };

      await update(ref(db, `ppdb_${selectedData.school}/${selectedData.uid}`), updatedData);
      await syncDataToGoogleSheets(updatedData);

      setPendaftar(prev => prev.map(item => item.uid === selectedData.uid ? updatedData : item));

      showAlert('success', `Pendaftaran ${selectedData.namaSiswa || 'siswa'} berhasil diselesaikan paksa! No. Reg: ${regNumber}`);
      setShowForceSubmitModal(false);
      setSelectedData(null);
    } catch (error) {
      console.error('Error force completing pendaftar:', error);
      showAlert('error', 'Gagal menyelesaikan paksa data pendaftar.');
    } finally {
      setModalLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'settings/ppdb');
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        setPpdbSettings(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

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

      // Trigger Google Sheets Realtime Webhook sync
      syncDataToGoogleSheets({
        ...selectedData,
        ...updateData
      } as any);

      showAlert('success', `Status pendaftar berhasil diubah menjadi ${selectedStatus}`);
      setShowStatusModal(false);
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

  const getSpreadsheetData = () => {
    return pendaftar
      .filter(item => {
        if (mode === 'pjj') {
          if (item.jalur !== 'pjj') return false;
        } else {
          if (item.jalur === 'pjj') return false;
        }
        if (schoolFilter !== 'all' && item.school !== schoolFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
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

  const handleExport = () => {
    exportPendaftarToExcel(getFilteredData(), userRole, mode);
  };

  const getFilteredCombinedData = () => {
    return pendaftar.filter(item => {
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
    });
  };

  const handleExportCombined = () => {
    exportCombinedToExcel(getFilteredCombinedData(), userRole, mode);
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

  const handleDownloadBuktiDaftar = async (item: PPDBData) => {
    setShowActionDropdown(null);
    await generateRegistrationCard(item as any, showAlert);
  };

  const handleDownloadBuktiLulus = async (item: PPDBData) => {
    setShowActionDropdown(null);
    await generateGraduationLetter(item as any, showAlert, ppdbSettings);
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

          <div className="grid grid-cols-2 gap-1.5">
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
              onClick={() => {
                setSelectedData(item);
                setShowEditModal(true);
                setExpandedRow(null);
              }}
              className="flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-600 py-2 rounded-lg text-xs transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            
            <Button
              onClick={() => handleOpenStatusModal(item)}
              className="flex items-center justify-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 py-2 rounded-lg text-xs transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Status</span>
            </Button>

            {item.status === 'draft' && (
              <Button
                onClick={() => {
                  setSelectedData(item);
                  setShowForceSubmitModal(true);
                  setExpandedRow(null);
                }}
                className="flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-2 rounded-lg text-xs transition-colors"
              >
                <DocumentCheckIcon className="w-4 h-4" />
                <span>Paksa Selesai</span>
              </Button>
            )}
            
            <Button
              onClick={() => {
                setSelectedData(item);
                setShowDeleteModal(true);
                setShowActionDropdown(null);
              }}
              className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-xs transition-colors col-span-2"
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
    <div className="space-y-6 w-full font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              {mode === 'pjj' ? 'Data Pendaftar SPMB Jarak Jauh (PJJ)' : 'Data Pendaftar SPMB Reguler'}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {getFilteredData().length} Data
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {mode === 'pjj' 
              ? 'Monitoring, verifikasi berkas, dan penetapan status kelulusan 5 sekolah mitra PJJ' 
              : 'Monitoring berkas pendaftaran jalur prestasi, reguler tes, dan undangan'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRealtimeModal(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition-all text-xs font-bold shadow-md shadow-emerald-950/10 active:scale-95 shrink-0"
            title="Buka Realtime Spreadsheet Grid & Sync Google Sheets"
          >
            <TableCellsIcon className="w-4 h-4 text-emerald-300" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Spreadsheet Live</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl transition-colors text-xs font-bold shadow-xs shrink-0"
            title="Export Data Pendaftar ke Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={handleExportCombined}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-colors text-xs font-bold shadow-xs shrink-0"
            title="Export Gabungan Data Pendaftar + Draft ke Excel"
          >
            <DocumentArrowDownIcon className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Export Gabungan</span>
          </button>
        </div>
      </div>

      {/* Main Double-Bezel Data Table Card */}
      <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden space-y-4">
        <div className="p-5 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nama calon siswa, NISN, asal sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 font-medium outline-none transition-all placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Status Filter Chips */}
              <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/60">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'diterima', label: 'Lulus' },
                  { id: 'ditolak', label: 'Ditolak' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={classNames(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      statusFilter === tab.id
                        ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60'
                        : 'text-zinc-500 hover:text-zinc-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Advanced Filter Toggle */}
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={classNames(
                  'flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-colors shadow-2xs',
                  showFilterDropdown ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                )}
              >
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>Filter Lanjut</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200 text-xs font-medium text-zinc-500">
                <span>Baris:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Filters & Column Visibility */}
          {showFilterDropdown && (
            <div className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/80 space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Filter Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-medium"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Pending Verifikasi</option>
                    <option value="diterima">Diterima / Lulus</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                {mode !== 'pjj' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Jalur Pendaftaran</label>
                    <select
                      value={jalurFilter}
                      onChange={(e) => setJalurFilter(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-medium"
                    >
                      <option value="all">Semua Jalur</option>
                      <option value="prestasi">Prestasi</option>
                      <option value="reguler">Reguler</option>
                      <option value="undangan">Undangan</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Urutan Tanggal</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-medium"
                  >
                    <option value="newest">Terbaru Mendaftar</option>
                    <option value="oldest">Terlama Mendaftar</option>
                  </select>
                </div>
              </div>

              {/* Display Columns Toggler */}
              <div className="pt-3 border-t border-zinc-200/60">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2">Visibilitas Kolom Tabel</label>
                <div className="flex flex-wrap gap-2">
                  {allHeaders.map((col) => (
                    <label 
                      key={col.key} 
                      className={classNames(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors",
                        visibleColumns[col.key as keyof typeof visibleColumns]
                          ? "bg-white border-zinc-300 text-zinc-800 shadow-2xs"
                          : "bg-zinc-100 border-transparent text-zinc-400"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key as keyof typeof visibleColumns]}
                        onChange={(e) => setVisibleColumns(prev => ({
                          ...prev,
                          [col.key]: e.target.checked
                        }))}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table View & Mobile Cards */}
          {getFilteredData().length > 0 ? (
            <>
              {/* Mobile Card List (< 768px) */}
              <div className="md:hidden space-y-3">
                {getFilteredData().map(renderMobileRow)}
              </div>

              {/* Desktop Modern Data Grid (>= 768px) */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/90 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                      {visibleColumns.no && <th className="px-3.5 py-3 text-center w-12">No</th>}
                      {visibleColumns.name && (
                        <th className="px-4 py-3 min-w-[220px] cursor-pointer select-none hover:text-zinc-900" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">
                            <span>Calon Siswa</span>
                            {sortConfig?.key === 'name' && <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                      )}
                      {visibleColumns.pjjSchool && <th className="px-4 py-3 min-w-[180px]">Sekolah Mitra PJJ</th>}
                      {visibleColumns.jalur && (
                        <th className="px-4 py-3 min-w-[110px] cursor-pointer select-none hover:text-zinc-900" onClick={() => handleSort('jalur')}>
                          <div className="flex items-center gap-1">
                            <span>Jalur</span>
                            {sortConfig?.key === 'jalur' && <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                      )}
                      {visibleColumns.school && (
                        <th className="px-4 py-3 min-w-[180px] cursor-pointer select-none hover:text-zinc-900" onClick={() => handleSort('school')}>
                          <div className="flex items-center gap-1">
                            <span>Asal Sekolah</span>
                            {sortConfig?.key === 'school' && <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                      )}
                      {visibleColumns.status && (
                        <th className="px-4 py-3 min-w-[120px] cursor-pointer select-none hover:text-zinc-900" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1">
                            <span>Status</span>
                            {sortConfig?.key === 'status' && <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                      )}
                      {visibleColumns.reRegistered && <th className="px-4 py-3 min-w-[110px]">Daftar Ulang</th>}
                      {visibleColumns.admin && <th className="px-4 py-3 min-w-[160px]">Verifikator</th>}
                      {visibleColumns.date && (
                        <th className="px-4 py-3 min-w-[150px] cursor-pointer select-none hover:text-zinc-900" onClick={() => handleSort('date')}>
                          <div className="flex items-center gap-1">
                            <span>Tanggal Kirim</span>
                            {sortConfig?.key === 'date' && <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                          </div>
                        </th>
                      )}
                      {visibleColumns.actions && (
                        <th className="px-4 py-3 min-w-[170px] text-right sticky right-0 bg-zinc-50/95 backdrop-blur-xs shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                          Aksi Cepat
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {getPaginatedData().map((item, index) => {
                      if (!item) return null;
                      const rowNumber = ((currentPage - 1) * itemsPerPage) + index + 1;
                      const phoneStr = (item as any).noHp || (item as any).noWa || (item as any).telepon || item.hpAyah || item.hpIbu || '';
                      const hasPhone = Boolean(phoneStr);
                      const cleanPhone = phoneStr.replace(/[^0-9]/g, '');
                      const waFormatted = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;

                      return (
                        <tr key={item.uid} className="hover:bg-emerald-50/30 transition-colors group">
                          {/* 1. NO */}
                          {visibleColumns.no && (
                            <td className="px-3.5 py-3 text-center font-mono font-bold text-zinc-400 text-[11px]">
                              {rowNumber}
                            </td>
                          )}

                          {/* 2. CALON SISWA */}
                          {visibleColumns.name && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <StudentPhotoAvatar
                                  photo={item.photo}
                                  name={item.namaSiswa}
                                  size="md"
                                  variant="emerald"
                                  onClick={() => {
                                    setSelectedData(item);
                                    setShowPhotoModal(true);
                                  }}
                                />
                                <div className="min-w-0">
                                  <button
                                    onClick={() => {
                                      setSelectedData(item);
                                      setShowDetailModal(true);
                                    }}
                                    className="font-extrabold text-zinc-900 hover:text-emerald-700 transition-colors text-left block truncate max-w-[180px]"
                                    title={item.namaSiswa}
                                  >
                                    {item.namaSiswa}
                                  </button>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-medium">
                                    <span>{item.nisn ? `NISN: ${item.nisn}` : 'NISN: -'}</span>
                                    {item.jenisKelamin && (
                                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-bold uppercase text-[9px]">
                                        {item.jenisKelamin.startsWith('L') ? 'L' : 'P'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* 3. SEKOLAH PJJ */}
                          {visibleColumns.pjjSchool && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 max-w-[200px]" title={item.pjjSchool || '-'}>
                                <MapPinIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-bold text-zinc-800 truncate text-xs">
                                  {item.pjjSchool || '-'}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* 4. JALUR */}
                          {visibleColumns.jalur && (
                            <td className="px-4 py-3">
                              <JalurBadge jalur={item.jalur} />
                            </td>
                          )}

                          {/* 5. ASAL SEKOLAH */}
                          {visibleColumns.school && (
                            <td className="px-4 py-3">
                              <div className="max-w-[180px] truncate text-zinc-700 font-medium" title={item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah}>
                                <span>{item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual || 'Sekolah Lain') : item.asalSekolah}</span>
                              </div>
                            </td>
                          )}

                          {/* 6. STATUS */}
                          {visibleColumns.status && (
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.adminStatus) {
                                    setSelectedData(item);
                                    setShowReasonModal(true);
                                  } else {
                                    handleOpenStatusModal(item);
                                  }
                                }}
                                className="cursor-pointer focus:outline-none"
                                title={item.adminStatus ? 'Lihat catatan verifikasi' : 'Ubah Status'}
                              >
                                <StatusBadge 
                                  status={item.status}
                                  adminStatus={item.adminStatus}
                                />
                              </button>
                            </td>
                          )}

                          {/* 7. DAFTAR ULANG */}
                          {visibleColumns.reRegistered && (
                            <td className="px-4 py-3">
                              {item.adminStatus === 'diterima' ? (
                                item.reRegistered ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs" title={item.reRegisteredAt ? `Daftar ulang pada: ${formatDateTime(item.reRegisteredAt)}` : ''}>
                                    Sudah
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">
                                    Belum
                                  </span>
                                )
                              ) : (
                                <span className="text-zinc-300 font-medium">-</span>
                              )}
                            </td>
                          )}

                          {/* 8. VERIFIKATOR */}
                          {visibleColumns.admin && (
                            <td className="px-4 py-3">
                              {item.updatedBy ? (
                                <div>
                                  <div className="font-bold text-zinc-800 text-xs">
                                    {item.updatedBy.name || item.updatedBy.email?.split('@')[0] || 'Admin'}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    {item.updatedBy.school === 'master' ? 'Admin Master' : 'Verifikator'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-300">-</span>
                              )}
                            </td>
                          )}

                          {/* 9. TANGGAL */}
                          {visibleColumns.date && (
                            <td className="px-4 py-3 text-zinc-500 font-medium text-[11px] whitespace-nowrap">
                              {formatDateTime(item.submittedAt || item.createdAt)}
                            </td>
                          )}

                          {/* 10. AKSI CEPAT */}
                          {visibleColumns.actions && (
                            <td className="px-4 py-3 text-right sticky right-0 bg-white/95 backdrop-blur-xs group-hover:bg-emerald-50/80 transition-colors shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.05)]">
                              <div className="flex items-center justify-end gap-1">
                                {/* Direct WhatsApp Trigger */}
                                {hasPhone && (
                                  <a
                                    href={`https://wa.me/${waFormatted}?text=Halo%20${encodeURIComponent(item.namaSiswa || '')},%20terkait%20pendaftaran%20SPMB...`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-colors shadow-2xs"
                                    title="Hubungi Calon Siswa via WhatsApp"
                                  >
                                    <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {/* Detail Modal */}
                                <button
                                  onClick={() => {
                                    setSelectedData(item);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/70 transition-colors shadow-2xs"
                                  title="Lihat Detail Pendaftar"
                                >
                                  <EyeIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Modal */}
                                <button
                                  onClick={() => {
                                    setSelectedData(item);
                                    setShowEditModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 transition-colors shadow-2xs"
                                  title="Edit Formulir"
                                >
                                  <PencilSquareIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Status Modal */}
                                <button
                                  onClick={() => handleOpenStatusModal(item)}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-colors shadow-2xs"
                                  title="Ubah Status Kelulusan"
                                >
                                  <CheckCircleIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* More Actions Dropdown */}
                                <div className="relative inline-block text-left">
                                  <button
                                    onClick={() => setShowActionDropdown(showActionDropdown === item.uid ? null : item.uid)}
                                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200/70 transition-colors shadow-2xs"
                                    title="Menu Lainnya"
                                  >
                                    <ChevronDownIcon className="w-3.5 h-3.5" />
                                  </button>

                                  {showActionDropdown === item.uid && (
                                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-zinc-200 p-1 z-50 animate-in fade-in duration-100">
                                      <button
                                        onClick={() => {
                                          handleDownloadBuktiDaftar(item);
                                          setShowActionDropdown(null);
                                        }}
                                        className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center gap-2"
                                      >
                                        <DocumentTextIcon className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Unduh Bukti</span>
                                      </button>

                                      {item.adminStatus === 'diterima' && (
                                        <button
                                          onClick={() => {
                                            handleDownloadBuktiLulus(item);
                                            setShowActionDropdown(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2"
                                        >
                                          <DocumentArrowDownIcon className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Surat Lulus</span>
                                        </button>
                                      )}

                                      {item.status === 'draft' && (
                                        <button
                                          onClick={() => {
                                            setSelectedData(item);
                                            setShowForceSubmitModal(true);
                                            setShowActionDropdown(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2"
                                        >
                                          <DocumentCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Selesaikan Paksa</span>
                                        </button>
                                      )}

                                      <div className="border-t border-zinc-100 my-1" />

                                      {userRole?.isMaster && (
                                        <button
                                          onClick={() => {
                                            setSelectedData(item);
                                            setShowResetModal(true);
                                            setShowActionDropdown(null);
                                          }}
                                          className="w-full px-2.5 py-1.5 text-left text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg flex items-center gap-2"
                                        >
                                          <ArrowPathIcon className="w-3.5 h-3.5 text-purple-600" />
                                          <span>Reset Data</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => {
                                          setSelectedData(item);
                                          setShowDeleteModal(true);
                                          setShowActionDropdown(null);
                                        }}
                                        className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                                      >
                                        <TrashIcon className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Hapus Data</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer: Status & Pagination */}
              <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
                <div>
                  Menampilkan <span className="font-bold text-zinc-800">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-zinc-800">{Math.min(currentPage * itemsPerPage, getFilteredData().length)}</span> dari <span className="font-bold text-zinc-800">{getFilteredData().length}</span> pendaftar
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={getTotalPages()}
                  onPageChange={setCurrentPage}
                  totalItems={getFilteredData().length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-zinc-50/60 rounded-2xl border border-zinc-100">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="mx-auto w-12 h-12 bg-white rounded-2xl shadow-2xs border border-zinc-200/80 flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900">
                    Data Tidak Ditemukan
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tidak ada pendaftar yang sesuai dengan kata kunci pencarian atau filter yang dipilih
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setJalurFilter('all');
                    setSchoolFilter('all');
                  }}
                  className="px-3.5 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold shadow-2xs transition-colors"
                >
                  Reset Semua Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StudentDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedData={selectedData as any}
        onEdit={(data) => {
          setSelectedData(data);
          setShowEditModal(true);
        }}
        onForceSubmit={(data) => {
          setSelectedData(data);
          setShowForceSubmitModal(true);
        }}
      />

      <EditStudentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        selectedData={selectedData}
        userRole={userRole}
        onSaveSuccess={(updated) => {
          setPendaftar(prev => prev.map(item => item.uid === updated.uid ? updated : item));
        }}
        onForceSubmit={(data) => {
          setSelectedData(data);
          setShowForceSubmitModal(true);
        }}
      />

      <ForceSubmitModal
        isOpen={showForceSubmitModal}
        onClose={() => setShowForceSubmitModal(false)}
        selectedData={selectedData}
        modalLoading={modalLoading}
        onConfirm={handleConfirmForceSubmit}
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

      <RealtimeSpreadsheetModal
        isOpen={showRealtimeModal}
        onClose={() => setShowRealtimeModal(false)}
        data={getSpreadsheetData()}
        userRole={userRole}
        mode={mode}
        lastUpdatedTime={lastUpdatedTime}
      />
    </div>
  );
};

export default DataPendaftar;
