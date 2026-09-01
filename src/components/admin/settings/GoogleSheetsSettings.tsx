import React, { useState } from 'react';
import Input from '../../ui/Input';
import { getGoogleAppsScriptTemplate, syncAllExistingDataToGoogleSheets } from '../../../services/googleSheetsSync';
import { showAlert } from '../../ui/Alert';
import { ClipboardDocumentIcon, CheckIcon, ArrowPathIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface GoogleSheetsSettingsProps {
  settings: {
    isEnabled: boolean;
    webhookUrl?: string;
    accountEmail?: string;
    spreadsheetUrl?: string;
  };
  onChange: (updated: { isEnabled: boolean; webhookUrl?: string; accountEmail?: string; spreadsheetUrl?: string }) => void;
}

const GoogleSheetsSettings: React.FC<GoogleSheetsSettingsProps> = ({ settings, onChange }) => {
  const [copied, setCopied] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const accountEmail = settings.accountEmail || 'alfaruqasri@sman-modalbangsa.sch.id';

  const handleCopyScript = () => {
    const script = getGoogleAppsScriptTemplate(accountEmail);
    navigator.clipboard.writeText(script);
    setCopied(true);
    showAlert('success', 'Skrip Google Apps Script berhasil disalin!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSyncAllExisting = async () => {
    if (!settings.webhookUrl) {
      showAlert('error', 'Google Apps Script Webhook URL belum diisi!');
      return;
    }

    setSyncingAll(true);
    try {
      await syncAllExistingDataToGoogleSheets(settings.webhookUrl);
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-6">
        {/* Header & Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-extrabold text-zinc-900">Integrasi Realtime Google Sheets</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Sinkronisasi instan data formulir dan verifikasi admin ke Google Spreadsheet milik <span className="font-semibold text-zinc-800">{accountEmail}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              settings.isEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              {settings.isEnabled ? 'Sync Aktif' : 'Sync Nonaktif'}
            </span>
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(e) => onChange({ ...settings, isEnabled: e.target.checked })}
              className="w-11 h-6 rounded-full bg-zinc-200 cursor-pointer appearance-none checked:bg-emerald-600 transition-colors duration-200 relative before:content-[''] before:w-5 before:h-5 before:bg-white before:shadow-md before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
            />
          </div>
        </div>

        {settings.isEnabled ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Akun Google Pemilik Spreadsheet"
                type="email"
                value={accountEmail}
                onChange={(e) => onChange({ ...settings, accountEmail: e.target.value })}
                placeholder="alfaruqasri@sman-modalbangsa.sch.id"
              />

              <Input
                label="Google Apps Script Webhook URL (POST)"
                type="url"
                value={settings.webhookUrl || ''}
                onChange={(e) => onChange({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                Tautan / Link Langsung Google Spreadsheet
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={settings.spreadsheetUrl || ''}
                  onChange={(e) => onChange({ ...settings, spreadsheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="flex-1 py-2.5 px-3.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 outline-none font-medium"
                />
                {settings.spreadsheetUrl && (
                  <a
                    href={settings.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs transition-colors shrink-0"
                  >
                    <span>Buka Spreadsheet</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Sync All Existing Data Action Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900">Kirim Semua Data Database ke Spreadsheet</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Kirim seluruh data pendaftar yang sudah tersimpan di database ke Google Sheets secara massal
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncAllExisting}
                disabled={syncingAll || !settings.webhookUrl}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 transition-all"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>{syncingAll ? 'Mengirim Data...' : 'Sync Semua Data'}</span>
              </button>
            </div>

            {/* Copy Script Helper Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-zinc-900">Butuh Kode Webhook Apps Script?</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Salin skrip otomatis untuk ditempel pada menu Ekstensi &gt; Apps Script di Google Sheets Anda
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              >
                {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Skrip Webhook'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-100 text-center text-xs text-zinc-400">
            Integrasi Google Sheets dinonaktifkan. Aktifkan saklar di atas untuk mengaktifkan sinkronisasi otomatis.
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsSettings;
