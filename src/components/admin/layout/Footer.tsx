import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t h-12 flex items-center">
      <div className="w-full px-4">
        <div className="text-center text-sm text-gray-600">
          <p className="text-xs md:text-sm">&copy; {new Date().getFullYear()} SMAN Modal Bangsa - Admin Panel</p>
          <p className="text-xs mt-1 hidden md:block">Version 1.0.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 