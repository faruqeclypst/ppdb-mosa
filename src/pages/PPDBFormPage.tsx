import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ref, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import FileUpload from '../components/ui/FileUpload';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Tabs from '../components/ui/Tabs';
import { compressFile } from '../utils/fileCompression';
import { showAlert } from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Types
type FormData = {
  // Informasi Siswa
  jalur: string;
  namaSiswa: string;
  nik: string;
  nisn: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  anakKe: string;
  jumlahSaudara: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  kodeKab: string;
  asalSekolah: string;
  kabupatenAsalSekolah: string;

  // Akademik
  nilaiAgama2: string;
  nilaiAgama3: string;
  nilaiAgama4: string;
  nilaiBindo2: string;
  nilaiBindo3: string;
  nilaiBindo4: string;
  nilaiBing2: string;
  nilaiBing3: string;
  nilaiBing4: string;
  nilaiMtk2: string;
  nilaiMtk3: string;
  nilaiMtk4: string;
  nilaiIpa2: string;
  nilaiIpa3: string;
  nilaiIpa4: string;

  // Informasi Orang Tua
  namaAyah: string;
  pekerjaanAyah: string;
  instansiAyah: string;
  hpAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  instansiIbu: string;
  hpIbu: string;

  // Files
  rekomendasi?: File;
  raport2?: File;
  raport3?: File;
  raport4?: File;
  photo?: File;
};

const INITIAL_FORM_DATA: FormData = {
  // Informasi Siswa
  jalur: '',
  namaSiswa: '',
  nik: '',
  nisn: '',
  jenisKelamin: '',
  tempatLahir: '',
  tanggalLahir: '',
  anakKe: '',
  jumlahSaudara: '',
  alamat: '',
  kecamatan: '',
  kabupaten: '',
  kodeKab: '',
  asalSekolah: '',
  kabupatenAsalSekolah: '',

  // Akademik
  nilaiAgama2: '',
  nilaiAgama3: '',
  nilaiAgama4: '',
  nilaiBindo2: '',
  nilaiBindo3: '',
  nilaiBindo4: '',
  nilaiBing2: '',
  nilaiBing3: '',
  nilaiBing4: '',
  nilaiMtk2: '',
  nilaiMtk3: '',
  nilaiMtk4: '',
  nilaiIpa2: '',
  nilaiIpa3: '',
  nilaiIpa4: '',

  // Informasi Orang Tua
  namaAyah: '',
  pekerjaanAyah: '',
  instansiAyah: '',
  hpAyah: '',
  namaIbu: '',
  pekerjaanIbu: '',
  instansiIbu: '',
  hpIbu: ''
};

const capitalizeEachWord = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
    <div className="mt-1 h-0.5 bg-gray-100"></div>
  </div>
);

const PPDBFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formStatus, setFormStatus] = useState<'draft' | 'submitted'>('draft');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load existing data
    const loadData = async () => {
      setLoading(true);
      try {
        const ppdbRef = ref(db, `ppdb/${user.uid}`);
        const snapshot = await get(ppdbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setFormData(data);
          setFormStatus(data.status || 'draft');
          setLastUpdated(data.lastUpdated || '');
        }
      } catch (err) {
        setError('Gagal memuat data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Jika input adalah number atau select, gunakan value asli
    if (type === 'number' || e.target instanceof HTMLSelectElement) {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    // Untuk input text, capitalize each word
    const capitalizedValue = capitalizeEachWord(value);
    setFormData(prev => ({ ...prev, [name]: capitalizedValue }));
  };

  const handleFileChange = async (name: string, file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, [name]: null }));
      return;
    }

    try {
      // Cek ukuran maksimal (4MB)
      const maxSize = 4 * 1024 * 1024; // 4MB dalam bytes
      if (file.size > maxSize) {
        showAlert('error', 'Ukuran file terlalu besar (maksimal 4MB)');
        return;
      }

      // Format nama file: nisn_namasiswa
      const fileName = `${formData.nisn}_${formData.namaSiswa.replace(/\s+/g, '')}`;
      const fileExtension = file.name.split('.').pop();

      let compressedFile: File;

      if (file.type.startsWith('image/')) {
        const alertId = showAlert('info', 'Sedang mengkompresi gambar...', 0);
        
        compressedFile = await compressFile(file, 30, {
          maxWidthOrHeight: 800,
          initialQuality: 0.5,
          maxIteration: 10,
          maxSizeMB: 0.03
        });
        
        if (compressedFile.size > 50 * 1024) {
          compressedFile = await compressFile(compressedFile, 30, {
            maxWidthOrHeight: 600,
            initialQuality: 0.3,
            maxIteration: 10,
            maxSizeMB: 0.03
          });
        }

        // Buat file baru dengan nama yang diformat
        compressedFile = new File(
          [compressedFile], 
          `${fileName}.${fileExtension}`,
          { type: compressedFile.type }
        );
        
        const originalSize = (file.size / 1024).toFixed(2);
        const compressedSize = (compressedFile.size / 1024).toFixed(2);
        
        document.getElementById(alertId)?.remove();
        
        setTimeout(() => {
          showAlert(
            'success',
            `File berhasil dikompresi dari ${originalSize}KB menjadi ${compressedSize}KB`,
            3000
          );
        }, 100);

      } else if (file.type === 'application/pdf') {
        try {
          if (file.size > 500 * 1024) {
            showAlert('error', 'Ukuran PDF tidak boleh lebih dari 500KB. Silakan kompres terlebih dahulu menggunakan tools online seperti ilovepdf.com');
            return;
          }

          // Buat file baru dengan nama yang diformat
          compressedFile = new File(
            [file], 
            `${fileName}_${name}.${fileExtension}`,
            { type: file.type }
          );

          setFormData(prev => ({ ...prev, [name]: compressedFile }));
        } catch (error) {
          showAlert('error', 'Format PDF tidak valid atau rusak');
          return;
        }
      } else {
        throw new Error('Format file tidak didukung');
      }

    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'Gagal mengkompresi file');
    }
  };

  const validateForm = () => {
    // Validasi Informasi Siswa
    if (currentStep === 0) {
      if (!formData.namaSiswa || !formData.nik || !formData.nisn) {
        setError('Mohon lengkapi semua field yang wajib diisi');
        return false;
      }
      if (formData.nik.length !== 16) {
        setError('NIK harus 16 digit');
        return false;
      }
      if (formData.nisn.length !== 10) {
        setError('NISN harus 10 digit');
        return false;
      }
    }

    // Validasi Akademik
    if (currentStep === 1) {
      const nilaiFields = [
        'nilaiAgama2', 'nilaiAgama3', 'nilaiAgama4',
        'nilaiBindo2', 'nilaiBindo3', 'nilaiBindo4',
        'nilaiBing2', 'nilaiBing3', 'nilaiBing4',
        'nilaiMtk2', 'nilaiMtk3', 'nilaiMtk4',
        'nilaiIpa2', 'nilaiIpa3', 'nilaiIpa4'
      ];

      for (const field of nilaiFields) {
        const nilai = Number(formData[field as keyof FormData]);
        if (isNaN(nilai) || nilai < 0 || nilai > 100) {
          setError('Nilai harus diisi dengan angka antara 0-100');
          return false;
        }
        if (nilai < 85) {
          setError('Nilai minimal yang dibutuhkan adalah 85');
          return false;
        }
      }
    }

    // Validasi Informasi Orang Tua
    if (currentStep === 2) {
      if (!formData.namaAyah || !formData.namaIbu || !formData.hpAyah || !formData.hpIbu) {
        setError('Mohon lengkapi informasi orang tua');
        return false;
      }
      // Validasi format nomor HP
      const phoneRegex = /^08[0-9]{8,11}$/;
      if (!phoneRegex.test(formData.hpAyah) || !phoneRegex.test(formData.hpIbu)) {
        setError('Format nomor HP tidak valid');
        return false;
      }
    }

    // Validasi Dokumen
    if (currentStep === 3) {
      const requiredFiles = ['rekomendasi', 'raport2', 'raport3', 'raport4', 'photo'];
      for (const file of requiredFiles) {
        if (!formData[file as keyof FormData]) {
          setError('Mohon upload semua dokumen yang diperlukan');
          return false;
        }
      }
    }

    setError('');
    return true;
  };

  const handleTabChange = (index: number) => {
    // Pindah tab tanpa validasi
    setCurrentStep(index);
  };

  const handleNext = () => {
    if (validateForm()) {
      if (currentStep < tabs.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    // Jika ini adalah draft, langsung proses
    if (isDraft) {
      await submitForm(isDraft);
      return;
    }

    // Jika ini adalah submit final (bukan draft)
    // Dan tombol "Kirim Formulir" diklik
    const submitButton = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    if (!isDraft && submitButton?.textContent?.includes('Kirim Formulir')) {
      if (!validateForm()) {
        return;
      }
      setShowConfirmModal(true);
    }
  };

  const submitForm = async (isDraft: boolean = false) => {
    setError('');
    setLoading(true);

    try {
      // Upload files
      const uploadPromises = [];
      const fileUrls: Record<string, string> = {};

      for (const [key, file] of Object.entries(formData)) {
        if (file instanceof File) {
          const fileRef = storageRef(storage, `ppdb/${user!.uid}/${key}`);
          uploadPromises.push(
            uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef))
              .then(url => { fileUrls[key] = url; })
          );
        }
      }

      await Promise.all(uploadPromises);

      // Save form data
      await update(ref(db, `ppdb/${user!.uid}`), {
        ...formData,
        ...fileUrls,
        status: isDraft ? 'draft' : 'submitted',
        lastUpdated: new Date().toISOString(),
        submittedAt: isDraft ? null : new Date().toISOString()
      });

      setFormStatus(isDraft ? 'draft' : 'submitted');
      setLastUpdated(new Date().toISOString());

      if (isDraft) {
        showAlert('success', 'Draft berhasil disimpan!', 3000);
      } else {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const renderInformasiSiswa = () => (
    <div className="space-y-8">
      <SectionTitle>Data Pribadi</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Select
          label="Jalur Pendaftaran"
          name="jalur"
          value={formData.jalur}
          onChange={handleInputChange}
          options={[
            { value: 'prestasi', label: 'Jalur Prestasi' },
            { value: 'zonasi', label: 'Jalur Zonasi' },
            { value: 'afirmasi', label: 'Jalur Afirmasi' }
          ]}
          required
        />

        <Input
          label="Nama Calon Siswa"
          name="namaSiswa"
          value={formData.namaSiswa}
          onChange={handleInputChange}
          required
        />

        <Input
          label="NIK (16 digit)"
          name="nik"
          value={formData.nik}
          onChange={handleInputChange}
          pattern="\d{16}"
          maxLength={16}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input
          label="NISN (10 digit)"
          name="nisn"
          value={formData.nisn}
          onChange={handleInputChange}
          pattern="\d{10}"
          maxLength={10}
          required
        />

        <Select
          label="Jenis Kelamin"
          name="jenisKelamin"
          value={formData.jenisKelamin}
          onChange={handleInputChange}
          options={[
            { value: 'L', label: 'Laki-laki' },
            { value: 'P', label: 'Perempuan' }
          ]}
          required
        />

        <Input
          label="Tempat Lahir"
          name="tempatLahir"
          value={formData.tempatLahir}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DatePicker
          label="Tanggal Lahir"
          value={formData.tanggalLahir}
          onChange={(date) => setFormData(prev => ({ ...prev, tanggalLahir: date }))}
          required
        />

        <Input
          label="Anak ke-"
          name="anakKe"
          type="number"
          value={formData.anakKe}
          onChange={handleInputChange}
          required
        />

        <Input
          label="Jumlah Saudara Kandung"
          name="jumlahSaudara"
          type="number"
          value={formData.jumlahSaudara}
          onChange={handleInputChange}
          required
        />
      </div>

      <SectionTitle>Alamat</SectionTitle>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Input
            label="Alamat Lengkap"
            name="alamat"
            value={formData.alamat}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Kecamatan"
            name="kecamatan"
            value={formData.kecamatan}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Kabupaten"
            name="kabupaten"
            value={formData.kabupaten}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Kode Kab."
            name="kodeKab"
            value={formData.kodeKab}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <SectionTitle>Asal Sekolah</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Nama Sekolah"
            name="asalSekolah"
            value={formData.asalSekolah}
            onChange={handleInputChange}
            required
          />
        </div>

        <Input
          label="Kabupaten Sekolah"
          name="kabupatenAsalSekolah"
          value={formData.kabupatenAsalSekolah}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>
  );

  const renderAkademik = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Semester 2 */}
      <div className="space-y-6">
        <SectionTitle>Semester 2</SectionTitle>
        <div className="space-y-6">
          <Input
            label="Pendidikan Agama"
            name="nilaiAgama2"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiAgama2}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Bahasa Indonesia"
            name="nilaiBindo2"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiBindo2}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Bahasa Inggris"
            name="nilaiBing2"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiBing2}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Matematika"
            name="nilaiMtk2"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiMtk2}
            onChange={handleInputChange}
            required
          />
          <Input
            label="IPA"
            name="nilaiIpa2"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiIpa2}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {/* Semester 3 */}
      <div className="space-y-6">
        <SectionTitle>Semester 3</SectionTitle>
        <div className="space-y-6">
          <Input
            label="Pendidikan Agama"
            name="nilaiAgama3"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiAgama3}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Bahasa Indonesia"
            name="nilaiBindo3"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiBindo3}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Bahasa Inggris"
            name="nilaiBing3"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiBing3}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Matematika"
            name="nilaiMtk3"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiMtk3}
            onChange={handleInputChange}
            required
          />
          <Input
            label="IPA"
            name="nilaiIpa3"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiIpa3}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {/* Semester 4 */}
      <div className="space-y-6">
        <SectionTitle>Semester 4</SectionTitle>
        <div className="space-y-6">
          <Input
            label="Pendidikan Agama"
            name="nilaiAgama4"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiAgama4}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Bahasa Indonesia"
            name="nilaiBindo4"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiBindo4}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Bahasa Inggris"
            name="nilaiBing4"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiBing4}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Matematika"
            name="nilaiMtk4"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiMtk4}
            onChange={handleInputChange}
            required
          />
          <Input
            label="IPA"
            name="nilaiIpa4"
            type="number"
            min="0"
            max="100"
            value={formData.nilaiIpa4}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
    </div>
  );

  const renderInformasiOrangTua = () => (
    <div className="space-y-8">
      <div className="space-y-6">
        <SectionTitle>Data Ayah</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nama Lengkap Ayah"
            name="namaAyah"
            value={formData.namaAyah}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Pekerjaan Ayah"
            name="pekerjaanAyah"
            value={formData.pekerjaanAyah}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Instansi / Unit Kerja"
            name="instansiAyah"
            value={formData.instansiAyah}
            onChange={handleInputChange}
            required
          />
          <Input
            label="No. HP/WA"
            name="hpAyah"
            value={formData.hpAyah}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="space-y-6">
        <SectionTitle>Data Ibu</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nama Lengkap Ibu"
            name="namaIbu"
            value={formData.namaIbu}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Pekerjaan Ibu"
            name="pekerjaanIbu"
            value={formData.pekerjaanIbu}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Instansi / Unit Kerja"
            name="instansiIbu"
            value={formData.instansiIbu}
            onChange={handleInputChange}
            required
          />
          <Input
            label="No. HP/WA"
            name="hpIbu"
            value={formData.hpIbu}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
    </div>
  );

  const renderDokumen = () => (
    <div className="space-y-8">
      <SectionTitle>Dokumen Persyaratan</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload
          label="Scan PDF Surat Rekomendasi / Sertifikat"
          name="rekomendasi"
          accept=".pdf"
          onChange={(file) => handleFileChange('rekomendasi', file)}
          maxSize={4}
          required
          value={formData.rekomendasi}
        />

        <FileUpload
          label="Scan PDF Raport Semester 2"
          name="raport2"
          accept=".pdf"
          onChange={(file) => handleFileChange('raport2', file)}
          maxSize={4}
          required
          value={formData.raport2}
        />

        <FileUpload
          label="Scan PDF Raport Semester 3"
          name="raport3"
          accept=".pdf"
          onChange={(file) => handleFileChange('raport3', file)}
          maxSize={4}
          required
          value={formData.raport3}
        />

        <FileUpload
          label="Scan PDF Raport Semester 4"
          name="raport4"
          accept=".pdf"
          onChange={(file) => handleFileChange('raport4', file)}
          maxSize={4}
          required
          value={formData.raport4}
        />
      </div>
    </div>
  );

  const tabs = [
    { label: 'Informasi Siswa', content: renderInformasiSiswa() },
    { label: 'Akademik', content: renderAkademik() },
    { label: 'Informasi Orang Tua', content: renderInformasiOrangTua() },
    { label: 'Dokumen', content: renderDokumen() }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Container>
      <div className="py-10">
        <Card className="max-w-4xl mx-auto relative">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Formulir Pendaftaran PPDB
                  </h1>
                  <h2 className="text-lg text-gray-600 mb-2">
                    SMAN Modal Bangsa Tahun Ajaran 2024/2025
                  </h2>
                  <div className="grid grid-cols-2 mb-2">
                    <div>
                      <p className="text-sm text-gray-500">Periode Pendaftaran:</p>
                      <p className="font-medium text-gray-700">1 Maret - 30 April 2024</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pengumuman:</p>
                      <p className="font-medium text-gray-700">15 Mei 2024</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-gray-500">Status: </span>
                      <span className={`font-medium ${
                        formStatus === 'submitted' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {formStatus === 'submitted' ? 'Terkirim' : 'Draft'}
                      </span>
                    </div>
                    {lastUpdated && (
                      <div className="bg-gray-100 px-3 py-1 rounded-full">
                        <span className="text-gray-500">Terakhir diperbarui: </span>
                        <span className="font-medium text-gray-700">
                          {new Date(lastUpdated).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-blue-600 font-medium">
                        Harap isi data dengan benar
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="relative group">
                  <input
                    type="file"
                    id="photoUpload"
                    accept="image/*"
                    onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label 
                    htmlFor="photoUpload" 
                    className="cursor-pointer block"
                  >
                    <div className="w-32 h-40 rounded-lg overflow-hidden relative">
                      {formData.photo ? (
                        <img 
                          src={typeof formData.photo === 'string' ? formData.photo : URL.createObjectURL(formData.photo)}
                          alt="Pas Foto"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 animate-pulse">
                          <img 
                            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                            alt="Dummy Profile"
                            className="w-20 h-20 opacity-50 mb-2"
                          />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-xs">!</span>
                          </div>
                          <p className="text-xs text-gray-500 text-center px-2">
                            Upload Foto 3x4
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <span className="text-white text-sm font-medium block">
                            {formData.photo ? 'Ganti Foto' : 'Upload Foto'}
                          </span>
                          <span className="text-gray-300 text-xs">
                            Klik untuk memilih
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {error && <Alert type="error" message={error} className="my-2" />}

            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="mt-4 min-h-[400px]">
                <Tabs 
                  tabs={tabs} 
                  activeTab={currentStep}
                  onChange={handleTabChange}
                />
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between sticky bottom-0 bg-white">
                <div className="flex space-x-4">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      className="bg-gray-200 text-gray-700"
                    >
                      Sebelumnya
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="bg-yellow-500 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Draft'}
                  </Button>
                </div>

                <div>
                  {currentStep < tabs.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-blue-600 text-white"
                    >
                      Selanjutnya
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-green-600 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Mengirim...' : 'Kirim Formulir'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </Card>

        {/* Modal Konfirmasi */}
        <Modal 
          isOpen={showConfirmModal} 
          onClose={() => setShowConfirmModal(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Konfirmasi Pengiriman
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin mengirim formulir pendaftaran ini? 
              Pastikan semua data yang diisi sudah benar karena tidak dapat diubah setelah dikirim.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                onClick={() => submitForm(false)}
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Ya, Kirim'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Sukses */}
        <Modal 
          isOpen={showSuccessModal} 
          onClose={() => setShowSuccessModal(false)}
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Formulir Berhasil Dikirim!
            </h3>
            <p className="text-gray-600 mb-6">
              Terima kasih telah mendaftar di SMAN Modal Bangsa. 
              Pengumuman hasil seleksi akan diinformasikan pada tanggal 15 Mei 2024.
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/');
              }}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </Modal>
      </div>
    </Container>
  );
};

export default PPDBFormPage; 