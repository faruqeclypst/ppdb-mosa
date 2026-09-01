import React from 'react';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';
import { 
  IdentificationIcon, 
  AcademicCapIcon, 
  DocumentCheckIcon, 
  SparklesIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface DocumentUploadFormProps {
  formData: any;
  formStatus: 'draft' | 'submitted';
  disabledInputClass: string;
  handleFileChange: (name: string, file: File | null) => Promise<void>;
  getRequiredSemesters: (jalur: string) => string[];
  setCurrentStep: (step: number) => void;
  SectionTitle: React.FC<{ children: React.ReactNode }>;
}

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  formData,
  formStatus,
  disabledInputClass,
  handleFileChange,
  getRequiredSemesters: _getRequiredSemesters,
  setCurrentStep,
  SectionTitle
}) => {
  const fieldsToCheck = {
    jalur: formData.jalur,
    namaSiswa: formData.namaSiswa,
    nik: formData.nik,
    nisn: formData.nisn,
    jenisKelamin: formData.jenisKelamin,
    tempatLahir: formData.tempatLahir,
    tanggalLahir: formData.tanggalLahir,
    anakKe: formData.anakKe,
    jumlahSaudara: formData.jumlahSaudara,
    alamat: formData.alamat,
    kecamatan: formData.kecamatan,
    kabupaten: formData.kabupaten,
    asalSekolah: formData.asalSekolah,
    alasanPilihan: formData.alasanPilihan
  };

  const isStudentInfoComplete = Object.values(fieldsToCheck).every(value => 
    value !== undefined && 
    value !== null && 
    value !== '' || 
    (typeof value === 'string' && value.trim() === '-')
  );

  if (!isStudentInfoComplete) {
    const emptyFields = Object.entries(fieldsToCheck)
      .filter(([_, value]) => !value && value !== '-')
      .map(([key]) => {
        switch(key) {
          case 'jalur': return 'Jalur';
          case 'namaSiswa': return 'Nama Calon Siswa';
          case 'nik': return 'NIK';
          case 'nisn': return 'NISN';
          case 'jenisKelamin': return 'Jenis Kelamin';
          case 'tempatLahir': return 'Tempat Lahir';
          case 'tanggalLahir': return 'Tanggal Lahir';
          case 'anakKe': return 'Anak Ke';
          case 'jumlahSaudara': return 'Jumlah Saudara';
          case 'alamat': return 'Alamat Lengkap';
          case 'kecamatan': return 'Kecamatan';
          case 'kabupaten': return 'Kabupaten/Kota';
          case 'asalSekolah': return 'Asal Sekolah';
          case 'alasanPilihan': return 'Alasan Memilih Sekolah';
          default: return key;
        }
      });

    return (
      <div className="rounded-2xl p-8 bg-amber-50/70 border border-amber-200/80 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-800">
          <svg 
            className="w-7 h-7" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-amber-900">
            Lengkapi Informasi Siswa Terlebih Dahulu
          </h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
            Untuk mengunggah berkas dokumen, Anda harus melengkapi semua isian data siswa pada langkah pertama.
          </p>
        </div>
        {emptyFields.length > 0 && (
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-xs text-rose-600 font-semibold max-w-lg">
            Field yang belum diisi: {emptyFields.join(', ')}
          </div>
        )}
        <Button
          onClick={() => setCurrentStep(0)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl border-0 shadow-sm"
        >
          Kembali ke Data Siswa
        </Button>
      </div>
    );
  }

  // PJJ Specific Document Form
  if (formData.jalur === 'pjj') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
          <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-5">
            <div className="flex items-center justify-between">
              <SectionTitle>Dokumen Persyaratan SPMB PJJ</SectionTitle>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                Format PDF (Maks. 2MB)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <FileUpload
                label="Scan PDF FC Ijazah SMP / MTsN"
                name="ijazah"
                accept=".pdf"
                onChange={(file) => handleFileChange('ijazah', file)}
                maxSize={2}
                required={true}
                value={formData.ijazah}
                id="ijazah"
                className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
              />

              <FileUpload
                label="Scan PDF Kartu Keluarga (KK)"
                name="kartuKeluarga"
                accept=".pdf"
                onChange={(file) => handleFileChange('kartuKeluarga', file)}
                maxSize={2}
                required={true}
                value={formData.kartuKeluarga}
                id="kartuKeluarga"
                className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
              />

              <FileUpload
                label="Scan PDF Akta Kelahiran"
                name="aktaKelahiran"
                accept=".pdf"
                onChange={(file) => handleFileChange('aktaKelahiran', file)}
                maxSize={2}
                required={true}
                value={formData.aktaKelahiran}
                id="aktaKelahiran"
                className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
              />

              <FileUpload
                label="Scan PDF Lampiran A (Formulir PJJ)"
                name="lampiranA"
                accept=".pdf"
                onChange={(file) => handleFileChange('lampiranA', file)}
                maxSize={2}
                required={true}
                value={formData.lampiranA}
                id="lampiranA"
                className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
              />

              <FileUpload
                label="Scan PDF Lampiran B (Opsional)"
                name="lampiranB"
                accept=".pdf"
                onChange={(file) => handleFileChange('lampiranB', file)}
                maxSize={2}
                required={false}
                value={formData.lampiranB}
                id="lampiranB"
                className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reguler / Prestasi / Undangan Full Document Form
  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <InformationCircleIcon className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-extrabold text-emerald-950">Petunjuk Upload Berkas Dokumen</p>
          <p className="text-emerald-800">
            Pastikan seluruh berkas yang diunggah berupa file <strong>PDF</strong> yang jelas, terbaca, dan berukuran maksimal <strong>2MB per file</strong>. Pas foto 3x4 diunggah pada bagian profil di atas.
          </p>
        </div>
      </div>

      {/* 1. Dokumen Identitas & Kependudukan */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IdentificationIcon className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                1. Dokumen Identitas & Kependudukan
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Wajib
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <FileUpload
              label="Scan PDF Kartu Keluarga (KK)"
              name="kartuKeluarga"
              accept=".pdf"
              onChange={(file) => handleFileChange('kartuKeluarga', file)}
              maxSize={2}
              required={true}
              value={formData.kartuKeluarga}
              id="kartuKeluarga"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Akta Kelahiran"
              name="aktaKelahiran"
              accept=".pdf"
              onChange={(file) => handleFileChange('aktaKelahiran', file)}
              maxSize={2}
              required={true}
              value={formData.aktaKelahiran}
              id="aktaKelahiran"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Surat Ket. Aktif / Ijazah / SKL"
              name="ijazah"
              accept=".pdf"
              onChange={(file) => handleFileChange('ijazah', file)}
              maxSize={2}
              required={true}
              value={formData.ijazah}
              id="ijazah"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* 2. Dokumen Rekomendasi & Sertifikat Prestasi */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentCheckIcon className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                2. Surat Rekomendasi & Sertifikat Piagam
              </h4>
            </div>
            {formData.jalur === 'prestasi' ? (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                Sertifikat Wajib (Jalur Prestasi)
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                Sertifikat Opsional
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <FileUpload
              label="Scan PDF Surat Rekomendasi Kepala Sekolah"
              name="rekomendasi"
              accept=".pdf"
              onChange={(file) => handleFileChange('rekomendasi', file)}
              maxSize={2}
              required={true}
              value={formData.rekomendasi}
              id="rekomendasi"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label={
                formData.jalur === 'prestasi'
                  ? 'Scan PDF Sertifikat Piagam Prestasi'
                  : 'Scan PDF Sertifikat Piagam Prestasi (Opsional)'
              }
              name="sertifikat"
              accept=".pdf"
              onChange={(file) => handleFileChange('sertifikat', file)}
              maxSize={2}
              required={formData.jalur === 'prestasi'}
              value={formData.sertifikat}
              id="sertifikat"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* 3. Dokumen Rapor Sekolah */}
      <div className="rounded-2xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-2xs">
        <div className="p-5 sm:p-6 bg-white rounded-[calc(1rem-0.125rem)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                3. Scan Buku Rapor SMP / MTs (Semester 2, 3, & 4)
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Wajib
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <FileUpload
              label="Scan PDF Rapor Semester 2 (Kelas VII Genap)"
              name="raport2"
              accept=".pdf"
              onChange={(file) => handleFileChange('raport2', file)}
              maxSize={2}
              required={true}
              value={formData.raport2}
              id="raport2"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Rapor Semester 3 (Kelas VIII Ganjil)"
              name="raport3"
              accept=".pdf"
              onChange={(file) => handleFileChange('raport3', file)}
              maxSize={2}
              required={true}
              value={formData.raport3}
              id="raport3"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Rapor Semester 4 (Kelas VIII Genap)"
              name="raport4"
              accept=".pdf"
              onChange={(file) => handleFileChange('raport4', file)}
              maxSize={2}
              required={true}
              value={formData.raport4}
              id="raport4"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
