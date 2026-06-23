import React from 'react';
import Input from '../../ui/Input';
import { PPDBSettings as PPDBSettingsType } from '../../../types/settings';

interface AdminContactSettingsProps {
  settings: PPDBSettingsType;
  onUpdateAdminContact: (adminKey: 'admin1' | 'admin2' | 'admin3' | 'admin4', field: 'name' | 'whatsapp', value: string) => void;
}

const AdminContactSettings: React.FC<AdminContactSettingsProps> = ({
  settings,
  onUpdateAdminContact,
}) => {
  const admins: ('admin1' | 'admin2' | 'admin3' | 'admin4')[] = ['admin1', 'admin2', 'admin3', 'admin4'];

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontak Admin</h3>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {admins.map((adminKey, idx) => (
          <div key={adminKey} className="space-y-6">
            <Input
              label={`Nama Admin ${idx + 1}`}
              value={settings.contactWhatsapp[adminKey]?.name || ''}
              onChange={(e) => onUpdateAdminContact(adminKey, 'name', e.target.value)}
              required
            />
            <Input
              label={`WhatsApp Admin ${idx + 1}`}
              value={settings.contactWhatsapp[adminKey]?.whatsapp || ''}
              onChange={(e) => onUpdateAdminContact(adminKey, 'whatsapp', e.target.value)}
              required
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminContactSettings;
