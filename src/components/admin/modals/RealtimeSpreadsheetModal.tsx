import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { PPDBData } from '../../../types/ppdb';
import { getJalurLabel } from '../AdminBadges';
import { exportPendaftarToExcel, exportToCSV, getStatusKelengkapan } from '../utils/exportExcel';
import { getGoogleAppsScriptTemplate, syncAllExistingDataToGoogleSheets } from '../../../services/googleSheetsSync';
import { showAlert } from '../../ui/Alert';
import { ref, get } from 'firebase/database';
import { db } from '../../../firebase/config';
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  ClipboardDocumentIcon, 
  CheckIcon, 
  MagnifyingGlassIcon,
  SparklesIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface RealtimeSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PPDBData[];
  userRole: any;
  mode?: 'regular' | 'pjj';
  lastUpdatedTime?: string;
}

const RealtimeSpreadsheetModal: React.FC<RealtimeSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  data,
  userRole,
  mode = 'regular',
  lastUpdatedTime = new Date().toLocaleTimeString('id-ID')
}) => {
  const [search, setSearch] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'setup'>('grid');
  const [syncingAll, setSyncingAll] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');

  useEffect(() => {
    const loadSpreadsheetUrl = async () => {
      try {
        const settingsRef = ref(db, 'settings/ppdb');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const gs = snapshot.val().googleSheets;
          if (gs?.spreadsheetUrl) {
            setSpreadsheetUrl(gs.spreadsheetUrl);
          }
        }
      } catch (err) {
        console.error('Error loading spreadsheetUrl:', err);
      }
    };
    if (isOpen) {
      loadSpreadsheetUrl();
    }
  }, [isOpen]);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await syncAllExistingDataToGoogleSheets(undefined, data);
    } finally {
      setSyncingAll(false);
    }
  };

  const filteredData = data.filter(item => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (item.namaSiswa || '').toLowerCase().includes(term) ||
      (item.nisn || '').includes(term) ||
      (item.nik || '').includes(term) ||
      (item.registrationNumber || '').toLowerCase().includes(term) ||
      (item.asalSekolah || '').toLowerCase().includes(term) ||
      (item.email || '').toLowerCase().includes(term) ||
      (item.hpAyah || '').includes(term) ||
      (item.hpIbu || '').includes(term) ||
      (item.adminStatus || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  });

  const handleCopyScript = () => {
    const script = getGoogleAppsScriptTemplate('alfaruqasri@sman-modalbangsa.sch.id');
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    showAlert('success', 'Skrip Google Apps Script berhasil disalin!');
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <TableCellsIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">Realtime Spreadsheet Grid</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  LIVE REALTIME
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Total: <span className="font-semibold text-gray-800">{filteredData.length}</span> pendaftar | Terakhir diperbarui: {lastUpdatedTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'grid' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Tampilan Grid Live
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${activeTab === 'setup' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Sheets Sync</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'grid' ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari di spreadsheet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3 rounded-lg font-bold shadow-sm transition-colors"
                  >
                    <span>Buka Google Sheets</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                <Button
                  onClick={() => exportPendaftarToExcel(filteredData, userRole, mode)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-3 rounded-lg font-medium"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Export XLSX</span>
                </Button>

                <Button
                  onClick={() => exportToCSV(filteredData, `PPDB_Spreadsheet_${mode}`)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg font-medium"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </div>

            {/* Grid Table Container */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-white">
              <div className="max-h-[450px] overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-800 text-slate-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold text-center w-10 align-middle">No</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[140px] align-middle">No. Pendaftaran</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[120px] align-middle">NISN</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[200px] align-middle">Nama Lengkap</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[100px] align-middle">Jalur</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[120px] align-middle">Kelengkapan</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[100px] align-middle">Status</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[180px] align-middle">Asal Sekolah</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[130px] align-middle">No HP Ayah</th>
                      <th className="px-3 py-2.5 border-b border-r border-slate-700 font-bold min-w-[130px] align-middle">No HP Ibu</th>
                      <th className="px-3 py-2.5 border-b border-slate-700 font-bold min-w-[150px] align-middle">Tanggal Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-500">
                          Tidak ada data pendaftar yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, idx) => (
                        <tr key={item.uid || idx} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-2.5 border-r border-gray-200 text-center font-medium text-gray-500 bg-gray-50/50 align-middle whitespace-nowrap">{idx + 1}</td>
                          <td className="px-3 py-2.5 border-r border-gray-200 font-mono font-medium text-gray-900 align-middle whitespace-nowrap">{item.registrationNumber || '-'}</td>
                          <td className="px-3 py-2.5 border-r border-gray-200 font-mono text-gray-700 align-middle whitespace-nowrap">{item.nisn || '-'}</td>
                          <td className="px-3 py-2.5 border-r border-gray-200 font-semibold text-gray-900 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {item.photo ? (
                                <img
                                  src={item.photo}
                                  alt={item.namaSiswa || 'Foto'}
                                  className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                                />
                              ) : null}
                              <span>{item.namaSiswa || '-'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-gray-200 text-center align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              {item.jalur ? getJalurLabel(item.jalur) : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 border-r border-gray-200 text-center font-semibold text-emerald-700 align-middle whitespace-nowrap">{getStatusKelengkapan(item)}</td>
                          <td className="px-3 py-2.5 border-r border-gray-200 text-center align-middle whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              item.adminStatus === 'diterima' ? 'bg-green-100 text-green-800' :
                              item.adminStatus === 'ditolak' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {item.adminStatus ? item.adminStatus.toUpperCase() : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 border-r border-gray-200 text-gray-700 truncate max-w-[200px] align-middle" title={item.asalSekolah}>
                            {item.asalSekolah === 'SEKOLAH LAIN' ? (item.asalSekolahManual || 'SEKOLAH LAIN') : (item.asalSekolah || '-')}
                          </td>
                          <td className="px-3 py-2.5 border-r border-gray-200 font-mono text-gray-700 align-middle whitespace-nowrap">{item.hpAyah || '-'}</td>
                          <td className="px-3 py-2.5 border-r border-gray-200 font-mono text-gray-700 align-middle whitespace-nowrap">{item.hpIbu || '-'}</td>
                          <td className="px-3 py-2.5 text-gray-500 text-[11px] align-middle whitespace-nowrap">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Google Sheets Setup Instructions Tab */
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold">Sinkronisasi Otomatis ke Google Sheets Realtime</p>
                <p className="mt-0.5">
                  Ikuti 4 langkah mudah di bawah untuk menghubungkan akun Google Sheets <span className="font-bold text-blue-900">alfaruqasri@sman-modalbangsa.sch.id</span> agar data pendaftar baru langsung terisi otomatis ke Google Spreadsheet Anda!
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-emerald-900">Kirim Semua Data Database yang Sudah Ada ke Spreadsheet</p>
                <p className="text-emerald-700 text-[11px]">
                  Sudah menyimpan URL Webhook di Pengaturan? Klik tombol di kanan untuk langsung memasukkan seluruh data pendaftar yang ada di database ke Google Sheets.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSyncAll}
                disabled={syncingAll}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-lg font-bold shadow-sm flex-shrink-0"
              >
                <ArrowPathIcon className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>{syncingAll ? 'Mengirim Data...' : 'Sync Semua Data Now'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="inline-block bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mb-1">Langkah 1</span>
                  <p className="font-medium text-gray-900">Buat File Google Sheets Baru</p>
                  <p className="text-gray-500 mt-0.5">Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline">sheets.new</a> dengan akun <span className="font-semibold">alfaruqasri@sman-modalbangsa.sch.id</span>.</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="inline-block bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mb-1">Langkah 2</span>
                  <p className="font-medium text-gray-900">Buka Apps Script</p>
                  <p className="text-gray-500 mt-0.5">Di menu atas Google Sheets, klik <span className="font-bold">Ekstensi &gt; Apps Script</span>.</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="inline-block bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mb-1">Langkah 3</span>
                  <p className="font-medium text-gray-900">Tempelkan Kode Skrip Webhook</p>
                  <p className="text-gray-500 mt-0.5">Hapus kode bawaan, lalu salin dan tempelkan kode di panel sebelah kanan.</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="inline-block bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] mb-1">Langkah 4</span>
                  <p className="font-medium text-gray-900">Deploy Web App & Tempel URL</p>
                  <p className="text-gray-500 mt-0.5">Klik <span className="font-bold">Deploy &gt; New deployment</span>, pilih <span className="font-bold">Web app</span>, ubah Access ke <span className="font-bold">Anyone</span>, salin URL-nya, lalu masukkan di menu Pengaturan PPDB Admin.</p>
                </div>
              </div>

              {/* Code Box */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 flex flex-col justify-between font-mono text-[11px] shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                  <span className="text-slate-400 text-[10px]">Google Apps Script Code</span>
                  <Button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-sans font-medium"
                  >
                    {copiedScript ? <CheckIcon className="w-3.5 h-3.5" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Tersalin!' : 'Salin Skrip'}</span>
                  </Button>
                </div>

                <div className="overflow-auto max-h-[260px] custom-scrollbar text-slate-300 pr-2">
                  <pre>{getGoogleAppsScriptTemplate('alfaruqasri@sman-modalbangsa.sch.id')}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t">
          <Button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2">
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RealtimeSpreadsheetModal;
