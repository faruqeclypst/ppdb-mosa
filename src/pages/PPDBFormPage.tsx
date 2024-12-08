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
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { query, orderByChild, equalTo, get as getDb } from 'firebase/database';

// Types
export type JalurPeriod = {
  announcementDate: string | undefined;
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
  // Tambahkan uid dan school
  uid?: string;
  school: 'mosa' | 'fajar';
  
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
};

// Tambahkan INITIAL_FORM_DATA
const INITIAL_FORM_DATA: FormData = {
  uid: undefined,
  school: 'mosa', // Default value, will be overwritten when loading data
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

// Tambahkan konstanta untuk validasi
const VALIDATION_CONFIG = {
  // Mapping field ke label untuk pesan error
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
    asalSekolah: 'Asal Sekolah',
    kabupatenAsalSekolah: 'Kabupaten Asal Sekolah'
  },

  // Nilai minimum per jalur
  MIN_NILAI: {
    prestasi: 83,
    reguler: 83,
    undangan: 83
  },

  // Semester yang diperlukan per jalur
  SEMESTER_CONFIG: {
    reguler: ['3', '4'],
    prestasi: ['2', '3', '4'],
    undangan: ['2', '3', '4']
  },

  // Mata pelajaran yang divalidasi
  MAPEL: ['Agama', 'Bindo', 'Bing', 'Mtk', 'Ipa'],

  // Tambahkan required fields untuk setiap tab
  REQUIRED_FIELDS: {
    SISWA: [
      'namaSiswa', 'nik', 'nisn', 'jenisKelamin', 'tempatLahir', 'tanggalLahir',
      'anakKe', 'jumlahSaudara', 'alamat', 'kecamatan', 'kabupaten',
      'asalSekolah', 'kabupatenAsalSekolah'
    ],
    ORANG_TUA: [
      'namaAyah', 'pekerjaanAyah', 'instansiAyah', 'hpAyah',
      'namaIbu', 'pekerjaanIbu', 'instansiIbu', 'hpIbu'
    ]
  }
};

// Helper functions
const getRequiredSemesters = (jalur: string) => {
  return VALIDATION_CONFIG.SEMESTER_CONFIG[jalur as keyof typeof VALIDATION_CONFIG.SEMESTER_CONFIG] || [];
};

const getNilaiFields = (semesters: string[]) => {
  return semesters.flatMap(semester => 
    VALIDATION_CONFIG.MAPEL.map(mapel => `nilai${mapel}${semester}`)
  );
};

const validateNilai = (nilai: string, jalur: string): { isValid: boolean; error?: string } => {
  if (!nilai) return { isValid: false, error: 'Nilai harus diisi' };

  const nilaiNum = parseFloat(nilai);
  if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
    return { isValid: false, error: 'Nilai harus valid dan antara 0-100' };
  }

  const minNilai = VALIDATION_CONFIG.MIN_NILAI[jalur as keyof typeof VALIDATION_CONFIG.MIN_NILAI];
  if (nilaiNum < minNilai) {
    return { 
      isValid: false, 
      error: `Nilai minimal untuk jalur ${jalur} adalah ${minNilai}. Nilai ${nilaiNum} tidak memenuhi syarat.` 
    };
  }

  return { isValid: true };
};

// Fungsi untuk mendapatkan tahun ajaran PPDB
const getPPDBYear = () => {
  return {
    start: 2025,
    end: 2026
  };
};

// Update fungsi formatRegistrationNumber
const formatRegistrationNumber = (uid: string, jalur: string) => {
  // Ambil 6 karakter terakhir dari uid
  const shortId = uid.slice(-6).toUpperCase();
  
  // Dapatkan kode jalur
  const jalurCode = {
    'prestasi': 'PST',
    'reguler': 'REG', 
    'undangan': 'UND'
  }[jalur] || 'XXX';
  
  // Gunakan tahun PPDB yang tetap (2025)
  const { start } = getPPDBYear();
  
  // Format: PPDB/2025/PST/XXXXXX
  return `PPDB/${start}/${jalurCode}/${shortId}`;
};

// Tambahkan fungsi untuk memecah teks panjang
const wrapText = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);

  return lines;
};

