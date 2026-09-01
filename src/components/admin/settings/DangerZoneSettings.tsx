import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { db } from '../../../firebase/config';
import { testR2Connection, deleteFromR2 } from '../../../services/cloudflareR2';
import { showAlert } from '../../ui/Alert';
import Modal from '../../ui/Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    <div className="rounded-3xl p-1 bg-gradient-to-b from-rose-50 to-rose-100/50 border border-rose-200 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-rose-100">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
            <ExclamationTriangleIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-rose-950">Zona Bahaya (Danger Zone)</h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Tindakan di bawah ini bersifat destruktif dan menghapus data secara permanen tanpa pemulihan
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-900">Reset & Hapus Semua Data Pendaftar</h4>
            <p className="text-[11px] text-rose-700/90 mt-0.5 max-w-xl leading-relaxed">
              Menghapus seluruh rekaman siswa dari database Firebase Realtime Database dan memusnahkan seluruh berkas dokumen (PDF rapor, KK, foto, sertifikat) dari Cloudflare R2.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDangerModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 active:scale-95 transition-all shrink-0"
          >
            Hapus Semua Data
          </button>
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
            <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-3 text-rose-600">
              <ExclamationTriangleIcon className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1">
              Hapus Semua Data Pendaftar?
            </h3>
            <p className="text-xs text-zinc-500">
              Tindakan ini akan menghapus database siswa dan berkas di Cloudflare R2 secara permanen.
            </p>
          </div>

          {userRole?.isMaster && !isDeletingAll && (
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Target Kampus yang Ingin Dihapus
              </label>
              <select
                value={targetSchool}
                onChange={(e) => setTargetSchool(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 text-xs font-medium outline-none"
              >
                <option value="all">Semua Kampus (MOSA & Fajar Harapan)</option>
                <option value="mosa">SMAN Modal Bangsa</option>
                <option value="fajar">SMAN 10 Fajar Harapan</option>
              </select>
            </div>
          )}

          {!userRole?.isMaster && !isDeletingAll && (
            <div className="mb-4 bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs text-zinc-700">
              Sekolah yang akan dihapus: <strong>{userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}</strong>
            </div>
          )}

          {isDeletingAll ? (
            <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 text-center space-y-2">
              <div className="w-7 h-7 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-rose-800 font-bold">{dangerProgress}</p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-xs text-zinc-600 mb-2">
                Ketik <span className="font-bold text-rose-600">"HAPUS SEMUA DATA"</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={dangerConfirmation}
                onChange={(e) => setDangerConfirmation(e.target.value)}
                placeholder="HAPUS SEMUA DATA"
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 text-xs font-mono font-bold text-center tracking-wider outline-none uppercase"
              />
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => {
                setShowDangerModal(false);
                setDangerConfirmation('');
              }}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
              disabled={isDeletingAll}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetAllData}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              disabled={isDeletingAll || dangerConfirmation !== 'HAPUS SEMUA DATA'}
            >
              Ya, Hapus Semua
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DangerZoneSettings;
