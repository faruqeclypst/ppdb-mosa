import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, User, onAuthStateChanged } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { auth, db } from '../firebase/config';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  KeyIcon,
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

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  school: 'mosa' | 'fajar' | '';
  jalur: 'prestasi' | 'reguler' | 'undangan' | 'pjj' | '';
  nik: string;
  pjjSchool: string;
}

// Tambahkan interface untuk data pendaftar
interface PPDBUserData {
  fullName: string;
  nik: string;
  email: string;
  school?: string;
  status?: string;
  jalur?: string;
  pjjSchool?: string;
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
    jalur: '',
    nik: '',
    pjjSchool: ''
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
  const [isPasswordValid, setIsPasswordValid] = useState(true);

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
        try {
          const adminRef = ref(db, `admins/${user.uid}`);
          const ppdbMosaRef = ref(db, `ppdb_mosa/${user.uid}`);
          const ppdbFajarRef = ref(db, `ppdb_fajar/${user.uid}`);
          
          const [adminSnapshot, ppdbMosaSnapshot, ppdbFajarSnapshot] = await Promise.all([
            get(adminRef).catch(() => null),
            get(ppdbMosaRef).catch(() => null),
            get(ppdbFajarRef).catch(() => null)
          ]);

          if (adminSnapshot && adminSnapshot.exists()) {
            navigate('/admin');
          } else if ((ppdbMosaSnapshot && ppdbMosaSnapshot.exists()) || (ppdbFajarSnapshot && ppdbFajarSnapshot.exists())) {
            navigate('/ppdb/form');
          }
        } catch (err) {
          // Silent catch to prevent page crash
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

  const getActiveJalur = () => {
    if (!ppdbSettings) return [];
    const list = [];
    if (ppdbSettings.jalurPrestasi?.isActive) list.push({ value: 'prestasi', label: 'Prestasi' });
    if (ppdbSettings.jalurReguler?.isActive) list.push({ value: 'reguler', label: 'Reguler' });
    if (ppdbSettings.jalurUndangan?.isActive) list.push({ value: 'undangan', label: 'Undangan' });
    if (ppdbSettings.jalurPjj?.isActive) list.push({ value: 'pjj', label: 'Pendidikan Jarak Jauh (PJJ)' });
    return list;
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

    if (!formData.jalur && !isFirstAdmin) {
      setError('Silakan pilih jalur pendaftaran');
      setLoading(false);
      return;
    }

    if (formData.jalur === 'pjj' && !formData.pjjSchool && !isFirstAdmin) {
      setError('Silakan pilih sekolah PJJ');
      setLoading(false);
      return;
    }

    if (!isFirstAdmin) {
      const activeJalurs = getActiveJalur().map(j => j.value);
      if (formData.jalur && !activeJalurs.includes(formData.jalur)) {
        setError('Jalur pendaftaran yang dipilih sedang tidak aktif');
        setLoading(false);
        return;
      }
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

    if (formData.password.length < 6) {
      setError('Password tidak boleh kurang dari 6 digit');
      setLoading(false);
      return;
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
        jalur: formData.jalur,
        pjjSchool: formData.jalur === 'pjj' ? formData.pjjSchool : null,
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

  return (
    <div className="min-h-[100dvh] bg-[#f8faf9] relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Ambient decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[100px] opacity-75" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-100/30 blur-[100px] opacity-75" />
      </div>

      <Container className="max-w-xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="p-1.5 bg-gradient-to-tr from-zinc-200/30 to-zinc-200/5 rounded-3xl border border-zinc-200/40 shadow-xl shadow-emerald-950/[0.01] hover:shadow-2xl transition-all duration-500"
        >
          <div className="relative bg-white rounded-[calc(1.5rem-0.375rem)] border border-zinc-100 p-5 md:p-6 shadow-sm before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-emerald-700 before:via-amber-500 before:to-emerald-850 before:rounded-t-[calc(1.5rem-0.375rem)]">
            {/* Header */}
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex justify-center items-center mb-3"
              >
                <div className="p-1.5 bg-gradient-to-tr from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-inner">
                  <img
                    src="/images/mosa.png"
                    alt="Logo MOSA"
                    className="h-14 w-14 object-contain"
                  />
                </div>
              </motion.div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-0.5">
                {isFirstAdmin ? 'Setup Admin' : 'Daftar Akun SPMB'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isFirstAdmin 
                  ? 'Buat akun admin pertama untuk mengelola sistem'
                  : `Lengkapi data berikut untuk membuat akun SPMB TA ${ppdbSettings?.academicYear || '2026/2027'}`}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="rounded-xl p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-800 font-bold shrink-0 text-[10px]">!</div>
                  <div className="flex-1 font-medium">{error}</div>
                  <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-auto">&times;</button>
                </div>
              </motion.div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
              {!isFirstAdmin && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Pilih Jalur Pendaftaran
                  </label>
                  <div className="relative flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                    <select
                      required
                      value={formData.jalur}
                      onChange={(e) => {
                        const newJalur = e.target.value as any;
                        setFormData({
                          ...formData,
                          jalur: newJalur,
                          school: '',
                          pjjSchool: ''
                        });
                      }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 appearance-none font-sans"
                    >
                      <option value="" disabled>{!ppdbSettings ? 'Memuat Jalur...' : '-- Pilih Jalur --'}</option>
                      {getActiveJalur().map((j) => (
                        <option key={j.value} value={j.value}>{j.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 pointer-events-none text-zinc-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {!isFirstAdmin && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Pilih Sekolah
                  </label>
                  <div className="relative flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                    <select
                      required
                      disabled={!formData.jalur}
                      value={formData.jalur === 'pjj' ? (formData.pjjSchool || '') : (formData.school || '')}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (formData.jalur === 'pjj') {
                          setFormData({
                            ...formData,
                            school: 'mosa',
                            pjjSchool: selectedVal
                          });
                        } else {
                          setFormData({
                            ...formData,
                            school: selectedVal as 'mosa' | 'fajar',
                            pjjSchool: ''
                          });
                        }
                      }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 appearance-none font-sans disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
                    >
                      {!formData.jalur ? (
                        <option value="">-- Pilih Jalur Terlebih Dahulu --</option>
                      ) : (
                        <option value="" disabled>-- Pilih Sekolah --</option>
                      )}
                      
                      {formData.jalur === 'pjj' && (
                        <>
                          <option value="Kab. Lhokseumawe - SMAN 6 Lhokseumawe (Mitra)">Kab. Lhokseumawe - SMAN 6 Lhokseumawe (Mitra)</option>
                          <option value="Kab. Bireuen - SMAN 1 Simpang Mamplam (Mitra)">Kab. Bireuen - SMAN 1 Simpang Mamplam (Mitra)</option>
                          <option value="Kab. Aceh Singkil - SMAN 1 Gunung Meriah (Mitra)">Kab. Aceh Singkil - SMAN 1 Gunung Meriah (Mitra)</option>
                          <option value="Kab. Aceh Besar - SMAN 1 Seulimeum (Mitra)">Kab. Aceh Besar - SMAN 1 Seulimeum (Mitra)</option>
                          <option value="Kab. Aceh Besar - SMAN Modal Bangsa (Induk)">Kab. Aceh Besar - SMAN Modal Bangsa (Induk)</option>
                        </>
                      )}

                      {formData.jalur && formData.jalur !== 'pjj' && (
                        <>
                          <option value="mosa">SMAN Modal Bangsa</option>
                          <option value="fajar">SMAN 10 Fajar Harapan</option>
                        </>
                      )}
                    </select>
                    <div className="absolute right-3 pointer-events-none text-zinc-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder={isFirstAdmin ? "Nama Admin" : "Nama Lengkap Siswa"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {!isFirstAdmin && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    NIK <span className="text-zinc-400 font-normal">({`(-) jika tidak ada`})</span>
                  </label>
                  <div className="relative flex items-center">
                    <IdentificationIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                    <input
                      type="text"
                      required
                      value={formData.nik}
                      onChange={async (e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '');
                        setFormData({...formData, nik: value});

                        if (!value) {
                          setError('');
                          setIsNIKValid(false);
                          return;
                        }

                        if (value === '-') {
                          setError('');
                          setIsNIKValid(true);
                          return;
                        }

                        if (value.length !== 16) {
                          setError('NIK harus 16 digit');
                          setIsNIKValid(false);
                          return;
                        }

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
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans ${
                        formData.nik && formData.nik !== '-' && formData.nik.length !== 16 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' 
                          : ''
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Email
                  </label>
                  <span className="text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    *Pastikan email aktif
                  </span>
                </div>
                <div className="relative flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Masukkan email aktif"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans"
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  Informasi dan pengumuman akan dikirim ke email ini
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Password
                  </label>
                  <span className={`text-[9px] font-semibold ${formData.password.length > 0 && formData.password.length < 6 ? 'text-rose-600' : 'text-zinc-400'}`}>
                    {formData.password.length > 0 && formData.password.length < 6 ? 'Minimal 6 karakter' : ''}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({...formData, password: value});
                      setIsPasswordValid(value.length >= 6 || value.length === 0);
                      if (value.length >= 6 || value.length === 0) {
                        setError('');
                      }
                    }}
                    placeholder="Masukkan password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                      formData.password.length > 0 && formData.password.length < 6 ? 'border-rose-450 focus:border-rose-500 focus:ring-rose-500/10' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Konfirmasi Password
                </label>
                <div className="relative flex items-center">
                  <KeyIcon className="h-5 w-5 text-zinc-400 absolute left-3 pointer-events-none z-10" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Konfirmasi password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 pt-3 space-y-3.5">
                <Button 
                  type="submit"
                  className="w-full bg-emerald-800 text-white hover:bg-emerald-900 active:scale-[0.98] py-2.5 rounded-xl transition-all duration-300 font-semibold shadow-md shadow-emerald-800/10 border-0 flex items-center justify-center text-sm"
                  disabled={loading || (!isFirstAdmin && !isNIKValid) || !isPasswordValid}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                      {isFirstAdmin ? 'Membuat Admin...' : 'Mendaftar...'}
                    </div>
                  ) : (
                    isFirstAdmin ? 'Buat Admin' : 'Daftar SPMB'
                  )}
                </Button>

                <div className="text-center space-y-3">
                  <p className="text-sm text-zinc-500">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-900 transition-colors underline decoration-emerald-600/30 underline-offset-4">
                      Masuk di sini
                    </Link>
                  </p>

                  <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    Dengan mendaftar, Anda menyetujui{' '}
                    <Link to="/info-spmb" className="font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2">
                      Syarat & Ketentuan SPMB Online SMAN Modal Bangsa
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </Container>

        
        {/* Modal PPDB Closed */}
      <Modal
        isOpen={showPPDBClosedModal}
        onClose={() => {
          setShowPPDBClosedModal(false);
          navigate('/');
        }}
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-4">
            <XMarkIcon className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            SPMB Belum Dimulai
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Mohon maaf, pendaftaran SPMB belum dibuka. Silakan cek kembali nanti atau hubungi panitia.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setShowPPDBClosedModal(false);
                navigate('/');
              }}
              className="bg-emerald-800 text-white hover:bg-emerald-900 border-0 rounded-xl py-3 px-6 font-semibold transition-all duration-300"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Registrasi Berhasil */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Registrasi Berhasil!
          </h3>
          <div className="text-zinc-500 text-sm space-y-4 mb-6">
            <p>
              Akun SPMB Anda telah berhasil dibuat. Silakan lanjut ke pengisian form pendaftaran.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/ppdb/form')}
              className="bg-emerald-800 text-white hover:bg-emerald-900 border-0 rounded-xl py-3 px-6 font-semibold transition-all duration-300 shadow-md shadow-emerald-800/10"
            >
              Lanjut ke Form SPMB
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage; 