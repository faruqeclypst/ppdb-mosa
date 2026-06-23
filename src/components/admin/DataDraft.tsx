import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import { showAlert } from '../ui/Alert';
import { deleteFromR2, testR2Connection } from '../../services/cloudflareR2';
import { 
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Pagination from '../ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import StudentDetailModal from './StudentDetailModal';

// Shared imports
import { PPDBData, SchoolFilter } from '../../types/ppdb';
import { StatusBadge, JalurBadge } from './AdminBadges';
import { exportDraftToExcel, getStatusKelengkapan } from './utils/exportExcel';
import DeleteConfirmModal from './modals/DeleteConfirmModal';

interface DataDraftProps {
  mode?: 'regular' | 'pjj';
}

const DataDraft: React.FC<DataDraftProps> = ({ mode = 'regular' }) => {
  const { userRole } = useAuth();
  
  const [pendaftar, setPendaftar] = useState<PPDBData[]>([]);
  const [selectedData, setSelectedData] = useState<PPDBData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jalurFilter, setJalurFilter] = useState<'all' | 'prestasi' | 'reguler' | 'undangan' | 'pjj'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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
      showAlert('error', 'Gagal memuat data draft');
    }
  };

  const getFilteredData = () => {
    return pendaftar
      .filter(item => item.status === 'draft' || item.status === 'pending')
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

  const headers = [
    'No',
    'Nama',
    ...(mode === 'pjj' ? ['Sekolah PJJ'] : []),
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

  const handleExport = () => {
    exportDraftToExcel(getFilteredData(), userRole, mode);
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

      {expandedRow === item.uid && (
        <div className="px-3 pb-3 space-y-3 bg-gray-50">
          <div className="space-y-2">
            {item.jalur && (
              <div>
                <p className="text-xs text-gray-500">Jalur</p>
                <JalurBadge jalur={item.jalur} />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Asal Sekolah</p>
              <p className="text-sm text-gray-900">
                {item.asalSekolah === 'SEKOLAH LAIN' 
                  ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') 
                  : item.asalSekolah || '-'}
              </p>
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
                <ArrowPathIcon className="w-4 h-4 animate-spin-once" />
              </button>
            </div>
          </div>
        </div>

        {showFilterDropdown && (
          <div className="border-b border-gray-200">
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  return [
                    <div className="text-left text-gray-600">
                      {((currentPage - 1) * itemsPerPage) + index + 1}
                    </div>,
                    <div className="text-left truncate max-w-[150px]" title={item.namaSiswa || 'Draft Kosong'}>
                      {item.namaSiswa || 'Draft Kosong'}
                    </div>,
                    ...(mode === 'pjj' ? [
                      <div className="text-left font-medium text-emerald-800 truncate max-w-[180px]" title={item.pjjSchool || '-'}>
                        {item.pjjSchool || '-'}
                      </div>
                    ] : []),
                    <div className="text-left">
                      {item.jalur ? <JalurBadge key={item.uid} jalur={item.jalur} /> : '-'}
                    </div>,
                    <div className="text-left truncate max-w-[150px]" title={item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah || '-'}>
                      {item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual ? `${item.asalSekolahManual} (SEKOLAH LAIN)` : 'SEKOLAH LAIN') : item.asalSekolah || '-'}
                    </div>,
                    <div className="text-left">
                      <button
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setSelectedData(item);
                          setShowDetailModal(true);
                        }}
                      >
                        {getStatusKelengkapan(item)}
                      </button>
                    </div>,
                    <div className="text-left">
                      <StatusBadge status={item.status} className="text-xs" />
                    </div>,
                    <div className="text-left">
                      {formatDateTime(item.createdAt)}
                    </div>,
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
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-50">
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
                Data Tidak Ditemukan
              </h3>
              <p className="text-gray-500 mb-4">
                Tidak ada data yang sesuai dengan filter yang dipilih
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
    </div>
  );
};

export default DataDraft;