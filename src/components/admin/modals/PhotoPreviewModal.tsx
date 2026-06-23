import React from 'react';
import Modal from '../../ui/Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      className="z-[70]"
    >
      <div className="relative bg-black">
        {/* Tombol close di pojok kanan atas */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        {/* Foto */}
        <div className="flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Pas Foto"
              className="w-full h-auto"
            />
          ) : (
            <div className="p-8 text-white text-center">Tidak ada foto</div>
          )}
        </div>
        
        {/* Footer dengan nama siswa */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-center font-medium">
            Pas Foto: {title || '-'}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PhotoPreviewModal;