// Tambahkan fungsi untuk membuat bukti pendaftaran PDF
const generateRegistrationCard = async (formData: FormData) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Tambahkan border dengan margin 20 points dari tepi
    const borderMargin = 20;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    // Sesuaikan marginX agar konten tidak terlalu dekat dengan border
    const marginX = 50; // Tetap 50 karena sudah cukup jauh dari border

    // Load fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load logo sekolah
    const logoResponse = await fetch('/images/mosa.png');
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoArrayBuffer);
    const logoDims = logoImage.scale(0.09); // Mengubah skala dari 0.07 menjadi 0.09

    // Header positioning
    const headerY = height - 80; // Turunkan sedikit header

    // Draw logo
    page.drawImage(logoImage, {
      x: marginX,
      y: headerY - logoDims.height/2,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Header text dengan alignment yang lebih baik
    const headerTextX = marginX + logoDims.width + 30;
    
    page.drawText('PENERIMAAN PESERTA DIDIK BARU', {
      x: headerTextX,
      y: headerY + 15,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('SMAN MODAL BANGSA', {
      x: headerTextX,
      y: headerY - 10,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const { start, end } = getPPDBYear();
    page.drawText(`TAHUN PELAJARAN ${start}/${end}`, {
      x: headerTextX,
      y: headerY - 35,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Garis pemisah yang lebih panjang
    const lineY = headerY - 60;
    page.drawLine({
      start: { x: marginX, y: lineY },
      end: { x: width - marginX, y: lineY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Judul bukti pendaftaran dengan spacing yang lebih baik
    page.drawText('BUKTI PENDAFTARAN', {
      x: (width - helveticaBold.widthOfTextAtSize('BUKTI PENDAFTARAN', 14)) / 2,
      y: lineY - 35,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Area foto dengan border yang lebih halus
    const photoWidth = 3 * 28.35;
    const photoHeight = 4 * 28.35;
    const photoX = width - photoWidth - marginX;
    const photoY = lineY - photoHeight - 20;

    // Border foto dengan sudut rounded
    page.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoWidth,
      height: photoHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.75,
    });

    // Teks petunjuk foto yang lebih rapi
    const textColor = rgb(0.5, 0.5, 0.5);
    page.drawText('Tempel', {
      x: photoX + photoWidth/2 - 12,
      y: photoY + photoHeight/2 + 10,
      size: 8,
      font: helveticaFont,
      color: textColor,
    });

    page.drawText('Pas Foto 3x4', {
      x: photoX + photoWidth/2 - 20,
      y: photoY + photoHeight/2 - 5,
      size: 8,
      font: helveticaFont,
      color: textColor,
    });

    // Format nomor pendaftaran
    const registrationNumber = formatRegistrationNumber(formData.uid || '', formData.jalur);

    // Informasi pendaftar dengan layout yang lebih rapi
    const startY = lineY - 80;
    const lineHeight = 25;
    let currentY = startY;

    const drawField = (label: string, value: string, y: number) => {
      page.drawText(label, {
        x: marginX,
        y,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });

      page.drawText(': ' + value, {
        x: marginX + 150, // Sejajarkan semua nilai
        y,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    };

    // Data pendaftar dengan grouping yang lebih jelas
    const fields = [
      { label: 'No. Pendaftaran', value: registrationNumber },
      { label: 'Jalur Pendaftaran', value: formData.jalur.toUpperCase() },
      { label: 'Nama Lengkap', value: formData.namaSiswa },
      { label: 'NISN', value: formData.nisn },
      { label: 'NIK', value: formData.nik },
      { label: 'Tempat, Tgl Lahir', value: `${formData.tempatLahir}, ${new Date(formData.tanggalLahir).toLocaleDateString('id-ID')}` },
      { label: 'Jenis Kelamin', value: formData.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan' },
      { label: 'Asal Sekolah', value: formData.asalSekolah },
      { label: 'Alamat', value: formData.alamat },
      { label: 'Nama Ayah', value: formData.namaAyah },
      { label: 'Nama Ibu', value: formData.namaIbu },
      { label: 'No. HP', value: formData.hpAyah }
    ];

    fields.forEach((field) => {
      drawField(field.label, field.value, currentY);
      currentY -= lineHeight;
    });

    // Catatan dengan style yang lebih baik
    currentY -= 30;
    page.drawText('Catatan:', {
      x: marginX,
      y: currentY,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    const notes = [
      'Kartu ini sebagai bukti pendaftaran PPDB SMAN Modal Bangsa'
      // '2. Simpan bukti ini dan tunjukkan saat pendaftaran ulang',
      // '3. Pengumuman hasil seleksi dapat dilihat di website PPDB'
    ];

    notes.forEach((note) => {
      currentY -= 20;
      page.drawText(note, {
        x: marginX,
        y: currentY,
        size: 9,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    });

    // Area tanda tangan dengan layout yang lebih rapi
    currentY -= 60;
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Update fungsi drawSignatureBox
    const drawSignatureBox = (x: number, y: number, width: number, label: string, name?: string) => {
      // Label (Panitia/Pendaftar)
      page.drawText(label, {
        x: x,
        y: y + 40,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Kurung dan garis putus-putus untuk nama
      page.drawText('(', {
        x: x,
        y: y - 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(')', {
        x: x + width - 5,
        y: y - 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });

      // Nama (jika ada) - dengan word wrap
      if (name) {
        const lines = wrapText(name, 25); // Batasi 25 karakter per baris
        lines.forEach((line, index) => {
          page.drawText(line, {
            x: x + 4,
            y: y - 21 - (index * 12), // Spasi antar baris 12pt
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        });
      }
    };

    // Update bagian tanda tangan
    // Pindahkan deklarasi konstanta ke atas
    const signatureWidth = 140; // Lebar area tanda tangan yang lebih besar
    const boxStartY = currentY - 40;

    // Hitung posisi kolom kanan
    const rightColumnX = width - marginX - signatureWidth;

    // Tanggal dan tanda tangan sejajar
    const dateText = 'Aceh Besar, ' + today;

    // Tanggal dan "Pendaftar" sejajar di kanan
    page.drawText(dateText, {
      x: rightColumnX,
      y: currentY + 15,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Hanya tampilkan box tanda tangan pendaftar
    drawSignatureBox(
      rightColumnX,
      boxStartY,
      signatureWidth,
      'Pendaftar',
      formData.namaSiswa
    );

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `Kartu_Pendaftaran_${formData.namaSiswa}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    showAlert('error', 'Gagal membuat bukti pendaftaran');
  }
};

// Update fungsi checkDuplicateNIK
const checkDuplicateNIK = async (nik: string, currentUid?: string, school?: string): Promise<boolean> => {
  try {
    if (nik === '-') return false;

    // Cek di database sesuai sekolah yang dipilih
    const ppdbRef = ref(db, `ppdb_${school}`);
    const nikQuery = query(ppdbRef, orderByChild('nik'), equalTo(nik));
    const snapshot = await getDb(nikQuery);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const entries = Object.entries(data);
      for (const [uid, entry] of entries) {
        if (uid === currentUid) continue;
        if ((entry as any).status === 'submitted') {
          console.log('Duplicate NIK found:', nik, 'from user:', uid);
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking duplicate NIK:', error);
    return false;
  }
};

// Update interface SavedData dan gunakan di submitForm
interface SavedData {
  // Metadata
  uid: string;
  email: string | null;
  status: 'draft' | 'submitted';
  lastUpdated: string;
  submittedAt: string | null;
  createdAt: string;
  wasReset: boolean;

  // Data siswa
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

  // Data akademik
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

  // Data orang tua
  namaAyah: string;
  pekerjaanAyah: string;
  instansiAyah: string;
  hpAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  instansiIbu: string;
  hpIbu: string;

  // File URLs
  photo?: string;
  rekomendasi?: string;
  raport2?: string;
  raport3?: string;
  raport4?: string;
}

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
  const [showChangeJalurModal, setShowChangeJalurModal] = useState(false);
  const [newJalurValue, setNewJalurValue] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(true);
  const [isReset, setIsReset] = useState(false);
  // Tambahkan state untuk melacak status duplikasi NIK
  const [isDuplicateNIK, setIsDuplicateNIK] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load existing data
    const loadData = async () => {
      setLoading(true);
      try {
        // Cek di kedua database untuk menentukan sekolah user
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

        if (userData) {
          setFormData({
            ...INITIAL_FORM_DATA,
            ...userData,
            uid: user.uid
          });
          setFormStatus(userData.status || 'draft');
          setLastUpdated(userData.lastUpdated || '');
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
      }
      return;
    }

    if (name === 'nik') {
      // Only allow numbers and '-'
      const sanitizedValue = value.replace(/[^0-9-]/g, '');
      
      // Check NIK format
      if (sanitizedValue !== '-') {
        if (sanitizedValue.length === 16) {
          // Check for duplicate NIK when a valid NIK is entered
          checkDuplicateNIK(sanitizedValue, formData.uid, formData.school).then(isDuplicate => {
            if (isDuplicate) {
              setError('NIK sudah terdaftar di sistem. Silakan periksa kembali NIK Anda atau hubungi panitia jika ada kesalahan.');
              setIsDuplicateNIK(true);
            } else {
              setError('');
              setIsDuplicateNIK(false);
            }
          });
        } else if (sanitizedValue.length > 16) {
          setError('NIK tidak boleh lebih dari 16 digit');
          setIsDuplicateNIK(true);
        } else if (sanitizedValue.length < 16 && sanitizedValue.length > 0) {
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

    setFormData(prev => ({ ...prev, [name]: value }));
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
        const alertId = showAlert('info', 'Sedang mengkompresi gambar...', 3000);
        
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

  // Tambahkan fungsi untuk mengecek apakah tab bisa diakses
  const canAccessTab = (tabIndex: number): boolean => {
    // Tab pertama selalu bisa diakses
    if (tabIndex === 0) return true;

    // Cek kelengkapan data informasi siswa
    const requiredFields = Object.keys(VALIDATION_CONFIG.FIELD_LABELS);
    const isInfoComplete = requiredFields.every(field => 
      formData[field as keyof FormData] && 
      formData[field as keyof FormData] !== ''
    );

    if (!isInfoComplete) return false;

    // Cek jalur untuk tab akademik dan selanjutnya
    if (tabIndex >= 1 && !formData.jalur) return false;

    return true;
  };

  // Update fungsi handleTabChange
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

  // Update fungsi validateForm
  const validateForm = async () => {
    // 1. Validasi informasi siswa
    const missingInfoSiswa = VALIDATION_CONFIG.REQUIRED_FIELDS.SISWA.filter(field => {
      const value = formData[field as keyof FormData];
      return !value || (value && value.toString().trim() === '');
    });

    if (missingInfoSiswa.length > 0) {
      const missingLabels = missingInfoSiswa.map(field => 
        VALIDATION_CONFIG.FIELD_LABELS[field as keyof typeof VALIDATION_CONFIG.FIELD_LABELS]
      );
      setError(`Data Siswa yang masih kosong: ${missingLabels.join(', ')}`);
      return false;
    }

    // 2. Validasi NIK
    if (formData.nik !== '-' && formData.nik.length !== 16) {
      setError('NIK harus 16 digit atau isi dengan "-" jika belum ada');
      return false;
    }

    // Check duplicate NIK
    const isDuplicateNIK = await checkDuplicateNIK(formData.nik, formData.uid, formData.school);
    if (isDuplicateNIK) {
      setError('NIK sudah terdaftar di sistem. Silakan periksa kembali NIK Anda atau hubungi panitia jika ada kesalahan.');
      return false;
    }

    // 3. Validasi nilai akademik
    const semesters = getRequiredSemesters(formData.jalur);
    const nilaiFields = getNilaiFields(semesters);

    for (const field of nilaiFields) {
      const nilaiStr = formData[field as keyof FormData];
      if (!nilaiStr) {
        setError(`Nilai akademik ${field.replace('nilai', '')} belum diisi`);
        return false;
      }
      
      // Tambahkan log untuk debugging
      console.log(`Validating ${field}: ${nilaiStr}`);
      
      const validation = validateNilai(nilaiStr as string, formData.jalur);
      if (!validation.isValid) {
        setError(`${field.replace('nilai', '')}: ${validation.error}`);
        return false;
      }

      // Tambahkan validasi eksplisit untuk nilai minimum
      const nilaiNum = parseFloat(nilaiStr as string);
      const minNilai = VALIDATION_CONFIG.MIN_NILAI[formData.jalur as keyof typeof VALIDATION_CONFIG.MIN_NILAI];
      if (nilaiNum < minNilai) {
        setError(`Nilai ${field.replace('nilai', '')} (${nilaiNum}) kurang dari nilai minimal ${minNilai} untuk jalur ${formData.jalur}`);
        return false;
      }
    }

    // 4. Validasi informasi orang tua
    const missingInfoOrtu = VALIDATION_CONFIG.REQUIRED_FIELDS.ORANG_TUA.filter(field => {
      const value = formData[field as keyof FormData];
      return !value || (value && value.toString().trim() === '');
    });

    if (missingInfoOrtu.length > 0) {
      const missingLabels = missingInfoOrtu.map(field => 
        VALIDATION_CONFIG.FIELD_LABELS[field as keyof typeof VALIDATION_CONFIG.FIELD_LABELS]
      );
      setError(`Data Orang Tua yang masih kosong: ${missingLabels.join(', ')}`);
      return false;
    }

    // 5. Validasi dokumen
    const requiredFiles = ['photo', 'rekomendasi'];
    semesters.forEach(semester => {
      requiredFiles.push(`raport${semester}`);
    });

    const missingDocs = requiredFiles.filter(key => {
      const fileValue = formData[key as keyof FormData];
      return !fileValue || (!(fileValue instanceof File) && typeof fileValue !== 'string');
    });

    if (missingDocs.length > 0) {
      const docLabels = missingDocs.map(key => {
        switch(key) {
          case 'photo': return 'Pas Foto';
          case 'rekomendasi': return formData.jalur === 'prestasi' ? 
            'Surat Rekomendasi / Sertifikat' : 'Surat Rekomendasi';
          default: return `Raport Semester ${key.replace('raport', '')}`;
        }
      });
      setError(`Dokumen yang belum diupload: ${docLabels.join(', ')}`);
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    // If saving as draft, process without confirmation modal
    if (isDraft) {
      await submitForm(isDraft);
      return;
    }

    // For final submission, validate NIK first
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setShowConfirmModal(true);
  };

  // Update fungsi submitForm
  const submitForm = async (isDraft: boolean = false) => {
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('User tidak ditemukan');
      }

      // Tentukan path berdasarkan sekolah yang dipilih saat register
      const userRef = ref(db, `ppdb_${formData.school}/${user.uid}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        throw new Error('Data pendaftar tidak ditemukan');
      }

      // Upload files dengan path yang sesuai
      const uploadPromises = [];
      const fileUrls: Record<string, string> = {};

      for (const [key, file] of Object.entries(formData)) {
        if (file instanceof File) {
          const fileRef = storageRef(storage, `ppdb_${formData.school}/${user.uid}/${key}`);
          uploadPromises.push(
            uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef))
              .then(url => { fileUrls[key] = url; })
          );
        }
      }

      await Promise.all(uploadPromises);

      // Prepare data untuk disimpan
      const dataToSave: SavedData = {
        // Metadata
        uid: user.uid,
        email: user.email,
        status: isDraft ? 'draft' : 'submitted',
        lastUpdated: new Date().toISOString(),
        submittedAt: isDraft ? null : new Date().toISOString(),
        createdAt: new Date().toISOString(), // Tambahkan ini
        wasReset: isDraft,

        // Data siswa
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
        kabupatenAsalSekolah: String(formData.kabupatenAsalSekolah || ''),

        // Data akademik
        nilaiAgama2: String(formData.nilaiAgama2 || ''),
        nilaiAgama3: String(formData.nilaiAgama3 || ''),
        nilaiAgama4: String(formData.nilaiAgama4 || ''),
        nilaiBindo2: String(formData.nilaiBindo2 || ''),
        nilaiBindo3: String(formData.nilaiBindo3 || ''),
        nilaiBindo4: String(formData.nilaiBindo4 || ''),
        nilaiBing2: String(formData.nilaiBing2 || ''),
        nilaiBing3: String(formData.nilaiBing3 || ''),
        nilaiBing4: String(formData.nilaiBing4 || ''),
        nilaiMtk2: String(formData.nilaiMtk2 || ''),
        nilaiMtk3: String(formData.nilaiMtk3 || ''),
        nilaiMtk4: String(formData.nilaiMtk4 || ''),
        nilaiIpa2: String(formData.nilaiIpa2 || ''),
        nilaiIpa3: String(formData.nilaiIpa3 || ''),
        nilaiIpa4: String(formData.nilaiIpa4 || ''),

        // Data orang tua
        namaAyah: String(formData.namaAyah || ''),
        pekerjaanAyah: String(formData.pekerjaanAyah || ''),
        instansiAyah: String(formData.instansiAyah || ''),
        hpAyah: String(formData.hpAyah || ''),
        namaIbu: String(formData.namaIbu || ''),
        pekerjaanIbu: String(formData.pekerjaanIbu || ''),
        instansiIbu: String(formData.instansiIbu || ''),
        hpIbu: String(formData.hpIbu || ''),

        // URL files yang sudah diupload
        ...fileUrls,
      };

      // Simpan ke database yang sesuai
      await update(userRef, dataToSave);

      setFormStatus(isDraft ? 'draft' : 'submitted');
      setLastUpdated(new Date().toISOString());
      
      if (!isDraft) {
        setIsReset(false);
      }

      if (isDraft) {
        showAlert('success', 'Draft berhasil disimpan!', 3000);
      } else {
        setShowSuccessModal(true);
      }

    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(`Gagal menyimpan data: ${err.message}`);
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
    const oldSemesters = formData.jalur === 'reguler' ? ['3', '4'] : ['2', '3'];
    const newSemesters = newJalurValue === 'reguler' ? ['3', '4'] : ['2', '3'];
    
    // Buat object untuk reset nilai dan dokumen
    const resetData: Partial<FormData> = {
      jalur: newJalurValue,
      // Reset semua nilai akademik
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
  };

  const renderInformasiSiswa = () => {
    const getAvailableJalur = () => {
      const options = [
        { value: '', label: '-- Pilih Jalur --', disabled: true }
      ];

      // Tambahkan jalur hanya jika aktif di settings
      if (ppdbSettings?.jalurPrestasi?.isActive) {
        options.push({ value: 'prestasi', label: 'Prestasi', disabled: false });
      }
      
      if (ppdbSettings?.jalurReguler?.isActive) {
        options.push({ value: 'reguler', label: 'Reguler', disabled: false });
      }
      
      if (ppdbSettings?.jalurUndangan?.isActive) {
        options.push({ value: 'undangan', label: 'Undangan', disabled: false });
      }

      return options;
    };

    return (
      <div className="space-y-10">
        <div>
          <SectionTitle>Data Pribadi</SectionTitle>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tampilkan Select Jalur hanya jika ada jalur yang aktif */}
              {getAvailableJalur().length > 1 && (
                <Select
                  label="Pilih Jalur"
                  name="jalur"
                  value={formData.jalur}
                  onChange={handleInputChange}
                  options={getAvailableJalur()}
                  required
                  className="bg-white"
                />
              )}

              <Input
                label="Nama Calon Siswa"
                name="namaSiswa"
                value={formData.namaSiswa}
                onChange={handleInputChange}
                required
              />

              <Input
                label={<span>NIK <span className="text-gray-500 text-xs">(-) jika tidak ada</span></span>}
                name="nik"
                value={formData.nik}
                onChange={(e) => {
                  // Hanya terima input angka dan -
                  const value = e.target.value.replace(/[^0-9-]/g, '');
                  setFormData(prev => ({ ...prev, nik: value }));
                }}
                onKeyPress={(e) => {
                  if (!/[0-9-]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                maxLength={16}
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
                }}
                required
              />

              <Input
                label={<span>NISN <span className="text-gray-500 text-xs">(-) jika tidak ada</span></span>}
                name="nisn"
                value={formData.nisn}
                onChange={(e) => {
                  // Hanya terima input angka dan -
                  const value = e.target.value.replace(/[^0-9-]/g, '');
                  setFormData(prev => ({ ...prev, nisn: value }));
                }}
                onKeyPress={(e) => {
                  if (!/[0-9-]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                maxLength={10}
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
                value={formData.anakKe}
                onChange={(e) => {
                  // Hanya terima input angka
                  const value = e.target.value.replace(/\D/g, '');
                  if (Number(value) > 0 || value === '') {
                    setFormData(prev => ({ ...prev, anakKe: value }));
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                min="1"
                maxLength={2}
                required
              />

              <Input
                label="Jumlah Saudara"
                name="jumlahSaudara"
                value={formData.jumlahSaudara}
                onChange={(e) => {
                  // Hanya terima input angka
                  const value = e.target.value.replace(/\D/g, '');
                  if (Number(value) >= 0 || value === '') {
                    setFormData(prev => ({ ...prev, jumlahSaudara: value }));
                  }
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                min="0"
                maxLength={2}
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
    const semesters = ['2', '3', '4'];

    const mapelList = [
      { label: 'Pendidikan Agama', mobileLabel: 'Pendidikan Agama', key: 'nilaiAgama' },
      { label: 'Bahasa Indonesia', mobileLabel: 'Bahasa Indonesia', key: 'nilaiBindo' },
      { label: 'Bahasa Inggris', mobileLabel: 'Bahasa Inggris', key: 'nilaiBing' },
      { label: 'Matematika', mobileLabel: 'Matematika', key: 'nilaiMtk' },
      { label: 'IPA', mobileLabel: 'IPA', key: 'nilaiIpa' }
    ];

    return (
      <div className="space-y-10">
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {semesters.map((semester) => (
              <div key={semester} className="space-y-6">
                <SectionTitle>Semester {semester}</SectionTitle>
                <div className="space-y-4">
                  {mapelList.map(({ label, mobileLabel, key }) => (
                    <Input
                      key={key}
                      label={label}
                      mobilelabel={mobileLabel}
                      name={`${key}${semester}`}
                      type="number"
                      min="0"
                      max="100"
                      value={String(formData[`${key}${semester}` as keyof typeof formData] || '')}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
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
    const semesters = ['2', '3', '4'];

    // Sisanya tetap sama
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
    { 
      label: "Siswa",
      mobileLabel: "Siswa",
      content: renderInformasiSiswa() 
    },
    { 
      label: "Akademik",
      mobileLabel: "Akademik",
      content: renderAkademik() 
    },
    { 
      label: "Orang Tua",
      mobileLabel: "Orang Tua",
      content: renderInformasiOrangTua() 
    },
    { 
      label: "Dokumen",
      mobileLabel: "Dokumen",
      content: renderDokumen() 
    }
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
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      };

      return new Date(dateStr).toLocaleDateString('id-ID', options);
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

  // Tambahkan komponen GuideModal
  const GuideModal = () => {
    return (
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        size="md"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Petunjuk Pengisian Formulir
            </h3>
            <p className="text-gray-600 mb-4">
              Mohon perhatikan petunjuk berikut sebelum mengisi formulir
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-800 mb-2">Langkah Pengisian:</p>
              <ol className="list-decimal ml-4 text-blue-700 space-y-2">
                <li>Lengkapi data di tab Siswa terlebih dahulu</li>
                <li>Pilih jalur pendaftaran sesuai dengan periode yang aktif</li>
                <li>Isi nilai akademik di tab Akademik</li>
                <li>Lengkapi data orang tua di tab Orang Tua</li>
                <li>Upload dokumen yang diperlukan di tab Dokumen</li>
                <li>Ukuran dokumen PDF maksimal 500KB, Pastikan sudah melakukan kompres PDF terlebih dahulu</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="font-medium text-yellow-800 mb-2">Hal Penting:</p>
              <ul className="list-disc ml-4 text-yellow-700 space-y-2">
                <li>Pastikan mengisi data dengan benar</li>
                <li>Simpan draft secara berkala</li>
                <li>Periksa kembali sebelum mengirim formulir</li>
                <li>Formulir yang sudah dikirim tidak dapat diubah</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-800 mb-2">Petunjuk Upload Dokumen:</p>
              <ul className="list-disc ml-4 text-green-700 space-y-2">
                <li>Kompres foto dan dokumen sebelum upload</li>
                <li>Ukuran maksimal file Pas Foto: 4MB</li>
                <li>Format foto: JPG/PNG, Dokumen: PDF</li>
                <li>Pastikan dokumen yang diupload jelas dan lengkap</li>
                <li>Gunakan koneksi internet yang stabil</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="font-medium text-purple-800 mb-2">Tips Tambahan:</p>
              <ul className="list-disc ml-4 text-purple-700 space-y-2">
                <li>Siapkan semua dokumen sebelum mulai mengisi</li>
                <li>Isi formulir dengan teliti dan lengkap</li>
                <li>Jika mengalami kendala teknis, coba refresh halaman</li>
                <li>Hubungi panitia jika membutuhkan bantuan</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowGuideModal(false)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Saya Mengerti
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  const getAnnouncementDate = () => {
    console.log('PPDB Settings:', ppdbSettings);
    console.log('Selected Jalur:', formData.jalur);

    if (!ppdbSettings || !formData.jalur) {
      return 'Memuat...';
    }

    const selectedJalur = ppdbSettings[`jalur${formData.jalur.charAt(0).toUpperCase() + formData.jalur.slice(1)}` as keyof typeof ppdbSettings] as JalurPeriod;
    console.log('Selected Jalur Data:', selectedJalur);

    const formatDate = (dateStr?: string) => {
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
      };

      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    };

    return formatDate(selectedJalur?.announcementDate);
  };

  // Tambahkan fungsi formatDateTime untuk timestamp
  const formatDateTime = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    };

    return new Date(dateStr).toLocaleString('id-ID', options);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Container className="max-w-full md:max-w-6xl px-2 md:px-6">
      <div className="py-4 md:py-10">
        <GuideModal />
        
        <Card className="max-w-full md:max-w-4xl mx-auto relative">
          <div className="p-4 md:p-6">
            <div className="mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    Formulir Pendaftaran PPDB
                  </h1>
                  <h2 className="text-base md:text-lg text-gray-600">
                    SMAN Modal Bangsa Tahun Ajaran {getAcademicYear()}
                  </h2>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 text-sm">
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
                          {formatDateTime(lastUpdated)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Grid untuk info periode - Stack di mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-sm text-gray-500">Periode Pendaftaran:</p>
                      <p className="font-medium text-gray-700">
                        {getRegistrationPeriod().start} - {getRegistrationPeriod().end}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pengumuman:</p>
                      <p className="font-medium text-gray-700">
                        {getAnnouncementDate()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo upload section */}
                <div className="w-full md:w-auto flex justify-center md:justify-end">
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
                      <div className="w-20 h-28 md:w-32 md:h-40 rounded-lg overflow-hidden relative">
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
                          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-red-300 animate-pulse">
                            <img 
                              src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                              alt="Dummy Profile"
                              className="w-12 h-12 md:w-20 md:h-20 opacity-50 mb-1 md:mb-2"
                            />
                            <div className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                              <span className="text-white text-[10px] md:text-xs">!</span>
                            </div>
                            <div className="text-center px-1 md:px-2">
                              <p className="text-[10px] md:text-xs text-red-500 font-medium">Pas Foto Wajib</p>
                              <p className="text-[8px] md:text-[10px] text-gray-500">
                                Upload foto 3x4 latar biru
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <span className="text-white text-xs md:text-sm font-medium block">
                              {formData.photo ? 'Ganti Foto' : 'Upload Foto'}
                            </span>
                            <span className="text-gray-300 text-[10px] md:text-xs">
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

            {/* Info reset - tampilkan jika isReset true dan status bukan submitted */}
            {isReset && formStatus !== 'submitted' && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                    <ArrowPathIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">
                      Data Anda telah direset oleh admin
                    </p>
                    <p className="text-sm text-yellow-700">
                      Silakan perbarui dan kirim ulang formulir PPDB Anda
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert 
                type="error" 
                message={error} 
                className="my-2"
                onClose={() => setError('')}
              />
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
            }}>
              {formStatus === 'submitted' && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <CheckCircleIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">
                        Formulir sudah terkirim
                      </p>
                      <p className="text-sm text-yellow-600">
                        Data tidak dapat diubah. Pengumuman hasil seleksi akan diinformasikan pada tanggal {getAnnouncementDate()}
                      </p>
                    </div>
                    <Button
                      onClick={() => generateRegistrationCard(formData)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      Cetak Kartu
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 min-h-[400px]">
                <Tabs 
                  tabs={tabs} 
                  activeTab={currentStep}
                  onChange={handleTabChange}
                  className="space-y-4 md:space-y-6"
                />
              </div>

              <div className="mt-6 pt-4 border-t bg-white">
                {/* Info box untuk panduan pengiriman formulir */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-1">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Petunjuk Pengiriman Formulir:
                      </p>
                      <p className="text-sm text-blue-600">
                        Tombol "Kirim Formulir" akan aktif dan tampil (pada tab Dokumen) setelah anda melengkapi semua data pada:
                      </p>
                      <ul className="mt-1 text-sm text-blue-600 list-disc list-inside">
                        <li>Tab Siswa (informasi pribadi)</li>
                        <li>Tab Akademik (nilai rapor)</li>
                        <li>Tab Orang Tua (data ayah & ibu)</li>
                        <li>Tab Dokumen (upload berkas)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Tombol-tombol aksi */}
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => setShowLogoutModal(true)}
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 text-sm md:text-base px-3 md:px-4 flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                      />
                    </svg>
                    <span className="hidden md:inline">Keluar</span>
                    <span className="inline md:hidden">Exit</span>
                  </Button>

                  {formStatus !== 'submitted' && (
                    <Button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center gap-2 text-sm md:text-base px-3 md:px-4 flex-1"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {loading ? (
                        <>
                          <span className="hidden md:inline">Menyimpan...</span>
                          <span className="inline md:hidden">Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden md:inline">Simpan Draft</span>
                          <span className="inline md:hidden">Draft</span>
                        </>
                      )}
                    </Button>
                  )}

                  {currentStep === tabs.length - 1 && formStatus !== 'submitted' && (
                    <Button
                      type="button"
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 text-sm md:text-base px-3 md:px-4 flex-1"
                      disabled={loading || !canAccessTab(currentStep) || isDuplicateNIK}
                      onClick={async () => {
                        const isValid = await validateForm();
                        if (!isValid) {
                          return;
                        }
                        setShowConfirmModal(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M5 13l4 4L19 7" />
                      </svg>
                      {loading ? (
                        <>
                          <span className="hidden md:inline">Mengirim...</span>
                          <span className="inline md:hidden">Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden md:inline">Kirim Formulir</span>
                          <span className="inline md:hidden">Kirim</span>
                        </>
                      )}
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
              Pengumuman hasil seleksi akan diinformasikan pada tanggal {getAnnouncementDate()}.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button
                onClick={() => generateRegistrationCard(formData)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Bukti Pendaftaran
              </Button>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Tutup
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