import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ref, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase/config';
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
import { signOut } from 'firebase/auth';
import { getPPDBStatus } from '../utils/ppdbStatus';

// Types
export type JalurPeriod = {
  start: string;    // Format: YYYY-MM-DD
  end: string;      // Format: YYYY-MM-DD
  isActive: boolean;
};

export type PPDBSettings = {
  academicYear: string;
  jalurPrestasi: JalurPeriod;
  jalurReguler: JalurPeriod;
  jalurUndangan: JalurPeriod;
  announcementDate: string;   // Format: YYYY-MM-DD
  isActive: boolean;
};

// Tambahkan di bagian atas file, setelah imports
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
  asalSekolah: string;
  kabupatenAsalSekolah: string;

  // Akademik
  nilaiAgama2: string;
  nilaiAgama3: string;
  nilaiAgama4: string;
  nilaiAgama5: string;
  nilaiBindo2: string;
  nilaiBindo3: string;
  nilaiBindo4: string;
  nilaiBindo5: string;
  nilaiBing2: string;
  nilaiBing3: string;
  nilaiBing4: string;
  nilaiBing5: string;
  nilaiMtk2: string;
  nilaiMtk3: string;
  nilaiMtk4: string;
  nilaiMtk5: string;
  nilaiIpa2: string;
  nilaiIpa3: string;
  nilaiIpa4: string;
  nilaiIpa5: string;

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
  rekomendasi?: File | string;
  raport2?: File | string;
  raport3?: File | string;
  raport4?: File | string;
  photo?: File | string;
};

// Tambahkan INITIAL_FORM_DATA
const INITIAL_FORM_DATA: FormData = {
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
  asalSekolah: '',
  kabupatenAsalSekolah: '',
  
  // Akademik
  nilaiAgama2: '',
  nilaiAgama3: '',
  nilaiAgama4: '',
  nilaiAgama5: '',
  nilaiBindo2: '',
  nilaiBindo3: '',
  nilaiBindo4: '',
  nilaiBindo5: '',
  nilaiBing2: '',
  nilaiBing3: '',
  nilaiBing4: '',
  nilaiBing5: '',
  nilaiMtk2: '',
  nilaiMtk3: '',
  nilaiMtk4: '',
  nilaiMtk5: '',
  nilaiIpa2: '',
  nilaiIpa3: '',
  nilaiIpa4: '',
  nilaiIpa5: '',
  
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

// Tambahkan komponen SectionTitle
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-900 mb-4">{children}</h3>
);

// Fungsi helper di luar komponen
const getAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  // Jika sudah lewat bulan Juli (index 6), gunakan tahun berikutnya
  const startYear = currentMonth >= 6 ? currentYear + 1 : currentYear;
  const endYear = startYear + 1;

  return `${startYear}/${endYear}`;
};

