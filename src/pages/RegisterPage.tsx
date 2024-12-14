import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, User, onAuthStateChanged } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { auth, db } from '../firebase/config';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  KeyIcon,
  ArrowRightIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { getPPDBStatus } from '../utils/ppdbStatus';
import Modal from '../components/ui/Modal';
import type { PPDBSettings } from '../types/settings';
import Select from '../components/ui/Select';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  school: 'mosa' | 'fajar' | '';
  nik: string;
}

// Tambahkan interface untuk data pendaftar
interface PPDBUserData {
  fullName: string;
  nik: string;
  email: string;
  school?: string;
  status?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    nik: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPPDBClosedModal, setShowPPDBClosedModal] = useState(false);
  const [ppdbSettings, setPPDBSettings] = useState<PPDBSettings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isNIKValid, setIsNIKValid] = useState<boolean>(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkFirstAdmin = async () => {
      try {
        const adminRef = ref(db, 'admins');
        const snapshot = await get(adminRef);
        setIsFirstAdmin(!snapshot.exists());
      } catch (error) {
        console.error('Error checking first admin:', error);
        // Jika gagal mengecek, asumsikan bukan admin pertama
        setIsFirstAdmin(false);
      }
    };

    checkFirstAdmin();
  }, []);

  useEffect(() => {
    const checkPPDBStatus = async () => {
      const isPPDBActive = await getPPDBStatus();
      if (!isPPDBActive && !isFirstAdmin) {
        setShowPPDBClosedModal(true);
      }
    };

    checkPPDBStatus();
  }, [isFirstAdmin]);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const checkUserRole = async () => {
        const adminRef = ref(db, `admins/${user.uid}`);
        const ppdbRef = ref(db, `ppdb/${user.uid}`);
        
        const adminSnapshot = await get(adminRef);
        const ppdbSnapshot = await get(ppdbRef);

        if (adminSnapshot.exists()) {
          navigate('/admin');
        } else if (ppdbSnapshot.exists()) {
          navigate('/ppdb/form');
        }
      };

      checkUserRole();
    }
  }, [user, navigate]);

  const checkExistingNIK = async (nik: string): Promise<{exists: boolean, userData?: {fullName: string, nik: string, school?: string}}> => {
    try {
      if (nik === '-') return { exists: false };

      // Cek di database MOSA
      const mosaRef = ref(db, 'ppdb_mosa');
      const mosaQuery = query(mosaRef, orderByChild('nik'), equalTo(nik));
      let mosaSnapshot;
      try {
        mosaSnapshot = await get(mosaQuery);
      } catch (error) {
        console.error('Error checking MOSA database:', error);
        mosaSnapshot = null;
      }

      // Cek di database Fajar Harapan
      const fajarRef = ref(db, 'ppdb_fajar');
      const fajarQuery = query(fajarRef, orderByChild('nik'), equalTo(nik));
      let fajarSnapshot;
      try {
        fajarSnapshot = await get(fajarQuery);
      } catch (error) {
        console.error('Error checking Fajar database:', error);
        fajarSnapshot = null;
      }

      if (mosaSnapshot?.exists()) {
        const mosaData = Object.values(mosaSnapshot.val())[0] as PPDBUserData;
        if (mosaData && mosaData.nik !== '-') {
          return { exists: true, userData: { fullName: mosaData.fullName, nik: mosaData.nik, school: 'SMAN Modal Bangsa' } };
        }
      }

      if (fajarSnapshot?.exists()) {
        const fajarData = Object.values(fajarSnapshot.val())[0] as PPDBUserData;
        if (fajarData && fajarData.nik !== '-') {
          return { exists: true, userData: { fullName: fajarData.fullName, nik: fajarData.nik, school: 'SMAN 10 Fajar Harapan' } };
        }
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking NIK:', error);
      return { exists: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!formData.school && !isFirstAdmin) {
      setError('Silakan pilih sekolah');
      setLoading(false);
      return;
    }

    if (!isFirstAdmin) {
      // Validasi NIK
      if (!formData.nik) {
        setError('NIK wajib diisi');
        setLoading(false);
        return;
      }
      
      // Validasi format NIK
      if (formData.nik !== '-') {
        if (formData.nik.length !== 16) {
          setError('NIK harus 16 digit');
          setLoading(false);
          return;
        }

        // Validasi NIK hanya angka
        if (!/^\d{16}$/.test(formData.nik)) {
          setError('NIK hanya boleh berisi angka');
          setLoading(false);
          return;
        }

        // Cek NIK duplikat
        const { exists, userData } = await checkExistingNIK(formData.nik);
        if (exists && userData) {
          setError(`NIK sudah terdaftar oleh: ${userData.nik} - ${userData.fullName} (${userData.school})`);
          setLoading(false);
          setIsNIKValid(false);
          return;
        }
      }

      if (!isNIKValid) {
        setError('NIK tidak valid atau sudah terdaftar');
        setLoading(false);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        nik: formData.nik,
        createdAt: new Date().toISOString()
      };

      if (isFirstAdmin) {
        await set(ref(db, `admins/${userCredential.user.uid}`), {
          ...userData,
          role: 'admin',
          isMaster: true,
          school: 'all'
        });
        navigate('/admin');
      } else {
        await set(ref(db, `ppdb_${formData.school}/${userCredential.user.uid}`), {
          ...userData,
          school: formData.school,
          status: 'draft'
        });
        setShowSuccessModal(true);
      }

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email telah digunakan');
      } else {
        setError('Gagal membuat akun');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <ArrowRightIcon className="w-5 h-5 text-blue-600" />,
      title: "Sistem pendaftaran yang mudah",
      description: "Proses pendaftaran online yang sederhana dan cepat"
    },
    {
      icon: <ArrowRightIcon className="w-5 h-5 text-blue-600" />,
      title: "Upload dokumen secara online",
      description: "Upload semua dokumen persyaratan secara digital"
    },
    {
      icon: <ArrowRightIcon className="w-5 h-5 text-blue-600" />,
      title: "Pantau status pendaftaran",
      description: "Cek status pendaftaran kapan saja secara real-time"
    },
    {
      icon: <ArrowRightIcon className="w-5 h-5 text-blue-600" />,
      title: "Pendaftaran hanya untuk satu sekolah",
      description: "Anda harus memilih salah satu, SMAN Modal Bangsa atau SMAN 10 Fajar Harapan"
    }
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    };

    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container className="max-w-6xl w-full">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Info */}
          <div className="hidden md:block text-center md:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Selamat Datang di PPDB Online
              </h1>
              <p className="text-lg text-gray-600">
                SMAN Modal Bangsa dan SMAN 10 Fajar Harapan membuka pendaftaran peserta didik baru tahun ajaran 2025/2026
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-start space-x-4 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="space-y-4 bg-blue-50 p-5 rounded-xl">
              <h3 className="font-medium text-blue-900">Periode Pendaftaran</h3>
                <div className="space-y-1">
                {ppdbSettings && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Jalur Prestasi</span>
                      <span className="text-blue-700 font-medium">
                        {formatDate(ppdbSettings.jalurPrestasi.start)} - {formatDate(ppdbSettings.jalurPrestasi.end)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Jalur Reguler</span>
                      <span className="text-blue-700 font-medium">
                        {formatDate(ppdbSettings.jalurReguler.start)} - {formatDate(ppdbSettings.jalurReguler.end)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Jalur Undangan</span>
                      <span className="text-blue-700 font-medium">
                        {formatDate(ppdbSettings.jalurUndangan.start)} - {formatDate(ppdbSettings.jalurUndangan.end)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-4 md:p-8 shadow-2xl bg-white/80 backdrop-blur-sm">
              {/* Header - Ukuran font lebih kecil di mobile */}
              <div className="text-center mb-4 md:mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                  {isFirstAdmin ? 'Setup Admin' : 'Daftar Akun PPDB'}
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  {isFirstAdmin 
                    ? 'Buat akun admin pertama untuk mengelola sistem'
                    : 'Lengkapi data berikut untuk membuat akun PPDB'}
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert 
                    type="error" 
                    message={error} 
                    className="mb-4 md:mb-6 text-xs md:text-sm"
                    onClose={() => setError('')}
                  />
                </motion.div>
              )}

              {/* Register Form - Spacing lebih kecil di mobile */}
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
                {!isFirstAdmin && (
                  <div className="relative">
                    <BuildingOfficeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                    <Select
                      label="Pilih Sekolah"
                      required
                      value={formData.school}
                      onChange={(e) => setFormData({...formData, school: e.target.value as 'mosa' | 'fajar'})}
                      options={[
                        { value: '', label: '-- Pilih Sekolah --', disabled: true },
                        { value: 'mosa', label: 'SMAN Modal Bangsa' },
                        { value: 'fajar', label: 'SMAN 10 Fajar Harapan' }
                      ]}
                      className="pl-8 md:pl-10"
                    />
                  </div>
                )}

                <div className="relative">
                  <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                  <Input
                    label="Nama Lengkap"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder={isFirstAdmin ? "Nama Admin" : "Nama Lengkap Siswa"}
                    className="pl-8 md:pl-10 text-sm md:text-base py-2 md:py-2.5"
                  />
                </div>

                {!isFirstAdmin && (
                  <div className="relative">
                    <IdentificationIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                    <Input
                      label={<span>NIK <span className="text-gray-500 text-xs">(-) jika tidak ada</span></span>}
                      type="text"
                      required
                      value={formData.nik}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '');
                        setFormData({...formData, nik: value});

                        // Reset validasi jika input kosong
                        if (!value) {
                          setError('');
                          setIsNIKValid(false);
                          return;
                        }

                        // Validasi untuk input "-"
                        if (value === '-') {
                          setError('');
                          setIsNIKValid(true);
                          return;
                        }

                        // Validasi panjang NIK
                        if (value.length !== 16) {
                          setError('NIK harus 16 digit');
                          setIsNIKValid(false);
                          return;
                        }

                        // Cek NIK di database
                        const { exists, userData } = await checkExistingNIK(value);
                        if (exists && userData) {
                          setError(`NIK terdaftar: ${userData.nik} - ${userData.fullName} - ${userData.school}`);
                          setIsNIKValid(false);
                        } else {
                          setError('');
                          setIsNIKValid(true);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9-]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={16}
                      placeholder="Masukkan NIK (16 digit)"
                      className={`pl-8 md:pl-10 text-sm md:text-base py-2 md:py-2.5 ${
                        formData.nik && formData.nik !== '-' && formData.nik.length !== 16 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : ''
                      }`}
                    />
                  </div>
                )}

                <div className="relative">
                  <EnvelopeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                  <Input
                    label={
                      <div className="flex items-center justify-between">
                        <span>Email</span>
                        <span className="text-xs text-yellow-600 font-medium">
                          *Pastikan email aktif
                        </span>
                      </div>
                    }
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Masukkan email aktif"
                    className="pl-8 md:pl-10 text-sm md:text-base py-2 md:py-2.5"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Informasi dan pengumuman akan dikirim ke email ini
                  </p>
                </div>

                <div className="relative">
                  <LockClosedIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Masukkan password"
                    className="pl-8 pr-10 md:pl-10 text-sm md:text-base py-2 md:py-2.5 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[2.1rem] text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <EyeIcon className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <KeyIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                  <Input
                    label="Konfirmasi Password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Konfirmasi password"
                    className="pl-8 pr-10 md:pl-10 text-sm md:text-base py-2 md:py-2.5 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[2.1rem] text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 md:h-5 md:w-5" />
                    ) : (
                      <EyeIcon className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                              hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 
                              py-2 md:py-3 rounded-lg transition-all duration-300 text-sm md:text-base"
                    disabled={loading || (!isFirstAdmin && !isNIKValid)}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 md:w-5 md:h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                        {isFirstAdmin ? 'Membuat Admin...' : 'Mendaftar...'}
                      </div>
                    ) : (
                      isFirstAdmin ? 'Buat Admin' : 'Daftar PPDB'
                    )}
                  </Button>

                  <div className="text-center space-y-2 md:space-y-4">
                    <p className="text-xs md:text-sm text-gray-500">
                      Sudah punya akun?{' '}
                      <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        Masuk di sini
                      </Link>
                    </p>

                    <p className="text-[10px] md:text-xs text-gray-500">
                      Dengan mendaftar, Anda menyetujui{' '}
                      <Link to="/info-ppdb" className="text-blue-600 hover:text-blue-700">
                        Syarat & Ketentuan PPDB SMAN Modal Bangsa
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </Container>

      {/* Modal PPDB Closed */}
      <Modal
        isOpen={showPPDBClosedModal}
        onClose={() => {
          setShowPPDBClosedModal(false);
          navigate('/'); // Redirect ke halaman utama saat modal ditutup
        }}
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PPDB Belum Dimulai
            </h3>
            <p className="text-sm text-gray-600">
              Mohon maaf, pendaftaran PPDB belum dibuka. Silakan cek kembali nanti.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => {
                setShowPPDBClosedModal(false);
                navigate('/'); // Redirect ke halaman utama
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Registrasi Berhasil!
          </h3>
          <div className="text-gray-600 space-y-4 mb-6">
            <p>
              Akun PPDB Anda telah berhasil dibuat.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg text-left">
              <p className="text-yellow-800 font-medium mb-2">Penting!</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Cek email Anda untuk informasi selanjutnya</li>
                <li>Pastikan cek folder Spam jika email tidak ada di Inbox</li>
                <li>Simpan email dan password untuk login kembali</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate('/ppdb/form')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lanjut ke Form PPDB
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage; 