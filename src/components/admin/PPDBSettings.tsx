import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase/config';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { showAlert } from '../ui/Alert';
import type { PPDBSettings as PPDBSettingsType } from '../../types/settings';

const initialSettings: PPDBSettingsType = {
  academicYear: '',
  jalurPrestasi: {
    start: '',
    end: '',
    isActive: true
  },
  jalurReguler: {
    start: '',
    end: '',
    isActive: true
  },
  jalurUndangan: {
    start: '',
    end: '',
    isActive: true
  },
  announcementDate: '',
  isActive: true
};

const PPDBSettings: React.FC = () => {
  const [settings, setSettings] = useState<PPDBSettingsType>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsRef = ref(db, 'settings/ppdb');
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        setSettings({
          ...initialSettings,
          ...snapshot.val()
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan PPDB</h1>
        <p className="text-gray-600">Kelola periode pendaftaran dan pengumuman PPDB</p>
      </div>

      <Card className="max-w-2xl">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Pengaturan Umum</h3>
            <div className="grid grid-cols-2 gap-6">
              <Input
                label="Tahun Ajaran"
                value={settings.academicYear}
                onChange={(e) => setSettings(prev => ({ ...prev, academicYear: e.target.value }))}
                placeholder="Contoh: 2025/2026"
                required
              />
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  checked={settings.isActive}
                  onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">PPDB Aktif</label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Jalur Prestasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.jalurPrestasi.isActive}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    jalurPrestasi: { ...prev.jalurPrestasi, isActive: e.target.checked }
                  }))}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">Jalur Prestasi Aktif</label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Jalur Reguler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.jalurReguler.isActive}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    jalurReguler: { ...prev.jalurReguler, isActive: e.target.checked }
                  }))}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">Jalur Reguler Aktif</label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Jalur Undangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.jalurUndangan.isActive}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    jalurUndangan: { ...prev.jalurUndangan, isActive: e.target.checked }
                  }))}
                  className="rounded text-blue-600"
                />
                <label className="text-sm text-gray-700">Jalur Undangan Aktif</label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Pengumuman</h3>
            <Input
              label="Tanggal Pengumuman"
              type="date"
              value={settings.announcementDate}
              onChange={(e) => setSettings(prev => ({ ...prev, announcementDate: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PPDBSettings; 