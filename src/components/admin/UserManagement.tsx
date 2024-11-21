import React, { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { showAlert } from '../ui/Alert';
import { KeyIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';

type Admin = {
  uid: string;
  fullName: string;
  email: string;
  createdAt: string;
};

const UserManagement: React.FC = () => {
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
    confirmPassword: ''
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const adminsRef = ref(db, 'admins');
      const snapshot = await get(adminsRef);
      
      if (snapshot.exists()) {
        const adminsData = Object.entries(snapshot.val()).map(([uid, data]) => ({
          uid,
          ...(data as Omit<Admin, 'uid'>)
        }));
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
        role: 'admin'
      });

      showAlert('success', 'Admin berhasil ditambahkan');
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
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

  const headers = ['Nama', 'Email', 'Tanggal Dibuat', 'Aksi'];
  const data = admins.map(admin => [
    admin.fullName,
    admin.email,
    new Date(admin.createdAt).toLocaleDateString('id-ID'),
    <div key={admin.uid} className="flex gap-2">
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Data Admin Table - Mobile Optimized */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Admin</h3>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              <span className="hidden md:inline">Tambah Admin</span>
            </Button>
          </div>
          
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {admins.map(admin => (
              <div 
                key={admin.uid}
                className="bg-gray-50 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{admin.fullName}</h4>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setShowResetModal(true);
                      }}
                      className="p-2 bg-yellow-500 text-white rounded-lg"
                    >
                      <KeyIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Terdaftar: {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <Table headers={headers} data={data} />
          </div>
        </div>
      </div>

      {/* Modal Tambah Admin - Mobile Optimized */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      >
        <div className="p-4 md:p-6">
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <UserPlusIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tambah Admin Baru
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Lengkapi data untuk membuat akun admin baru
            </p>
          </div>

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

            <div className="flex flex-col md:flex-row gap-3 pt-4">
              <Button
                onClick={() => setShowAddModal(false)}
                className="w-full md:w-auto order-2 md:order-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 md:py-2"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddAdmin}
                className="w-full md:w-auto order-1 md:order-2 bg-blue-600 text-white hover:bg-blue-700 py-3 md:py-2"
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
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <KeyIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Reset Password Admin
            </h3>
            <p className="text-gray-600 mt-2">
              Apakah Anda yakin ingin mengirim email reset password ke{' '}
              <span className="font-medium">{selectedAdmin?.email}</span>?
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowResetModal(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              className="bg-yellow-500 text-white hover:bg-yellow-600"
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
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Hapus Admin
            </h3>
            <p className="text-gray-600 mt-2">
              Apakah Anda yakin ingin menghapus admin{' '}
              <span className="font-medium">{selectedAdmin?.fullName}</span>?
              <br />
              <span className="text-sm text-red-500 mt-2 block">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteAdmin}
              className="bg-red-600 text-white hover:bg-red-700"
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