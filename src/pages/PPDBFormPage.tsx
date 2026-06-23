import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ref, get, update } from 'firebase/database';
import { db, auth } from '../firebase/config';
import { uploadToR2 } from '../services/cloudflareR2';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert, { showAlert } from '../components/ui/Alert';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { signOut } from 'firebase/auth';
import { getPPDBStatus } from '../utils/ppdbStatus';
import { compressFile } from '../utils/fileCompression';

// Modular imports
import StudentInfoForm from '../components/ppdb/StudentInfoForm';
import AcademicForm from '../components/ppdb/AcademicForm';
import ParentInfoForm from '../components/ppdb/ParentInfoForm';
import DocumentUploadForm from '../components/ppdb/DocumentUploadForm';
import { generateRegistrationCard, generateGraduationLetter } from '../utils/pdfGenerator';
import { generateAtomicRegistrationNumber } from '../utils/registrationNumber';

// Types
export type JalurPeriod = {
  announcementDate: string | undefined;
  start: string;    // Format: YYYY-MM-DD
  end: string;      // Format: YYYY-MM-DD
  isActive: boolean;
  reRegistrationStart?: string;
  reRegistrationEnd?: string;
};

export type PPDBSettings = {
  academicYear: string;
  jalurPrestasi: JalurPeriod;
  jalurReguler: JalurPeriod;
  jalurUndangan: JalurPeriod;
  jalurPjj: JalurPeriod;
  announcementDate: string;   // Format: YYYY-MM-DD
  isActive: boolean;
};

type FormData = {
  uid?: string;
  school: 'mosa' | 'fajar';
  jalur: string;
  pjjSchool?: string;
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
  asalSekolahManual?: string;
  registrationNumber?: string;
  createdAt?: string;

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
  rekomendasi?: File | string;
  raport2?: File | string;
  raport3?: File | string;
  raport4?: File | string;
  photo?: File | string;
  ijazah?: File | string;
  kartuKeluarga?: File | string;
  aktaKelahiran?: File | string;
  lampiranA?: File | string;
  lampiranB?: File | string;
  adminStatus?: 'diterima' | 'ditolak';
  reRegistered?: boolean;
  reRegisteredAt?: string;
  alasanPenolakan?: string;
};

const INITIAL_FORM_DATA: FormData = {
  uid: undefined,
  school: 'mosa',
  jalur: '',
  pjjSchool: '',
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
  asalSekolahManual: '',
  registrationNumber: '',

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
  
  namaAyah: '',
  pekerjaanAyah: '',
  instansiAyah: '',
  hpAyah: '',
  namaIbu: '',
  pekerjaanIbu: '',
  instansiIbu: '',
  hpIbu: '',

  ijazah: undefined,
  kartuKeluarga: undefined,
  aktaKelahiran: undefined,
  lampiranA: undefined,
  lampiranB: undefined,
  adminStatus: undefined,
  reRegistered: undefined,
  reRegisteredAt: undefined,
  alasanPenolakan: undefined
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-lg font-semibold text-gray-900 mb-4">{children}</h3>
);

const getAcademicYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const startYear = currentMonth >= 6 ? currentYear + 1 : currentYear;
  const endYear = startYear + 1;

  return `${startYear}/${endYear}`;
};

const VALIDATION_CONFIG = {
  FIELD_LABELS: {
    namaSiswa: 'Nama Siswa',
    nik: 'NIK',
    nisn: 'NISN',
    jenisKelamin: 'Jenis Kelamin',
    tempatLahir: 'Tempat Lahir',
    tanggalLahir: 'Tanggal Lahir',
    anakKe: 'Anak Ke',
    jumlahSaudara: 'Jumlah Saudara',
    alamat: 'Alamat',
    kecamatan: 'Kecamatan',
    kabupaten: 'Kabupaten',
    asalSekolah: 'Asal Sekolah'
  },
  SEMESTER_CONFIG: {
    reguler: ['3', '4'],
    prestasi: ['2', '3', '4'],
    undangan: ['2', '3', '4'],
    pjj: []
  },
  MAPEL: ['Agama', 'Bindo', 'Bing', 'Mtk', 'Ipa'],
  REQUIRED_FIELDS: {
    SISWA: [
      'namaSiswa', 'nik', 'nisn', 'jenisKelamin', 'tempatLahir', 'tanggalLahir',
      'anakKe', 'jumlahSaudara', 'alamat', 'kecamatan', 'kabupaten',
      'asalSekolah'
    ],
    ORANG_TUA: [
      'namaAyah', 'pekerjaanAyah', 'instansiAyah', 'hpAyah',
      'namaIbu', 'pekerjaanIbu', 'instansiIbu', 'hpIbu'
    ]
  }
};

const getRequiredSemesters = (jalur: string): string[] => {
  return (VALIDATION_CONFIG.SEMESTER_CONFIG[jalur as keyof typeof VALIDATION_CONFIG.SEMESTER_CONFIG] as string[]) || [];
};

const getNilaiFields = (semesters: string[]) => {
  return semesters.flatMap(semester => 
    VALIDATION_CONFIG.MAPEL.map(mapel => `nilai${mapel}${semester}`)
  );
};

const validateNilai = (nilai: string): { isValid: boolean; error?: string } => {
  if (!nilai) return { isValid: false, error: 'Nilai harus diisi' };
  const nilaiNum = parseFloat(nilai);
  if (isNaN(nilaiNum)) return { isValid: false, error: 'Nilai harus berupa angka' };
  if (nilaiNum < 0 || nilaiNum > 100) return { isValid: false, error: 'Nilai harus antara 0-100' };
  return { isValid: true };
};

