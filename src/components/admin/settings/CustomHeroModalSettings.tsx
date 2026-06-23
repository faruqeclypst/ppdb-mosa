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
    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 md:p-6 rounded-xl border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-purple-900">Modal Khusus di Hero</h3>
          <p className="text-xs md:text-sm text-purple-700 mt-1">
            Kelola modal yang muncul di halaman hero dengan pesan kustom
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
            settings.customModal.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {settings.customModal.isEnabled ? 'Aktif' : 'Nonaktif'}
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
            className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-purple-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
          />
        </div>
      </div>

      {settings.customModal.isEnabled && (
        <div className="bg-white rounded-lg p-4 space-y-4">
          <Input
            label="Judul Modal"
            value={settings.customModal.title}
            onChange={(e) => setSettings(prev => ({ 
              ...prev, 
              customModal: { 
                ...prev.customModal, 
                title: e.target.value 
              } 
            }))}
            placeholder="Contoh: Penting! Perubahan Jadwal"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pesan Modal
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
              placeholder="Tulis pesan yang akan ditampilkan dalam modal..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <FileUpload
              label="Gambar Modal (Opsional)"
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
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Mengupload gambar...</span>
              </div>
            )}
            {deletingImage && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Menghapus gambar...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teks Link (Opsional)"
              value={settings.customModal.linkText}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                customModal: { 
                  ...prev.customModal, 
                  linkText: e.target.value 
                } 
              }))}
              placeholder="Contoh: Lihat Detail"
            />

            <Input
              label="URL Link (Opsional)"
              value={settings.customModal.linkUrl}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                customModal: { 
                  ...prev.customModal, 
                  linkUrl: e.target.value 
                } 
              }))}
              placeholder="https://example.com/link"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> Modal akan muncul di halaman hero dengan konten di atas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomHeroModalSettings;
