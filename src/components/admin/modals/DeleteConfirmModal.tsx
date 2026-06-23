import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { TrashIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  modalLoading: boolean;
  deleteConfirmation: string;
  setDeleteConfirmation: (val: string) => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  modalLoading,
  deleteConfirmation,
  setDeleteConfirmation,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!modalLoading) {
          onClose();
        }
      }}
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <TrashIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Hapus Data Pendaftar
          </h3>
          <p className="text-gray-600 mt-2">
            Apakah Anda yakin ingin menghapus data pendaftar{' '}
            <span className="font-medium">{selectedData?.namaSiswa || 'ini'}</span>?
            <br />
            <span className="text-sm text-red-500 mt-2 block">
              Tindakan ini tidak dapat dibatalkan dan akan menghapus akun pendaftar.
            </span>
          </p>
        </div>

        {/* Input Konfirmasi */}
        <div className="mb-6">
          <label className="block text-sm text-gray-700 mb-2">
            Ketik "hapus data" untuk mengkonfirmasi:
          </label>
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="hapus data"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={modalLoading}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={modalLoading}
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={modalLoading || deleteConfirmation !== 'hapus data'}
          >
            {modalLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghapus...</span>
              </div>
            ) : (
              'Hapus'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
