import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { DocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';

interface ForceSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  modalLoading: boolean;
  onConfirm: () => void;
}

const ForceSubmitModal: React.FC<ForceSubmitModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  modalLoading,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <DocumentCheckIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Selesaikan Paksa Pendaftaran
          </h3>
          <p className="text-sm text-gray-600">
            Pendaftar: <span className="font-semibold text-gray-900">{selectedData?.namaSiswa || 'Siswa Tanpa Nama'}</span>
            <br />
            NISN: <span className="font-mono text-gray-700">{selectedData?.nisn || '-'}</span>
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6 space-y-2 text-xs md:text-sm text-emerald-900">
          <p className="font-semibold flex items-center gap-1.5 text-emerald-800">
            <ExclamationTriangleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            Konfirmasi Penyelesaian Paksa oleh Admin:
          </p>
          <ul className="list-disc ml-5 space-y-1 text-emerald-800">
            <li>Status akan diubah dari <span className="font-bold uppercase">{selectedData?.status || 'draft'}</span> menjadi <span className="font-bold uppercase text-emerald-700">SUBMITTED</span>.</li>
            <li>Nomor Registrasi akan diproduksi secara otomatis jika belum ada.</li>
            <li>Tanggal pengiriman (submittedAt) akan dicatat berdasarkan waktu saat ini.</li>
            <li>Data akan disinkronkan otomatis ke Google Sheets.</li>
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
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
            disabled={modalLoading}
          >
            {modalLoading ? 'Memproses...' : 'Ya, Selesaikan Paksa'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ForceSubmitModal;
