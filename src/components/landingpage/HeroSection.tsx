import React from 'react';
import Container from '../ui/Container';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

const HeroSection: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-blue-600 text-white relative">
      <div className="absolute inset-0 bg-black opacity-40"></div>
      
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/src/assets/hero-bg.jpg')",
          backgroundAttachment: "fixed"
        }}
      ></div>

      <Container className="relative z-10 pt-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Selamat Datang di SMAN Modal Bangsa
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-gray-100">
            Pendidikan berkualitas untuk masa depan yang gemilang.
          </p>
          <Link to="/register">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection; 