const KABUPATEN_LIST = [
  { kode: '01', nama: 'KOTA BANDA ACEH' },
  { kode: '02', nama: 'KOTA SABANG' },
  { kode: '03', nama: 'KOTA LHOKSEUMAWE' },
  { kode: '04', nama: 'KOTA LANGSA' },
  { kode: '05', nama: 'KOTA SUBULUSSALAM' },
  { kode: '06', nama: 'KABUPATEN ACEH BESAR' },
  { kode: '07', nama: 'KABUPATEN PIDIE' },
  { kode: '08', nama: 'KABUPATEN PIDIE JAYA' },
  { kode: '09', nama: 'KABUPATEN BIREUEN' },
  { kode: '10', nama: 'KABUPATEN ACEH TENGAH' },
  { kode: '11', nama: 'KABUPATEN BENER MERIAH' },
  { kode: '12', nama: 'KABUPATEN ACEH UTARA' },
  { kode: '13', nama: 'KABUPATEN ACEH TIMUR' },
  { kode: '14', nama: 'KABUPATEN ACEH TAMIANG' },
  { kode: '15', nama: 'KABUPATEN ACEH SINGKIL' },
  { kode: '16', nama: 'KABUPATEN ACEH JAYA' },
  { kode: '17', nama: 'KABUPATEN ACEH BARAT' },
  { kode: '18', nama: 'KABUPATEN NAGAN RAYA' },
  { kode: '19', nama: 'KABUPATEN SIMEULUE' },
  { kode: '20', nama: 'KABUPATEN ACEH BARAT DAYA' },
  { kode: '21', nama: 'KABUPATEN ACEH SELATAN' },
  { kode: '22', nama: 'KABUPATEN ACEH TENGGARA' },
  { kode: '23', nama: 'KABUPATEN GAYO LUES' },
  { kode: '24', nama: 'LUAR DAERAH' }
];

