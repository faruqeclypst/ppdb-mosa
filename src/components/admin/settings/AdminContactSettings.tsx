import React from 'react';
import Input from '../../ui/Input';
import { PPDBSettings as PPDBSettingsType } from '../../../types/settings';
import { PhoneIcon } from '@heroicons/react/24/outline';

interface AdminContactSettingsProps {
  settings: PPDBSettingsType;
  onUpdateAdminContact: (adminKey: 'admin1' | 'admin2' | 'admin3' | 'admin4', field: 'name' | 'whatsapp', value: string) => void;
}

const AdminContactSettings: React.FC<AdminContactSettingsProps> = ({
  settings,
  onUpdateAdminContact,
}) => {
  const admins: ('admin1' | 'admin2' | 'admin3' | 'admin4')[] = ['admin1', 'admin2', 'admin3', 'admin4'];

  const adminRoles = [
    'Panitia Helpdesk Utama',
    'Panitia Teknis & Berkas',
    'Panitia Verifikasi Nilai',
    'Panitia SPMB Jarak Jauh (PJJ)'
  ];

  return (
    <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden space-y-4">
      <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-6">
        <div className="pb-4 border-b border-zinc-100">
          <h3 className="text-base font-extrabold text-zinc-900">Kontak Narahubung & Helpdesk WhatsApp</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Nomor WhatsApp yang akan muncul pada widget floating helpdesk dan halaman informasi kontak calon siswa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {admins.map((adminKey, idx) => (
            <div key={adminKey} className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <span className="text-xs font-bold text-zinc-800">{adminRoles[idx]}</span>
                </div>
                <span className="text-[10px] font-semibold text-zinc-400">Admin {idx + 1}</span>
              </div>

              <div className="space-y-3">
                <Input
                  label="Nama Petugas / Narahubung"
                  value={settings.contactWhatsapp[adminKey]?.name || ''}
                  onChange={(e) => onUpdateAdminContact(adminKey, 'name', e.target.value)}
                  placeholder="Contoh: Pak Faruq (Helpdesk)"
                  required
                />
                <Input
                  label="Nomor WhatsApp (Awali dengan 62)"
                  value={settings.contactWhatsapp[adminKey]?.whatsapp || ''}
                  onChange={(e) => onUpdateAdminContact(adminKey, 'whatsapp', e.target.value)}
                  placeholder="6281234567890"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-[11px] text-emerald-900 flex items-center gap-2 font-medium">
          <PhoneIcon className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>Gunakan format internasional (contoh: <strong>6281234567890</strong>) tanpa spasi atau strip agar link WhatsApp dapat terbuka langsung.</span>
        </div>
      </div>
    </div>
  );
};

export default AdminContactSettings;
