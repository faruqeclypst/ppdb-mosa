import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
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
        const ppdbMosaRef = ref(db, `ppdb_mosa/${user.uid}`);
        const ppdbFajarRef = ref(db, `ppdb_fajar/${user.uid}`);
        
        const [adminSnapshot, ppdbMosaSnapshot, ppdbFajarSnapshot] = await Promise.all([
          get(adminRef),
          get(ppdbMosaRef),
          get(ppdbFajarRef)
        ]);

        if (adminSnapshot.exists()) {
          navigate('/admin');
        } else if (ppdbMosaSnapshot.exists() || ppdbFajarSnapshot.exists()) {
          navigate('/ppdb/form');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="fixed top-4 left-4 md:top-8 md:left-8 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border transition-colors"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
        <span className="font-medium">Kembali ke Beranda</span>
      </Link>
 
      <Container className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 shadow-2xl bg-white/80 backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src="images/mosa.png"
                  alt="Logo"
                  className="h-20 mx-auto mb-4"
                />
              </motion.div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Masuk ke Akun
              </h2>
              <p className="text-sm text-gray-600">
                Atau{' '}
                <Link 
                  to="/register" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
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
              >
                <Alert 
                  type="error" 
                  message={error} 
                  className="mb-6"
                  onClose={() => setError('')} 
                />
              </motion.div>
            )}
 
            {/* Success Alert */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert 
                  type="success" 
                  message={successMessage} 
                  className="mb-6"
                  onClose={() => setSuccessMessage('')}
                />
              </motion.div>
            )}
 
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Masukkan email"
                  className="pl-10"
                />
              </div>
 
              <div className="relative">
                <LockClosedIcon className="h-5 w-5 text-gray-400 absolute top-[2.1rem] left-3" />
                <Input
                  label="Password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Masukkan password"
                  className="pl-10"
                />
              </div>
 
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Lupa password?
                </button>
              </div>
 
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                          hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 
                          py-3 rounded-lg transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                    Masuk...
                  </div>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </Card>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Masukkan email Anda untuk menerima link reset password
            </p>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                required
              />
 
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleResetPassword}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
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