import React, { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Input from '../ui/Input';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import { showAlert } from '../ui/Alert';
import type { PPDBSettings as PPDBSettingsType } from '../../types/settings';
import Modal from '../ui/Modal';
import { uploadToR2, deleteFromR2, testR2Connection } from '../../services/cloudflareR2';
import { useAuth } from '../../contexts/AuthContext';

const initialSettings: PPDBSettingsType = {
  academicYear: '',
  jalurPrestasi: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    requirements: []
  },
  jalurReguler: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    requirements: []
  },
  jalurUndangan: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    requirements: []
  },
  jalurPjj: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    requirements: []
  },
  isActive: true,
  contactWhatsapp: {
    admin1: {
      name: '',
      whatsapp: ''
    },
    admin2: {
      name: '',
      whatsapp: ''
    },
    admin3: {
      name: '',
      whatsapp: ''
    },
    admin4: {
      name: '',
      whatsapp: ''
    }
  },
  customModal: {
    isEnabled: false,
    title: '',
    message: '',
    image: '',
    linkText: '',
    linkUrl: ''
  }
};

const RequirementsSection: React.FC<{
  jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj';
  requirements: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
}> = ({ jalur, requirements, onAdd, onRemove, onUpdate }) => {
  const jalurConfig = {
    jalurPrestasi: {
      color: 'blue',
      label: 'Prestasi'
    },
    jalurReguler: {
      color: 'green',
      label: 'Reguler'
    },
    jalurUndangan: {
      color: 'purple',
      label: 'Undangan'
    },
    jalurPjj: {
      color: 'amber',
      label: 'PJJ'
    }
  };

  const config = jalurConfig[jalur];

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      <div className="border-b pb-3">
        <h4 className="font-medium text-gray-900">
          Persyaratan Jalur {config.label}
        </h4>
      </div>

      <div className="space-y-2">
        {requirements?.length === 0 ? (
          <div className="text-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <div className="flex justify-center mb-2">
              <svg className={`w-6 h-6 text-${config.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 px-4">
              Belum ada persyaratan untuk jalur {config.label.toLowerCase()}
            </p>
          </div>
        ) : (
          requirements.map((req, index) => (
            <div 
              key={index} 
              className={`group flex items-center gap-2 bg-white rounded-lg border p-2 hover:border-${config.color}-200 transition-colors`}
            >
              <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center bg-${config.color}-50 rounded-lg`}>
                <span className={`text-sm font-medium text-${config.color}-600`}>{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  value={req}
                  onChange={(e) => onUpdate(index, e.target.value)}
                  placeholder={`Persyaratan ${index + 1}`}
                  className="w-full border-0 focus:ring-0 bg-transparent px-2"
                />
              </div>
              <Button
                onClick={() => onRemove(index)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t mt-2">
        <div className="text-sm text-gray-500">
          {requirements?.length > 0 && (
            <span>{requirements.length} persyaratan</span>
          )}
        </div>
        <Button
          onClick={onAdd}
          className={`bg-white text-${config.color}-600 hover:bg-${config.color}-50 
                     border border-${config.color}-200 shadow-sm px-3 py-1.5 
                     text-sm font-medium rounded-lg`}
        >
          Tambah
        </Button>
      </div>
    </div>
  );
};

const PPDBSettings: React.FC = () => {
  const { userRole } = useAuth();
  const [settings, setSettings] = useState<PPDBSettingsType>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerConfirmation, setDangerConfirmation] = useState('');
  const [targetSchool, setTargetSchool] = useState<string>('');
  const [dangerProgress, setDangerProgress] = useState<string>('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    if (userRole) {
      setTargetSchool(userRole.isMaster ? 'all' : (userRole.school || ''));
    }
  }, [userRole]);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setSettings(prev => ({ 
        ...prev, 
        customModal: { 
          ...prev.customModal, 
          image: '' 
        } 
      }));
      return;
    }

    setUploadingImage(true);
    try {
      // Create unique filename with timestamp
      const fileExtension = file.name.split('.').pop();
      const fileName = `modal-image-${Date.now()}.${fileExtension}`;
      const filePath = `modal-images/${fileName}`;

      // Upload to R2
      const result = await uploadToR2({
        file,
        path: filePath,
        contentType: file.type,
      });

      // Update settings with the uploaded image URL
      const updatedSettings = {
        ...settings,
        customModal: {
          ...settings.customModal,
          image: result.publicUrl
        }
      };
      
      setSettings(updatedSettings);

      // Automatically save to database
      await set(ref(db, 'settings/ppdb'), updatedSettings);

      showAlert('success', 'Gambar berhasil diupload dan pengaturan disimpan');
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('error', 'Gagal mengupload gambar. Silakan coba lagi.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = () => {
    if (!settings.customModal.image) return;
    setShowDeleteConfirmModal(true);
  };

  const confirmImageDelete = async () => {
    setShowDeleteConfirmModal(false);
    setDeletingImage(true);
    
    try {
      // Extract the key from the URL to delete from R2
      const imageUrl = settings.customModal.image;
      if (!imageUrl) return;
      
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `modal-images/${fileName}`;

      // Delete from R2
      await deleteFromR2(filePath);

      // Update settings with empty image
      const updatedSettings = {
        ...settings,
        customModal: {
          ...settings.customModal,
          image: ''
        }
      };
      
      setSettings(updatedSettings);

      // Automatically save to database
      await set(ref(db, 'settings/ppdb'), updatedSettings);

      showAlert('success', 'Gambar berhasil dihapus dan pengaturan disimpan');
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert('error', 'Gagal menghapus gambar. Silakan coba lagi.');
    } finally {
      setDeletingImage(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'settings/ppdb');
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        const dbSettings = snapshot.val();
        setSettings({
          ...initialSettings,
          ...dbSettings,
          jalurPrestasi: {
            ...initialSettings.jalurPrestasi,
            ...dbSettings.jalurPrestasi,
            requirements: dbSettings.jalurPrestasi?.requirements || []
          },
          jalurReguler: {
            ...initialSettings.jalurReguler,
            ...dbSettings.jalurReguler,
            requirements: dbSettings.jalurReguler?.requirements || []
          },
          jalurUndangan: {
            ...initialSettings.jalurUndangan,
            ...dbSettings.jalurUndangan,
            requirements: dbSettings.jalurUndangan?.requirements || []
          },
          jalurPjj: {
            ...initialSettings.jalurPjj,
            ...dbSettings.jalurPjj,
            requirements: dbSettings.jalurPjj?.requirements || []
          },
          contactWhatsapp: {
            ...initialSettings.contactWhatsapp,
            ...dbSettings.contactWhatsapp
          },
          customModal: {
            ...initialSettings.customModal,
            ...dbSettings.customModal
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showAlert('error', 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await set(ref(db, 'settings/ppdb'), settings);
      showAlert('success', 'Pengaturan berhasil disimpan');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('error', 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRequirement = (jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj') => {
    setSettings(prev => ({
      ...prev,
      [jalur]: {
        ...prev[jalur],
        requirements: [...prev[jalur].requirements, '']
      }
    }));
  };

  const handleRemoveRequirement = (jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj', index: number) => {
    setSettings(prev => ({
      ...prev,
      [jalur]: {
        ...prev[jalur],
        requirements: prev[jalur].requirements.filter((_, i) => i !== index)
      }
    }));
  };

  const handleUpdateRequirement = (
    jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj', 
    index: number, 
    value: string
  ) => {
    setSettings(prev => ({
      ...prev,
      [jalur]: {
        ...prev[jalur],
        requirements: prev[jalur].requirements.map((req, i) => 
          i === index ? value : req
        )
      }
    }));
  };

  const handleResetAllData = async () => {
    if (!userRole) return;
    if (dangerConfirmation !== 'HAPUS SEMUA DATA') {
      showAlert('error', 'Konfirmasi kata kunci salah');
      return;
    }

    setIsDeletingAll(true);
    setDangerProgress('Menghubungkan ke Cloudflare R2...');

    try {
      // 1. Test R2 connection
      const connectionTest = await testR2Connection();
      if (!connectionTest.success) {
        throw new Error('Gagal terhubung ke Cloudflare R2 storage: ' + connectionTest.message);
      }

      // 2. Tentukan sekolah mana saja yang akan di-reset
      const schoolsToReset: ('mosa' | 'fajar')[] = [];
      if (userRole.isMaster) {
        if (targetSchool === 'all') {
          schoolsToReset.push('mosa', 'fajar');
        } else {
          schoolsToReset.push(targetSchool as 'mosa' | 'fajar');
        }
      } else {
        schoolsToReset.push(userRole.school as 'mosa' | 'fajar');
      }

      // Helper function to extract file key from URL
      const extractFileKeyFromUrl = (url: string): string | null => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1);
        } catch (error) {
          console.error('Error extracting key:', url, error);
          return null;
        }
      };

      const filesToDelete: string[] = [];

      // 3. Ambil data candidates dari masing-masing sekolah
      for (const school of schoolsToReset) {
        setDangerProgress(`Mengambil data pendaftar ${school === 'mosa' ? 'Modal Bangsa' : 'Fajar Harapan'}...`);
        const ppdbRef = ref(db, `ppdb_${school}`);
        const snapshot = await get(ppdbRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.values(data).forEach((item: any) => {
            if (item.photo) filesToDelete.push(item.photo);
            if (item.rekomendasi) filesToDelete.push(item.rekomendasi);
            if (item.raport2) filesToDelete.push(item.raport2);
            if (item.raport3) filesToDelete.push(item.raport3);
            if (item.raport4) filesToDelete.push(item.raport4);
            if (item.sertifikat) filesToDelete.push(item.sertifikat);
            if (item.ijazah) filesToDelete.push(item.ijazah);
            if (item.kartuKeluarga) filesToDelete.push(item.kartuKeluarga);
            if (item.lampiranA) filesToDelete.push(item.lampiranA);
            if (item.lampiranB) filesToDelete.push(item.lampiranB);
          });
        }
      }

      // 4. Hapus file dari R2
      if (filesToDelete.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < filesToDelete.length; i += batchSize) {
          const batch = filesToDelete.slice(i, i + batchSize);
          setDangerProgress(`Menghapus file di Cloudflare R2 (${i + 1}-${Math.min(i + batchSize, filesToDelete.length)} dari ${filesToDelete.length})...`);
          
          await Promise.all(
            batch.map(async (fileUrl) => {
              const fileKey = extractFileKeyFromUrl(fileUrl);
              if (fileKey) {
                try {
                  await deleteFromR2(fileKey);
                } catch (err) {
                  console.error('Failed to delete file key:', fileKey, err);
                }
              }
            })
          );
        }
      }

      // 5. Hapus data dari Realtime Database
      for (const school of schoolsToReset) {
        setDangerProgress(`Menghapus data pendaftar ${school === 'mosa' ? 'Modal Bangsa' : 'Fajar Harapan'} dari database...`);
        await remove(ref(db, `ppdb_${school}`));
      }

      showAlert('success', 'Semua data pendaftaran dan file terkait berhasil dihapus permanen');
      setShowDangerModal(false);
      setDangerConfirmation('');
      setDangerProgress('');
    } catch (error: any) {
      console.error('Error during batch deletion:', error);
      showAlert('error', error.message || 'Gagal menghapus data');
      setDangerProgress('');
    } finally {
      setIsDeletingAll(false);
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
      {/* Status SPMB */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 md:p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-blue-900">Status SPMB</h3>
            <p className="text-xs md:text-sm text-blue-700 mt-1">
              {settings.isActive ? 'SPMB sedang berlangsung' : 'SPMB belum dimulai'}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
              settings.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {settings.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
            <input
              type="checkbox"
              checked={settings.isActive}
              onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-blue-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
            />
          </div>
        </div>
      </div>

      {/* Custom Modal Settings */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 md:p-6 rounded-xl border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-purple-900">Modal Khusus di Hero</h3>
            <p className="text-xs md:text-sm text-purple-700 mt-1">
              Kelola modal yang muncul di halaman hero dengan pesan kustom
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
              settings.customModal.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {settings.customModal.isEnabled ? 'Aktif' : 'Nonaktif'}
            </span>
            <input
              type="checkbox"
              checked={settings.customModal.isEnabled}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                customModal: { 
                  ...prev.customModal, 
                  isEnabled: e.target.checked 
                } 
              }))}
              className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-purple-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
            />
          </div>
        </div>

        {settings.customModal.isEnabled && (
          <div className="bg-white rounded-lg p-4 space-y-4">
            <Input
              label="Judul Modal"
              value={settings.customModal.title}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                customModal: { 
                  ...prev.customModal, 
                  title: e.target.value 
                } 
              }))}
              placeholder="Contoh: Penting! Perubahan Jadwal"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pesan Modal
              </label>
              <textarea
                value={settings.customModal.message}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customModal: { 
                    ...prev.customModal, 
                    message: e.target.value 
                  } 
                }))}
                placeholder="Tulis pesan yang akan ditampilkan dalam modal..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div>
              <FileUpload
                label="Gambar Modal (Opsional)"
                name="modalImage"
                accept="image/*"
                value={settings.customModal.image}
                onChange={handleImageUpload}
                onDelete={handleImageDelete}
                showPreview={true}
                maxSize={5}
                className={uploadingImage || deletingImage ? 'opacity-50' : ''}
                isDeleting={deletingImage}
              />
              {uploadingImage && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengupload gambar...</span>
                </div>
              )}
              {deletingImage && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Menghapus gambar...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Teks Link (Opsional)"
                value={settings.customModal.linkText}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customModal: { 
                    ...prev.customModal, 
                    linkText: e.target.value 
                  } 
                }))}
                placeholder="Contoh: Lihat Detail"
              />

              <Input
                label="URL Link (Opsional)"
                value={settings.customModal.linkUrl}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customModal: { 
                    ...prev.customModal, 
                    linkUrl: e.target.value 
                  } 
                }))}
                placeholder="https://example.com/link"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> Modal akan muncul di halaman hero dengan konten di atas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pengaturan Umum */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pengaturan Umum</h3>
        <div className="gap-6">
          <Input
            label="Tahun Ajaran"
            value={settings.academicYear}
            onChange={(e) => setSettings(prev => ({ ...prev, academicYear: e.target.value }))}
            placeholder="Contoh: 2025/2026"
            required
          />
        </div>
      </div>

      {/* Jalur Pendaftaran - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Jalur Prestasi */}
        <div className="bg-white rounded-xl p-3 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Jalur Prestasi</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                settings.jalurPrestasi.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.jalurPrestasi.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={settings.jalurPrestasi.isActive}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  jalurPrestasi: { ...prev.jalurPrestasi, isActive: e.target.checked }
                }))}
                className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-blue-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
              />
            </div>
          </div>
          <div className="space-y-6">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={settings.jalurPrestasi.start}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPrestasi: { ...prev.jalurPrestasi, start: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={settings.jalurPrestasi.end}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPrestasi: { ...prev.jalurPrestasi, end: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Tes"
              type="date"
              value={settings.jalurPrestasi.testDate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPrestasi: { ...prev.jalurPrestasi, testDate: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Pengumuman"
              type="date"
              value={settings.jalurPrestasi.announcementDate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPrestasi: { ...prev.jalurPrestasi, announcementDate: e.target.value }
              }))}
              required
            />
            <RequirementsSection
              jalur="jalurPrestasi"
              requirements={settings.jalurPrestasi.requirements}
              onAdd={() => handleAddRequirement('jalurPrestasi')}
              onRemove={(index) => handleRemoveRequirement('jalurPrestasi', index)}
              onUpdate={(index, value) => handleUpdateRequirement('jalurPrestasi', index, value)}
            />
          </div>
        </div>

        {/* Jalur Reguler */}
        <div className="bg-white rounded-xl p-3 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Jalur Reguler</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                settings.jalurReguler.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.jalurReguler.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={settings.jalurReguler.isActive}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  jalurReguler: { ...prev.jalurReguler, isActive: e.target.checked }
                }))}
                className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-blue-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
              />
            </div>
          </div>
          <div className="space-y-6">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={settings.jalurReguler.start}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurReguler: { ...prev.jalurReguler, start: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={settings.jalurReguler.end}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurReguler: { ...prev.jalurReguler, end: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Tes"
              type="date"
              value={settings.jalurReguler.testDate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurReguler: { ...prev.jalurReguler, testDate: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Pengumuman"
              type="date"
              value={settings.jalurReguler.announcementDate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurReguler: { ...prev.jalurReguler, announcementDate: e.target.value }
              }))}
              required
            />
            <RequirementsSection
              jalur="jalurReguler"
              requirements={settings.jalurReguler.requirements}
              onAdd={() => handleAddRequirement('jalurReguler')}
              onRemove={(index) => handleRemoveRequirement('jalurReguler', index)}
              onUpdate={(index, value) => handleUpdateRequirement('jalurReguler', index, value)}
            />
          </div>
        </div>

        {/* Jalur Undangan */}
        <div className="bg-white rounded-xl p-3 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Jalur Undangan</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                settings.jalurUndangan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.jalurUndangan.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={settings.jalurUndangan.isActive}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  jalurUndangan: { ...prev.jalurUndangan, isActive: e.target.checked }
                }))}
                className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-blue-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
              />
            </div>
          </div>
          <div className="space-y-6">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={settings.jalurUndangan.start}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurUndangan: { ...prev.jalurUndangan, start: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={settings.jalurUndangan.end}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurUndangan: { ...prev.jalurUndangan, end: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Tes"
              type="date"
              value={settings.jalurUndangan.testDate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurUndangan: { ...prev.jalurUndangan, testDate: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Pengumuman"
              type="date"
              value={settings.jalurUndangan.announcementDate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurUndangan: { ...prev.jalurUndangan, announcementDate: e.target.value }
              }))}
              required
            />
            <RequirementsSection
              jalur="jalurUndangan"
              requirements={settings.jalurUndangan.requirements}
              onAdd={() => handleAddRequirement('jalurUndangan')}
              onRemove={(index) => handleRemoveRequirement('jalurUndangan', index)}
              onUpdate={(index, value) => handleUpdateRequirement('jalurUndangan', index, value)}
            />
          </div>
        </div>

        {/* Jalur PJJ */}
        <div className="bg-white rounded-xl p-3 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Jalur PJJ</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                settings.jalurPjj?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.jalurPjj?.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              <input
                type="checkbox"
                checked={settings.jalurPjj?.isActive || false}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  jalurPjj: { ...prev.jalurPjj, isActive: e.target.checked }
                }))}
                className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-blue-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
              />
            </div>
          </div>
          <div className="space-y-6">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={settings.jalurPjj?.start || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPjj: { ...prev.jalurPjj, start: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={settings.jalurPjj?.end || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPjj: { ...prev.jalurPjj, end: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Tes"
              type="date"
              value={settings.jalurPjj?.testDate || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPjj: { ...prev.jalurPjj, testDate: e.target.value }
              }))}
              required
            />
            <Input
              label="Tanggal Pengumuman"
              type="date"
              value={settings.jalurPjj?.announcementDate || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                jalurPjj: { ...prev.jalurPjj, announcementDate: e.target.value }
              }))}
              required
            />
            <RequirementsSection
              jalur="jalurPjj"
              requirements={settings.jalurPjj?.requirements || []}
              onAdd={() => handleAddRequirement('jalurPjj')}
              onRemove={(index) => handleRemoveRequirement('jalurPjj', index)}
              onUpdate={(index, value) => handleUpdateRequirement('jalurPjj', index, value)}
            />
          </div>
        </div>
      </div>

      {/* Kontak Admin */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontak Admin</h3>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Admin 1 */}
          <div className="space-y-6">
            <Input
              label="Nama Admin 1"
              value={settings.contactWhatsapp.admin1.name}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin1: {
                    ...prev.contactWhatsapp.admin1,
                    name: e.target.value
                  }
                }
              }))}
              required
            />
            <Input
              label="WhatsApp Admin 1"
              value={settings.contactWhatsapp.admin1.whatsapp}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin1: {
                    ...prev.contactWhatsapp.admin1,
                    whatsapp: e.target.value
                  }
                }
              }))}
              required
            />
          </div>

          {/* Admin 2 */}
          <div className="space-y-6">
            <Input
              label="Nama Admin 2"
              value={settings.contactWhatsapp.admin2.name}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin2: {
                    ...prev.contactWhatsapp.admin2,
                    name: e.target.value
                  }
                }
              }))}
              required
            />
            <Input
              label="WhatsApp Admin 2"
              value={settings.contactWhatsapp.admin2.whatsapp}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin2: {
                    ...prev.contactWhatsapp.admin2,
                    whatsapp: e.target.value
                  }
                }
              }))}
              required
            />
          </div>

          {/* Admin 3 */}
          <div className="space-y-6">
            <Input
              label="Nama Admin 3"
              value={settings.contactWhatsapp.admin3.name}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin3: {
                    ...prev.contactWhatsapp.admin3,
                    name: e.target.value
                  }
                }
              }))}
              required
            />
            <Input
              label="WhatsApp Admin 3"
              value={settings.contactWhatsapp.admin3.whatsapp}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin3: {
                    ...prev.contactWhatsapp.admin3,
                    whatsapp: e.target.value
                  }
                }
              }))}
              required
            />
          </div>

          {/* Admin 4 */}
          <div className="space-y-6">
            <Input
              label="Nama Admin 4"
              value={settings.contactWhatsapp.admin4.name}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin4: {
                    ...prev.contactWhatsapp.admin4,
                    name: e.target.value
                  }
                }
              }))}
              required
            />
            <Input
              label="WhatsApp Admin 4"
              value={settings.contactWhatsapp.admin4.whatsapp}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                contactWhatsapp: {
                  ...prev.contactWhatsapp,
                  admin4: {
                    ...prev.contactWhatsapp.admin4,
                    whatsapp: e.target.value
                  }
                }
              }))}
              required
            />
          </div>
        </div>

        {/* Tombol Simpan dipindah ke sini */}
        <div className="mt-8 flex justify-end border-t pt-6">
          <Button
            onClick={() => setShowConfirmModal(true)}
            className="w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700 px-8 py-2.5"
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </div>
            ) : (
              'Simpan Pengaturan'
            )}
          </Button>
        </div>
      </div>

      {/* Zona Bahaya / Danger Zone */}
      <div className="bg-red-50 rounded-xl p-4 md:p-6 border-2 border-red-200 shadow-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-red-900">Zona Bahaya</h3>
              <p className="text-xs md:text-sm text-red-700 mt-1">
                Tindakan di bawah ini bersifat destruktif dan tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-red-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-red-800 text-sm md:text-base">Hapus Semua Data Pendaftaran</h4>
              <p className="text-xs md:text-sm text-red-600 mt-0.5">
                Menghapus seluruh berkas pendaftaran dari database serta menghapus berkas dokumen (PDF/Gambar) dari penyimpanan Cloudflare R2 secara permanen.
              </p>
            </div>
            
            <Button
              onClick={() => setShowDangerModal(true)}
              className="bg-red-600 text-white hover:bg-red-700 font-medium px-6 py-2.5 rounded-lg shadow-sm w-full md:w-auto flex-shrink-0"
            >
              Hapus Semua Data
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Danger Zone */}
      <Modal
        isOpen={showDangerModal}
        onClose={() => {
          if (!isDeletingAll) {
            setShowDangerModal(false);
            setDangerConfirmation('');
          }
        }}
        className="z-50"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">
              Hapus Semua Data PPDB
            </h3>
            <p className="text-sm text-red-700">
              Anda akan menghapus seluruh data siswa pendaftar dan berkas terkait di penyimpanan R2. Tindakan ini <strong>tidak dapat dibatalkan</strong>!
            </p>
          </div>

          {/* Pilihan sekolah jika admin master */}
          {userRole?.isMaster && !isDeletingAll && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Pilih Sekolah yang Ingin Dihapus:
              </label>
              <select
                value={targetSchool}
                onChange={(e) => setTargetSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Semua Sekolah (MOSA & Fajar Harapan)</option>
                <option value="mosa">SMAN Modal Bangsa</option>
                <option value="fajar">SMAN 10 Fajar Harapan</option>
              </select>
            </div>
          )}

          {!userRole?.isMaster && !isDeletingAll && (
            <div className="mb-4 bg-gray-50 border p-3 rounded-lg text-sm text-gray-700">
              Sekolah yang akan dihapus: <span className="font-semibold text-gray-900">{userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}</span>
            </div>
          )}

          {isDeletingAll ? (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-red-800 font-semibold">{dangerProgress}</p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-2">
                Ketik <span className="font-semibold text-red-600">"HAPUS SEMUA DATA"</span> untuk melanjutkan:
              </label>
              <input
                type="text"
                value={dangerConfirmation}
                onChange={(e) => setDangerConfirmation(e.target.value)}
                placeholder="HAPUS SEMUA DATA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 uppercase font-medium text-center"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowDangerModal(false);
                setDangerConfirmation('');
              }}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={isDeletingAll}
            >
              Batal
            </Button>
            <Button
              onClick={handleResetAllData}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              disabled={isDeletingAll || dangerConfirmation !== 'HAPUS SEMUA DATA'}
            >
              Ya, Hapus Semua
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        className="z-50"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Konfirmasi Penghapusan Gambar
            </h3>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus gambar ini?
              <br />
              <span className="text-red-600 mt-2 block">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowDeleteConfirmModal(false)}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={deletingImage}
            >
              Batal
            </Button>
            <Button
              onClick={confirmImageDelete}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              disabled={deletingImage}
            >
              {deletingImage ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </div>
              ) : (
                'Ya, Hapus'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="z-50"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Konfirmasi Simpan Pengaturan
            </h3>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menyimpan perubahan pengaturan SPMB?
              <br />
              <span className="text-yellow-600 mt-2 block">
                Perubahan ini akan langsung mempengaruhi sistem SPMB.
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Ya, Simpan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PPDBSettings; 