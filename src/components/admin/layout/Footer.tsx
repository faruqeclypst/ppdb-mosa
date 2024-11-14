import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="px-4 py-3">
        <div className="text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} SMAN Modal Bangsa - Admin Panel</p>
          <p className="text-xs mt-1">Version 1.0.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 