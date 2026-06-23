import React from 'react';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';

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
  getRequiredSemesters,
  setCurrentStep,
  SectionTitle
}) => {
  const semesters = getRequiredSemesters(formData.jalur);

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
    asalSekolah: formData.asalSekolah
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
          default: return key;
        }
      });

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
        <svg 
          className="w-16 h-16 text-yellow-400 mb-4" 
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
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Lengkapi Informasi Siswa Terlebih Dahulu
        </h3>
        <p className="text-yellow-600 text-center max-w-md">
          Untuk mengunggah dokumen, Anda harus melengkapi semua informasi siswa di tab pertama.
          Silakan kembali ke tab "Informasi Siswa" dan lengkapi semua field yang diperlukan.
        </p>
        {emptyFields.length > 0 && (
          <p className="text-sm text-red-600 mt-2">
            Field yang masih kosong: {emptyFields.join(', ')}
          </p>
        )}
        <Button
          onClick={() => setCurrentStep(0)}
          className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Kembali ke Informasi Siswa
        </Button>
      </div>
    );
  }

  if (formData.jalur === 'pjj') {
    return (
      <div className="space-y-10">
        <div>
          <SectionTitle>Dokumen Persyaratan PJJ</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              label="Scan PDF FC Ijazah SMP / MTsN*"
              name="ijazah"
              accept=".pdf"
              onChange={(file) => handleFileChange('ijazah', file)}
              maxSize={4}
              required={true}
              value={formData.ijazah}
              id="ijazah"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Kartu Keluarga*"
              name="kartuKeluarga"
              accept=".pdf"
              onChange={(file) => handleFileChange('kartuKeluarga', file)}
              maxSize={4}
              required={true}
              value={formData.kartuKeluarga}
              id="kartuKeluarga"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Akta Kelahiran*"
              name="aktaKelahiran"
              accept=".pdf"
              onChange={(file) => handleFileChange('aktaKelahiran', file)}
              maxSize={4}
              required={true}
              value={formData.aktaKelahiran}
              id="aktaKelahiran"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Lampiran A (Opsional)"
              name="lampiranA"
              accept=".pdf"
              onChange={(file) => handleFileChange('lampiranA', file)}
              maxSize={4}
              required={false}
              value={formData.lampiranA}
              id="lampiranA"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />

            <FileUpload
              label="Scan PDF Lampiran B (Opsional)"
              name="lampiranB"
              accept=".pdf"
              onChange={(file) => handleFileChange('lampiranB', file)}
              maxSize={4}
              required={false}
              value={formData.lampiranB}
              id="lampiranB"
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle>Dokumen Persyaratan</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileUpload
            label="Scan PDF Surat Rekomendasi / Sertifikat"
            name="rekomendasi"
            accept=".pdf"
            onChange={(file) => handleFileChange('rekomendasi', file)}
            maxSize={4}
            required={true}
            value={formData.rekomendasi}
            id="rekomendasi"
            className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
          />

          {semesters.map((semester) => (
            <FileUpload
              key={semester}
              label={`Scan PDF Raport Semester ${semester}`}
              name={`raport${semester}`}
              accept=".pdf"
              onChange={(file) => handleFileChange(`raport${semester}`, file)}
              maxSize={4}
              required={true}
              value={formData[`raport${semester}` as keyof typeof formData]}
              id={`raport${semester}`}
              className={`${disabledInputClass} ${formStatus === 'submitted' ? 'pointer-events-none' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
