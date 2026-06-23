import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ref, get } from 'firebase/database';
import Modal from '../components/ui/Modal';
import { onAuthStateChanged } from 'firebase/auth';
 
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
          // Silent catch to prevent page crash
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
 
      // Cek role user
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
        setError('Akun tidak valid');
        await signOut(auth);
      }
    } catch (err: any) {
      setError('Email atau password salah');
    } finally {
      setLoading(false);
    }
  };
 
  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Masukkan email');
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
 
      setSuccessMessage('Link reset password telah dikirim ke email Anda');
      setShowForgotModal(false);
      setResetEmail('');
    } catch (error) {
      setError('Gagal mengirim email reset password');
    } finally {
      setResetLoading(false);
    }
  };
 
  return (
    <div className="min-h-[100dvh] bg-[#f8faf9] relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Ambient decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[100px] opacity-75" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-100/30 blur-[100px] opacity-75" />
      </div>

      

      <Container className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl border border-zinc-200/80 p-8 shadow-xl shadow-emerald-950/[0.02] hover:shadow-2xl transition-all duration-500 before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-emerald-700 before:via-amber-500 before:to-emerald-850 before:rounded-t-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex justify-center items-center mb-4"
              >
                <div className="p-2 bg-gradient-to-tr from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-inner">
                  <img
                    src="/images/mosa.png"
                    alt="Logo MOSA"
                    className="h-16 w-16 object-contain"
                  />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">
                Masuk ke Akun
              </h2>
              <p className="text-sm text-zinc-500">
                Atau{' '}
                <Link 
                  to="/register" 
                  className="font-semibold text-emerald-700 hover:text-emerald-900 transition-colors underline decoration-emerald-600/30 underline-offset-4 hover:decoration-emerald-900"
                >
                  daftar akun baru
                </Link>
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="rounded-xl p-4 bg-rose-50 border border-rose-100 text-rose-800 text-sm flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-800 font-bold shrink-0">!</div>
                  <div className="flex-1 font-medium">{error}</div>
                  <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-auto">&times;</button>
                </div>
              </motion.div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold shrink-0">✓</div>
                  <div className="flex-1 font-medium">{successMessage}</div>
                  <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 font-bold ml-auto">&times;</button>
                </div>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
                  Email
                </label>
                <div className="relative flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-zinc-400 absolute left-3.5 pointer-events-none z-10" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Masukkan email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-zinc-400 absolute left-3.5 pointer-events-none z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Masukkan password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white/50 backdrop-blur-sm transition-all duration-300 text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-800 text-white hover:bg-emerald-900 active:scale-[0.98] py-3 rounded-xl transition-all duration-300 font-semibold shadow-md shadow-emerald-800/10 border-0 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                      Memverifikasi...
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </div>
            </form>
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
          <div className="p-6">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              Reset Password
            </h3>
            <p className="text-sm text-zinc-500 mb-5">
              Masukkan email Anda untuk menerima tautan pemulihan kata sandi.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  required
                  className="w-full py-3 px-4 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-emerald-600/10 focus:ring-4 bg-white transition-all duration-300 text-zinc-800 placeholder-zinc-400 focus:outline-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-0 rounded-xl py-3 font-semibold transition-all duration-300"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleResetPassword}
                  className="flex-1 bg-emerald-800 text-white hover:bg-emerald-900 border-0 rounded-xl py-3 font-semibold transition-all duration-300 shadow-md shadow-emerald-800/10"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                      Mengirim...
                    </div>
                  ) : (
                    'Kirim Link Reset'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
};
 
export default LoginPage; 