import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const SocialIcon: React.FC<{ type: 'facebook' | 'instagram' | 'youtube' }> = ({ type }) => {
  const icons = {
    facebook: (
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/>
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    youtube: (
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  };

  return icons[type];
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* School Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <img 
                src="/src/assets/mosa.png" 
                alt="SMAN Modal Bangsa Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h3 className="text-white font-bold">SMAN Modal Bangsa</h3>
                <p className="text-sm text-gray-400">Unggul dalam Prestasi</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Sekolah unggulan dengan sistem pendidikan berasrama yang mengutamakan 
              pembentukan karakter dan prestasi akademik.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-white font-semibold">Link Cepat</h3>
            <ul className="space-y-2">
              {[
                { label: 'Beranda', path: '/' },
                { label: 'Info PPDB', path: '/info-ppdb' },
                { label: 'Pendaftaran', path: '/register' },
                { label: 'Kontak', path: '/contact' }
              ].map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-1"
                  >
                    <GlobeAltIcon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-white font-semibold">Kontak</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="tel:+628116700050" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"
                >
                  <PhoneIcon className="h-4 w-4" />
                  <span>+62 811-6700-050</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:info@modalbangsa.sch.id" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>info@modalbangsa.sch.id</span>
                </a>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <MapPinIcon className="h-4 w-4 mt-1 flex-shrink-0" />
                <span className="text-gray-400">
                  Jl. Bandara Sultan Iskandar Muda Km.12,5, 
                  Blang Bintang, Aceh Besar, Aceh 23374
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Social Media & Maps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-white font-semibold">Ikuti Kami</h3>
            <div className="flex space-x-4">
              {[
                { type: 'facebook' as const, url: 'https://facebook.com/smanmodalbangsa' },
                { type: 'instagram' as const, url: 'https://instagram.com/smanmodalbangsa' },
                { type: 'youtube' as const, url: 'https://youtube.com/@smanmodalbangsa' }
              ].map((social) => (
                <a
                  key={social.type}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                >
                  <SocialIcon type={social.type} />
                </a>
              ))}
            </div>
            <div className="mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.5647460255434!2d95.42163661476695!3d5.486910396023827!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30408aa0aa0a9441%3A0x6f5e0a9f7d3f55f9!2sSMAN%20Modal%20Bangsa!5e0!3m2!1sen!2sid!4v1647827937297!5m2!1sen!2sid"
                className="w-full h-32 rounded-lg"
                loading="lazy"
              ></iframe>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} SMAN Modal Bangsa. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 