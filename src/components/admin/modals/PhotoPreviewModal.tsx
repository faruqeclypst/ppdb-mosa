import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import { XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setHasError(false);
    }
  }, [isOpen, imageUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      className="z-[70] overflow-hidden rounded-3xl"
    >
      <div className="relative bg-zinc-950 min-h-[320px] flex flex-col justify-center">
        {/* Tombol close di pojok kanan atas */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 backdrop-blur-md transition-all z-20"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Loading Spinner & Shimmer */}
        {loading && !hasError && imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-10 space-y-3">
            <ArrowPathIcon className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs text-zinc-400 font-medium">Memuat pas foto...</p>
          </div>
        )}

        {/* Foto Display */}
        <div className="flex items-center justify-center p-2">
          {imageUrl && !hasError ? (
            <img
              src={imageUrl}
              alt="Pas Foto"
              decoding="async"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
              className={`w-full max-h-[75vh] object-contain rounded-xl transition-opacity duration-300 ${
                loading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : hasError ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center space-y-2">
              <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
              <p className="text-sm font-semibold text-zinc-300">Gagal memuat gambar</p>
              <p className="text-xs text-zinc-500">Berkas mungkin telah dihapus atau koneksi bermasalah</p>
            </div>
          ) : (
            <div className="p-12 text-zinc-400 text-center text-sm">Tidak ada foto</div>
          )}
        </div>

        {/* Footer dengan nama siswa */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-center">
          <p className="text-white font-bold text-sm truncate">
            {title || 'Pas Foto Pendaftar'}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Pas Foto Formal Calon Siswa</p>
        </div>
      </div>
    </Modal>
  );
};

export default PhotoPreviewModal;
