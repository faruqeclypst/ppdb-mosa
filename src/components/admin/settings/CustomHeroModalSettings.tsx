import React from 'react';
import Input from '../../ui/Input';
import FileUpload from '../../ui/FileUpload';
import type { PPDBSettings as PPDBSettingsType } from '../../../types/settings';

interface CustomHeroModalSettingsProps {
  settings: PPDBSettingsType;
  setSettings: React.Dispatch<React.SetStateAction<PPDBSettingsType>>;
  uploadingImage: boolean;
  deletingImage: boolean;
  handleImageUpload: (file: File | null) => Promise<void>;
  handleImageDelete: () => void;
}

const CustomHeroModalSettings: React.FC<CustomHeroModalSettingsProps> = ({
  settings,
  setSettings,
  uploadingImage,
  deletingImage,
  handleImageUpload,
  handleImageDelete,
}) => {
  return (
    <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-6">
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-extrabold text-zinc-900">Modal Pop-up Selamat Datang di Beranda</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tampilkan pesan pengumuman darurat atau panduan khusus saat pengunjung membuka landing page
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              settings.customModal.isEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              {settings.customModal.isEnabled ? 'Pop-up Aktif' : 'Pop-up Nonaktif'}
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
              className="w-11 h-6 rounded-full bg-zinc-200 cursor-pointer appearance-none checked:bg-emerald-600 transition-colors duration-200 relative before:content-[''] before:w-5 before:h-5 before:bg-white before:shadow-md before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
            />
          </div>
        </div>

        {settings.customModal.isEnabled ? (
          <div className="space-y-4">
            <Input
              label="Judul Pop-up Pengumuman"
              value={settings.customModal.title}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                customModal: { 
                  ...prev.customModal, 
                  title: e.target.value 
                } 
              }))}
              placeholder="Contoh: PENTING: Pengumuman Jadwal Ujian CBT & Lokasi Tes"
              required
            />
            
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Isi Pesan Pengumuman
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
                placeholder="Tuliskan instruksi atau detail pengumuman yang akan dibaca calon siswa..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 outline-none resize-none font-medium"
                required
              />
            </div>

            <div>
              <FileUpload
                label="Poster / Gambar Banner Pop-up (Opsional)"
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
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengunggah poster ke Cloudflare R2...</span>
                </div>
              )}
              {deletingImage && (
                <div className="mt-2 flex items-center gap-2 text-xs text-rose-600 font-semibold">
                  <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Menghapus poster...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teks Tombol Aksi / Link (Opsional)"
                value={settings.customModal.linkText}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customModal: { 
                    ...prev.customModal, 
                    linkText: e.target.value 
                  } 
                }))}
                placeholder="Contoh: Unduh Jadwal Lengkap (PDF)"
              />

              <Input
                label="URL Tujuan Tombol (Opsional)"
                value={settings.customModal.linkUrl}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  customModal: { 
                    ...prev.customModal, 
                    linkUrl: e.target.value 
                  } 
                }))}
                placeholder="https://sman-modalbangsa.sch.id/info"
              />
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-100 text-center text-xs text-zinc-400">
            Pop-up modal beranda saat ini dinonaktifkan. Aktifkan saklar di atas jika ingin menampilkan pengumuman khusus.
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomHeroModalSettings;
