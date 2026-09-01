import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Tabs from '../../ui/Tabs';
import FileUpload from '../../ui/FileUpload';
import { ref, update } from 'firebase/database';
import { db } from '../../../firebase/config';
import { PPDBData } from '../../../types/ppdb';
import { showAlert } from '../../ui/Alert';
import { syncDataToGoogleSheets } from '../../../services/googleSheetsSync';
import { uploadToR2 } from '../../../services/cloudflareR2';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  PencilSquareIcon,
  XMarkIcon,
  DocumentCheckIcon,
  CameraIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  userRole: any;
  onSaveSuccess: (updated: PPDBData) => void;
  onForceSubmit?: (data: PPDBData) => void;
}

export const KABUPATEN_LIST = [
  { kode: '17', nama: 'KABUPATEN ACEH BARAT' },
  { kode: '20', nama: 'KABUPATEN ACEH BARAT DAYA' },
  { kode: '06', nama: 'KABUPATEN ACEH BESAR' },
  { kode: '16', nama: 'KABUPATEN ACEH JAYA' },
  { kode: '21', nama: 'KABUPATEN ACEH SELATAN' },
  { kode: '15', nama: 'KABUPATEN ACEH SINGKIL' },
  { kode: '14', nama: 'KABUPATEN ACEH TAMIANG' },
  { kode: '10', nama: 'KABUPATEN ACEH TENGAH' },
  { kode: '22', nama: 'KABUPATEN ACEH TENGGARA' },
  { kode: '13', nama: 'KABUPATEN ACEH TIMUR' },
  { kode: '12', nama: 'KABUPATEN ACEH UTARA' },
  { kode: '11', nama: 'KABUPATEN BENER MERIAH' },
  { kode: '09', nama: 'KABUPATEN BIREUEN' },
  { kode: '23', nama: 'KABUPATEN GAYO LUES' },
  { kode: '18', nama: 'KABUPATEN NAGAN RAYA' },
  { kode: '07', nama: 'KABUPATEN PIDIE' },
  { kode: '08', nama: 'KABUPATEN PIDIE JAYA' },
  { kode: '19', nama: 'KABUPATEN SIMEULUE' },
  { kode: '01', nama: 'KOTA BANDA ACEH' },
  { kode: '04', nama: 'KOTA LANGSA' },
  { kode: '03', nama: 'KOTA LHOKSEUMAWE' },
  { kode: '02', nama: 'KOTA SABANG' },
  { kode: '05', nama: 'KOTA SUBULUSSALAM' },
  { kode: '24', nama: 'LUAR DAERAH' }
];

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  userRole,
  onSaveSuccess,
  onForceSubmit
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Partial<PPDBData>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  useEffect(() => {
    if (selectedData) {
      setFormData({ ...selectedData });
      setPendingFiles({});
      setFilePreviews({});
      setActiveTab(0);
    }
  }, [selectedData, isOpen]);

  if (!selectedData) return null;

  const handleChange = (field: keyof PPDBData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setPendingFiles(prev => ({ ...prev, [field]: file }));
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFilePreviews(prev => ({ ...prev, [field]: url }));
      }
    } else {
      setPendingFiles(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
      setFilePreviews(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.uid || !formData.school) return;

    setLoading(true);
    try {
      const updatedPayload: any = { ...formData };

      // Upload pending files to Cloudflare R2
      const fileKeys = Object.keys(pendingFiles);
      if (fileKeys.length > 0) {
        setUploadStatus(`Mengunggah ${fileKeys.length} berkas ke cloud storage...`);
        for (const key of fileKeys) {
          const file = pendingFiles[key];
          if (file) {
            const path = `ppdb_${formData.school}/${formData.uid}/${key}`;
            const uploadRes = await uploadToR2({
              file,
              path,
              contentType: file.type
            });
            updatedPayload[key] = uploadRes.url;
          }
        }
      }

      setUploadStatus('Menyimpan data pendaftar...');
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

      updatedPayload.lastUpdated = now;
      updatedPayload.updatedBy = updatedBy;

      const dbPath = `ppdb_${formData.school}/${formData.uid}`;
      await update(ref(db, dbPath), updatedPayload);

      // Sync to Google Sheets
      await syncDataToGoogleSheets(updatedPayload);

      showAlert('success', `Data & berkas pendaftar ${updatedPayload.namaSiswa} berhasil diperbarui!`);
      onSaveSuccess(updatedPayload as PPDBData);
      onClose();
    } catch (error) {
      console.error('Error updating pendaftar:', error);
      showAlert('error', 'Gagal memperbarui data & berkas pendaftar.');
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  const getFileDisplayValue = (field: string) => {
    if (filePreviews[field]) return filePreviews[field];
    if (pendingFiles[field]) return pendingFiles[field];
    return formData[field as keyof PPDBData] as string || null;
  };

  const tabSiswaContent = (
    <div className="space-y-4">
      {/* Photo Preview & Quick Upload Header */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-24 h-32 bg-gray-200 rounded-lg overflow-hidden border-2 border-white shadow shrink-0 flex items-center justify-center">
          {getFileDisplayValue('photo') ? (
            <img 
              src={getFileDisplayValue('photo') as string} 
              alt="Pas Foto" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="text-center p-2">
              <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
              <span className="text-[10px] text-gray-500 font-medium">Belum Ada Foto</span>
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h4 className="text-sm font-bold text-blue-950 flex items-center justify-center sm:justify-start gap-1.5">
            <CameraIcon className="w-4 h-4 text-blue-600" />
            <span>Pas Foto Siswa (3x4)</span>
          </h4>
          <p className="text-xs text-blue-800">
            Format: PNG/JPG/WEBP, maksimal 4MB. Foto ini akan dicetak pada Bukti Pendaftaran.
          </p>
          <div className="pt-1">
            <FileUpload
              label=""
              name="photo"
              accept="image/*"
              onChange={(file) => handleFileChange('photo', file)}
              value={getFileDisplayValue('photo')}
              showPreview={false}
              maxSize={4}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Nama Lengkap Siswa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.namaSiswa || ''}
            onChange={(e) => handleChange('namaSiswa', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            No. Registrasi / Pendaftaran
          </label>
          <input
            type="text"
            value={formData.registrationNumber || ''}
            onChange={(e) => handleChange('registrationNumber', e.target.value)}
            placeholder="Kosongkan jika belum ada"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            NIK <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nik || ''}
            onChange={(e) => handleChange('nik', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            NISN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nisn || ''}
            onChange={(e) => handleChange('nisn', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Jenis Kelamin
          </label>
          <select
            value={formData.jenisKelamin || ''}
            onChange={(e) => handleChange('jenisKelamin', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih Jenis Kelamin --</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Jalur Pendaftaran
          </label>
          <select
            value={formData.jalur || 'reguler'}
            onChange={(e) => handleChange('jalur', e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="prestasi">Prestasi</option>
            <option value="reguler">Reguler</option>
            <option value="undangan">Undangan</option>
            <option value="pjj">Pendidikan Jarak Jauh (PJJ)</option>
          </select>
        </div>

        {formData.jalur === 'pjj' && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-emerald-800 mb-1">
              Sekolah Penyelenggara PJJ
            </label>
            <input
              type="text"
              value={formData.pjjSchool || ''}
              onChange={(e) => handleChange('pjjSchool', e.target.value)}
              placeholder="Contoh: SMAN 1 Banda Aceh"
              className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Tempat Lahir
          </label>
          <input
            type="text"
            value={formData.tempatLahir || ''}
            onChange={(e) => handleChange('tempatLahir', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Tanggal Lahir
          </label>
          <input
            type="text"
            value={formData.tanggalLahir || ''}
            onChange={(e) => handleChange('tanggalLahir', e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Anak Ke-
          </label>
          <input
            type="text"
            value={formData.anakKe || ''}
            onChange={(e) => handleChange('anakKe', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Jumlah Saudara
          </label>
          <input
            type="text"
            value={formData.jumlahSaudara || ''}
            onChange={(e) => handleChange('jumlahSaudara', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Asal Sekolah
          </label>
          <input
            type="text"
            value={formData.asalSekolah || ''}
            onChange={(e) => handleChange('asalSekolah', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {formData.asalSekolah === 'SEKOLAH LAIN' && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Asal Sekolah Manual
            </label>
            <input
              type="text"
              value={formData.asalSekolahManual || ''}
              onChange={(e) => handleChange('asalSekolahManual', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Alamat Lengkap
          </label>
          <textarea
            rows={2}
            value={formData.alamat || ''}
            onChange={(e) => handleChange('alamat', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Alasan Kuat Memilih Sekolah
          </label>
          <textarea
            rows={3}
            value={formData.alasanPilihan || ''}
            onChange={(e) => handleChange('alasanPilihan', e.target.value)}
            placeholder="Alasan dan motivasi calon siswa..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Kecamatan
          </label>
          <input
            type="text"
            value={formData.kecamatan || ''}
            onChange={(e) => handleChange('kecamatan', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Kabupaten / Kota
          </label>
          <select
            value={formData.kabupaten || ''}
            onChange={(e) => handleChange('kabupaten', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih Kabupaten/Kota --</option>
            {KABUPATEN_LIST.map(kab => (
              <option key={kab.kode} value={kab.nama}>
                {kab.nama} ({kab.kode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Status Formulir
          </label>
          <select
            value={formData.status || 'draft'}
            onChange={(e) => handleChange('status', e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft (Belum Selesai)</option>
            <option value="submitted">Submitted (Selesai Pendaftaran)</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
    </div>
  );

  const tabRaporContent = (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 italic">
        Masukkan nilai rapor skala 0 - 100 untuk tiap semester (Semester 2, 3, 4).
      </p>
      
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs text-left text-gray-700">
          <thead className="bg-gray-100 uppercase font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-3">Mata Pelajaran</th>
              <th className="px-4 py-3">Semester 2</th>
              <th className="px-4 py-3">Semester 3</th>
              <th className="px-4 py-3">Semester 4</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 font-semibold">Pendidikan Agama</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiAgama2 || ''}
                  onChange={(e) => handleChange('nilaiAgama2', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiAgama3 || ''}
                  onChange={(e) => handleChange('nilaiAgama3', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiAgama4 || ''}
                  onChange={(e) => handleChange('nilaiAgama4', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 font-semibold">Bahasa Indonesia</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiBindo2 || ''}
                  onChange={(e) => handleChange('nilaiBindo2', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiBindo3 || ''}
                  onChange={(e) => handleChange('nilaiBindo3', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiBindo4 || ''}
                  onChange={(e) => handleChange('nilaiBindo4', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 font-semibold">Bahasa Inggris</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiBing2 || ''}
                  onChange={(e) => handleChange('nilaiBing2', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiBing3 || ''}
                  onChange={(e) => handleChange('nilaiBing3', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiBing4 || ''}
                  onChange={(e) => handleChange('nilaiBing4', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 font-semibold">Matematika</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiMtk2 || ''}
                  onChange={(e) => handleChange('nilaiMtk2', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiMtk3 || ''}
                  onChange={(e) => handleChange('nilaiMtk3', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiMtk4 || ''}
                  onChange={(e) => handleChange('nilaiMtk4', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
            </tr>

            <tr>
              <td className="px-4 py-3 font-semibold">IPA</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiIpa2 || ''}
                  onChange={(e) => handleChange('nilaiIpa2', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiIpa3 || ''}
                  onChange={(e) => handleChange('nilaiIpa3', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={formData.nilaiIpa4 || ''}
                  onChange={(e) => handleChange('nilaiIpa4', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-center"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabOrangTuaContent = (
    <div className="space-y-6">
      {/* Ayah */}
      <div>
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b">
          Data Ayah / Wali
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Ayah
            </label>
            <input
              type="text"
              value={formData.namaAyah || ''}
              onChange={(e) => handleChange('namaAyah', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              No. HP / WA Ayah
            </label>
            <input
              type="text"
              value={formData.hpAyah || ''}
              onChange={(e) => handleChange('hpAyah', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pekerjaan Ayah
            </label>
            <input
              type="text"
              value={formData.pekerjaanAyah || ''}
              onChange={(e) => handleChange('pekerjaanAyah', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Instansi Pekerjaan Ayah
            </label>
            <input
              type="text"
              value={formData.instansiAyah || ''}
              onChange={(e) => handleChange('instansiAyah', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ibu */}
      <div>
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b">
          Data Ibu / Wali
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Ibu
            </label>
            <input
              type="text"
              value={formData.namaIbu || ''}
              onChange={(e) => handleChange('namaIbu', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              No. HP / WA Ibu
            </label>
            <input
              type="text"
              value={formData.hpIbu || ''}
              onChange={(e) => handleChange('hpIbu', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pekerjaan Ibu
            </label>
            <input
              type="text"
              value={formData.pekerjaanIbu || ''}
              onChange={(e) => handleChange('pekerjaanIbu', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Instansi Pekerjaan Ibu
            </label>
            <input
              type="text"
              value={formData.instansiIbu || ''}
              onChange={(e) => handleChange('instansiIbu', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const tabDokumenContent = (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b flex items-center gap-1.5">
          <CameraIcon className="w-4 h-4 text-blue-600" />
          <span>Pas Foto Siswa</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <FileUpload
            label="Upload Pas Foto (3x4)"
            name="photo"
            accept="image/*"
            onChange={(file) => handleFileChange('photo', file)}
            value={getFileDisplayValue('photo')}
            showPreview={true}
            maxSize={4}
          />
          {getFileDisplayValue('photo') && (
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border">
              <p className="font-semibold text-gray-800 mb-1">Status Pas Foto:</p>
              <a 
                href={getFileDisplayValue('photo') as string} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                Lihat Foto Saat Ini ↗
              </a>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b flex items-center gap-1.5">
          <FolderIcon className="w-4 h-4 text-indigo-600" />
          <span>Dokumen Persyaratan Utama</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUpload
            label="Kartu Keluarga (KK)"
            name="kartuKeluarga"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('kartuKeluarga', file)}
            value={getFileDisplayValue('kartuKeluarga')}
            maxSize={5}
          />

          <FileUpload
            label="Akta Kelahiran"
            name="aktaKelahiran"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('aktaKelahiran', file)}
            value={getFileDisplayValue('aktaKelahiran')}
            maxSize={5}
          />

          <FileUpload
            label="Ijazah / SKL SMP / MTs"
            name="ijazah"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('ijazah', file)}
            value={getFileDisplayValue('ijazah')}
            maxSize={5}
          />

          <FileUpload
            label="Surat Rekomendasi"
            name="rekomendasi"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('rekomendasi', file)}
            value={getFileDisplayValue('rekomendasi')}
            maxSize={5}
          />

          <FileUpload
            label="Sertifikat Prestasi"
            name="sertifikat"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('sertifikat', file)}
            value={getFileDisplayValue('sertifikat')}
            maxSize={5}
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b flex items-center gap-1.5">
          <FolderIcon className="w-4 h-4 text-emerald-600" />
          <span>Berkas Scan Raport</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileUpload
            label="Raport Semester 2"
            name="raport2"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('raport2', file)}
            value={getFileDisplayValue('raport2')}
            maxSize={5}
          />

          <FileUpload
            label="Raport Semester 3"
            name="raport3"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('raport3', file)}
            value={getFileDisplayValue('raport3')}
            maxSize={5}
          />

          <FileUpload
            label="Raport Semester 4"
            name="raport4"
            accept="image/*,.pdf"
            onChange={(file) => handleFileChange('raport4', file)}
            value={getFileDisplayValue('raport4')}
            maxSize={5}
          />
        </div>
      </div>

      {formData.jalur === 'pjj' && (
        <div>
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 pb-1 border-b border-emerald-200 flex items-center gap-1.5">
            <FolderIcon className="w-4 h-4 text-emerald-700" />
            <span>Lampiran Tambahan PJJ</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="Lampiran A (PJJ)"
              name="lampiranA"
              accept="image/*,.pdf"
              onChange={(file) => handleFileChange('lampiranA', file)}
              value={getFileDisplayValue('lampiranA')}
              maxSize={5}
            />

            <FileUpload
              label="Lampiran B (PJJ)"
              name="lampiranB"
              accept="image/*,.pdf"
              onChange={(file) => handleFileChange('lampiranB', file)}
              value={getFileDisplayValue('lampiranB')}
              maxSize={5}
            />
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { label: 'Informasi Siswa', content: tabSiswaContent },
    { label: 'Nilai Rapor', content: tabRaporContent },
    { label: 'Informasi Orang Tua', content: tabOrangTuaContent },
    { label: 'Dokumen & Pas Foto', content: tabDokumenContent }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col max-h-[90vh] bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <PencilSquareIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Edit Data & Dokumen Pendaftar</h3>
              <p className="text-xs text-blue-100 font-mono">
                {formData.namaSiswa || 'Siswa'} ({formData.registrationNumber || 'Belum Registrasi'})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form & Tab Navigation */}
        <div className="p-6 overflow-y-auto flex-1">
          <Tabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        </div>

        {/* Status Indicator during upload */}
        {uploadStatus && (
          <div className="px-6 py-2 bg-blue-50 border-t border-blue-200 text-xs text-blue-800 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap items-center justify-between gap-3">
          {formData.status === 'draft' && onForceSubmit ? (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onForceSubmit(formData as PPDBData);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <DocumentCheckIcon className="w-4 h-4" />
              <span>Selesaikan Paksa Data</span>
            </Button>
          ) : <div />}

          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 text-xs font-medium"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => handleSave()}
              className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5"
              disabled={loading}
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span>{loading ? 'Menyimpan & Mengunggah...' : 'Simpan Perubahan'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditStudentModal;
