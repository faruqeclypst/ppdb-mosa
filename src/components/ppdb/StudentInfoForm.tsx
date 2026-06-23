import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import SearchableSelect from './SearchableSelect';

interface StudentInfoFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formStatus: 'draft' | 'submitted';
  disabledInputClass: string;
  ppdbSettings: any;
  KABUPATEN_LIST: Array<{ kode: string; nama: string }>;
  SectionTitle: React.FC<{ children: React.ReactNode }>;
}

export const StudentInfoForm: React.FC<StudentInfoFormProps> = ({
  formData,
  setFormData,
  handleInputChange,
  formStatus,
  disabledInputClass,
  ppdbSettings,
  KABUPATEN_LIST,
  SectionTitle
}) => {
  
  const isDateInRange = (start: string, end: string) => {
    const currentDate = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    currentDate.setHours(12, 0, 0, 0);
    return currentDate >= startDate && currentDate <= endDate;
  };

  const isDateBeforeStart = (start: string) => {
    const currentDate = new Date();
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    currentDate.setHours(12, 0, 0, 0);
    return currentDate < startDate;
  };

  const getAvailableJalur = () => {
    const options = [
      { value: '', label: '-- Pilih Jalur --', disabled: true }
    ];

    if (!ppdbSettings) return options;

    const jalurList = [
      {
        value: 'prestasi',
        label: 'Prestasi',
        settings: ppdbSettings.jalurPrestasi
      },
      {
        value: 'reguler',
        label: 'Reguler',
        settings: ppdbSettings.jalurReguler
      },
      {
        value: 'undangan',
        label: 'Undangan',
        settings: ppdbSettings.jalurUndangan
      },
      {
        value: 'pjj',
        label: 'Pendidikan Jarak Jauh',
        settings: ppdbSettings.jalurPjj
      }
    ];

    jalurList.forEach(jalur => {
      const isAvailable = jalur.settings?.isActive && 
                         isDateInRange(jalur.settings.start, jalur.settings.end);
      
      let label = jalur.label;
      if (!jalur.settings?.isActive) {
        label += ' (Tidak Aktif)';
      } else if (isDateBeforeStart(jalur.settings.start)) {
        label += ' (Belum Dimulai)';
      } else if (!isDateInRange(jalur.settings.start, jalur.settings.end)) {
        label += ' (Sudah Ditutup)';
      }

      options.push({
        value: jalur.value,
        label: label,
        disabled: !isAvailable
      });
    });

    return options;
  };

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle>Data Pribadi</SectionTitle>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Pilih Jalur"
              name="jalur"
              value={formData.jalur}
              onChange={handleInputChange}
              options={getAvailableJalur()}
              required
              className={`bg-white ${disabledInputClass}`}
              disabled={formStatus === 'submitted' || !!formData.uid}
            />

            <Input
              label="Nama Calon Siswa"
              name="namaSiswa"
              value={formData.namaSiswa}
              onChange={handleInputChange}
              required
              disabled={formStatus === 'submitted'}
              className={disabledInputClass}
            />

            <Input
              label={<span>NIK <span className="text-gray-500 text-xs">(-) jika tidak ada</span></span>}
              name="nik"
              value={formData.nik}
              onChange={(e) => {
                if (formStatus === 'submitted') return;
                const value = e.target.value.replace(/[^0-9-]/g, '');
                setFormData((prev: any) => ({ ...prev, nik: value }));
              }}
              onKeyPress={(e) => {
                if (formStatus === 'submitted' || !/[0-9-]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              maxLength={16}
              required
              className={disabledInputClass}
              disabled={formStatus === 'submitted'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Tempat Lahir"
              name="tempatLahir"
              value={formData.tempatLahir}
              onChange={handleInputChange}
              required
              className={disabledInputClass}
            />

            <DatePicker
              label="Tanggal Lahir"
              value={formData.tanggalLahir}
              onChange={(date) => {
                if (formStatus === 'submitted') return;
                setFormData((prev: any) => ({ ...prev, tanggalLahir: date }));
              }}
              required
              className={disabledInputClass}
            />

            <Input
              label={<span>NISN <span className="text-gray-500 text-xs">(-) jika tidak ada</span></span>}
              name="nisn"
              value={formData.nisn}
              onChange={(e) => {
                if (formStatus === 'submitted') return;
                const value = e.target.value.replace(/[^0-9-]/g, '');
                setFormData((prev: any) => ({ ...prev, nisn: value }));
              }}
              onKeyPress={(e) => {
                if (formStatus === 'submitted' || !/[0-9-]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              maxLength={10}
              required
              className={disabledInputClass}
              disabled={formStatus === 'submitted'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Jenis Kelamin"
              name="jenisKelamin"
              value={formData.jenisKelamin}
              onChange={handleInputChange}
              options={[
                { value: '', label: '-- Pilih Jenis Kelamin --' },
                { value: 'L', label: 'Laki-laki' },
                { value: 'P', label: 'Perempuan' }
              ]}
              required
              className={`bg-white ${disabledInputClass}`}
              disabled={formStatus === 'submitted'}
            />

            <Input
              label="Anak Ke"
              name="anakKe"
              value={formData.anakKe}
              onChange={(e) => {
                if (formStatus === 'submitted') return;
                const value = e.target.value.replace(/\D/g, '');
                if (Number(value) > 0 || value === '') {
                  setFormData((prev: any) => ({ ...prev, anakKe: value }));
                }
              }}
              onKeyPress={(e) => {
                if (formStatus === 'submitted' || !/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              min="1"
              maxLength={2}
              required
              className={disabledInputClass}
              disabled={formStatus === 'submitted'}
              type="number"
            />

            <Input
              label="Jumlah Saudara"
              name="jumlahSaudara"
              value={formData.jumlahSaudara}
              onChange={(e) => {
                if (formStatus === 'submitted') return;
                const value = e.target.value.replace(/\D/g, '');
                if (Number(value) >= 0 || value === '') {
                  setFormData((prev: any) => ({ ...prev, jumlahSaudara: value }));
                }
              }}
              onKeyPress={(e) => {
                if (formStatus === 'submitted' || !/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              min="0"
              maxLength={2}
              required
              className={disabledInputClass}
              disabled={formStatus === 'submitted'}
              type="number"
            />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Alamat</SectionTitle>
        <div className="space-y-6">
          <Input
            label="Alamat Lengkap"
            name="alamat"
            value={formData.alamat}
            onChange={handleInputChange}
            required
            className={disabledInputClass}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Kecamatan"
              name="kecamatan"
              value={formData.kecamatan}
              onChange={handleInputChange}
              required
              className={disabledInputClass}
            />

            <Select
              label="Kabupaten/Kota"
              name="kabupaten"
              value={formData.kabupaten}
              onChange={handleInputChange}
              options={[
                { value: '', label: '-- Pilih Kabupaten/Kota --', disabled: true },
                ...KABUPATEN_LIST.map(kab => ({
                  value: kab.nama,
                  label: kab.nama
                }))
              ]}
              required
              className={`bg-white ${disabledInputClass}`}
              disabled={formStatus === 'submitted'}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Asal Sekolah</SectionTitle>
        <SearchableSelect
          label="Nama Sekolah"
          name="asalSekolah"
          value={formData.asalSekolah}
          onChange={handleInputChange}
          required
          className={`bg-white ${disabledInputClass}`}
          disabled={formStatus === 'submitted'}
        />
        {formData.asalSekolah === 'SEKOLAH LAIN' && (
          <div className="mt-4">
            <Input
              label="Nama Sekolah"
              name="asalSekolahManual"
              value={formData.asalSekolahManual || ''}
              onChange={handleInputChange}
              required
              className={disabledInputClass}
              disabled={formStatus === 'submitted'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInfoForm;
