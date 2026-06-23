import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  modalLoading: boolean;
  onConfirm: () => void;
}

const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  modalLoading,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <ArrowPathIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Reset Data Pendaftar
          </h3>
          <p className="text-gray-600">
            Pendaftar: <span className="font-medium">{selectedData?.namaSiswa}</span>
            <br />
            NISN: <span className="font-medium">{selectedData?.nisn}</span>
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-yellow-800 font-semibold">
            Tindakan ini akan:
          </p>
          <ul className="list-disc ml-4 mt-2 text-sm text-yellow-700 space-y-1">
            <li>Mengubah status pendaftar menjadi reset / draft</li>
            <li>Menghapus status keputusan admin</li>
            <li>Memungkinkan pendaftar untuk mengirim ulang formulir</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={modalLoading}
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
            disabled={modalLoading}
          >
            {modalLoading ? 'Memproses...' : 'Ya, Reset Data'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResetConfirmModal;
