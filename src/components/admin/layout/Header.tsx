import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase/config';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { ref, update, get } from 'firebase/database';
import { showAlert } from '../../ui/Alert';
import Sidebar from '../layout/Sidebar';
import classNames from 'classnames';
import { useAuth } from '../../../contexts/AuthContext';

type AdminData = {
  fullName: string;
  role: string;
  school: 'mosa' | 'fajar' | 'all';
  isMaster?: boolean;
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { userRole } = useAuth();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const adminRef = ref(db, `admins/${userId}`);
        const snapshot = await get(adminRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setAdminData({
            fullName: data.fullName,
            role: data.role,
            school: data.school,
            isMaster: data.isMaster
          });
          setNewName(data.fullName);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const day = days[date.getDay()];
    const dateNum = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const time = `${hours}:${minutes}:${seconds}`;

    return `${day}, ${dateNum} ${month} ${year} - ${time}`;
  };

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

      showAlert('success', 'Nama berhasil diperbarui');
      setShowProfileModal(false);
    } catch (error) {
      showAlert('error', 'Gagal memperbarui nama');
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-white border-b fixed top-0 right-0 left-0 z-40">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="hidden md:block">
          <span className="text-sm font-medium text-gray-900">
            {formatDateTime(currentTime)}
          </span>
        </div>

        <h1 className="md:hidden text-lg font-semibold text-gray-800">
          Admin Dashboard
        </h1>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={classNames(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-gray-100"
              )}
            >
              <UserCircleIcon className="w-5 h-5 text-gray-600" />
              <div className="hidden md:block text-left">
                <p className={classNames(
                  "text-sm font-medium text-gray-900"
                )}>
                  {adminData?.fullName || 'Admin'}
                </p>
                <p className={classNames(
                  "text-xs text-gray-500"
                )}>
                  {userRole?.isMaster 
                    ? 'Master Admin'
                    : `Admin ${userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}`
                  }
                </p>
              </div>
              <svg 
                className={classNames(
                  "w-4 h-4 text-gray-500 transition-transform",
                  showProfileMenu ? 'rotate-180' : ''
                )}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className={classNames(
                "absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50"
              )}>
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                  className={classNames(
                    "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50",
                    "flex items-center gap-2"
                  )}
                >
                  <UserCircleIcon className="w-4 h-4" />
                  Edit Profil
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setShowProfileMenu(false);
                  }}
                  className={classNames(
                    "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50",
                    "flex items-center gap-2"
                  )}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <Sidebar mobile onClose={() => setShowMobileMenu(false)} />
          </div>
        </div>
      )}

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

      {/* Modal Logout */}
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
    </header>
  );
};

export default Header; 