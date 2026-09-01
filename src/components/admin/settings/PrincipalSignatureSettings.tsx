import React from 'react';
import FileUpload from '../../ui/FileUpload';
import type { PPDBSettings as PPDBSettingsType } from '../../../types/settings';

interface PrincipalSignatureSettingsProps {
  settings: PPDBSettingsType;
  uploadingSigMosa: boolean;
  deletingSigMosa: boolean;
  uploadingSigFajar: boolean;
  deletingSigFajar: boolean;
  handleSigUpload: (school: 'mosa' | 'fajar', file: File | null) => Promise<void>;
  handleSigDelete: (school: 'mosa' | 'fajar') => Promise<void>;
}

const PrincipalSignatureSettings: React.FC<PrincipalSignatureSettingsProps> = ({
  settings,
  uploadingSigMosa,
  deletingSigMosa,
  uploadingSigFajar,
  deletingSigFajar,
  handleSigUpload,
  handleSigDelete,
}) => {
  return (
    <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-6">
        <div className="pb-4 border-b border-zinc-100">
          <h3 className="text-base font-extrabold text-zinc-900">Tanda Tangan Digital Kepala Sekolah</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            File tanda tangan transparan (PNG) yang akan dicantumkan secara otomatis pada Surat Keterangan Lulus (SKL) dan Kartu Peserta
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMAN Modal Bangsa */}
          <div className="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-200/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                MOSA
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">SMAN Modal Bangsa & PJJ</h4>
                <p className="text-[10px] text-zinc-500">Kampus Aceh Besar</p>
              </div>
            </div>

            <FileUpload
              label="Unggah File TTD (PNG Transparan)"
              name="sigMosa"
              accept="image/*"
              value={settings.principalSignatureMosa}
              onChange={(file) => handleSigUpload('mosa', file)}
              onDelete={() => handleSigDelete('mosa')}
              showPreview={true}
              maxSize={4}
              className={uploadingSigMosa || deletingSigMosa ? 'opacity-50' : ''}
              isDeleting={deletingSigMosa}
            />

            {uploadingSigMosa && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                <span>Mengunggah tanda tangan...</span>
              </div>
            )}

            {settings.principalSignatureMosa && (
              <div className="mt-2">
                <span className="text-[11px] text-zinc-500 font-bold block mb-1">Pratinjau TTD MOSA:</span>
                <div className="w-full h-24 border border-dashed border-zinc-300 rounded-xl p-2 bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={settings.principalSignatureMosa}
                    alt="Tanda Tangan Kepsek Mosa"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SMAN 10 Fajar Harapan */}
          <div className="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-200/60">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                FAJAR
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">SMAN 10 Fajar Harapan</h4>
                <p className="text-[10px] text-zinc-500">Kampus Banda Aceh</p>
              </div>
            </div>

            <FileUpload
              label="Unggah File TTD (PNG Transparan)"
              name="sigFajar"
              accept="image/*"
              value={settings.principalSignatureFajar}
              onChange={(file) => handleSigUpload('fajar', file)}
              onDelete={() => handleSigDelete('fajar')}
              showPreview={true}
              maxSize={4}
              className={uploadingSigFajar || deletingSigFajar ? 'opacity-50' : ''}
              isDeleting={deletingSigFajar}
            />

            {uploadingSigFajar && (
              <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold">
                <div className="w-3.5 h-3.5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                <span>Mengunggah tanda tangan...</span>
              </div>
            )}

            {settings.principalSignatureFajar && (
              <div className="mt-2">
                <span className="text-[11px] text-zinc-500 font-bold block mb-1">Pratinjau TTD Fajar:</span>
                <div className="w-full h-24 border border-dashed border-zinc-300 rounded-xl p-2 bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={settings.principalSignatureFajar}
                    alt="Tanda Tangan Kepsek Fajar"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalSignatureSettings;
