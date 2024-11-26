import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase/config';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { showAlert } from '../ui/Alert';
import type { PPDBSettings as PPDBSettingsType } from '../../types/settings';
import Modal from '../ui/Modal';

const initialSettings: PPDBSettingsType = {
  academicYear: '',
  jalurPrestasi: {
    start: '',
    end: '',
    isActive: true,
    testDate: ''
  },
  jalurReguler: {
    start: '',
    end: '',
    isActive: true,
    testDate: ''
  },
  jalurUndangan: {
    start: '',
    end: '',
    isActive: true
  },
  announcementDate: '',
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
    }
  }
};

const PPDBSettings: React.FC = () => {
  const [settings, setSettings] = useState<PPDBSettingsType>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
          contactWhatsapp: {
            ...initialSettings.contactWhatsapp,
            ...dbSettings.contactWhatsapp
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Status PPDB */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Status PPDB</h3>
            <p className="text-sm text-blue-700 mt-1">
              {settings.isActive ? 'PPDB sedang berlangsung' : 'PPDB belum dimulai'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
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

      {/* Pengaturan Umum */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pengaturan Umum</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Tahun Ajaran"
            value={settings.academicYear}
            onChange={(e) => setSettings(prev => ({ ...prev, academicYear: e.target.value }))}
            placeholder="Contoh: 2025/2026"
            required
          />
          <Input
            label="Tanggal Pengumuman"
            type="date"
            value={settings.announcementDate}
            onChange={(e) => setSettings(prev => ({ ...prev, announcementDate: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Jalur Pendaftaran - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jalur Prestasi */}
        <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Jalur Prestasi</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
          </div>
        </div>

        {/* Jalur Reguler */}
        <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Jalur Reguler</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
          </div>
        </div>

        {/* Jalur Undangan */}
        <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Jalur Undangan</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
          </div>
        </div>
      </div>

      {/* Kontak Admin */}
      <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontak Admin</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              placeholder="Contoh: Pak Ahmad"
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
              placeholder="Contoh: +628116700050"
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
              placeholder="Contoh: Bu Siti"
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
              placeholder="Contoh: +628116700050"
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
              placeholder="Contoh: Pak Budi"
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
              placeholder="Contoh: +628116700050"
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
              Apakah Anda yakin ingin menyimpan perubahan pengaturan PPDB?
              <br />
              <span className="text-yellow-600 mt-2 block">
                Perubahan ini akan langsung mempengaruhi sistem PPDB.
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