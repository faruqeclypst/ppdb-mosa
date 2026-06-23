import React from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { PPDBData } from '../../../types/ppdb';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PPDBData | null;
  modalLoading: boolean;
  selectedStatus: 'diterima' | 'ditolak' | null;
  setSelectedStatus: (status: 'diterima' | 'ditolak' | null) => void;
  alasanPenolakan: string;
  setAlasanPenolakan: (reason: string) => void;
  onSave: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  selectedData,
  modalLoading,
  selectedStatus,
  setSelectedStatus,
  alasanPenolakan,
  setAlasanPenolakan,
  onSave,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="z-[60]"
    >
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ubah Status Pendaftar
          </h3>
          <p className="text-gray-600 mt-2">
            Pendaftar: <span className="font-medium">{selectedData?.namaSiswa}</span>
            <br />
            NISN: <span className="font-medium">{selectedData?.nisn}</span>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Opsi Terima */}
          <div 
            onClick={() => !modalLoading && setSelectedStatus('diterima')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              modalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'
            } ${selectedStatus === 'diterima' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
          >
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-3 ${
                selectedStatus === 'diterima' ? 'bg-green-500' : 'border-2 border-gray-400'
              }`} />
              <div>
                <p className="font-medium text-gray-900">Terima</p>
                <p className="text-sm text-gray-500">Pendaftar dinyatakan diterima</p>
              </div>
            </div>
          </div>

          {/* Opsi Tolak */}
          <div className="space-y-3">
            <div 
              onClick={() => !modalLoading && setSelectedStatus('ditolak')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                modalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
              } ${selectedStatus === 'ditolak' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  selectedStatus === 'ditolak' ? 'bg-red-500' : 'border-2 border-gray-400'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">Tolak</p>
                  <p className="text-sm text-gray-500">Pendaftar dinyatakan tidak diterima</p>
                </div>
              </div>
            </div>

            {/* Input alasan penolakan - tampil jika status Tolak dipilih atau ada alasan penolakan */}
            {(selectedStatus === 'ditolak' || (selectedStatus === null && alasanPenolakan)) && (
              <div className="px-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="alasanPenolakan"
                  value={alasanPenolakan}
                  onChange={(e) => setAlasanPenolakan(e.target.value)}
                  placeholder="Tuliskan alasan penolakan di sini..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
                {selectedStatus === 'ditolak' && !alasanPenolakan.trim() && (
                  <p className="mt-1 text-sm text-red-500">
                    Alasan penolakan wajib diisi
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={modalLoading}
          >
            Batal
          </Button>
          <Button
            onClick={onSave}
            className={`${
              selectedStatus === 'diterima' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
            disabled={
              modalLoading || 
              !selectedStatus || 
              (selectedStatus === 'ditolak' && !alasanPenolakan.trim())
            }
          >
            {modalLoading ? 'Memproses...' : 'Simpan Status'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatusModal;
