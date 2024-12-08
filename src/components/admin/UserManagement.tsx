import React, { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { showAlert } from '../ui/Alert';
import { KeyIcon, TrashIcon, UserPlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import classNames from 'classnames';

type Admin = {
  uid: string;
  fullName: string;
  email: string;
  createdAt: string;
  school: 'mosa' | 'fajar';
  isMaster?: boolean;
};

const UserManagement: React.FC = () => {
  const { userRole } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    isMaster: false
  });
  const [schoolFilter, setSchoolFilter] = useState<'all' | 'mosa' | 'fajar'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const adminsRef = ref(db, 'admins');
      const snapshot = await get(adminsRef);
      
      if (snapshot.exists()) {
        const adminsData = Object.entries(snapshot.val())
          .map(([uid, data]) => ({
            uid,
            ...(data as Omit<Admin, 'uid'>)
          }))
          .filter(admin => {
            if (userRole?.isMaster) {
              if (schoolFilter === 'all') return true;
              return admin.school === schoolFilter;
            }
            return admin.school === userRole?.school;
          });
        setAdmins(adminsData);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      showAlert('error', 'Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (formData.password !== formData.confirmPassword) {
      showAlert('error', 'Password tidak cocok');
      return;
    }

    try {
      const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            returnSecureToken: true
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gagal membuat admin');

      await set(ref(db, `admins/${data.localId}`), {
        fullName: formData.fullName,
        email: formData.email,
        createdAt: new Date().toISOString(),
        school: formData.school || userRole?.school,
        isMaster: userRole?.isMaster ? formData.isMaster : false,
        role: 'admin'
      });

      showAlert('success', 'Admin berhasil ditambahkan');
      setShowAddModal(false);
      setFormData({ 
        fullName: '', 
        email: '', 
        password: '', 
        confirmPassword: '', 
        school: '',
        isMaster: false 
      });
      loadAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      showAlert('error', 'Gagal menambahkan admin');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;

    try {
      const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email: selectedAdmin.email,
          }),
        }
      );

      if (!response.ok) throw new Error('Gagal mengirim email reset password');

      showAlert('success', 'Email reset password telah dikirim');
      setShowResetModal(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      showAlert('error', 'Gagal mengirim email reset password');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      await remove(ref(db, `admins/${selectedAdmin.uid}`));
      showAlert('success', 'Admin berhasil dihapus');
      loadAdmins();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting admin:', error);
      showAlert('error', 'Gagal menghapus admin');
    }
  };

  const renderAddAdminForm = () => (
    <div className="space-y-4">
      <Input
        label="Nama Lengkap"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        placeholder="Masukkan nama lengkap"
        required
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Masukkan email"
        required
      />
      
      {/* Pilih sekolah - selalu tampil untuk admin master */}
      {userRole?.isMaster && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sekolah <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.school}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Pilih Sekolah</option>
            <option value="mosa">SMAN Modal Bangsa</option>
            <option value="fajar">SMAN 10 Fajar Harapan</option>
          </select>
        </div>
      )}

      {/* Checkbox admin master - hanya untuk admin master */}
      {userRole?.isMaster && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isMaster"
            checked={formData.isMaster}
            onChange={(e) => setFormData({ ...formData, isMaster: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="isMaster" className="text-sm text-gray-700">
            Admin Master (dapat mengakses kedua sekolah)
          </label>
        </div>
      )}

      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Masukkan password"
        required
      />
      <Input
        label="Konfirmasi Password"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        placeholder="Konfirmasi password"
        required
      />
    </div>
  );

  const renderAdminTable = () => {
    const headers = [
      'Nama',
      'Email',
      'Sekolah',
      ...(userRole?.isMaster ? ['Tipe Admin'] : []),
      'Tanggal Dibuat',
      'Aksi'
    ];

    const getSchoolLabel = (school: string) => {
      switch (school) {
        case 'mosa':
          return 'SMAN Modal Bangsa';
        case 'fajar':
          return 'SMAN 10 Fajar Harapan';
        case 'all':
          return 'Semua Sekolah'; // Untuk admin master
        default:
          return school;
      }
    };

    const data = admins.map(admin => [
      admin.fullName,
      admin.email,
      getSchoolLabel(admin.school), // Gunakan fungsi helper untuk menampilkan nama sekolah
      ...(userRole?.isMaster ? [admin.isMaster ? 'Admin Master' : 'Admin Sekolah'] : []),
      new Date(admin.createdAt).toLocaleDateString('id-ID'),
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setSelectedAdmin(admin);
            setShowResetModal(true);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg"
          title="Reset Password"
        >
          <KeyIcon className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => {
            setSelectedAdmin(admin);
            setShowDeleteModal(true);
          }}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
          title="Hapus Admin"
        >
          <TrashIcon className="w-4 h-4" />
        </Button>
      </div>
    ]);

    return <Table headers={headers} data={data} />;
  };

  const isMobile = () => {
    return window.innerWidth <= 640;
  };

  const renderMobileRow = (admin: Admin) => (
    <div key={admin.uid} className="border-b last:border-b-0">
      <div 
        onClick={() => setExpandedRow(expandedRow === admin.uid ? null : admin.uid)}
        className={classNames(
          "flex items-center justify-between p-3 cursor-pointer",
          expandedRow === admin.uid ? "bg-gray-50" : "hover:bg-gray-50"
        )}
      >
        <div>
          <p className="font-medium text-gray-900 text-sm mb-1">{admin.fullName}</p>
          <p className="text-xs text-gray-500">{admin.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={classNames(
            "px-2 py-1 rounded-full text-xs font-medium",
            admin.isMaster 
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          )}>
            {admin.isMaster ? 'Admin Master' : 'Admin Sekolah'}
          </span>
          <ChevronDownIcon 
            className={classNames(
              "w-4 h-4 text-gray-400 transition-transform",
              expandedRow === admin.uid ? "transform rotate-180" : ""
            )}
          />
        </div>
      </div>

      {/* Dropdown Content */}
      {expandedRow === admin.uid && (
        <div className="px-3 pb-3 space-y-3 bg-gray-50">
          {/* Info List */}
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Sekolah</p>
              <p className="text-sm font-medium text-gray-900">
                {admin.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tanggal Dibuat</p>
              <p className="text-sm text-gray-900">
                {new Date(admin.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              onClick={() => {
                setSelectedAdmin(admin);
                setShowResetModal(true);
              }}
              className="flex items-center justify-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 py-2 rounded-lg text-xs transition-colors"
            >
              <KeyIcon className="w-4 h-4" />
              <span>Reset Password</span>
            </Button>
            
            <Button
              onClick={() => {
                setSelectedAdmin(admin);
                setShowDeleteModal(true);
              }}
              className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-xs transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Hapus</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userRole?.isMaster 
                  ? 'Manajemen Admin' 
                  : `Admin ${userRole?.school === 'mosa' ? 'SMAN Modal Bangsa' : 'SMAN 10 Fajar Harapan'}`}
              </h3>
              {userRole?.isMaster && (
                <p className="text-sm text-gray-600 mt-1">
                  Kelola admin untuk kedua sekolah
                </p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Filter Sekolah untuk Admin Master */}
              {userRole?.isMaster && (
                <div className="relative w-full md:w-auto">
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value as 'all' | 'mosa' | 'fajar')}
                    className="w-full px-3 py-2 border rounded-lg text-sm appearance-none bg-white pl-9 pr-8"
                  >
                    <option value="all">Semua Sekolah</option>
                    <option value="mosa">SMAN Modal Bangsa</option>
                    <option value="fajar">SMAN 10 Fajar Harapan</option>
                  </select>
                  {/* Icon untuk filter */}
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <div className="w-4 h-4 rounded-full bg-gray-200" />
                  </div>
                </div>
              )}

              {/* Tombol Tambah Admin yang diperbarui */}
              <Button
                onClick={() => setShowAddModal(true)}
                className={classNames(
                  "flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors",
                  "w-full md:w-auto"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500 rounded">
                    <UserPlusIcon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Tambah Admin Baru</span>
                </div>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden">
                {admins.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {admins.map(renderMobileRow)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada data admin</p>
                  </div>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                {renderAdminTable()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Tambah Admin */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size={isMobile() ? "full" : "md"}
      >
        <div className={`${isMobile() ? 'p-4' : 'p-6'}`}>
          <div className="text-center mb-4">
            <div className={`mx-auto ${isMobile() ? 'w-10 h-10' : 'w-12 h-12'} bg-blue-100 rounded-full flex items-center justify-center mb-3`}>
              <UserPlusIcon className={`${isMobile() ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
            </div>
            <h3 className={`${isMobile() ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
              Tambah Admin Baru
            </h3>
            <p className={`${isMobile() ? 'text-sm' : 'text-base'} text-gray-600 mt-1`}>
              Lengkapi data untuk membuat akun admin baru
            </p>
          </div>

          <div className="space-y-4">
            {renderAddAdminForm()}

            <div className={`flex ${isMobile() ? 'flex-col' : 'flex-row justify-end'} gap-3 pt-4`}>
              <Button
                onClick={() => setShowAddModal(false)}
                className={`${isMobile() ? 'w-full py-3' : ''} bg-gray-100 text-gray-700 hover:bg-gray-200`}
              >
                Batal
              </Button>
              <Button
                onClick={handleAddAdmin}
                className={`${isMobile() ? 'w-full py-3' : ''} bg-blue-600 text-white hover:bg-blue-700`}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        size={isMobile() ? "full" : "sm"}
      >
        <div className={`${isMobile() ? 'p-4' : 'p-6'}`}>
          <div className="text-center mb-6">
            <div className={`mx-auto ${isMobile() ? 'w-10 h-10' : 'w-12 h-12'} bg-yellow-100 rounded-full flex items-center justify-center mb-4`}>
              <KeyIcon className={`${isMobile() ? 'w-5 h-5' : 'w-6 h-6'} text-yellow-600`} />
            </div>
            <h3 className={`${isMobile() ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
              Reset Password Admin
            </h3>
            <p className={`${isMobile() ? 'text-sm' : 'text-base'} text-gray-600 mt-2`}>
              Apakah Anda yakin ingin mengirim email reset password ke{' '}
              <span className="font-medium">{selectedAdmin?.email}</span>?
            </p>
          </div>

          <div className={`flex ${isMobile() ? 'flex-col' : 'flex-row justify-end'} gap-3`}>
            <Button
              onClick={() => setShowResetModal(false)}
              className={`${isMobile() ? 'w-full py-3' : ''} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              className={`${isMobile() ? 'w-full py-3' : ''} bg-yellow-500 text-white hover:bg-yellow-600`}
            >
              Kirim Email Reset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size={isMobile() ? "full" : "sm"}
      >
        <div className={`${isMobile() ? 'p-4' : 'p-6'}`}>
          <div className="text-center mb-6">
            <div className={`mx-auto ${isMobile() ? 'w-10 h-10' : 'w-12 h-12'} bg-red-100 rounded-full flex items-center justify-center mb-4`}>
              <TrashIcon className={`${isMobile() ? 'w-5 h-5' : 'w-6 h-6'} text-red-600`} />
            </div>
            <h3 className={`${isMobile() ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
              Hapus Admin
            </h3>
            <p className={`${isMobile() ? 'text-sm' : 'text-base'} text-gray-600 mt-2`}>
              Apakah Anda yakin ingin menghapus admin{' '}
              <span className="font-medium">{selectedAdmin?.fullName}</span>?
              <br />
              <span className="text-sm text-red-500 mt-2 block">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>
          </div>

          <div className={`flex ${isMobile() ? 'flex-col' : 'flex-row justify-end'} gap-3`}>
            <Button
              onClick={() => setShowDeleteModal(false)}
              className={`${isMobile() ? 'w-full py-3' : ''} bg-gray-100 text-gray-700 hover:bg-gray-200`}
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteAdmin}
              className={`${isMobile() ? 'w-full py-3' : ''} bg-red-600 text-white hover:bg-red-700`}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement; 