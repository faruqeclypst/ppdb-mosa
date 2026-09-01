import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase/config';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  Bars3Icon
} from '@heroicons/react/24/outline';
import Modal from '../../ui/Modal';
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

    return `${day}, ${dateNum} ${month} ${year} — ${time} WIB`;
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
    <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 fixed top-0 right-0 left-0 md:left-64 z-20 h-20 shadow-xs">
      <div className="h-20 px-4 md:px-8 flex items-center justify-between">
        {/* Left Side: Mobile Menu & Live Clock Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 -ml-2 rounded-xl text-zinc-600 hover:bg-zinc-100 md:hidden transition-colors"
            aria-label="Buka Menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-100/70 border border-zinc-200/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-zinc-700 font-mono tracking-tight">
              {formatDateTime(currentTime)}
            </span>
          </div>

          <div className="md:hidden">
            <h1 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
              SPMB ADMIN
            </h1>
          </div>
        </div>
        
        {/* Right Side: Admin Profile & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={classNames(
                "flex items-center gap-3 p-1.5 pr-3 rounded-2xl transition-all duration-200 border",
                showProfileMenu 
                  ? "bg-zinc-100 border-zinc-300 ring-2 ring-emerald-500/10" 
                  : "bg-zinc-50/70 hover:bg-zinc-100/80 border-zinc-200/80 hover:border-zinc-300"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {adminData?.fullName ? adminData.fullName.charAt(0).toUpperCase() : 'A'}
              </div>

              <div className="hidden md:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-extrabold text-zinc-900 tracking-tight leading-tight">
                    {adminData?.fullName || 'Administrator'}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                    userRole?.isMaster 
                      ? 'bg-amber-50 text-amber-900 border-amber-200' 
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}>
                    {userRole?.isMaster ? 'Master Admin' : 'Admin Kampus'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[120px]">
                    {userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : userRole?.school === 'fajar' ? 'SMAN 10 Fajar Harapan' : 'Pusat'}
                  </span>
                </div>
              </div>

              <svg 
                className={classNames(
                  "w-4 h-4 text-zinc-400 transition-transform duration-200 ml-1",
                  showProfileMenu ? 'rotate-180 text-zinc-800' : ''
                )}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2.5 border-b border-zinc-100 mb-1">
                  <p className="text-xs font-bold text-zinc-900">{adminData?.fullName || 'Administrator'}</p>
                  <p className="text-[10px] text-zinc-500 font-medium truncate">{auth.currentUser?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-xl flex items-center gap-2.5 transition-colors"
                >
                  <UserCircleIcon className="w-4 h-4 text-zinc-500" />
                  <span>Edit Profil Admin</span>
                </button>

                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors mt-1"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 text-rose-500" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />
          
          <div className="fixed inset-y-0 left-0 w-64 bg-[#0d1612] shadow-2xl z-10">
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
            <div className="mx-auto w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-3">
              <UserCircleIcon className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Edit Profil Administrator
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Perbarui nama tampilan akun administrator Anda
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-xs sm:text-sm outline-none font-medium"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateName}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all flex items-center gap-1.5"
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
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
            <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-3">
              <ArrowRightOnRectangleIcon className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">
              Konfirmasi Keluar
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Apakah Anda yakin ingin keluar dari sesi administrator ini?
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};

export default Header;