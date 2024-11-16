import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Container from '../ui/Container';
import { auth, db } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'ppdb' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  const navLinks = [
    { to: '/', label: 'Beranda' },
    { to: '/info-ppdb', label: 'Info PPDB' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminRef = ref(db, `admins/${user.uid}`);
        const ppdbRef = ref(db, `ppdb/${user.uid}`);
        
        const adminSnapshot = await get(adminRef);
        const ppdbSnapshot = await get(ppdbRef);

        if (adminSnapshot.exists()) {
          setUserRole('admin');
        } else if (ppdbSnapshot.exists()) {
          setUserRole('ppdb');
        }
      } else {
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDashboardClick = () => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'ppdb') {
      navigate('/ppdb/form');
    } else {
      navigate('/login');
    }
  };

  const isTransparent = isHomePage && !isScrolled;

  return (
    <header 
      className={`
        fixed w-full top-0 z-50 transition-all duration-300
        ${isTransparent 
          ? 'py-3' 
          : 'py-3 bg-white shadow-lg'}
      `}
    >
      <Container>
        <div className="relative">
          <nav className="flex items-center justify-between">
            {/* Brand Name */}
            <Link to="/">
              <span className={`
                font-bold text-lg transition-colors duration-300
                ${isTransparent ? 'text-white' : 'text-blue-600'}
              `}>
                SMAN Modal Bangsa
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              {/* Menu Links */}
              <div className="flex items-center mr-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      relative px-5 py-2 text-sm font-medium transition-colors duration-300
                      ${isTransparent 
                        ? 'text-white hover:text-white/80' 
                        : 'text-gray-600 hover:text-blue-600'}
                    `}
                  >
                    {link.label}
                    {location.pathname === link.to && (
                      <div 
                        className={`
                          absolute bottom-0 left-3 right-3 h-0.5 rounded-full
                          ${isTransparent ? 'bg-white' : 'bg-blue-600'}
                        `}
                      />
                    )}
                  </Link>
                ))}
              </div>

              {/* Auth Button */}
              <button
                onClick={handleDashboardClick}
                className={`
                  px-5 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-300
                  ${isTransparent 
                    ? 'bg-white text-gray-900 hover:bg-gray-100' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:opacity-90'}
                  shadow-lg
                `}
              >
                {userRole ? 'Dashboard' : 'Login'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`
                md:hidden p-2 rounded-lg transition-colors duration-300
                ${isTransparent 
                  ? 'text-white hover:bg-white/10' 
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </nav>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl" />
                <nav className="relative p-4">
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`
                          block px-4 py-3 text-sm font-medium rounded-xl
                          transition-colors duration-300
                          ${location.pathname === link.to
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'}
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 p-2">
                    <button
                      onClick={() => {
                        handleDashboardClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-center px-4 py-3 text-sm font-medium text-white 
                               bg-gradient-to-r from-blue-600 to-blue-700 
                               rounded-xl hover:opacity-90 transition-opacity duration-300"
                    >
                      {userRole ? 'Dashboard' : 'Login'}
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          )}
        </div>
      </Container>
    </header>
  );
};

export default Header; 