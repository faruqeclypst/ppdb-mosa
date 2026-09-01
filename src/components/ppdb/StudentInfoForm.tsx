import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import SearchableSelect from './SearchableSelect';
import { 
  getProvinces, 
  getRegencies, 
  getDistricts, 
  getVillages, 
  WilayahItem,
  INITIAL_PROVINCES,
  INITIAL_ACEH_REGENCIES,
  findProvinceCode,
  findRegencyCode
} from '../../services/wilayahApi';
import { 
  SparklesIcon, 
  MapPinIcon, 
  BuildingOffice2Icon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface StudentInfoFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
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
  SectionTitle
}) => {
  // Cascading Wilayah states with instant default data
  const [provinces, setProvinces] = useState<WilayahItem[]>(INITIAL_PROVINCES);
  const [regencies, setRegencies] = useState<WilayahItem[]>(INITIAL_ACEH_REGENCIES);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // 1. Initial Load of Provinces & Ensure Provinsi is set
  useEffect(() => {
    let isMounted = true;
    getProvinces().then(data => {
      if (isMounted && data.length > 0) {
        setProvinces(data);
      }
    });

    if (!formData.provinsi) {
      setFormData((prev: any) => ({ ...prev, provinsi: 'ACEH' }));
    }

    return () => { isMounted = false; };
  }, []);

  // 2. Derive current Province code from formData.provinsi
  const activeProvCode = useMemo(() => {
    return findProvinceCode(formData.provinsi || 'ACEH', provinces);
  }, [formData.provinsi, provinces]);

  // 3. Load Regencies when Province changes
  useEffect(() => {
    let isMounted = true;
    if (!activeProvCode) {
      setRegencies([]);
      return;
    }

    if (activeProvCode === '11') {
      setRegencies(INITIAL_ACEH_REGENCIES);
    }

    setLoadingRegencies(true);
    getRegencies(activeProvCode).then(data => {
      if (isMounted) {
        if (data.length > 0) {
          setRegencies(data);
        }
        setLoadingRegencies(false);
      }
    }).catch(() => {
      if (isMounted) setLoadingRegencies(false);
    });

    return () => { isMounted = false; };
  }, [activeProvCode]);

  // 4. Derive current Regency code from formData.kabupaten
  const activeRegCode = useMemo(() => {
    return findRegencyCode(formData.kabupaten || '', regencies);
  }, [formData.kabupaten, regencies]);

  // 5. Load Districts (Kecamatan) when Regency changes
  useEffect(() => {
    let isMounted = true;
    if (!activeRegCode) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    getDistricts(activeRegCode).then(data => {
      if (isMounted) {
        setDistricts(data);
        setLoadingDistricts(false);
      }
    }).catch(() => {
      if (isMounted) setLoadingDistricts(false);
    });

    return () => { isMounted = false; };
  }, [activeRegCode]);

  // 6. Derive current District code from formData.kecamatan
  const activeDistCode = useMemo(() => {
    if (!formData.kecamatan || districts.length === 0) return '';
    const clean = formData.kecamatan.trim().toUpperCase();
    const match = districts.find(d => 
      d.name.toUpperCase() === clean || 
      d.name.toUpperCase().includes(clean) ||
      clean.includes(d.name.toUpperCase())
    );
    return match ? match.code : '';
  }, [formData.kecamatan, districts]);

  // 7. Load Villages (Desa) when District changes
  useEffect(() => {
    let isMounted = true;
    if (!activeDistCode) {
      setVillages([]);
      return;
    }

    setLoadingVillages(true);
    getVillages(activeDistCode).then(data => {
      if (isMounted) {
        setVillages(data);
        setLoadingVillages(false);
      }
    }).catch(() => {
      if (isMounted) setLoadingVillages(false);
    });

    return () => { isMounted = false; };
  }, [activeDistCode]);

  // Handlers for Select changes (setting uppercase standard names into formData)
  const handleProvSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provName = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      provinsi: provName,
      kabupaten: '',
      kecamatan: '',
      desa: ''
    }));
  };

  const handleRegSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regName = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      kabupaten: regName,
      kecamatan: '',
      desa: ''
    }));
  };

  const handleDistSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distName = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      kecamatan: distName,
      desa: ''
    }));
  };

  const handleVillageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const villageName = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      desa: villageName
    }));
  };

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

  // Selected value matchers for dropdowns
  const currentProvValue = useMemo(() => {
    if (!formData.provinsi) return 'ACEH';
    const match = provinces.find(p => p.name.toUpperCase() === formData.provinsi.toUpperCase());
    return match ? match.name.toUpperCase() : formData.provinsi.toUpperCase();
  }, [formData.provinsi, provinces]);

  const currentRegValue = useMemo(() => {
    if (!formData.kabupaten) return '';
    const clean = formData.kabupaten.toUpperCase();
    const match = regencies.find(r => r.name.toUpperCase() === clean || clean.includes(r.name.toUpperCase()));
    return match ? match.name.toUpperCase() : formData.kabupaten.toUpperCase();
  }, [formData.kabupaten, regencies]);

  const currentDistValue = useMemo(() => {
    if (!formData.kecamatan) return '';
    const clean = formData.kecamatan.toUpperCase();
    const match = districts.find(d => d.name.toUpperCase() === clean || clean.includes(d.name.toUpperCase()));
    return match ? match.name.toUpperCase() : formData.kecamatan.toUpperCase();
  }, [formData.kecamatan, districts]);

  const currentVillageValue = useMemo(() => {
    if (!formData.desa) return '';
    const clean = formData.desa.toUpperCase();
    const match = villages.find(v => v.name.toUpperCase() === clean || clean.includes(v.name.toUpperCase()));
    return match ? match.name.toUpperCase() : formData.desa.toUpperCase();
  }, [formData.desa, villages]);

  return (
    <div className="space-y-6">
      {/* 1. Data Pribadi Panel */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-5">
          <SectionTitle>Data Pribadi Calon Siswa</SectionTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
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
              label={<span>NIK <span className="text-zinc-400 font-normal text-[10px]">(-) jika tidak ada</span></span>}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
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
              label={<span>NISN <span className="text-zinc-400 font-normal text-[10px]">(-) jika tidak ada</span></span>}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
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

      {/* 2. Alamat & Domisili Panel (Powered by wilayah.id API) */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-5">
          <div className="flex items-center justify-between">
            <SectionTitle>Alamat & Domisili</SectionTitle>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
              <MapPinIcon className="w-3 h-3" />
              Wilayah.id API Live
            </span>
          </div>
          
          <div className="space-y-4">
            {/* Cascading Wilayah Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Provinsi */}
              <Select
                label="Provinsi"
                name="provinsi"
                value={currentProvValue}
                onChange={handleProvSelect}
                options={[
                  { value: '', label: '-- Pilih Provinsi --', disabled: true },
                  ...provinces
                    .map(p => ({
                      value: p.name.toUpperCase(),
                      label: p.name
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label, 'id'))
                ]}
                required
                className={`bg-white ${disabledInputClass}`}
                disabled={formStatus === 'submitted'}
              />

              {/* 2. Kabupaten / Kota */}
              <div className="relative">
                <Select
                  label={
                    <span className="flex items-center justify-between">
                      <span>Kabupaten / Kota</span>
                      {loadingRegencies && <ArrowPathIcon className="w-3 h-3 animate-spin text-emerald-600 inline" />}
                    </span>
                  }
                  name="kabupaten"
                  value={currentRegValue}
                  onChange={handleRegSelect}
                  options={[
                    { value: '', label: loadingRegencies ? 'Memuat Kab/Kota...' : '-- Pilih Kab/Kota --', disabled: true },
                    ...regencies
                      .map(r => ({
                        value: r.name.toUpperCase(),
                        label: r.name
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label, 'id'))
                  ]}
                  required
                  className={`bg-white ${disabledInputClass}`}
                  disabled={formStatus === 'submitted'}
                />
              </div>

              {/* 3. Kecamatan */}
              <div className="relative">
                {districts.length > 0 ? (
                  <Select
                    label={
                      <span className="flex items-center justify-between">
                        <span>Kecamatan</span>
                        {loadingDistricts && <ArrowPathIcon className="w-3 h-3 animate-spin text-emerald-600 inline" />}
                      </span>
                    }
                    name="kecamatan"
                    value={currentDistValue}
                    onChange={handleDistSelect}
                    options={[
                      { value: '', label: loadingDistricts ? 'Memuat Kecamatan...' : '-- Pilih Kecamatan --', disabled: true },
                      ...districts
                        .map(d => ({
                          value: d.name.toUpperCase(),
                          label: d.name
                        }))
                        .sort((a, b) => a.label.localeCompare(b.label, 'id'))
                    ]}
                    required
                    className={`bg-white ${disabledInputClass}`}
                    disabled={formStatus === 'submitted'}
                  />
                ) : (
                  <Input
                    label={
                      <span className="flex items-center justify-between">
                        <span>Kecamatan</span>
                        {loadingDistricts && <ArrowPathIcon className="w-3 h-3 animate-spin text-emerald-600 inline" />}
                      </span>
                    }
                    name="kecamatan"
                    value={formData.kecamatan || ''}
                    onChange={handleInputChange}
                    placeholder={loadingDistricts ? "Memuat kecamatan..." : "Ketik nama kecamatan"}
                    required
                    className={disabledInputClass}
                    disabled={formStatus === 'submitted'}
                  />
                )}
              </div>

              {/* 4. Desa / Kelurahan */}
              <div className="relative">
                {villages.length > 0 ? (
                  <Select
                    label={
                      <span className="flex items-center justify-between">
                        <span>Desa / Kelurahan</span>
                        {loadingVillages && <ArrowPathIcon className="w-3 h-3 animate-spin text-emerald-600 inline" />}
                      </span>
                    }
                    name="desa"
                    value={currentVillageValue}
                    onChange={handleVillageSelect}
                    options={[
                      { value: '', label: loadingVillages ? 'Memuat Desa...' : '-- Pilih Desa/Kelurahan --', disabled: true },
                      ...villages
                        .map(v => ({
                          value: v.name.toUpperCase(),
                          label: v.name
                        }))
                        .sort((a, b) => a.label.localeCompare(b.label, 'id'))
                    ]}
                    className={`bg-white ${disabledInputClass}`}
                    disabled={formStatus === 'submitted'}
                  />
                ) : (
                  <Input
                    label={
                      <span className="flex items-center justify-between">
                        <span>Desa / Gampong</span>
                        {loadingVillages && <ArrowPathIcon className="w-3 h-3 animate-spin text-emerald-600 inline" />}
                      </span>
                    }
                    name="desa"
                    value={formData.desa || ''}
                    onChange={handleInputChange}
                    placeholder={loadingVillages ? "Memuat desa..." : "Nama Desa / Gampong"}
                    className={disabledInputClass}
                    disabled={formStatus === 'submitted'}
                  />
                )}
              </div>
            </div>

            {/* Detailed Street Address */}
            <Input
              label="Alamat Detail (Jalan, No. Rumah, Dusun / Lorong, RT / RW)"
              name="alamat"
              value={formData.alamat || ''}
              onChange={handleInputChange}
              placeholder="Contoh: Jl. Bandara SIM No. 12, Dusun Cinta Kasih, RT 02 / RW 01"
              required
              className={disabledInputClass}
            />
          </div>
        </div>
      </div>

      {/* 3. Asal Sekolah Panel (Powered by sekolah.devapi.id API) */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-5">
          <div className="flex items-center justify-between">
            <SectionTitle>Sekolah Asal</SectionTitle>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
              <BuildingOffice2Icon className="w-3 h-3" />
              Kemendikbud API Live
            </span>
          </div>
          
          <SearchableSelect
            label="Cari Nama Sekolah Asal (SMP / MTs se-Indonesia)"
            name="asalSekolah"
            value={formData.asalSekolah}
            onChange={handleInputChange}
            required
            className={`bg-white ${disabledInputClass}`}
            disabled={formStatus === 'submitted'}
          />
          {formData.asalSekolah === 'SEKOLAH LAIN' && (
            <div className="mt-3">
              <Input
                label="Tuliskan Nama Lengkap & Lokasi Sekolah Asal Secara Manual"
                name="asalSekolahManual"
                value={formData.asalSekolahManual || ''}
                onChange={handleInputChange}
                placeholder="Contoh: SMP Swasta Teladan Banda Aceh"
                required
                className={disabledInputClass}
                disabled={formStatus === 'submitted'}
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. Alasan Kuat Masuk Sekolah yang Dipilih */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Alasan Memilih Sekolah</SectionTitle>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              Wajib Diisi
            </span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Jelaskan secara jelas dan terperinci alasan, motivasi pribadi, minat bakat, serta target yang ingin Anda capai jika diterima di SMAN Modal Bangsa. Tulisan ini menjadi salah satu poin penilaian panitia seleksi.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Alasan Kuat Masuk Sekolah yang Dipilih <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="alasanPilihan"
              value={formData.alasanPilihan || ''}
              onChange={handleInputChange}
              rows={4}
              maxLength={1000}
              placeholder="Tuliskan alasan dan motivasi kuat Anda mendaftar di SMAN Modal Bangsa di sini (minimal 30 karakter)..."
              required
              disabled={formStatus === 'submitted'}
              className={`w-full px-3.5 py-3 text-xs sm:text-sm font-medium text-zinc-800 bg-white border border-zinc-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 resize-y shadow-2xs ${disabledInputClass}`}
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>Minimal 30 karakter</span>
              <span className={(formData.alasanPilihan?.length || 0) < 30 ? 'text-amber-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                {formData.alasanPilihan?.length || 0} / 1000 Karakter
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoForm;
