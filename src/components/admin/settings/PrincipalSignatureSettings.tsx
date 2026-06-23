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
    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 md:p-6 rounded-xl border border-emerald-200">
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-semibold text-emerald-900">Tanda Tangan Kepala Sekolah</h3>
        <p className="text-xs md:text-sm text-emerald-700 mt-1">
          Upload gambar tanda tangan Kepala Sekolah yang akan otomatis dicantumkan di Surat Keterangan Lulus (SKL)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-lg p-4">
        {/* SMAN Modal Bangsa */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm border-b pb-2">SMAN Modal Bangsa & PJJ</h4>
          <FileUpload
            label="Gambar Tanda Tangan"
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
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Mengupload...</span>
            </div>
          )}
          {settings.principalSignatureMosa && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 block mb-1">Preview Tanda Tangan:</span>
              <div className="w-48 h-24 border border-dashed rounded-lg p-2 bg-gray-50 flex items-center justify-center overflow-hidden">
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
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm border-b pb-2">SMAN 10 Fajar Harapan</h4>
          <FileUpload
            label="Gambar Tanda Tangan"
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
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Mengupload...</span>
            </div>
          )}
          {settings.principalSignatureFajar && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 block mb-1">Preview Tanda Tangan:</span>
              <div className="w-48 h-24 border border-dashed rounded-lg p-2 bg-gray-50 flex items-center justify-center overflow-hidden">
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
  );
};

export default PrincipalSignatureSettings;
