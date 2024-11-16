import React, { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Table from '../ui/Table';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { showAlert } from '../ui/Alert';
import { KeyIcon, TrashIcon } from '@heroicons/react/24/outline';

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
      // Create new admin account using Firebase Auth REST API
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

      // Save admin data to Realtime Database
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
      >
        <KeyIcon className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => {
          setSelectedAdmin(admin);
          setShowDeleteModal(true);
        }}
        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
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
    <div className="p-6">
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Admin</h1>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Tambah Admin
          </Button>
        </div>

        <Card className="overflow-hidden">
          <Table headers={headers} data={data} />
        </Card>

        {/* Modal Tambah Admin */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tambah Admin Baru
            </h3>
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
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddAdmin}
                  className="bg-blue-600 text-white hover:bg-blue-700"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password Admin
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin mengirim email reset password ke{' '}
              <span className="font-medium">{selectedAdmin?.email}</span>?
            </p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Hapus Admin
            </h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus admin{' '}
              <span className="font-medium">{selectedAdmin?.fullName}</span>?
              <br />
              <span className="text-sm text-red-500">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>
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
    </div>
  );
};

export default UserManagement; 