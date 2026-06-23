import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import { PPDBData } from '../../../types/ppdb';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  formatDateTime: (dateStr?: string) => string;
}

const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  formatDateTime,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="z-[60]"
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <div className={classNames(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            selectedData?.adminStatus === 'diterima' ? 'bg-green-100' : 'bg-red-100'
          )}>
            {selectedData?.adminStatus === 'diterima' ? (
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            ) : (
              <XCircleIcon className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedData?.adminStatus === 'diterima' ? 'Pendaftar Diterima' : 'Pendaftar Ditolak'}
          </h3>
          <p className="text-gray-600 mt-2">
            {selectedData?.namaSiswa} • NISN {selectedData?.nisn}
          </p>
        </div>

        {selectedData?.adminStatus === 'ditolak' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-1">Alasan Penolakan</p>
            <p className="text-sm text-red-700 whitespace-pre-line">
              {selectedData?.alasanPenolakan || '-'}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              Pendaftar dinyatakan diterima. Silakan lanjutkan proses administrasi sesuai ketentuan sekolah.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-6">
          <div>
            <span className="text-gray-500">Pemeriksa: </span>
            <span className="font-medium">{selectedData?.updatedBy?.name || selectedData?.updatedBy?.email?.split('@')[0] || '-'}</span>
            {selectedData?.updatedBy?.school === 'master' && (
              <span className="text-blue-600 font-medium"> (Admin Master)</span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Waktu Keputusan: </span>
            <span className="font-medium">
              {selectedData?.updatedBy?.timestamp ? formatDateTime(selectedData.updatedBy.timestamp) : '-'}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReasonModal;
