import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import Container from '../components/ui/Container';
import { Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Daftar Akun
            </h2>
            <p className="mt-2 text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500">
                Masuk di sini
              </Link>
            </p>
          </div>
          <RegisterForm />
        </div>
      </Container>
    </div>
  );
};

export default RegisterPage; 