const PPDBFormPage: React.FC = () => {
  // Pindahkan hooks ke dalam komponen
  const [ppdbSettings, setPPDBSettings] = useState<PPDBSettings | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formStatus, setFormStatus] = useState<'draft' | 'submitted'>('draft');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [showChangeJalurModal, setShowChangeJalurModal] = useState(false);
  const [newJalurValue, setNewJalurValue] = useState('');

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
          setFormData({
            ...INITIAL_FORM_DATA,
            ...data
          });
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

  useEffect(() => {
    const checkPPDBStatus = async () => {
      const isPPDBActive = await getPPDBStatus();
      if (!isPPDBActive) {
        showAlert('error', 'PPDB belum dimulai');
        navigate('/');
      }
    };

    checkPPDBStatus();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Jika yang berubah adalah jalur pendaftaran
    if (name === 'jalur') {
      // Cek apakah ada nilai akademik atau dokumen yang sudah terisi
      const hasAcademicData = Object.entries(formData)
        .some(([key, value]) => {
          // Cek nilai akademik
          if (key.startsWith('nilai') && value !== '') {
            return true;
          }
          // Cek dokumen raport
          if (key.startsWith('raport') && value) {
            return true;
          }
          return false;
        });

      if (hasAcademicData) {
        // Jika ada data, tampilkan konfirmasi
        setNewJalurValue(value);
        setShowChangeJalurModal(true);
        return; // Jangan update form dulu
      } else {
        // Jika belum ada data, langsung update
        setFormData(prev => ({
          ...prev,
          jalur: value
        }));
        setIsFormChanged(true);
      }
      return;
    }

    // Untuk input lainnya
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsFormChanged(true);
  };

  const handleFileChange = async (name: string, file: File | null) => {
    setIsFormChanged(true);
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
        
        // Update formData dengan file yang sudah dikompresi
        setFormData(prev => ({ ...prev, [name]: compressedFile }));
        
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
      // Validasi NIK hanya jika bukan tanda strip
      if (formData.nik !== '-' && formData.nik.length !== 16) {
        setError('NIK harus 16 digit atau isi dengan "-" jika belum ada');
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
      // Validasi format nomor HP (10-14 digit)
      const phoneRegex = /^08[0-9]{8,12}$/;
      if (!phoneRegex.test(formData.hpAyah) || !phoneRegex.test(formData.hpIbu)) {
        setError('Nomor HP harus 10-14 digit dan dimulai dengan 08');
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

    // Validasi form dokumen jika bukan draft
    if (!isDraft) {
      const dokumenForm = document.getElementById('dokumenForm') as HTMLFormElement;
      if (dokumenForm && !dokumenForm.checkValidity()) {
        dokumenForm.reportValidity();
        return;
      }
    }

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
      setIsFormChanged(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleJalurChange = () => {
    // Tentukan semester yang perlu direset berdasarkan jalur baru
    const oldSemesters = formData.jalur === 'reguler' ? ['3', '4', '5'] : ['2', '3', '4'];
    const newSemesters = newJalurValue === 'reguler' ? ['3', '4', '5'] : ['2', '3', '4'];
    
    // Buat object untuk reset nilai dan dokumen
    const resetData: Partial<FormData> = {
      jalur: newJalurValue,
      // Reset semua nilai akademik
      nilaiAgama2: '',
      nilaiAgama3: '',
      nilaiAgama4: '',
      nilaiAgama5: '',
      nilaiBindo2: '',
      nilaiBindo3: '',
      nilaiBindo4: '',
      nilaiBindo5: '',
      nilaiBing2: '',
      nilaiBing3: '',
      nilaiBing4: '',
      nilaiBing5: '',
      nilaiMtk2: '',
      nilaiMtk3: '',
      nilaiMtk4: '',
      nilaiMtk5: '',
      nilaiIpa2: '',
      nilaiIpa3: '',
      nilaiIpa4: '',
      nilaiIpa5: '',
    };

    // Reset hanya dokumen raport yang berbeda antara jalur lama dan baru
    const differentSemesters = newSemesters.filter(sem => !oldSemesters.includes(sem));
    differentSemesters.forEach(semester => {
      resetData[`raport${semester}` as keyof FormData] = undefined;
    });

    // Jangan reset surat rekomendasi
    setFormData(prev => ({
      ...prev,
      ...resetData
    }));

    showAlert('info', `Jalur berhasil diubah ke ${newJalurValue}. Nilai akademik dan dokumen raport telah direset sesuai jalur yang dipilih.`);
    setShowChangeJalurModal(false);
    setIsFormChanged(true);
  };

  const renderInformasiSiswa = () => {
    const getAvailableJalur = () => {
      if (!ppdbSettings) {
        return [
          { value: '', label: '-- Pilih Jalur --' }
        ];
      }

      const now = new Date();
      const options = [];

      // Helper untuk cek apakah jalur aktif
      const isJalurActive = (jalur: JalurPeriod | undefined) => {
        if (!jalur || !jalur.isActive) return false;
        
        try {
          const start = new Date(jalur.start);
          const end = new Date(jalur.end);
          return now >= start && now <= end;
        } catch (error) {
          console.error('Error checking jalur period:', error);
          return false;
        }
      };

      // Cek setiap jalur dengan null check
      if (ppdbSettings.jalurPrestasi && isJalurActive(ppdbSettings.jalurPrestasi)) {
        options.push({ value: 'prestasi', label: 'Prestasi' });
      }
      if (ppdbSettings.jalurReguler && isJalurActive(ppdbSettings.jalurReguler)) {
        options.push({ value: 'reguler', label: 'Reguler' });
      }
      if (ppdbSettings.jalurUndangan && isJalurActive(ppdbSettings.jalurUndangan)) {
        options.push({ value: 'undangan', label: 'Undangan' });
      }

      return [
        { value: '', label: '-- Pilih Jalur --' },
        ...options
      ];
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
              />

              <Input
                label="Nama Calon Siswa"
                name="namaSiswa"
                value={formData.namaSiswa}
                onChange={handleInputChange}
                required
              />

              <Input
                label="NIK (isi '-' jika belum ada)"
                name="nik"
                value={formData.nik}
                onChange={(e) => {
                  const value = e.target.value;
                  // Jika input adalah tanda strip, terima
                  if (value === '-') {
                    setFormData(prev => ({ ...prev, nik: value }));
                    return;
                  }
                  // Jika input adalah angka dan panjangnya <= 16
                  if (/^\d*$/.test(value) && value.length <= 16) {
                    setFormData(prev => ({ ...prev, nik: value }));
                  }
                }}
                onKeyPress={(e) => {
                  // Mencegah input karakter non-angka kecuali tanda strip
                  if (!/[\d-]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Tempat Lahir"
                name="tempatLahir"
                value={formData.tempatLahir}
                onChange={handleInputChange}
                required
              />

              <DatePicker
                label="Tanggal Lahir"
                value={formData.tanggalLahir}
                onChange={(date) => {
                  setFormData(prev => ({ ...prev, tanggalLahir: date }));
                  setIsFormChanged(true); // Aktifkan tombol kirim saat tanggal berubah
                }}
                required
              />

              <Input
                label="NISN (isi '-' jika belum ada)"
                name="nisn"
                value={formData.nisn}
                onChange={handleInputChange}
                required
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
              />

              <Input
                label="Anak Ke"
                name="anakKe"
                type="number"
                min="1"
                value={formData.anakKe}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Jumlah Saudara"
                name="jumlahSaudara"
                type="number"
                min="0"
                value={formData.jumlahSaudara}
                onChange={handleInputChange}
                required
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
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>
        </div>

        <div>
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
      </div>
    );
  };

  const renderAkademik = () => {
    const semesters = formData.jalur === 'reguler' 
      ? ['3', '4', '5']  // Jalur Reguler
      : ['2', '3', '4']; // Jalur Prestasi & Undangan

    return (
      <div className="grid grid-cols-3 gap-6">
        {semesters.map((semester) => (
          <div key={semester} className="space-y-6">
            <SectionTitle>Semester {semester}</SectionTitle>
            <div className="space-y-4">
              <Input
                label="Pendidikan Agama"
                name={`nilaiAgama${semester}`}
                type="number"
                min="0"
                max="100"
                value={String(formData[`nilaiAgama${semester}` as keyof typeof formData] || '')}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    handleInputChange(e);
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />
              <Input
                label="Bahasa Indonesia"
                name={`nilaiBindo${semester}`}
                type="number"
                min="0"
                max="100"
                value={String(formData[`nilaiBindo${semester}` as keyof typeof formData] || '')}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    handleInputChange(e);
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />
              <Input
                label="Bahasa Inggris"
                name={`nilaiBing${semester}`}
                type="number"
                min="0"
                max="100"
                value={String(formData[`nilaiBing${semester}` as keyof typeof formData] || '')}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    handleInputChange(e);
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />
              <Input
                label="Matematika"
                name={`nilaiMtk${semester}`}
                type="number"
                min="0"
                max="100"
                value={String(formData[`nilaiMtk${semester}` as keyof typeof formData] || '')}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    handleInputChange(e);
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />
              <Input
                label="IPA"
                name={`nilaiIpa${semester}`}
                type="number"
                min="0"
                max="100"
                value={String(formData[`nilaiIpa${semester}` as keyof typeof formData] || '')}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    handleInputChange(e);
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderInformasiOrangTua = () => (
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
            label="No. HP/WA (10-14 digit)"
            name="hpAyah"
            value={formData.hpAyah}
            onChange={(e) => {
              // Hanya terima input angka
              const value = e.target.value.replace(/\D/g, '');
              // Pastikan dimulai dengan 08
              if (value === '0' || value.startsWith('08')) {
                setFormData(prev => ({ ...prev, hpAyah: value }));
              } else if (value !== '') {
                setFormData(prev => ({ ...prev, hpAyah: `08${value}` }));
              } else {
                setFormData(prev => ({ ...prev, hpAyah: '' }));
              }
            }}
            pattern="^08[0-9]{8,12}$"
            minLength={10}
            maxLength={14}
            onKeyPress={(e) => {
              // Mencegah input karakter non-angka
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            required
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
            label="No. HP/WA (10-14 digit)"
            name="hpIbu"
            value={formData.hpIbu}
            onChange={(e) => {
              // Hanya terima input angka
              const value = e.target.value.replace(/\D/g, '');
              // Pastikan dimulai dengan 08
              if (value === '0' || value.startsWith('08')) {
                setFormData(prev => ({ ...prev, hpIbu: value }));
              } else if (value !== '') {
                setFormData(prev => ({ ...prev, hpIbu: `08${value}` }));
              } else {
                setFormData(prev => ({ ...prev, hpIbu: '' }));
              }
            }}
            pattern="^08[0-9]{8,12}$"
            minLength={10}
            maxLength={14}
            onKeyPress={(e) => {
              // Mencegah input karakter non-angka
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            required
          />
        </div>
      </div>
    </div>
  );

  const renderDokumen = () => {
    const semesters = formData.jalur === 'reguler' 
      ? ['3', '4', '5']  // Jalur Reguler
      : ['2', '3', '4']; // Jalur Prestasi & Undangan

    // Cek setiap field dan tampilkan nilainya untuk debug
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
      kabupatenAsalSekolah: formData.kabupatenAsalSekolah
    };

    // Cek apakah informasi siswa sudah lengkap
    const isStudentInfoComplete = Object.values(fieldsToCheck).every(value => 
      value !== undefined && 
      value !== null && 
      value !== '' || 
      (typeof value === 'string' && value.trim() === '-')
    );

    if (!isStudentInfoComplete) {
      // Tampilkan field mana yang masih kosong
      const emptyFields = Object.entries(fieldsToCheck)
        .filter(([_, value]) => !value && value !== '-')
        .map(([key]) => key);

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
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { label: 'Informasi Siswa', content: renderInformasiSiswa() },
    { label: 'Akademik', content: renderAkademik() },
    { label: 'Informasi Orang Tua', content: renderInformasiOrangTua() },
    { label: 'Dokumen', content: renderDokumen() }
  ];

  // Tambahkan fungsi getRegistrationPeriod di dalam komponen
  const getRegistrationPeriod = () => {
    if (!ppdbSettings || !formData.jalur) {
      return {
        start: '-',
        end: '-',
        announcement: '-'
      };
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    try {
      // Ambil periode sesuai jalur yang dipilih
      let selectedJalur;
      switch (formData.jalur) {
        case 'prestasi':
          selectedJalur = ppdbSettings.jalurPrestasi;
          break;
        case 'reguler':
          selectedJalur = ppdbSettings.jalurReguler;
          break;
        case 'undangan':
          selectedJalur = ppdbSettings.jalurUndangan;
          break;
        default:
          return {
            start: '-',
            end: '-',
            announcement: ppdbSettings.announcementDate ? formatDate(ppdbSettings.announcementDate) : '-'
          };
      }

      if (!selectedJalur || !selectedJalur.isActive) {
        return {
          start: '-',
          end: '-',
          announcement: ppdbSettings.announcementDate ? formatDate(ppdbSettings.announcementDate) : '-'
        };
      }

      return {
        start: formatDate(selectedJalur.start),
        end: formatDate(selectedJalur.end),
        announcement: ppdbSettings.announcementDate ? formatDate(ppdbSettings.announcementDate) : '-'
      };
    } catch (error) {
      console.error('Error in getRegistrationPeriod:', error);
      return {
        start: '-',
        end: '-',
        announcement: '-'
      };
    }
  };

  // Tambahkan useEffect untuk memuat pengaturan PPDB
  useEffect(() => {
    const loadPPDBSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/ppdb');
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          setPPDBSettings(snapshot.val());
        }
      } catch (error) {
        console.error('Error loading PPDB settings:', error);
      }
    };

    loadPPDBSettings();
  }, []);

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
                    SMAN Modal Bangsa Tahun Ajaran {getAcademicYear()}
                  </h2>
                  <div className="grid grid-cols-2 mb-2">
                    <div>
                      <p className="text-sm text-gray-500">Periode Pendaftaran:</p>
                      <p className="font-medium text-gray-700">
                        {getRegistrationPeriod().start} - {getRegistrationPeriod().end}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pengumuman:</p>
                      <p className="font-medium text-gray-700">
                        {getRegistrationPeriod().announcement}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {formData.jalur && (
                      <div className="bg-blue-100 px-3 py-1 rounded-full">
                        <span className="text-gray-500">Jalur: </span>
                        <span className="font-medium text-blue-700">
                          {formData.jalur === 'prestasi' ? 'Prestasi' :
                           formData.jalur === 'reguler' ? 'Reguler' :
                           formData.jalur === 'undangan' ? 'Undangan' : '-'}
                        </span>
                      </div>
                    )}
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-gray-500">Status: </span>
                      <span className={`font-medium ${
                        formStatus === 'submitted' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {formStatus === 'submitted' ? 'Terkirim' : 'Draft'}
                      </span>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-gray-500">Email: </span>
                      <span className="font-medium text-gray-700">
                        {user?.email}
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
                    {/* <div className="bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-blue-600 font-medium">
                        Harap isi data dengan benar
                      </span>
                    </div> */}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
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
                            src={formData.photo instanceof File ? URL.createObjectURL(formData.photo) : formData.photo}
                            alt="Pas Foto"
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              // Cleanup URL object setelah gambar dimuat
                              if (formData.photo instanceof File) {
                                URL.revokeObjectURL((e.target as HTMLImageElement).src);
                              }
                            }}
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
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M15 19l-7-7 7-7" />
                      </svg>
                      Sebelumnya
                    </Button>
                  )}
                  
                  {formStatus !== 'submitted' && (
                    <Button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {loading ? 'Menyimpan...' : 'Simpan Draft'}
                    </Button>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => setShowLogoutModal(true)}
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                      />
                    </svg>
                    Keluar
                  </Button>

                  {currentStep < tabs.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      Selanjutnya
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        !isFormChanged 
                          ? 'bg-gray-300 cursor-not-allowed opacity-60 hover:bg-gray-300' 
                          : 'bg-green-600 hover:bg-green-700 animate-pulse hover:animate-none transform hover:scale-105 text-white'
                      }`}
                      disabled={loading || !isFormChanged}
                      title={!isFormChanged ? 'Belum ada perubahan data yang perlu dikirim' : 'Kirim perubahan data'}
                    >
                      <svg className={`w-4 h-4 ${isFormChanged ? 'animate-bounce' : ''}`} 
                           fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={isFormChanged ? 'font-semibold' : ''}>
                        {loading ? 'Mengirim...' : 'Kirim Formulir'}
                      </span>
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
              Pastikan semua data yang diisi sudah benar!
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
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsFormChanged(false);
                }}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Tetap di Halaman Ini
              </Button>
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
          </div>
        </Modal>

        {/* Tambahkan Modal Konfirmasi Logout */}
        <Modal 
          isOpen={showLogoutModal} 
          onClose={() => setShowLogoutModal(false)}
        >
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Konfirmasi Keluar
              </h3>
              <p className="text-sm text-gray-600">
                Apakah Anda yakin ingin keluar dari sistem?
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Konfirmasi Ganti Jalur */}
        <Modal
          isOpen={showChangeJalurModal}
          onClose={() => {
            setShowChangeJalurModal(false);
            // Reset pilihan jalur ke nilai sebelumnya
            setFormData(prev => ({ ...prev, jalur: prev.jalur }));
          }}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Konfirmasi Perubahan Jalur
            </h3>
            <p className="text-gray-600 mb-2">
              Mengubah jalur pendaftaran akan mereset:
            </p>
            <ul className="list-disc ml-6 mb-6 text-gray-600">
              <li>Semua nilai akademik</li>
              <li>Dokumen raport sesuai semester yang diperlukan</li>
            </ul>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin melanjutkan?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowChangeJalurModal(false);
                  // Reset pilihan jalur ke nilai sebelumnya
                  setFormData(prev => ({ ...prev, jalur: prev.jalur }));
                }}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                onClick={handleJalurChange}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Ya, Ubah Jalur
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Container>
  );
};

export default PPDBFormPage; 