import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase/config';
import Input from '../ui/Input';
import { showAlert } from '../ui/Alert';
import type { PPDBSettings as PPDBSettingsType } from '../../types/settings';
import Modal from '../ui/Modal';
import { uploadToR2, deleteFromR2 } from '../../services/cloudflareR2';
import { useAuth } from '../../contexts/AuthContext';
import classNames from 'classnames';
import {
  Cog6ToothIcon,
  CalendarDaysIcon,
  SparklesIcon,
  PencilSquareIcon,
  TableCellsIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  TrophyIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

// Shared Settings subcomponents
import CustomHeroModalSettings from './settings/CustomHeroModalSettings';
import AdminContactSettings from './settings/AdminContactSettings';
import DangerZoneSettings from './settings/DangerZoneSettings';
import PrincipalSignatureSettings from './settings/PrincipalSignatureSettings';
import GoogleSheetsSettings from './settings/GoogleSheetsSettings';

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
  principalSignatureFajar: '',
  googleSheets: {
    isEnabled: false,
    webhookUrl: '',
    accountEmail: 'alfaruqasri@sman-modalbangsa.sch.id'
  }
};

type SettingTab = 'general' | 'jalur' | 'hero' | 'signature' | 'sheets' | 'contact' | 'danger';

const PPDBSettings: React.FC = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingTab>('general');
  const [activeJalurTab, setActiveJalurTab] = useState<'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj'>('jalurPrestasi');
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
      setLoading(true);
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
      showAlert('success', 'Gambar berhasil diunggah dan disimpan');
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('error', 'Gagal mengunggah gambar. Silakan coba lagi.');
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
      showAlert('success', 'Gambar berhasil dihapus');
    } catch (error) {
      console.error('Error deleting image:', error);
      showAlert('error', 'Gagal menghapus gambar');
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
      showAlert('success', 'Tanda tangan berhasil diunggah');
    } catch (error) {
      console.error('Error uploading signature:', error);
      showAlert('error', 'Gagal mengunggah tanda tangan');
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
      showAlert('success', 'Tanda tangan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting signature:', error);
      showAlert('error', 'Gagal menghapus tanda tangan');
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

  const navTabs = [
    { id: 'general', label: 'Umum & Status', icon: Cog6ToothIcon, desc: 'Tahun ajaran & status operasional' },
    { id: 'jalur', label: 'Jalur & Jadwal', icon: CalendarDaysIcon, desc: 'Periode tes & persyaratan per jalur' },
    { id: 'hero', label: 'Pop-up Modal Beranda', icon: SparklesIcon, desc: 'Banner pengumuman calon siswa' },
    { id: 'signature', label: 'Tanda Tangan Digital', icon: PencilSquareIcon, desc: 'TTD Kepala Sekolah pada kartu' },
    { id: 'sheets', label: 'Integrasi Google Sheets', icon: TableCellsIcon, desc: 'Webhook & live spreadsheet sync' },
    { id: 'contact', label: 'Kontak Helpdesk WA', icon: PhoneIcon, desc: 'Nomor panitia & narahubung' },
    { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon, desc: 'Reset pendaftar & data darurat', isDanger: true }
  ];

  const jalurTabs = [
    { id: 'jalurPrestasi', label: 'Prestasi', icon: TrophyIcon },
    { id: 'jalurReguler', label: 'Reguler', icon: AcademicCapIcon },
    { id: 'jalurUndangan', label: 'Undangan', icon: SparklesIcon },
    { id: 'jalurPjj', label: 'PJJ (Mitra)', icon: BuildingOfficeIcon }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
          <span className="text-xs font-semibold text-zinc-500">Memuat konfigurasi sistem...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Top Header & Save Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Pengaturan Sistem SPMB
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Settings Studio
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Konfigurasi jadwal pendaftaran, integrasi webhook, nomor kontak, dan keamanan sistem
          </p>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
          <span>Simpan Semua Perubahan</span>
        </button>
      </div>

      {/* Supabase-Style Layout: Left Navigation Rail & Right Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings Sidebar Navigation (3.5 Cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="rounded-2xl bg-white border border-zinc-200/80 p-1.5 shadow-xs space-y-0.5">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingTab)}
                  className={classNames(
                    'w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all duration-150',
                    isActive
                      ? tab.isDanger 
                        ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200 shadow-xs'
                        : 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-xs'
                      : tab.isDanger
                        ? 'text-rose-600 hover:bg-rose-50/50 font-medium'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                  )}
                >
                  <div className={classNames(
                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    isActive
                      ? tab.isDanger ? 'bg-rose-600 text-white' : 'bg-emerald-700 text-white'
                      : 'bg-zinc-100 text-zinc-500'
                  )}>
                    <tab.icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight">{tab.label}</div>
                    <div className="text-[10px] text-zinc-400 font-normal truncate mt-0.5">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-zinc-100/70 border border-zinc-200/60 text-[11px] text-zinc-500">
            <span className="font-bold text-zinc-700">Tips:</span> Klik tombol <strong>Simpan</strong> di kanan atas setelah melakukan perubahan konfigurasi.
          </div>
        </div>

        {/* Right Content Panel (8.5 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ================= 1. TAB: GENERAL & STATUS ================= */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Panel 1: Master Operation Status */}
              <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden">
                <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900">Status Operasional Portal SPMB</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Kontrol saklar utama pembukaan seluruh pendaftaran secara global</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        settings.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {settings.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.isActive}
                        onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-9 h-5 rounded-full bg-zinc-200 cursor-pointer appearance-none checked:bg-emerald-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-xs before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-4"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Jika saklar dinonaktifkan, calon siswa yang mengakses halaman registrasi dan formulir akan dialihkan ke halaman pemberitahuan bahwa SPMB belum dibuka.
                  </p>
                </div>
              </div>

              {/* Panel 2: Academic Year Configuration */}
              <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden">
                <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900">Tahun Ajaran Aktif</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Format tahun ajaran yang akan tertera pada kartu bukti pendaftaran dan kop surat resmi</p>
                  </div>

                  <div className="max-w-md">
                    <Input
                      label="Tahun Ajaran (Academic Year)"
                      value={settings.academicYear}
                      onChange={(e) => setSettings(prev => ({ ...prev, academicYear: e.target.value }))}
                      placeholder="Contoh: 2026/2027"
                      required
                    />
                  </div>
                </div>

                <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                  <span>Label ini tampil di seluruh portal publik dan dashboard siswa</span>
                  <span className="font-semibold text-zinc-700">{settings.academicYear || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. TAB: JALUR & PERIODS ================= */}
          {activeTab === 'jalur' && (
            <div className="space-y-5">
              {/* Compact Segmented Track Switcher */}
              <div className="p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 grid grid-cols-2 sm:grid-cols-4 gap-1">
                {jalurTabs.map((j) => {
                  const isSelected = activeJalurTab === j.id;
                  return (
                    <button
                      key={j.id}
                      onClick={() => setActiveJalurTab(j.id as any)}
                      className={classNames(
                        'py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap',
                        isSelected
                          ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/80'
                          : 'text-zinc-500 hover:text-zinc-900'
                      )}
                    >
                      <j.icon className={classNames('w-3.5 h-3.5', isSelected ? 'text-emerald-700' : 'text-zinc-400')} />
                      <span>{j.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Focused Track Settings Panel */}
              <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden">
                <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-6">
                  {/* Track Status Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                    <div>
                      <h3 className="text-base font-extrabold text-zinc-900">
                        Konfigurasi {activeJalurTab === 'jalurPrestasi' ? 'Jalur Prestasi' : activeJalurTab === 'jalurReguler' ? 'Jalur Reguler' : activeJalurTab === 'jalurUndangan' ? 'Jalur Undangan' : 'Jalur PJJ'}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Atur rentang tanggal pendaftaran, jadwal tes, dan pengumuman</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        settings[activeJalurTab].isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {settings[activeJalurTab].isActive ? 'Jalur Aktif' : 'Jalur Nonaktif'}
                      </span>
                      <input
                        type="checkbox"
                        checked={settings[activeJalurTab].isActive}
                        onChange={(e) => handleUpdatePeriod(activeJalurTab, 'isActive', e.target.checked)}
                        className="w-9 h-5 rounded-full bg-zinc-200 cursor-pointer appearance-none checked:bg-emerald-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-xs before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-4"
                      />
                    </div>
                  </div>

                  {/* Dates Configuration Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Tanggal Mulai Pendaftaran"
                      type="date"
                      value={settings[activeJalurTab].start || ''}
                      onChange={(e) => handleUpdatePeriod(activeJalurTab, 'start', e.target.value)}
                      required
                    />
                    <Input
                      label="Tanggal Selesai Pendaftaran"
                      type="date"
                      value={settings[activeJalurTab].end || ''}
                      onChange={(e) => handleUpdatePeriod(activeJalurTab, 'end', e.target.value)}
                      required
                    />
                    <Input
                      label="Tanggal Pelaksanaan Tes (CBT)"
                      type="date"
                      value={settings[activeJalurTab].testDate || ''}
                      onChange={(e) => handleUpdatePeriod(activeJalurTab, 'testDate', e.target.value)}
                    />
                    <Input
                      label="Tanggal Pengumuman Hasil Seleksi"
                      type="date"
                      value={settings[activeJalurTab].announcementDate || ''}
                      onChange={(e) => handleUpdatePeriod(activeJalurTab, 'announcementDate', e.target.value)}
                    />
                    <Input
                      label="Mulai Daftar Ulang (Lulus)"
                      type="date"
                      value={settings[activeJalurTab].reRegistrationStart || ''}
                      onChange={(e) => handleUpdatePeriod(activeJalurTab, 'reRegistrationStart', e.target.value)}
                    />
                    <Input
                      label="Batas Akhir Daftar Ulang"
                      type="date"
                      value={settings[activeJalurTab].reRegistrationEnd || ''}
                      onChange={(e) => handleUpdatePeriod(activeJalurTab, 'reRegistrationEnd', e.target.value)}
                    />
                  </div>

                  {/* Requirements List Editor */}
                  <div className="pt-4 border-t border-zinc-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                          Daftar Persyaratan Berkas & Dokumen
                        </h4>
                        <p className="text-[11px] text-zinc-500">Poin persyaratan yang akan tampil pada kartu jalur di halaman depan</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddRequirement(activeJalurTab)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>Tambah Syarat</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(settings[activeJalurTab].requirements || []).length === 0 ? (
                        <div className="p-4 rounded-2xl bg-zinc-50 text-center text-xs text-zinc-400">
                          Belum ada poin persyaratan khusus. Klik "Tambah Syarat" di atas.
                        </div>
                      ) : (
                        settings[activeJalurTab].requirements.map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={req}
                              onChange={(e) => handleUpdateRequirement(activeJalurTab, idx, e.target.value)}
                              placeholder={`Poin persyaratan #${idx + 1}`}
                              className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-xs outline-none font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveRequirement(activeJalurTab, idx)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. TAB: HERO MODAL ================= */}
          {activeTab === 'hero' && (
            <CustomHeroModalSettings
              settings={settings}
              setSettings={setSettings}
              uploadingImage={uploadingImage}
              deletingImage={deletingImage}
              handleImageUpload={handleImageUpload}
              handleImageDelete={handleImageDelete}
            />
          )}

          {/* ================= 4. TAB: PRINCIPAL SIGNATURES ================= */}
          {activeTab === 'signature' && (
            <PrincipalSignatureSettings
              settings={settings}
              uploadingSigMosa={uploadingSigMosa}
              deletingSigMosa={deletingSigMosa}
              uploadingSigFajar={uploadingSigFajar}
              deletingSigFajar={deletingSigFajar}
              handleSigUpload={handleSigUpload}
              handleSigDelete={handleSigDelete}
            />
          )}

          {/* ================= 5. TAB: GOOGLE SHEETS ================= */}
          {activeTab === 'sheets' && (
            <GoogleSheetsSettings
              settings={settings.googleSheets || { isEnabled: false, accountEmail: 'alfaruqasri@sman-modalbangsa.sch.id', webhookUrl: '' }}
              onChange={(updated) => setSettings(prev => ({ ...prev, googleSheets: updated }))}
            />
          )}

          {/* ================= 6. TAB: CONTACT HELPDESK ================= */}
          {activeTab === 'contact' && (
            <AdminContactSettings
              settings={settings}
              onUpdateAdminContact={handleUpdateAdminContact}
            />
          )}

          {/* ================= 7. TAB: DANGER ZONE ================= */}
          {activeTab === 'danger' && (
            <DangerZoneSettings userRole={userRole} />
          )}
        </div>
      </div>

      {/* Modal image deletion confirmation */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        className="z-50"
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-3">
            <TrashIcon className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            Konfirmasi Hapus Gambar
          </h3>
          <p className="text-xs text-zinc-500 mt-1 mb-5">
            Apakah Anda yakin ingin menghapus gambar banner modal beranda ini?
          </p>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowDeleteConfirmModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
              disabled={deletingImage}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmImageDelete}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              disabled={deletingImage}
            >
              {deletingImage ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal general save confirmation */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="z-50"
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircleIcon className="w-6 h-6 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            Simpan Perubahan Pengaturan?
          </h3>
          <p className="text-xs text-zinc-500 mt-1 mb-5">
            Perubahan pengaturan akan segera diterapkan pada sistem pendaftaran online dan formulir siswa.
          </p>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Ya, Simpan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PPDBSettings;