import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, User, onAuthStateChanged } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { auth, db } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  KeyIcon,
  XMarkIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  TrophyIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ChevronRightIcon
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
  jalur: 'prestasi' | 'reguler' | 'undangan' | '';
  nik: string;
}

interface PPDBUserData {
  fullName: string;
  nik: string;
  email: string;
  school?: string;
  status?: string;
  jalur?: string;
}

const JALUR_INFO = [
  {
    id: 'prestasi',
    name: 'Prestasi',
    badge: 'Akademik & Non-Akademik',
    desc: 'Bagi siswa berprestasi olimpiade, seni, atau olahraga',
    icon: TrophyIcon,
    accent: 'emerald'
  },
  {
    id: 'reguler',
    name: 'Reguler',
    badge: 'Tes Berbasis Komputer',
    desc: 'Jalur seleksi umum berbasis rapor & ujian CBT',
    icon: AcademicCapIcon,
    accent: 'blue'
  },
  {
    id: 'undangan',
    name: 'Undangan',
    badge: 'Rekomendasi Sekolah',
    desc: 'Khusus bagi siswa terpilih rekomendasi sekolah asal',
    icon: SparklesIcon,
    accent: 'purple'
  }
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: 'mosa',
    jalur: 'reguler',
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
  const [isPasswordValid, setIsPasswordValid] = useState(true);

  // Auto-detect preselected jalur from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryJalur = params.get('jalur');
    if (queryJalur && ['prestasi', 'reguler', 'undangan'].includes(queryJalur)) {
      setFormData(prev => ({ ...prev, jalur: queryJalur as any }));
    }
  }, [location.search]);

  useEffect(() => {
    const checkFirstAdmin = async () => {
      try {
        const adminRef = ref(db, 'admins');
        const snapshot = await get(adminRef);
        setIsFirstAdmin(!snapshot.exists());
      } catch (error) {
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
          const settings = snapshot.val();
          setPPDBSettings(settings);

          // Auto-select first active track if current isn't active
          if (settings.jalurPrestasi?.isActive) {
            setFormData(prev => prev.jalur ? prev : ({ ...prev, jalur: 'prestasi' }));
          } else if (settings.jalurReguler?.isActive) {
            setFormData(prev => prev.jalur ? prev : ({ ...prev, jalur: 'reguler' }));
          } else if (settings.jalurUndangan?.isActive) {
            setFormData(prev => prev.jalur ? prev : ({ ...prev, jalur: 'undangan' }));
          }
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
          // Silent catch
        }
      };

      checkUserRole();
    }
  }, [user, navigate]);

  const checkExistingNIK = async (nik: string): Promise<{exists: boolean, userData?: {fullName: string, nik: string, school?: string}}> => {
    try {
      if (nik === '-') return { exists: false };

      const mosaRef = ref(db, 'ppdb_mosa');
      const mosaQuery = query(mosaRef, orderByChild('nik'), equalTo(nik));
      let mosaSnapshot;
      try {
        mosaSnapshot = await get(mosaQuery);
      } catch (error) {
        mosaSnapshot = null;
      }

      const fajarRef = ref(db, 'ppdb_fajar');
      const fajarQuery = query(fajarRef, orderByChild('nik'), equalTo(nik));
      let fajarSnapshot;
      try {
        fajarSnapshot = await get(fajarQuery);
      } catch (error) {
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
      return { exists: false };
    }
  };

  const isJalurActive = (jalur: string) => {
    if (!ppdbSettings) return true;
    if (jalur === 'prestasi') return ppdbSettings.jalurPrestasi?.isActive;
    if (jalur === 'reguler') return ppdbSettings.jalurReguler?.isActive;
    if (jalur === 'undangan') return ppdbSettings.jalurUndangan?.isActive;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!formData.school && !isFirstAdmin) {
      setError('Silakan pilih sekolah pilihan Anda');
      setLoading(false);
      return;
    }

    if (!formData.jalur && !isFirstAdmin) {
      setError('Silakan pilih jalur pendaftaran');
      setLoading(false);
      return;
    }

    if (!isFirstAdmin && !isJalurActive(formData.jalur)) {
      setError('Jalur pendaftaran yang dipilih sedang tidak aktif');
      setLoading(false);
      return;
    }

    if (!isFirstAdmin) {
      if (!formData.nik) {
        setError('NIK wajib diisi');
        setLoading(false);
        return;
      }
      
      if (formData.nik !== '-') {
        if (formData.nik.length !== 16) {
          setError('NIK harus 16 digit');
          setLoading(false);
          return;
        }

        if (!/^\d{16}$/.test(formData.nik)) {
          setError('NIK hanya boleh berisi angka');
          setLoading(false);
          return;
        }

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
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok');
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
        setError('Email sudah digunakan. Silakan gunakan email lain atau masuk.');
      } else {
        setError('Gagal membuat akun. Silakan periksa koneksi internet Anda.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0c1411] text-zinc-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[25%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-600/15 blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-full bg-amber-500/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(#152e24_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Main Dual-Panel Architecture */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 rounded-[2.25rem] p-1.5 sm:p-2 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden"
      >
        {/* ================= LEFT HERO PANEL ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#12281f] via-[#0e1f18] to-[#0a1611] rounded-[calc(2.25rem-0.5rem)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-emerald-500/20 shadow-inner">
          {/* Subtle Ambient Radial inside Left Panel */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Branding Section */}
          <div className="relative z-10">
            {/* Header Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-md">
                <img
                  src="/images/mosa.png"
                  alt="Logo SMAN Modal Bangsa"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400 block">
                  SPMB ONLINE {ppdbSettings?.academicYear || '2026/2027'}
                </span>
                <h1 className="text-base font-bold text-white tracking-tight">
                  SMAN Modal Bangsa
                </h1>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Pendaftaran Jalur Utama</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Mulai Masa Depan Gemilang di Sekolah Para Juara.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300/80 leading-relaxed">
                Penerimaan Peserta Didik Baru jalur Prestasi, Reguler, dan Undangan untuk SMAN Modal Bangsa & SMAN 10 Fajar Harapan.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-2.5">
              {[
                { title: 'Seleksi Prestasi & CBT Terintegrasi', desc: 'Sistem seleksi digital transparan dan akuntabel', icon: ShieldCheckIcon },
                { title: 'Akreditasi A & Fasilitas Asrama Unggulan', desc: 'Lingkungan pendidikan holistik berstandar nasional', icon: BuildingOffice2Icon },
                { title: 'Peluang Beasiswa Perguruan Tinggi', desc: 'Jalur prioritas menuju universitas terbaik dalam & luar negeri', icon: AcademicCapIcon }
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-100">{feat.title}</h4>
                    <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Switcher Card to PJJ */}
          <div className="mt-8 relative z-10">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-emerald-500/10 border border-amber-500/30 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Jalur Khusus
                  </span>
                  <p className="text-xs font-bold text-white">
                    Program PJJ (Pendidikan Jarak Jauh)?
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Bagi calon siswa 5 Sekolah Mitra Binaan MOSA
                  </p>
                </div>
                <Link
                  to="/register-pjj"
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md shadow-amber-500/20"
                >
                  <span>Daftar PJJ</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="lg:col-span-7 bg-[#ffffff] text-zinc-900 rounded-[calc(2.25rem-0.5rem)] p-6 sm:p-8 md:p-10 flex flex-col justify-between relative">
          <div>
            {/* Top Navigation Tabs Switcher */}
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Jalur Reguler / Utama</span>
                </div>
              </div>

              <Link
                to="/register-pjj"
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
              >
                <span>Beralih ke Form PJJ</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                {isFirstAdmin ? 'Setup Akun Administrator' : 'Buat Akun Pendaftaran'}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {isFirstAdmin 
                  ? 'Konfigurasi akun master administrator untuk mengelola SPMB'
                  : 'Lengkapi formulir registrasi untuk mendapatkan akses formulir pendaftaran'}
              </p>
            </div>

            {/* Error Notification Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-200/80 text-rose-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    !
                  </span>
                  <div className="flex-1 font-medium pt-0.5">{error}</div>
                  <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold text-base">&times;</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isFirstAdmin && (
                <>
                  {/* 1. Interactive Jalur Selector Tiles */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Pilih Jalur Pendaftaran <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {JALUR_INFO.map((j) => {
                        const active = isJalurActive(j.id);
                        const isSelected = formData.jalur === j.id;

                        return (
                          <button
                            key={j.id}
                            type="button"
                            disabled={!active}
                            onClick={() => setFormData({ ...formData, jalur: j.id as any })}
                            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                              !active 
                                ? 'opacity-40 bg-zinc-50 border-zinc-200 cursor-not-allowed'
                                : isSelected
                                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                  <j.icon className="w-4 h-4" />
                                </div>
                                {isSelected && (
                                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-zinc-900">{j.name}</h4>
                              <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">{j.desc}</p>
                            </div>
                            <span className="inline-block mt-2 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 w-max">
                              {j.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. School Choice Segmented Cards */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Pilihan Sekolah Tujuan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'mosa', name: 'SMAN Modal Bangsa', label: 'Kampus Aceh Besar' },
                        { id: 'fajar', name: 'SMAN 10 Fajar Harapan', label: 'Kampus Banda Aceh' }
                      ].map((sch) => {
                        const isSelected = formData.school === sch.id;
                        return (
                          <button
                            key={sch.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, school: sch.id as any })}
                            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'
                              }`}>
                                <BuildingOffice2Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-zinc-900">{sch.name}</h4>
                                <p className="text-[11px] text-zinc-500">{sch.label}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* 3. Applicant Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Sesuai ijazah atau akta kelahiran"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
                    />
                  </div>
                </div>

                {/* NIK */}
                {!isFirstAdmin && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <IdentificationIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={formData.nik}
                        onChange={async (e) => {
                          const value = e.target.value.replace(/[^0-9-]/g, '');
                          setFormData({ ...formData, nik: value });

                          if (!value || value === '-') {
                            setIsNIKValid(value === '-');
                            setError('');
                            return;
                          }

                          if (value.length === 16) {
                            const { exists, userData } = await checkExistingNIK(value);
                            if (exists && userData) {
                              setError(`NIK sudah terdaftar: ${userData.fullName} (${userData.school})`);
                              setIsNIKValid(false);
                            } else {
                              setError('');
                              setIsNIKValid(true);
                            }
                          } else {
                            setIsNIKValid(false);
                          }
                        }}
                        placeholder="16 digit NIK calon siswa"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:ring-4 transition-all outline-none font-medium ${
                          formData.nik && formData.nik.length === 16 && isNIKValid
                            ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-500/10'
                            : formData.nik && formData.nik.length !== 16
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                            : 'border-zinc-200 focus:border-emerald-600 focus:ring-emerald-500/10'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Alamat Email Aktif <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                      Digunakan untuk login & pengumuman
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contoh: nama.siswa@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <LockClosedIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, password: val });
                        setIsPasswordValid(val.length >= 6 || val.length === 0);
                      }}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Konfirmasi Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <KeyIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading || (!isFirstAdmin && !isNIKValid) || !isPasswordValid}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#0e2c20] hover:from-emerald-800 hover:to-[#081e15] text-white font-bold text-sm tracking-wide shadow-xl shadow-emerald-900/20 active:scale-[0.99] transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                    )}
                    <span>{isFirstAdmin ? 'Selesaikan Setup Administrator' : 'Buat Akun & Masuk Formulir'}</span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all group-hover:translate-x-1">
                    <ArrowRightIcon className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Footer Terms & Login Link */}
          <div className="pt-6 mt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <p>
              Sudah memiliki akun SPMB?{' '}
              <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2">
                Masuk di sini
              </Link>
            </p>

            <a 
              href="https://sman-modalbangsa.sch.id/id/spmb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Syarat & Ketentuan SPMB
            </a>
          </div>
        </div>
      </motion.div>

      {/* Modal SPMB Tutup */}
      <Modal
        isOpen={showPPDBClosedModal}
        onClose={() => {
          setShowPPDBClosedModal(false);
          navigate('/');
        }}
      >
        <div className="p-6 text-center text-zinc-900">
          <div className="mx-auto w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-4">
            <XMarkIcon className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Pendaftaran SPMB Belum Dibuka
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Mohon maaf, pendaftaran SPMB saat ini belum aktif. Silakan pantau pengumuman jadwal pada portal resmi.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowPPDBClosedModal(false);
                navigate('/');
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-900 transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Registrasi Berhasil */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
      >
        <div className="p-6 text-center text-zinc-900">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Akun Berhasil Didaftarkan!
          </h3>
          <p className="text-zinc-500 text-sm mb-6">
            Akun SPMB Anda telah aktif. Silakan lanjutkan untuk melengkapi biodata dan berkas persyaratan.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/ppdb/form')}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-sm shadow-md transition-all"
            >
              Lanjut ke Formulir SPMB
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage;