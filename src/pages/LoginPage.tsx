import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Container from '../components/ui/Container';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Cek role user
      const adminRef = ref(db, `admins/${userCredential.user.uid}`);
      const ppdbRef = ref(db, `ppdb/${userCredential.user.uid}`);
      
      const adminSnapshot = await get(adminRef);
      const ppdbSnapshot = await get(ppdbRef);

      if (adminSnapshot.exists()) {
        // Jika user adalah admin
        navigate('/admin');
      } else if (ppdbSnapshot.exists()) {
        // Jika user adalah pendaftar PPDB
        navigate('/ppdb/form');
      } else {
        // Jika user tidak memiliki role
        setError('Akun tidak valid');
        await signOut(auth);
      }
    } catch (err: any) {
      setError('Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Container>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <Card className="p-8 shadow-2xl bg-white/80 backdrop-blur-sm">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    src="/src/assets/mosa.png"
                    alt="Logo"
                    className="h-20 mx-auto mb-4"
                  />
                </motion.div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                  Masuk ke Akun
                </h2>
                <p className="text-sm text-gray-600">
                  Atau{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    daftar akun baru
                  </Link>
                </p>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert type="error" message={error} className="mb-6" />
                </motion.div>
              )}
              
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
                  <div className="text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Lupa password?
                    </Link>
                  </div>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 py-3 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5"
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
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage; 