import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ref, get } from 'firebase/database';
import Modal from '../components/ui/Modal';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const adminRef = ref(db, `admins/${userCredential.user.uid}`);
      const ppdbMosaRef = ref(db, `ppdb_mosa/${userCredential.user.uid}`);
      const ppdbFajarRef = ref(db, `ppdb_fajar/${userCredential.user.uid}`);

      const [adminSnapshot, ppdbMosaSnapshot, ppdbFajarSnapshot] = await Promise.all([
        get(adminRef),
        get(ppdbMosaRef),
        get(ppdbFajarRef)
      ]);

      if (adminSnapshot.exists()) {
        navigate('/admin');
      } else if (ppdbMosaSnapshot.exists() || ppdbFajarSnapshot.exists()) {
        navigate('/ppdb/form');
      } else {
        setError('Akun tidak terdaftar di sistem SPMB');
        await signOut(auth);
      }
    } catch (err: any) {
      setError('Email atau kata sandi yang Anda masukkan salah');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Masukkan alamat email untuk pemulihan kata sandi');
      return;
    }

    setResetLoading(true);
    try {
      const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email: resetEmail,
          }),
        }
      );

      if (!response.ok) throw new Error('Gagal mengirim email reset password');

      setSuccessMessage('Tautan pemulihan kata sandi telah dikirim ke email Anda');
      setShowForgotModal(false);
      setResetEmail('');
    } catch (error) {
      setError('Gagal mengirim tautan reset kata sandi');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0c1411] text-zinc-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Cinematic Ambient Glows */}
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
        className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 rounded-[2.25rem] p-1.5 sm:p-2 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden"
      >
        {/* ================= LEFT HERO PANEL ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#12281f] via-[#0e1f18] to-[#0a1611] rounded-[calc(2.25rem-0.5rem)] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-emerald-500/20 shadow-inner">
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Content */}
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
                  PORTAL MASUK SPMB
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
                <span>Sistem Pendaftaran Terpadu</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Selamat Datang di Portal SPMB Online.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300/80 leading-relaxed">
                Akses dashboard formulir pendaftaran, unggah berkas, dan pantau pengumuman kelulusan secara real-time.
              </p>
            </div>

            {/* Benefit Items */}
            <div className="space-y-2.5">
              {[
                { title: 'Layanan Pengisian Formulir Fleksibel', desc: 'Simpan draf dan lanjutkan pengisian kapan saja', icon: ShieldCheckIcon },
                { title: 'Cetak Kartu Ujian & Bukti Pendaftaran', desc: 'Unduh kartu ujian ber-barcode resmi secara mandiri', icon: AcademicCapIcon }
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

          {/* Bottom Dual Register Portal Links */}
          <div className="mt-8 relative z-10 space-y-2">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Belum Memiliki Akun?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/register"
                className="p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-emerald-400">JALUR REGULER</span>
                  <ArrowRightIcon className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-bold text-white">Daftar Reguler</p>
              </Link>

              <Link
                to="/register-pjj"
                className="p-3 rounded-2xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-400">PROGRAM PJJ</span>
                  <ArrowRightIcon className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-bold text-white">Daftar PJJ</p>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="lg:col-span-7 bg-[#ffffff] text-zinc-900 rounded-[calc(2.25rem-0.5rem)] p-6 sm:p-8 md:p-10 flex flex-col justify-between relative">
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                Masuk ke Akun
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Gunakan email dan kata sandi yang telah didaftarkan sebelumnya
              </p>
            </div>

            {/* Error Notification */}
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

            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-sm"
                >
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 font-medium pt-0.5">{successMessage}</div>
                  <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 font-bold text-base">&times;</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <EnvelopeIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan alamat email Anda"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <LockClosedIcon className="h-4 w-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none font-medium"
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

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#0e2c20] hover:from-emerald-800 hover:to-[#081e15] text-white font-bold text-sm tracking-wide shadow-xl shadow-emerald-900/20 active:scale-[0.99] transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                    )}
                    <span>Masuk ke Akun SPMB</span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all group-hover:translate-x-1">
                    <ArrowRightIcon className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Registration Selector */}
          <div className="pt-6 mt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span>Belum terdaftar?</span>
              <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-900 underline">
                Daftar Reguler
              </Link>
              <span>atau</span>
              <Link to="/register-pjj" className="font-bold text-amber-700 hover:text-amber-900 underline">
                Daftar PJJ
              </Link>
            </div>

            <Link to="/" className="text-zinc-400 hover:text-zinc-600 transition-colors">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Modal Lupa Password */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => {
          setShowForgotModal(false);
          setResetEmail('');
        }}
      >
        <div className="p-6 text-zinc-900">
          <h3 className="text-lg font-bold text-zinc-900 mb-2">
            Reset Kata Sandi
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mb-5">
            Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Alamat Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="nama.siswa@gmail.com"
                required
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-sm outline-none font-medium"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-xl font-semibold text-xs transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {resetLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  'Kirim Tautan'
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;