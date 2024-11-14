import React from 'react';
import IconButton from '../../ui/IconButton';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/config';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 right-0 left-0 z-50">
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
            icon={<UserCircleIcon className="w-5 h-5" />}
            label="Profile"
            onClick={() => {/* handle profile click */}}
            className="text-gray-600 hover:text-gray-800"
          />
          <IconButton
            icon={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
            label="Logout"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700"
          />
        </div>
      </div>
    </header>
  );
};

export default Header; 