import React from 'react';
import IconButton from '../../ui/IconButton';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Admin
          </div>
          <IconButton
            icon={<span>👤</span>}
            label="Profile"
            onClick={() => {/* handle profile click */}}
          />
          <IconButton
            icon={<span>🚪</span>}
            label="Logout"
            onClick={() => {/* handle logout */}}
            className="text-red-600 hover:text-red-700"
          />
        </div>
      </div>
    </header>
  );
};

export default Header; 