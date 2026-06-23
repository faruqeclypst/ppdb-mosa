import React from 'react';
import Input from '../ui/Input';

interface ParentInfoFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formStatus: 'draft' | 'submitted';
  disabledInputClass: string;
  SectionTitle: React.FC<{ children: React.ReactNode }>;
}

export const ParentInfoForm: React.FC<ParentInfoFormProps> = ({
  formData,
  setFormData,
  handleInputChange,
  formStatus,
  disabledInputClass,
  SectionTitle
}) => {
  const handlePhoneChange = (name: string, value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly === '0' || numbersOnly.startsWith('08')) {
      setFormData((prev: any) => ({ ...prev, [name]: numbersOnly }));
    } else if (numbersOnly !== '') {
      setFormData((prev: any) => ({ ...prev, [name]: `08${numbersOnly}` }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle>Data Ayah</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nama Lengkap Ayah"
            name="namaAyah"
            value={formData.namaAyah}
            onChange={handleInputChange}
            required
            disabled={formStatus === 'submitted'}
            className={disabledInputClass}
          />
          <Input
            label="Pekerjaan Ayah"
            name="pekerjaanAyah"
            value={formData.pekerjaanAyah}
            onChange={handleInputChange}
            required
            disabled={formStatus === 'submitted'}
            className={disabledInputClass}
          />
          <Input
            label="Instansi / Unit Kerja"
            name="instansiAyah"
            value={formData.instansiAyah}
            onChange={handleInputChange}
            required
            disabled={formStatus === 'submitted'}
            className={disabledInputClass}
          />
          <Input
            label="No. HP/WA Ayah (10-14 digit)"
            name="hpAyah"
            value={formData.hpAyah}
            onChange={(e) => {
              if (formStatus === 'submitted') return;
              handlePhoneChange('hpAyah', e.target.value);
            }}
            pattern="^08[0-9]{8,12}$"
            minLength={10}
            maxLength={14}
            required
            className={`${disabledInputClass} ${
              formData.hpAyah && !formData.hpAyah.match(/^08[0-9]{8,12}$/) 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : ''
            }`}
            placeholder="Contoh: 081234567890"
            disabled={formStatus === 'submitted'}
          />
        </div>
      </div>

      <div>
        <SectionTitle>Data Ibu</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nama Lengkap Ibu"
            name="namaIbu"
            value={formData.namaIbu}
            onChange={handleInputChange}
            required
            disabled={formStatus === 'submitted'}
            className={disabledInputClass}
          />
          <Input
            label="Pekerjaan Ibu"
            name="pekerjaanIbu"
            value={formData.pekerjaanIbu}
            onChange={handleInputChange}
            required
            disabled={formStatus === 'submitted'}
            className={disabledInputClass}
          />
          <Input
            label="Instansi / Unit Kerja"
            name="instansiIbu"
            value={formData.instansiIbu}
            onChange={handleInputChange}
            required
            disabled={formStatus === 'submitted'}
            className={disabledInputClass}
          />
          <Input
            label="No. HP/WA Ibu (10-14 digit)"
            name="hpIbu"
            value={formData.hpIbu}
            onChange={(e) => {
              if (formStatus === 'submitted') return;
              handlePhoneChange('hpIbu', e.target.value);
            }}
            pattern="^08[0-9]{8,12}$"
            minLength={10}
            maxLength={14}
            required
            className={`${disabledInputClass} ${
              formData.hpIbu && !formData.hpIbu.match(/^08[0-9]{8,12}$/) 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : ''
            }`}
            placeholder="Contoh: 081234567890"
            disabled={formStatus === 'submitted'}
          />
        </div>
      </div>
    </div>
  );
};

export default ParentInfoForm;