const checkDuplicateNIK = async (nik: string, currentUid?: string, school?: string): Promise<boolean> => {
  try {
    if (nik === '-') return false;

    const ppdbRef = ref(db, `ppdb_${school}`);
    const snapshot = await get(ppdbRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const entries = Object.entries(data);
      for (const [uid, entry] of entries) {
        if (uid === currentUid) continue;
        if ((entry as any).nik === nik && (entry as any).status === 'submitted') {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
};

const PPDBFormPage: React.FC = () => {
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
  const [showChangeJalurModal, setShowChangeJalurModal] = useState(false);
  const [newJalurValue, setNewJalurValue] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [isDuplicateNIK, setIsDuplicateNIK] = useState(false);
  const [showReRegisterConfirmModal, setShowReRegisterConfirmModal] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isJalurPeriodOpen = (jalur: string, settings: PPDBSettings | null): boolean => {
    if (!settings || !jalur) return false;

    let selectedJalur;
    switch (jalur) {
      case 'prestasi':
        selectedJalur = settings.jalurPrestasi;
        break;
      case 'reguler':
        selectedJalur = settings.jalurReguler;
        break;
      case 'undangan':
        selectedJalur = settings.jalurUndangan;
        break;
      case 'pjj':
        selectedJalur = settings.jalurPjj;
        break;
      default:
        return false;
    }

    if (!selectedJalur || !selectedJalur.isActive) return false;

    const currentDate = new Date();
    const startDate = new Date(selectedJalur.start);
    const endDate = new Date(selectedJalur.end);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    currentDate.setHours(12, 0, 0, 0);

    return currentDate >= startDate && currentDate <= endDate;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      if (isMounted.current) setLoading(true);
      try {
        const mosaRef = ref(db, `ppdb_mosa/${user.uid}`);
        const fajarRef = ref(db, `ppdb_fajar/${user.uid}`);
        
        const [mosaSnapshot, fajarSnapshot] = await Promise.all([
          get(mosaRef),
          get(fajarRef)
        ]);

        let userData = null;

        if (mosaSnapshot.exists()) {
          userData = { ...mosaSnapshot.val(), school: 'mosa' as const };
        } else if (fajarSnapshot.exists()) {
          userData = { ...fajarSnapshot.val(), school: 'fajar' as const };
        }

        if (userData && isMounted.current) {
          setFormData({
            ...INITIAL_FORM_DATA,
            ...userData,
            uid: user.uid,
            namaSiswa: userData.fullName || userData.namaSiswa || '',
            nik: userData.nik || '',
            asalSekolahManual: userData.asalSekolahManual || ''
          });
          setFormStatus(userData.status || 'draft');
          setLastUpdated(userData.lastUpdated || '');
          setIsReset(!!userData.isReset);
        }
      } catch (err) {
        if (isMounted.current) setError('Gagal memuat data');
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  useEffect(() => {
    const checkPPDBStatus = async () => {
      const isPPDBActive = await getPPDBStatus();
      if (!isPPDBActive) {
        showAlert('error', 'SPMB belum dimulai');
        navigate('/');
      }
    };

    checkPPDBStatus();
  }, [navigate]);

  useEffect(() => {
    const loadPPDBSettings = async () => {
      try {
        const settingsRef = ref(db, 'settings/ppdb');
        const snapshot = await get(settingsRef);
        if (snapshot.exists() && isMounted.current) {
          setPPDBSettings(snapshot.val());
        }
      } catch (error) {
        // Slit silent error for inspect log cleanup
      }
    };

    loadPPDBSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (formStatus === 'submitted') return;

    const { name, value } = e.target;
    
    if (name === 'jalur') {
      const hasAcademicData = Object.entries(formData)
        .some(([key, val]) => {
          if (key.startsWith('nilai') && val !== '') return true;
          if (key.startsWith('raport') && val) return true;
          return false;
        });

      if (hasAcademicData) {
        setNewJalurValue(value);
        setShowChangeJalurModal(true);
        return;
      } else {
        setFormData(prev => ({ ...prev, jalur: value }));
      }
      return;
    }

    if (name === 'nik') {
      const sanitizedValue = value.replace(/[^0-9-]/g, '');
      if (sanitizedValue !== '-') {
        if (sanitizedValue.length === 16) {
          checkDuplicateNIK(sanitizedValue, formData.uid, formData.school).then(isDuplicate => {
            if (isMounted.current) {
              if (isDuplicate) {
                setError('NIK sudah terdaftar di sistem. Silakan periksa kembali NIK Anda.');
                setIsDuplicateNIK(true);
              } else {
                setError('');
                setIsDuplicateNIK(false);
              }
            }
          });
        } else if (sanitizedValue.length > 16) {
          setError('NIK tidak boleh lebih dari 16 digit');
          setIsDuplicateNIK(true);
        } else {
          setError('NIK harus 16 digit');
          setIsDuplicateNIK(true);
        }
      } else {
        setError('');
        setIsDuplicateNIK(false);
      }
      
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
      return;
    }

    if (name === 'asalSekolah' && value !== 'SEKOLAH LAIN') {
      setFormData(prev => ({ ...prev, [name]: value, asalSekolahManual: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (name: string, file: File | null) => {
    if (formStatus === 'submitted') return;

    if (!file) {
      setFormData(prev => ({ ...prev, [name]: null }));
      return;
    }

    try {
      const maxSize = 4 * 1024 * 1024;
      if (file.size > maxSize) {
        showAlert('error', 'Ukuran file terlalu besar (maksimal 4MB)');
        return;
      }

      const fileName = `${formData.nisn}_${formData.namaSiswa.replace(/\s+/g, '')}`;
      const fileExtension = file.name.split('.').pop();

      let compressed: File;

      if (file.type.startsWith('image/')) {
        const alertId = showAlert('info', 'Sedang mengkompresi gambar...', 3000);
        
        compressed = await compressFile(file, 30, {
          maxWidthOrHeight: 800,
          initialQuality: 0.5,
          maxIteration: 10,
          maxSizeMB: 0.03
        });
        
        if (compressed.size > 50 * 1024) {
          compressed = await compressFile(compressed, 30, {
            maxWidthOrHeight: 600,
            initialQuality: 0.3,
            maxIteration: 10,
            maxSizeMB: 0.03
          });
        }

        compressed = new File(
          [compressed], 
          `${fileName}.${fileExtension}`,
          { type: compressed.type }
        );
        
        const element = document.getElementById(alertId);
        if (element) element.remove();
        
        setFormData(prev => ({ ...prev, [name]: compressed }));
        
        setTimeout(() => {
          showAlert('success', 'File berhasil dikompresi', 3000);
        }, 100);

      } else if (file.type === 'application/pdf') {
        if (file.size > 2 * 1024 * 1024) {
          showAlert('error', 'Ukuran PDF tidak boleh lebih dari 2MB.');
          return;
        }

        compressed = new File(
          [file], 
          `${fileName}_${name}.${fileExtension}`,
          { type: file.type }
        );

        setFormData(prev => ({ ...prev, [name]: compressed }));
      } else {
        throw new Error('Format file tidak didukung');
      }
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'Gagal memproses file');
    }
  };

  const canAccessTab = (tabIndex: number): boolean => {
    if (tabIndex === 0) return true;
    const requiredFields = Object.keys(VALIDATION_CONFIG.FIELD_LABELS);
    const isInfoComplete = requiredFields.every(field => 
      formData[field as keyof FormData] && 
      formData[field as keyof FormData] !== ''
    );
    if (!isInfoComplete) return false;
    if (tabIndex >= 1 && !formData.jalur) return false;
    return true;
  };

  const handleTabChange = (index: number) => {
    if (!canAccessTab(index)) {
      const message = !formData.jalur && index >= 1 
        ? 'Mohon pilih jalur pendaftaran terlebih dahulu'
        : 'Mohon lengkapi data informasi siswa terlebih dahulu';
      setError(message);
      return;
    }
    setCurrentStep(index);
  };

  const validateForm = async () => {
    const missingInfoSiswa = VALIDATION_CONFIG.REQUIRED_FIELDS.SISWA.filter(field => {
      const val = formData[field as keyof FormData];
      return !val || (val && val.toString().trim() === '');
    });

    if (missingInfoSiswa.length > 0) {
      const missingLabels = missingInfoSiswa.map(field =>
        VALIDATION_CONFIG.FIELD_LABELS[field as keyof typeof VALIDATION_CONFIG.FIELD_LABELS]
      );
      setError(`Data Siswa yang masih kosong: ${missingLabels.join(', ')}`);
      return false;
    }

    if (formData.asalSekolah === 'SEKOLAH LAIN' && (!formData.asalSekolahManual || formData.asalSekolahManual.trim() === '')) {
      setError('Nama Sekolah harus diisi jika memilih "SEKOLAH LAIN"');
      return false;
    }

    if (formData.nik !== '-' && formData.nik.length !== 16) {
      setError('NIK harus 16 digit');
      return false;
    }

    const isDuplicate = await checkDuplicateNIK(formData.nik, formData.uid, formData.school);
    if (isDuplicate) {
      setError('NIK sudah terdaftar di sistem.');
      return false;
    }

    if (formData.jalur !== 'pjj') {
      const semesters = getRequiredSemesters(formData.jalur);
      const nilaiFields = getNilaiFields(semesters);
      for (const field of nilaiFields) {
        const val = formData[field as keyof FormData];
        if (!val) {
          setError('Nilai akademik belum diisi lengkap');
          setCurrentStep(1);
          return false;
        }
        const validation = validateNilai(val as string);
        if (!validation.isValid) {
          setError(validation.error || 'Nilai tidak valid');
          setCurrentStep(1);
          return false;
        }
      }
    }

    const missingParent = VALIDATION_CONFIG.REQUIRED_FIELDS.ORANG_TUA.filter(field => {
      const val = formData[field as keyof FormData];
      return !val || (val && val.toString().trim() === '');
    });

    if (missingParent.length > 0) {
      setError('Data orang tua belum lengkap');
      return false;
    }

    const phoneRegex = /^08[0-9]{8,12}$/;
    if (!phoneRegex.test(formData.hpAyah) || !phoneRegex.test(formData.hpIbu)) {
      setError('Nomor HP tidak valid (harus diawali 08 dan 10-14 digit)');
      return false;
    }

    let requiredFiles: string[] = [];
    if (formData.jalur === 'pjj') {
      requiredFiles = ['photo', 'ijazah', 'kartuKeluarga', 'aktaKelahiran'];
    } else {
      requiredFiles = ['photo', 'rekomendasi'];
      const semesters = getRequiredSemesters(formData.jalur);
      semesters.forEach(s => requiredFiles.push(`raport${s}`));
    }

    const missingDocs = requiredFiles.filter(key => {
      const val = formData[key as keyof FormData];
      return !val || (!(val instanceof File) && typeof val !== 'string');
    });

    if (missingDocs.length > 0) {
      setError('Dokumen wajib belum diunggah lengkap');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (loading) return;

    if (isDraft) {
      await submitForm(isDraft);
      return;
    }

    const isValid = await validateForm();
    if (!isValid) return;
    setShowConfirmModal(true);
  };

  const submitForm = async (isDraft: boolean = false) => {
    setError('');
    if (isMounted.current) setLoading(true);

    try {
      if (!user) throw new Error('User tidak ditemukan');
      const userRef = ref(db, `ppdb_${formData.school}/${user.uid}`);

      const uploadPromises = [];
      const fileUrls: Record<string, string> = {};

      for (const [key, file] of Object.entries(formData)) {
        if (file instanceof File) {
          const path = `ppdb_${formData.school}/${user.uid}/${key}`;
          uploadPromises.push(
            uploadToR2({
              file,
              path,
              contentType: file.type
            }).then(result => {
              fileUrls[key] = result.url;
            })
          );
        }
      }

      await Promise.all(uploadPromises);

      const kabupatenData = KABUPATEN_LIST.find(kab => kab.nama === formData.kabupaten);
      const kabupatenKode = kabupatenData?.kode || '00';

      // Atomic generate registration number only on first submission / reset
      let registrationNumber = formData.registrationNumber || '';
      if (!isDraft && (!registrationNumber || isReset)) {
        registrationNumber = await generateAtomicRegistrationNumber(db, formData.school, kabupatenKode);
      } else if (isDraft && !registrationNumber) {
        registrationNumber = await generateAtomicRegistrationNumber(db, formData.school, kabupatenKode);
      }

      const isPJJ = formData.jalur === 'pjj';

      const dataToSave: any = {
        uid: user.uid,
        email: user.email,
        status: isDraft ? 'draft' : 'submitted',
        lastUpdated: new Date().toISOString(),
        submittedAt: isDraft ? null : new Date().toISOString(),
        createdAt: formData.createdAt || new Date().toISOString(),
        wasReset: isDraft,
        isReset: false, // Reset flag cleared on submit/save

        jalur: String(formData.jalur || ''),
        namaSiswa: String(formData.namaSiswa || ''),
        nik: String(formData.nik || ''),
        nisn: String(formData.nisn || ''),
        jenisKelamin: String(formData.jenisKelamin || ''),
        tempatLahir: String(formData.tempatLahir || ''),
        tanggalLahir: String(formData.tanggalLahir || ''),
        anakKe: String(formData.anakKe || ''),
        jumlahSaudara: String(formData.jumlahSaudara || ''),
        alamat: String(formData.alamat || ''),
        kecamatan: String(formData.kecamatan || ''),
        kabupaten: String(formData.kabupaten || ''),
        asalSekolah: String(formData.asalSekolah || ''),
        asalSekolahManual: String(formData.asalSekolahManual || ''),

        namaAyah: String(formData.namaAyah || ''),
        pekerjaanAyah: String(formData.pekerjaanAyah || ''),
        instansiAyah: String(formData.instansiAyah || ''),
        hpAyah: String(formData.hpAyah || ''),
        namaIbu: String(formData.namaIbu || ''),
        pekerjaanIbu: String(formData.pekerjaanIbu || ''),
        instansiIbu: String(formData.instansiIbu || ''),
        hpIbu: String(formData.hpIbu || ''),

        registrationNumber,
        kabupatenKode,

        // Handle file references mapping
        photo: typeof formData.photo === 'string' ? formData.photo : (fileUrls.photo || null)
      };

      if (isPJJ) {
        dataToSave.ijazah = typeof formData.ijazah === 'string' ? formData.ijazah : (fileUrls.ijazah || null);
        dataToSave.kartuKeluarga = typeof formData.kartuKeluarga === 'string' ? formData.kartuKeluarga : (fileUrls.kartuKeluarga || null);
        dataToSave.aktaKelahiran = typeof formData.aktaKelahiran === 'string' ? formData.aktaKelahiran : (fileUrls.aktaKelahiran || null);
        dataToSave.lampiranA = typeof formData.lampiranA === 'string' ? formData.lampiranA : (fileUrls.lampiranA || null);
        dataToSave.lampiranB = typeof formData.lampiranB === 'string' ? formData.lampiranB : (fileUrls.lampiranB || null);
        dataToSave.pjjSchool = String(formData.pjjSchool || '');
        
        dataToSave.rekomendasi = null;
        dataToSave.raport2 = null;
        dataToSave.raport3 = null;
        dataToSave.raport4 = null;
        
        // Also clear grades for PJJ
        for (let s = 2; s <= 4; s++) {
          VALIDATION_CONFIG.MAPEL.forEach(m => {
            dataToSave[`nilai${m}${s}`] = '';
          });
        }
      } else {
        dataToSave.rekomendasi = typeof formData.rekomendasi === 'string' ? formData.rekomendasi : (fileUrls.rekomendasi || null);
        
        const semesters = getRequiredSemesters(formData.jalur);
        semesters.forEach(s => {
          const key = `raport${s}`;
          dataToSave[key] = typeof formData[key as keyof FormData] === 'string' ? formData[key as keyof FormData] : (fileUrls[key] || null);
        });
 
        // Set unused semesters to null
        const allSemesters = ['2', '3', '4'];
        allSemesters.filter(s => !semesters.includes(s)).forEach(s => {
          dataToSave[`raport${s}`] = null;
          // Clear unused semester grades
          VALIDATION_CONFIG.MAPEL.forEach(m => {
            dataToSave[`nilai${m}${s}`] = '';
          });
        });
 
        // Copy grades
        semesters.forEach(s => {
          VALIDATION_CONFIG.MAPEL.forEach(m => {
            const key = `nilai${m}${s}`;
            dataToSave[key] = String(formData[key as keyof FormData] || '');
          });
        });
 
        dataToSave.ijazah = null;
        dataToSave.kartuKeluarga = null;
        dataToSave.aktaKelahiran = null;
        dataToSave.lampiranA = null;
        dataToSave.lampiranB = null;
        dataToSave.pjjSchool = null;
      }

      await update(userRef, dataToSave);

      if (isMounted.current) {
        setFormData(prev => ({
          ...prev,
          ...dataToSave
        }));
        setFormStatus(isDraft ? 'draft' : 'submitted');
        setLastUpdated(new Date().toISOString());
        setIsReset(false);
        if (isDraft) {
          showAlert('success', 'Draft berhasil disimpan!', 3000);
        } else {
          setShowSuccessModal(true);
        }
      }
    } catch (err: any) {
      if (isMounted.current) setError(`Gagal menyimpan data: ${err.message}`);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setShowConfirmModal(false);
      }
    }
  };

  const handleReRegister = async () => {
    if (loading) return;
    if (isMounted.current) setLoading(true);
    setError('');
    try {
      if (!user) throw new Error('User tidak ditemukan');
      const userRef = ref(db, `ppdb_${formData.school}/${user.uid}`);
      
      const nowStr = new Date().toISOString();
      await update(userRef, {
        reRegistered: true,
        reRegisteredAt: nowStr
      });
      
      if (isMounted.current) {
        setFormData(prev => ({
          ...prev,
          reRegistered: true,
          reRegisteredAt: nowStr
        }));
        setShowReRegisterConfirmModal(false);
        showAlert('success', 'Daftar ulang berhasil dikonfirmasi!', 3000);
      }
    } catch (err: any) {
      if (isMounted.current) setError(`Gagal melakukan daftar ulang: ${err.message}`);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      // Silent error
    }
  };

  const handleJalurChange = () => {
    const resetData: Partial<FormData> = {
      jalur: newJalurValue,
      nilaiAgama2: '', nilaiAgama3: '', nilaiAgama4: '',
      nilaiBindo2: '', nilaiBindo3: '', nilaiBindo4: '',
      nilaiBing2: '', nilaiBing3: '', nilaiBing4: '',
      nilaiMtk2: '', nilaiMtk3: '', nilaiMtk4: '',
      nilaiIpa2: '', nilaiIpa3: '', nilaiIpa4: '',
    };

    if (newJalurValue === 'pjj') {
      resetData.rekomendasi = undefined;
      resetData.raport2 = undefined;
      resetData.raport3 = undefined;
      resetData.raport4 = undefined;
    } else {
      if (formData.jalur === 'pjj') {
        resetData.ijazah = undefined;
        resetData.kartuKeluarga = undefined;
        resetData.lampiranA = undefined;
        resetData.lampiranB = undefined;
      } else {
        const oldSemesters = getRequiredSemesters(formData.jalur);
        const newSemesters = getRequiredSemesters(newJalurValue);
        const differentSemesters = oldSemesters.filter(sem => !newSemesters.includes(sem));
        differentSemesters.forEach(semester => {
          resetData[`raport${semester}` as keyof FormData] = undefined;
        });
      }
    }

    setFormData(prev => ({
      ...prev,
      ...resetData
    }));

    showAlert('info', `Jalur berhasil diubah. Data sebelumnya telah direset.`);
    setShowChangeJalurModal(false);
  };

  const getRegistrationPeriod = () => {
    if (!ppdbSettings || !formData.jalur) {
      return { start: '-', end: '-', announcement: '-' };
    }

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      });
    };

    try {
      let selectedJalur;
      switch (formData.jalur) {
        case 'prestasi': selectedJalur = ppdbSettings.jalurPrestasi; break;
        case 'reguler': selectedJalur = ppdbSettings.jalurReguler; break;
        case 'undangan': selectedJalur = ppdbSettings.jalurUndangan; break;
        case 'pjj': selectedJalur = ppdbSettings.jalurPjj; break;
        default:
          return {
            start: '-',
            end: '-',
            announcement: ppdbSettings.announcementDate ? formatDate(ppdbSettings.announcementDate) : '-'
          };
      }

      if (!selectedJalur || !selectedJalur.isActive) {
        return { start: '-', end: '-', announcement: ppdbSettings.announcementDate ? formatDate(ppdbSettings.announcementDate) : '-' };
      }

      return {
        start: formatDate(selectedJalur.start),
        end: formatDate(selectedJalur.end),
        announcement: ppdbSettings.announcementDate ? formatDate(ppdbSettings.announcementDate) : '-'
      };
    } catch (error) {
      return { start: '-', end: '-', announcement: '-' };
    }
  };

  const getAnnouncementDate = () => {
    if (!ppdbSettings || !formData.jalur) return 'Memuat...';

    const selectedJalur = ppdbSettings[`jalur${formData.jalur.charAt(0).toUpperCase() + formData.jalur.slice(1)}` as keyof typeof ppdbSettings] as JalurPeriod;

    const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      });
    };

    return formatDate(selectedJalur?.announcementDate);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const disabledInputClass = formStatus === 'submitted' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '';

  const renderSiswaTab = () => (
    <StudentInfoForm
      formData={formData}
      setFormData={setFormData}
      handleInputChange={handleInputChange}
      formStatus={formStatus}
      disabledInputClass={disabledInputClass}
      ppdbSettings={ppdbSettings}
      KABUPATEN_LIST={KABUPATEN_LIST}
      SectionTitle={SectionTitle}
    />
  );

  const renderAkademikTab = () => (
    <AcademicForm
      formData={formData}
      handleInputChange={handleInputChange}
      formStatus={formStatus}
      disabledInputClass={disabledInputClass}
      SectionTitle={SectionTitle}
    />
  );

  const renderOrangTuaTab = () => (
    <ParentInfoForm
      formData={formData}
      setFormData={setFormData}
      handleInputChange={handleInputChange}
      formStatus={formStatus}
      disabledInputClass={disabledInputClass}
      SectionTitle={SectionTitle}
    />
  );

  const renderDokumenTab = () => (
    <DocumentUploadForm
      formData={formData}
      formStatus={formStatus}
      disabledInputClass={disabledInputClass}
      handleFileChange={handleFileChange}
      getRequiredSemesters={getRequiredSemesters}
      setCurrentStep={setCurrentStep}
      SectionTitle={SectionTitle}
    />
  );

  const tabs = [
    { label: "Siswa", mobileLabel: "Siswa", content: renderSiswaTab() },
    ...(formData.jalur !== 'pjj' ? [{ label: "Akademik", mobileLabel: "Akademik", content: renderAkademikTab() }] : []),
    { label: "Orang Tua", mobileLabel: "Orang Tua", content: renderOrangTuaTab() },
    { label: "Dokumen", mobileLabel: "Dokumen", content: renderDokumenTab() }
  ];

  if (loading && formData.namaSiswa === '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Container className="max-w-full md:max-w-6xl px-4 md:px-6">
      <div className="py-6 md:py-10">
        {/* Guide Modal */}
        <Modal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} size="md">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-2">Petunjuk Pengisian Formulir</h3>
              <p className="text-sm text-zinc-500">Mohon perhatikan petunjuk berikut sebelum mengisi formulir</p>
            </div>

            <div className="space-y-4 mb-6 text-sm text-zinc-650 max-h-[350px] overflow-y-auto pr-1">
              <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-xl">
                <p className="font-semibold text-emerald-800 mb-2">Langkah Pengisian:</p>
                <ol className="list-decimal ml-4 text-emerald-800 space-y-1">
                  <li>Lengkapi data di tab Siswa terlebih dahulu</li>
                  <li>Pilih jalur pendaftaran sesuai dengan periode yang aktif</li>
                  <li>Isi nilai akademik di tab Akademik (jika memilih jalur non-PJJ)</li>
                  <li>Lengkapi data orang tua di tab Orang Tua</li>
                  <li>Upload berkas di tab Dokumen</li>
                </ol>
              </div>

              <div className="bg-amber-50/50 border border-amber-100/50 p-4 rounded-xl">
                <p className="font-semibold text-amber-800 mb-2">Hal Penting:</p>
                <ul className="list-disc ml-4 text-amber-800 space-y-1">
                  <li>Pastikan mengisi data dengan benar</li>
                  <li>Simpan draft secara berkala</li>
                  <li>Formulir yang sudah dikirim tidak dapat diubah</li>
                </ul>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-xl">
                <p className="font-semibold text-zinc-800 mb-2">Petunjuk Upload Dokumen:</p>
                <ul className="list-disc ml-4 text-zinc-700 space-y-1">
                  <li>Ukuran maksimal file Pas Foto & PDF: 4MB</li>
                  <li>Format foto: JPG/PNG, Dokumen: PDF</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowGuideModal(false)} className="bg-emerald-800 text-white hover:bg-emerald-900 border-0 rounded-xl px-6 py-2.5 font-semibold">
                Saya Mengerti
              </Button>
            </div>
          </div>
        </Modal>
        
        <Card className="max-w-full md:max-w-4xl mx-auto relative overflow-hidden border border-zinc-200/80 shadow-lg shadow-zinc-200/20 rounded-2xl">
          <div className="p-4 md:p-8">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1 min-w-0 space-y-3">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                    Formulir Pendaftaran SPMB
                  </h1>
                  <h2 className="text-base text-zinc-500 font-medium">
                    SMAN Modal Bangsa Tahun Ajaran {getAcademicYear()}
                  </h2>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    {formData.jalur && (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-full">
                        Jalur: {formData.jalur === 'prestasi' ? 'Prestasi' :
                               formData.jalur === 'reguler' ? 'Reguler' :
                               formData.jalur === 'undangan' ? 'Undangan' :
                               formData.jalur === 'pjj' ? 'Pendidikan Jarak Jauh (PJJ)' : '-'}
                      </span>
                    )}
                    <span className={`border px-3 py-1 rounded-full ${
                      formStatus === 'submitted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      Status: {formStatus === 'submitted' ? 'Terkirim' : 'Draft'}
                    </span>
                    <span className="bg-zinc-50 text-zinc-650 border border-zinc-200/60 px-3 py-1 rounded-full">
                      Email: {user?.email}
                    </span>
                    {lastUpdated && (
                      <span className="bg-zinc-50 text-zinc-650 border border-zinc-200/60 px-3 py-1 rounded-full">
                        Update: {formatDateTime(lastUpdated)}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-zinc-500">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Periode Pendaftaran:</p>
                      <p className="font-medium text-zinc-700">
                        {getRegistrationPeriod().start} - {getRegistrationPeriod().end}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Pengumuman:</p>
                      <p className="font-medium text-zinc-700">
                        {getAnnouncementDate()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo upload section */}
                <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0">
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
                      className={`cursor-pointer block ${formStatus === 'submitted' ? 'pointer-events-none opacity-75' : ''}`}
                    >
                      <div className="w-28 h-36 md:w-32 md:h-40 rounded-2xl overflow-hidden relative border border-zinc-200 shadow-sm bg-zinc-50">
                        {formData.photo ? (
                          <img 
                            src={formData.photo instanceof File ? URL.createObjectURL(formData.photo) : formData.photo}
                            alt="Pas Foto"
                            className="w-full h-full object-cover"
                            onLoad={(e) => {
                              if (formData.photo instanceof File) {
                                URL.revokeObjectURL((e.target as HTMLImageElement).src);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-2">
                              <span className="text-rose-500 font-bold text-sm">!</span>
                            </div>
                            <p className="text-xs text-rose-600 font-bold">Pas Foto Wajib</p>
                            <p className="text-[10px] text-zinc-400 mt-1">Latar belakang biru</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-center p-2">
                          <span className="text-white text-xs font-semibold">
                            {formData.photo ? 'Ganti Foto' : 'Upload Foto'}
                          </span>
                          <span className="text-[10px] text-zinc-300 mt-0.5">Klik untuk memilih</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {isReset && formStatus !== 'submitted' && (
              <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ArrowPathIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Formulir Anda telah di-reset oleh admin</p>
                    <p className="text-sm text-amber-700 mt-0.5">Silakan periksa kembali data Anda, lakukan koreksi, lalu kirim ulang formulir.</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert 
                type="error" 
                message={error} 
                className="mb-6"
                onClose={() => setError('')}
              />
            )}

            <form onSubmit={(e) => e.preventDefault()}>
              {formStatus === 'submitted' && (() => {
                const jalurName = formData.jalur;
                const selectedJalur = ppdbSettings
                  ? (ppdbSettings[`jalur${jalurName.charAt(0).toUpperCase() + jalurName.slice(1)}` as keyof typeof ppdbSettings] as any)
                  : null;

                if (!selectedJalur || !selectedJalur.announcementDate) {
                  return (
                    <div className="mb-6 bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-zinc-800">Formulir Telah Terkirim</p>
                        <p className="text-sm text-zinc-500 mt-0.5">Data Anda telah tersimpan di sistem.</p>
                      </div>
                      <Button
                        onClick={() => generateRegistrationCard(formData as any, showAlert)}
                        className="bg-zinc-800 hover:bg-zinc-950 text-white font-semibold border-0 py-2.5 px-5 rounded-xl shadow-md"
                      >
                        Unduh Bukti Kartu
                      </Button>
                    </div>
                  );
                }

                const currentDate = new Date();
                const announcementDate = new Date(selectedJalur.announcementDate);
                announcementDate.setHours(0, 0, 0, 0);
                
                const tempCurrentDate = new Date(currentDate);
                tempCurrentDate.setHours(0, 0, 0, 0);

                const isAnnouncementActive = tempCurrentDate >= announcementDate;

                if (!isAnnouncementActive) {
                  return (
                    <div className="mb-6 bg-emerald-50 border border-emerald-100/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-emerald-800">Formulir Telah Terkirim</p>
                        <p className="text-sm text-emerald-700 mt-0.5">Data sudah dikunci. Hasil seleksi diumumkan pada tanggal {getAnnouncementDate()}</p>
                      </div>
                      <Button
                        onClick={() => generateRegistrationCard(formData as any, showAlert)}
                        className="bg-emerald-800 hover:bg-emerald-950 text-white font-semibold border-0 py-2.5 px-5 rounded-xl shadow-md shadow-emerald-800/10 self-start sm:self-center"
                      >
                        Unduh Bukti Kartu
                      </Button>
                    </div>
                  );
                }

                if (formData.adminStatus === 'diterima') {
                  let reRegStarted = false;
                  let reRegEnded = false;
                  let reRegPeriodText = '';
                  
                  if (selectedJalur.reRegistrationStart && selectedJalur.reRegistrationEnd) {
                    const reRegStart = new Date(selectedJalur.reRegistrationStart);
                    reRegStart.setHours(0, 0, 0, 0);
                    const reRegEnd = new Date(selectedJalur.reRegistrationEnd);
                    reRegEnd.setHours(23, 59, 59, 999);
                    
                    reRegStarted = currentDate >= reRegStart;
                    reRegEnded = currentDate > reRegEnd;
                    
                    const formatDate = (dateStr: string) => {
                      return new Date(dateStr).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'Asia/Jakarta'
                      });
                    };
                    reRegPeriodText = `${formatDate(selectedJalur.reRegistrationStart)} s.d. ${formatDate(selectedJalur.reRegistrationEnd)}`;
                  }

                  return (
                    <div className="mb-8 space-y-4">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                        </div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                            <span className="bg-emerald-400/30 text-white border border-emerald-300/40 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                              Pengumuman Hasil Seleksi
                            </span>
                            <h3 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight">
                              Selamat! Anda Dinyatakan LULUS
                            </h3>
                            <p className="text-sm md:text-base text-emerald-50 mt-2 max-w-2xl leading-relaxed">
                              Selamat kepada <span className="font-bold text-white uppercase">{formData.namaSiswa}</span> (No. Registrasi: <span className="font-mono bg-emerald-700/40 px-2 py-0.5 rounded text-white">{formData.registrationNumber}</span>) yang telah dinyatakan lulus seleksi masuk SMAN Modal Bangsa Jalur {
                                formData.jalur === 'prestasi' ? 'Prestasi' :
                                formData.jalur === 'reguler' ? 'Reguler' :
                                formData.jalur === 'undangan' ? 'Undangan' :
                                formData.jalur === 'pjj' ? 'Pendidikan Jarak Jauh (PJJ)' : '-'
                              }.
                            </p>
                          </div>
                          <Button
                            onClick={() => generateGraduationLetter(formData as any, showAlert, ppdbSettings)}
                            className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold border-0 py-3 px-6 rounded-xl shadow-lg shrink-0 self-start md:self-center"
                          >
                            Unduh Bukti Kelulusan
                          </Button>
                        </div>
                      </div>

                      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Tahap Daftar Ulang
                        </h4>
                        
                        {formData.reRegistered ? (
                          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-emerald-805">Daftar Ulang Selesai</p>
                                <p className="text-sm text-emerald-700 mt-1">
                                  Anda telah melakukan konfirmasi daftar ulang pada tanggal <span className="font-semibold">{formatDateTime(formData.reRegisteredAt || '')}</span>.
                                </p>
                                <p className="text-xs text-emerald-600 mt-2">
                                  Silakan pantau informasi selanjutnya mengenai persiapan masuk sekolah melalui grup koordinasi atau website resmi sekolah.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-4">
                            <p className="text-sm text-zinc-650 leading-relaxed">
                              Untuk mengonfirmasi kesediaan Anda belajar di SMAN Modal Bangsa, silakan lakukan daftar ulang dengan mengklik tombol konfirmasi di bawah ini.
                            </p>
                            
                            {reRegPeriodText && (
                              <div className="bg-zinc-50 border border-zinc-150 p-3.5 rounded-xl text-sm flex flex-col sm:flex-row sm:justify-between gap-2">
                                <span className="text-zinc-500 font-medium">Periode Daftar Ulang:</span>
                                <span className="font-bold text-zinc-800">{reRegPeriodText}</span>
                              </div>
                            )}

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                              {reRegEnded ? (
                                <div className="w-full bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3.5 text-center text-sm font-semibold">
                                  Maaf, periode daftar ulang telah berakhir.
                                </div>
                              ) : !reRegStarted ? (
                                <div className="w-full bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-3.5 text-center text-sm font-semibold">
                                  Pendaftaran ulang belum dimulai. Tombol konfirmasi akan aktif mulai tanggal {selectedJalur.reRegistrationStart ? new Date(selectedJalur.reRegistrationStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}.
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setShowReRegisterConfirmModal(true)}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
                                >
                                  Konfirmasi Daftar Ulang
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else if (formData.adminStatus === 'ditolak') {
                  return (
                    <div className="mb-8 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm">
                      <div className="max-w-2xl">
                        <span className="bg-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                          Pengumuman Hasil Seleksi
                        </span>
                        <h3 className="text-xl md:text-2xl font-bold text-zinc-900 mt-4">
                          Pengumuman Hasil Seleksi SPMB SMAN Modal Bangsa
                        </h3>
                        <p className="text-sm md:text-base text-zinc-600 mt-3 leading-relaxed">
                          Terima kasih telah berpartisipasi dalam proses seleksi SPMB SMAN Modal Bangsa. 
                          Setelah melakukan peninjauan berkas dan hasil tes secara saksama, kami menginformasikan bahwa nama pendaftar di bawah ini:
                        </p>
                        <div className="my-4 p-4 bg-white border border-zinc-200 rounded-xl text-sm space-y-2">
                          <p className="text-zinc-500">Nama Siswa: <span className="font-bold text-zinc-800 uppercase ml-2">{formData.namaSiswa}</span></p>
                          <p className="text-zinc-500">No. Registrasi: <span className="font-mono font-bold text-zinc-800 ml-2">{formData.registrationNumber}</span></p>
                          <p className="text-zinc-500">Jalur: <span className="font-semibold text-zinc-800 ml-2">
                            {formData.jalur === 'prestasi' ? 'Prestasi' :
                             formData.jalur === 'reguler' ? 'Reguler' :
                             formData.jalur === 'undangan' ? 'Undangan' :
                             formData.jalur === 'pjj' ? 'Pendidikan Jarak Jauh (PJJ)' : '-'}
                          </span></p>
                        </div>
                        <p className="text-sm md:text-base text-zinc-700 font-bold mt-2">
                          Dinyatakan: TIDAK LULUS SELEKSI.
                        </p>
                        
                        {formData.alasanPenolakan && (
                          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-900">
                            <span className="font-bold">Alasan Penolakan/Keterangan:</span>
                            <p className="mt-1 leading-relaxed">{formData.alasanPenolakan}</p>
                          </div>
                        )}

                        <p className="text-xs text-zinc-400 mt-6 leading-relaxed">
                          Kami sangat menghargai minat dan usaha Anda. Tetap semangat dan semoga sukses di jenjang pendidikan selanjutnya.
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-blue-900">Pengumuman Hasil Seleksi</h3>
                      <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                        Hasil seleksi pendaftaran Anda masih dalam tahap peninjauan oleh tim panitia seleksi. 
                        Silakan periksa kembali halaman ini secara berkala.
                      </p>
                      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <p className="text-xs text-blue-600">
                          Terima kasih atas kesabaran Anda.
                        </p>
                        <Button
                          onClick={() => generateRegistrationCard(formData as any, showAlert)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold border-0 py-2 px-4 rounded-lg self-start sm:self-center"
                        >
                          Unduh Bukti Kartu
                        </Button>
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="min-h-[400px]">
                <Tabs 
                  tabs={tabs} 
                  activeTab={currentStep}
                  onChange={handleTabChange}
                  className="space-y-6"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-150">
                {/* Petunjuk Kirim */}
                <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200/50 rounded-xl">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Petunjuk Pengiriman Formulir:</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Tombol "Kirim Formulir" akan aktif pada tab **Dokumen** setelah Anda melengkapi seluruh data di tab Siswa, Akademik (jika berlaku), Orang Tua, serta mengunggah berkas wajib.
                  </p>
                </div>

                <div className="flex flex-row gap-3">
                  <Button
                    onClick={() => setShowLogoutModal(true)}
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white border-0 py-3 px-5 rounded-xl font-semibold transition-all duration-300 flex-1 flex items-center justify-center gap-2"
                  >
                    Keluar
                  </Button>

                  {formStatus !== 'submitted' && (
                    <Button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white border-0 py-3 px-5 rounded-xl font-semibold transition-all duration-300 flex-1 flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? 'Menyimpan...' : 'Simpan Draft'}
                    </Button>
                  )}

                  {currentStep === tabs.length - 1 && formStatus !== 'submitted' && (
                    <Button
                      type="button"
                      className="bg-emerald-800 hover:bg-emerald-900 text-white border-0 py-3 px-5 rounded-xl font-semibold transition-all duration-300 flex-1 flex items-center justify-center gap-2 shadow-md shadow-emerald-800/10"
                      disabled={loading || !canAccessTab(currentStep) || isDuplicateNIK}
                      onClick={async () => {
                        if (!isJalurPeriodOpen(formData.jalur, ppdbSettings)) {
                          setError('Periode pendaftaran untuk jalur ini sudah ditutup. Tidak dapat mengirim formulir.');
                          return;
                        }

                        const isValid = await validateForm();
                        if (!isValid) return;
                        setShowConfirmModal(true);
                      }}
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
        <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Konfirmasi Pengiriman</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin mengirim formulir pendaftaran ini? Setelah dikirim, data Anda akan dikunci dan tidak dapat diubah kembali.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => setShowConfirmModal(false)}
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-0 rounded-xl px-5 py-2.5 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={() => submitForm(false)}
                className="bg-emerald-800 text-white hover:bg-emerald-900 border-0 rounded-xl px-5 py-2.5 font-semibold shadow-md shadow-emerald-800/10"
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Ya, Kirim'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Sukses */}
        <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Formulir Berhasil Dikirim!</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              Terima kasih telah mendaftar di SMAN Modal Bangsa. Bukti pendaftaran telah tersimpan di sistem.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => generateRegistrationCard(formData as any, showAlert)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white border-0 py-2.5 px-5 rounded-xl font-semibold shadow-md shadow-emerald-800/10 flex items-center justify-center gap-2"
              >
                Unduh Kartu Pendaftaran
              </Button>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-0 rounded-xl py-2.5 px-5 font-semibold"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Konfirmasi Logout */}
        <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Konfirmasi Keluar</h3>
              <p className="text-sm text-zinc-500">Apakah Anda yakin ingin keluar dari sistem?</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-0 rounded-xl py-2.5 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700 border-0 rounded-xl py-2.5 font-semibold"
              >
                Keluar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Konfirmasi Ganti Jalur */}
        <Modal
          isOpen={showChangeJalurModal}
          onClose={() => {
            setShowChangeJalurModal(false);
            setFormData(prev => ({ ...prev, jalur: prev.jalur }));
          }}
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Konfirmasi Ganti Jalur</h3>
            <p className="text-sm text-zinc-500 mb-3 leading-relaxed">
              Mengubah jalur pendaftaran akan mereset:
            </p>
            <ul className="list-disc ml-5 mb-6 text-sm text-zinc-650 space-y-1">
              <li>Semua nilai akademik yang sudah diisi</li>
              <li>Dokumen raport yang sudah diunggah</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowChangeJalurModal(false);
                  setFormData(prev => ({ ...prev, jalur: prev.jalur }));
                }}
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-0 rounded-xl px-5 py-2.5 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={handleJalurChange}
                className="bg-rose-650 text-white hover:bg-rose-700 border-0 rounded-xl px-5 py-2.5 font-semibold"
              >
                Ya, Ganti Jalur
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Konfirmasi Daftar Ulang */}
        <Modal isOpen={showReRegisterConfirmModal} onClose={() => setShowReRegisterConfirmModal(false)}>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Konfirmasi Daftar Ulang</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Apakah Anda yakin ingin melakukan konfirmasi daftar ulang? Tindakan ini menyatakan kesediaan penuh Anda untuk menempuh pendidikan di SMAN Modal Bangsa.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowReRegisterConfirmModal(false)}
                className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-0 rounded-xl py-2.5 font-semibold"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                onClick={handleReRegister}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 border-0 rounded-xl py-2.5 font-semibold shadow-md shadow-emerald-600/10"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Ya, Daftar Ulang'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Container>
  );
};

export default PPDBFormPage;