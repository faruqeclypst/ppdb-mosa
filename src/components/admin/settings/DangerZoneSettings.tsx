import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { db } from '../../../firebase/config';
import { testR2Connection, deleteFromR2 } from '../../../services/cloudflareR2';
import { showAlert } from '../../ui/Alert';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

interface DangerZoneSettingsProps {
  userRole: any;
}

const DangerZoneSettings: React.FC<DangerZoneSettingsProps> = ({ userRole }) => {
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerConfirmation, setDangerConfirmation] = useState('');
  const [targetSchool, setTargetSchool] = useState<string>('');
  const [dangerProgress, setDangerProgress] = useState('');
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  useEffect(() => {
    if (userRole) {
      setTargetSchool(userRole.isMaster ? 'all' : (userRole.school || ''));
    }
  }, [userRole]);

  const extractFileKeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error('Error extracting key:', url, error);
      return null;
    }
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
      const connectionTest = await testR2Connection();
      if (!connectionTest.success) {
        throw new Error('Gagal terhubung ke Cloudflare R2 storage: ' + connectionTest.message);
      }

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

      const filesToDelete: string[] = [];

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

  return (
    <div className="bg-red-50 rounded-xl p-4 md:p-6 border-2 border-red-200 shadow-sm relative overflow-hidden">
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
    </div>
  );
};

export default DangerZoneSettings;
