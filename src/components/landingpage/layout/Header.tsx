import React, { useState, useEffect } from 'react';
import Navbar from '../../ui/Navbar';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/register', label: 'Pendaftaran' },
    { to: '/about', label: 'Tentang' },
    { to: '/contact', label: 'Kontak' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClasses = `
    fixed w-full top-0 z-50 transition-all duration-300
    ${(isScrolled || !isHome) ? 'bg-white shadow-md' : 'bg-transparent'}
  `;

  const logoTextClasses = `
    text-xl font-bold
    ${(isScrolled || !isHome) ? 'text-blue-600' : 'text-white'}
  `;

  const navClasses = `
    flex space-x-4
    ${(isScrolled || !isHome) ? 'text-gray-700' : 'text-white'}
  `;

  const mobileButtonClasses = `
    p-2 rounded-md
    ${(isScrolled || !isHome) ? 'text-gray-600 hover:bg-gray-100' : 'text-white hover:bg-white/10'}
  `;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/src/assets/mosa.png" 
              className="h-10 w-auto"
              alt="SMAN Modal Bangsa Logo"
            />
            <span className={logoTextClasses}>
              SMAN Modal Bangsa
            </span>
          </Link>
          
          <div className="hidden md:block">
            <Navbar 
              links={navLinks} 
              className={navClasses}
              isTransparent={!isScrolled && isHome}
            />
          </div>

          <div className="md:hidden">
            <button className={mobileButtonClasses}>
              <span className="sr-only">Open menu</span>
              {/* Add menu icon here */}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 