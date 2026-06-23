import React from 'react';
import Input from '../../ui/Input';
import RequirementsSection from './RequirementsSection';
import { JalurPeriod } from '../../../types/settings';

interface JalurPeriodSettingsProps {
  title: string;
  jalurKey: 'jalurPrestasi' | 'jalurReguler' | 'jalurUndangan' | 'jalurPjj';
  period: JalurPeriod;
  onUpdatePeriod: (field: keyof JalurPeriod, value: any) => void;
  onAddRequirement: () => void;
  onRemoveRequirement: (index: number) => void;
  onUpdateRequirement: (index: number, value: string) => void;
}

const JalurPeriodSettings: React.FC<JalurPeriodSettingsProps> = ({
  title,
  jalurKey,
  period,
  onUpdatePeriod,
  onAddRequirement,
  onRemoveRequirement,
  onUpdateRequirement,
}) => {
  return (
    <div className="bg-white rounded-xl p-3 md:p-6 border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
            period.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {period.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
          <input
            type="checkbox"
            checked={period.isActive}
            onChange={(e) => onUpdatePeriod('isActive', e.target.checked)}
            className="w-10 h-5 rounded-full bg-gray-200 cursor-pointer appearance-none checked:bg-blue-600 transition-colors duration-200 relative before:content-[''] before:w-4 before:h-4 before:bg-white before:shadow-sm before:rounded-full before:absolute before:top-0.5 before:left-0.5 before:transition-transform before:duration-200 checked:before:transform checked:before:translate-x-5"
          />
        </div>
      </div>
      <div className="space-y-6">
        <Input
          label="Tanggal Mulai"
          type="date"
          value={period.start || ''}
          onChange={(e) => onUpdatePeriod('start', e.target.value)}
          required
        />
        <Input
          label="Tanggal Selesai"
          type="date"
          value={period.end || ''}
          onChange={(e) => onUpdatePeriod('end', e.target.value)}
          required
        />
        <Input
          label="Tanggal Tes"
          type="date"
          value={period.testDate || ''}
          onChange={(e) => onUpdatePeriod('testDate', e.target.value)}
          required
        />
        <Input
          label="Tanggal Pengumuman"
          type="date"
          value={period.announcementDate || ''}
          onChange={(e) => onUpdatePeriod('announcementDate', e.target.value)}
          required
        />
        <Input
          label="Mulai Daftar Ulang"
          type="date"
          value={period.reRegistrationStart || ''}
          onChange={(e) => onUpdatePeriod('reRegistrationStart', e.target.value)}
        />
        <Input
          label="Selesai Daftar Ulang"
          type="date"
          value={period.reRegistrationEnd || ''}
          onChange={(e) => onUpdatePeriod('reRegistrationEnd', e.target.value)}
        />
        <RequirementsSection
          jalur={jalurKey}
          requirements={period.requirements || []}
          onAdd={onAddRequirement}
          onRemove={onRemoveRequirement}
          onUpdate={onUpdateRequirement}
        />
      </div>
    </div>
  );
};

export default JalurPeriodSettings;
