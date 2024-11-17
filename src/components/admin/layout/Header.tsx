import React, { useState, useEffect } from 'react';
import IconButton from '../../ui/IconButton';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase/config';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { ref, update, get } from 'firebase/database';
import { showAlert } from '../../ui/Alert';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const adminRef = ref(db, `admins/${userId}`);
        const snapshot = await get(adminRef);
        
        if (snapshot.exists()) {
          const adminData = snapshot.val();
          setAdminName(adminData.fullName);
          setNewName(adminData.fullName); // Set initial value for edit form
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      showAlert('error', 'Nama tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User tidak ditemukan');

      await update(ref(db, `admins/${userId}`), {
        fullName: newName,
        updatedAt: new Date().toISOString()
      });

      setAdminName(newName); // Update displayed name
      showAlert('success', 'Nama berhasil diperbarui');
      setShowProfileModal(false);
    } catch (error) {
      showAlert('error', 'Gagal memperbarui nama');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm fixed top-0 right-0 left-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Admin Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-700">
              {adminName}
            </div>
            <IconButton
              icon={<UserCircleIcon className="w-5 h-5" />}
              label="Profile"
              onClick={() => setShowProfileModal(true)}
              className="text-gray-600 hover:text-gray-800"
            />
            <IconButton
              icon={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
              label="Logout"
              onClick={() => setShowLogoutModal(true)}
              className="text-red-600 hover:text-red-700"
            />
          </div>
        </div>
      </header>

      {/* Modal Profile */}
      <Modal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        className="z-[70]"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Edit Profil
            </h3>
            <p className="text-sm text-gray-600">
              Perbarui nama profil Anda
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Nama Baru"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Masukkan nama baru"
            />

            <div className="flex gap-3">
              <Button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                onClick={handleUpdateName}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Logout */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)}
        className="z-[70]"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Konfirmasi Keluar
            </h3>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin keluar dari sistem?
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Keluar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Header; 