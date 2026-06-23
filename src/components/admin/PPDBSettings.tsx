import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase/config';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { showAlert } from '../ui/Alert';
import type { PPDBSettings as PPDBSettingsType } from '../../types/settings';
import Modal from '../ui/Modal';
import { uploadToR2, deleteFromR2 } from '../../services/cloudflareR2';
import { useAuth } from '../../contexts/AuthContext';

// Shared Settings subcomponents
import CustomHeroModalSettings from './settings/CustomHeroModalSettings';
import JalurPeriodSettings from './settings/JalurPeriodSettings';
import AdminContactSettings from './settings/AdminContactSettings';
import DangerZoneSettings from './settings/DangerZoneSettings';
import PrincipalSignatureSettings from './settings/PrincipalSignatureSettings';

const initialSettings: PPDBSettingsType = {
  academicYear: '',
  jalurPrestasi: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    reRegistrationStart: '',
    reRegistrationEnd: '',
    requirements: []
  },
  jalurReguler: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    reRegistrationStart: '',
    reRegistrationEnd: '',
    requirements: []
  },
  jalurUndangan: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    reRegistrationStart: '',
    reRegistrationEnd: '',
    requirements: []
  },
  jalurPjj: {
    start: '',
    end: '',
    isActive: true,
    testDate: '',
    announcementDate: '',
    reRegistrationStart: '',
    reRegistrationEnd: '',
    requirements: []
  },
  isActive: true,
  contactWhatsapp: {
    admin1: { name: '', whatsapp: '' },
    admin2: { name: '', whatsapp: '' },
    admin3: { name: '', whatsapp: '' },
    admin4: { name: '', whatsapp: '' }
  },
  customModal: {
    isEnabled: false,
    title: '',
    message: '',
    image: '',
    linkText: '',
    linkUrl: ''
  },
  principalSignatureMosa: '',
  principalSignatureFajar: ''
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
  const [uploadingSigMosa, setUploadingSigMosa] = useState(false);
  const [deletingSigMosa, setDeletingSigMosa] = useState(false);
  const [uploadingSigFajar, setUploadingSigFajar] = useState(false);
  const [deletingSigFajar, setDeletingSigFajar] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

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

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setSettings(prev => ({ 
        ...prev, 
        customModal: { ...prev.customModal, image: '' } 
      }));
      return;
    }

    setUploadingImage(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `modal-image-${Date.now()}.${fileExtension}`;
      const filePath = `modal-images/${fileName}`;

      const result = await uploadToR2({
        file,
        path: filePath,
        contentType: file.type,
      });

      const updatedSettings = {
        ...settings,
        customModal: {
          ...settings.customModal,
          image: result.publicUrl
        }
      };
      
      setSettings(updatedSettings);
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
      const imageUrl = settings.customModal.image;
      if (!imageUrl) return;
      
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `modal-images/${fileName}`;

      await deleteFromR2(filePath);

      const updatedSettings = {
        ...settings,
        customModal: {
          ...settings.customModal,
          image: ''
        }
      };
      
      setSettings(updatedSettings);
      await set(ref(db, 'settings/ppdb'), updatedSettings);
      showAlert('success', 'Gambar berhasil dihapus dan pengaturan disimpan');
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert('error', 'Gagal menghapus gambar. Silakan coba lagi.');
    } finally {
      setDeletingImage(false);
    }
  };

  const handleSigUpload = async (school: 'mosa' | 'fajar', file: File | null) => {
    if (!file) {
      setSettings(prev => ({
        ...prev,
        [school === 'mosa' ? 'principalSignatureMosa' : 'principalSignatureFajar']: ''
      }));
      return;
    }

    if (school === 'mosa') setUploadingSigMosa(true);
    else setUploadingSigFajar(true);

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `signature-${school}-${Date.now()}.${fileExtension}`;
      const filePath = `signatures/${fileName}`;

      const result = await uploadToR2({
        file,
        path: filePath,
        contentType: file.type,
      });

      const fieldKey = school === 'mosa' ? 'principalSignatureMosa' : 'principalSignatureFajar';
      const updatedSettings = {
        ...settings,
        [fieldKey]: result.publicUrl
      };

      setSettings(updatedSettings);
      await set(ref(db, 'settings/ppdb'), updatedSettings);
      showAlert('success', 'Tanda tangan berhasil diupload dan pengaturan disimpan');
    } catch (error) {
      console.error('Error uploading signature:', error);
      showAlert('error', 'Gagal mengupload tanda tangan. Silakan coba lagi.');
    } finally {
      if (school === 'mosa') setUploadingSigMosa(false);
      else setUploadingSigFajar(false);
    }
  };

  const handleSigDelete = async (school: 'mosa' | 'fajar') => {
    const fieldKey = school === 'mosa' ? 'principalSignatureMosa' : 'principalSignatureFajar';
    const imageUrl = settings[fieldKey];
    if (!imageUrl) return;

    if (school === 'mosa') setDeletingSigMosa(true);
    else setDeletingSigFajar(true);

    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `signatures/${fileName}`;

      await deleteFromR2(filePath);

      const updatedSettings = {
        ...settings,
        [fieldKey]: ''
      };

      setSettings(updatedSettings);
      await set(ref(db, 'settings/ppdb'), updatedSettings);
      showAlert('success', 'Tanda tangan berhasil dihapus dan pengaturan disimpan');
    } catch (error) {
      console.error('Error deleting signature:', error);
      showAlert('error', 'Gagal menghapus tanda tangan. Silakan coba lagi.');
    } finally {
      if (school === 'mosa') setDeletingSigMosa(false);
      else setDeletingSigFajar(false);
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

  const handleUpdatePeriod = (jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj', field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [jalur]: {
        ...prev[jalur],
        [field]: value
      }
    }));
  };

  const handleAddRequirement = (jalur: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj') => {
    setSettings(prev => ({
      ...prev,
      [jalur]: {
        ...prev[jalur],
        requirements: [...(prev[jalur].requirements || []), '']
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
        requirements: prev[jalur].requirements.map((req, i) => i === index ? value : req)
      }
    }));
  };

  const handleUpdateAdminContact = (adminKey: 'admin1' | 'admin2' | 'admin3' | 'admin4', field: 'name' | 'whatsapp', value: string) => {
    setSettings(prev => ({
      ...prev,
      contactWhatsapp: {
        ...prev.contactWhatsapp,
        [adminKey]: {
          ...prev.contactWhatsapp[adminKey],
          [field]: value
        }
      }
    }));
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
      {/* 1. Status SPMB Toggle */}
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

      {/* 2. Custom Hero Modal settings */}
      <CustomHeroModalSettings
        settings={settings}
        setSettings={setSettings}
        uploadingImage={uploadingImage}
        deletingImage={deletingImage}
        handleImageUpload={handleImageUpload}
        handleImageDelete={handleImageDelete}
      />

      {/* 3. General settings */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pengaturan Umum</h3>
        <div>
          <Input
            label="Tahun Ajaran"
            value={settings.academicYear}
            onChange={(e) => setSettings(prev => ({ ...prev, academicYear: e.target.value }))}
            placeholder="Contoh: 2025/2026"
            required
          />
        </div>
      </div>

      {/* 3.5. Principal Signature settings */}
      <PrincipalSignatureSettings
        settings={settings}
        uploadingSigMosa={uploadingSigMosa}
        deletingSigMosa={deletingSigMosa}
        uploadingSigFajar={uploadingSigFajar}
        deletingSigFajar={deletingSigFajar}
        handleSigUpload={handleSigUpload}
        handleSigDelete={handleSigDelete}
      />

      {/* 4. Pathways settings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <JalurPeriodSettings
          title="Jalur Prestasi"
          jalurKey="jalurPrestasi"
          period={settings.jalurPrestasi}
          onUpdatePeriod={(f, v) => handleUpdatePeriod('jalurPrestasi', f, v)}
          onAddRequirement={() => handleAddRequirement('jalurPrestasi')}
          onRemoveRequirement={(i) => handleRemoveRequirement('jalurPrestasi', i)}
          onUpdateRequirement={(i, v) => handleUpdateRequirement('jalurPrestasi', i, v)}
        />
        <JalurPeriodSettings
          title="Jalur Reguler"
          jalurKey="jalurReguler"
          period={settings.jalurReguler}
          onUpdatePeriod={(f, v) => handleUpdatePeriod('jalurReguler', f, v)}
          onAddRequirement={() => handleAddRequirement('jalurReguler')}
          onRemoveRequirement={(i) => handleRemoveRequirement('jalurReguler', i)}
          onUpdateRequirement={(i, v) => handleUpdateRequirement('jalurReguler', i, v)}
        />
        <JalurPeriodSettings
          title="Jalur Undangan"
          jalurKey="jalurUndangan"
          period={settings.jalurUndangan}
          onUpdatePeriod={(f, v) => handleUpdatePeriod('jalurUndangan', f, v)}
          onAddRequirement={() => handleAddRequirement('jalurUndangan')}
          onRemoveRequirement={(i) => handleRemoveRequirement('jalurUndangan', i)}
          onUpdateRequirement={(i, v) => handleUpdateRequirement('jalurUndangan', i, v)}
        />
        <JalurPeriodSettings
          title="Jalur PJJ"
          jalurKey="jalurPjj"
          period={settings.jalurPjj}
          onUpdatePeriod={(f, v) => handleUpdatePeriod('jalurPjj', f, v)}
          onAddRequirement={() => handleAddRequirement('jalurPjj')}
          onRemoveRequirement={(i) => handleRemoveRequirement('jalurPjj', i)}
          onUpdateRequirement={(i, v) => handleUpdateRequirement('jalurPjj', i, v)}
        />
      </div>

      {/* 5. Whatsapp Admin contact settings */}
      <AdminContactSettings
        settings={settings}
        onUpdateAdminContact={handleUpdateAdminContact}
      />

      {/* Save Settings Trigger */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={() => setShowConfirmModal(true)}
          className="w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700 px-8 py-2.5"
          disabled={saving}
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>

      {/* 6. Destructive cleanups Danger zone */}
      <DangerZoneSettings userRole={userRole} />

      {/* Modal image deletion confirmation */}
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
              {deletingImage ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal general save confirmation */}
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