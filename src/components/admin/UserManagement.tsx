import React, { useState, useEffect } from 'react';
import { ref, get, set, remove } from 'firebase/database';
import { db } from '../../firebase/config';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { showAlert } from '../ui/Alert';
import { 
  KeyIcon, 
  TrashIcon, 
  UserPlusIcon, 
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    loadAdmins();
  }, [schoolFilter]);

  const handleAddAdmin = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      showAlert('error', 'Harap lengkapi semua kolom yang wajib diisi');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert('error', 'Konfirmasi password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      showAlert('error', 'Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);
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
      if (!response.ok) throw new Error(data.error?.message || 'Gagal membuat akun');

      await set(ref(db, `admins/${data.localId}`), {
        fullName: formData.fullName,
        email: formData.email,
        createdAt: new Date().toISOString(),
        school: formData.school || userRole?.school || 'mosa',
        isMaster: userRole?.isMaster ? formData.isMaster : false,
        role: 'admin'
      });

      showAlert('success', 'Akun administrator baru berhasil dibuat');
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
    } catch (error: any) {
      console.error('Error adding admin:', error);
      showAlert('error', error.message || 'Gagal menambahkan admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);

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

      showAlert('success', `Tautan reset password telah dikirim ke ${selectedAdmin.email}`);
      setShowResetModal(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showAlert('error', error.message || 'Gagal mengirim email reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);

    try {
      await remove(ref(db, `admins/${selectedAdmin.uid}`));
      showAlert('success', 'Akun administrator berhasil dihapus');
      loadAdmins();
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      showAlert('error', error.message || 'Gagal menghapus admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSchoolLabel = (school: string) => {
    switch (school) {
      case 'mosa':
        return 'SMAN Modal Bangsa';
      case 'fajar':
        return 'SMAN 10 Fajar Harapan';
      case 'all':
        return 'Semua Sekolah (Master)';
      default:
        return school || '-';
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
              Manajemen Administrator
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {admins.length} Pengguna
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kelola hak akses akun verifikator dan administrator sistem SPMB
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-950/10 active:scale-95 transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <UserPlusIcon className="w-4 h-4" />
          <span>Tambah Administrator Baru</span>
        </button>
      </div>

      {/* Main Double-Bezel Card */}
      <div className="rounded-3xl p-1 bg-gradient-to-b from-white to-zinc-50 border border-zinc-200/80 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-5">
          {/* Filter Bar */}
          {userRole?.isMaster && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">Filter Kampus:</span>
                <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/60">
                  {[
                    { id: 'all', label: 'Semua Kampus' },
                    { id: 'mosa', label: 'Modal Bangsa' },
                    { id: 'fajar', label: 'Fajar Harapan' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSchoolFilter(tab.id as any)}
                      className={classNames(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                        schoolFilter === tab.id
                          ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/60'
                          : 'text-zinc-500 hover:text-zinc-900'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-zinc-100">
              <ShieldCheckIcon className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-700">Belum ada akun administrator</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Klik tombol di kanan atas untuk membuat akun baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-100">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                    <th className="px-4 py-3">Administrator</th>
                    <th className="px-4 py-3">Kampus</th>
                    <th className="px-4 py-3">Tipe Akses</th>
                    <th className="px-4 py-3">Terdaftar</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {admins.map((admin) => (
                    <tr key={admin.uid} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="font-extrabold text-zinc-900">{admin.fullName}</div>
                            <div className="text-[11px] text-zinc-400 font-medium">{admin.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <BuildingOfficeIcon className="w-4 h-4 text-zinc-400" />
                          <span>{getSchoolLabel(admin.school)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={classNames(
                          'px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider shadow-xs',
                          admin.isMaster
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        )}>
                          {admin.isMaster ? 'Master Admin' : 'Admin Kampus'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-zinc-500 font-medium text-[11px]">
                        {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowResetModal(true);
                            }}
                            className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            title="Kirim Email Reset Password"
                          >
                            <KeyIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                            title="Hapus Akun Administrator"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Admin */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        className="z-50"
      >
        <div className="p-6 space-y-4">
          <div className="text-center pb-3 border-b border-zinc-100">
            <div className="mx-auto w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-2 text-emerald-700">
              <UserPlusIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Tambah Akun Administrator</h3>
            <p className="text-xs text-zinc-500">Buat kredensial login untuk petugas SPMB</p>
          </div>

          <div className="space-y-3">
            <Input
              label="Nama Lengkap"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Muhammad Faruq, S.Pd"
              required
            />
            <Input
              label="Alamat Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@sman-modalbangsa.sch.id"
              required
            />

            {userRole?.isMaster && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Kampus Sekolah
                </label>
                <select
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-zinc-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-xs font-medium outline-none"
                  required
                >
                  <option value="">Pilih Kampus</option>
                  <option value="mosa">SMAN Modal Bangsa</option>
                  <option value="fajar">SMAN 10 Fajar Harapan</option>
                </select>
              </div>
            )}

            {userRole?.isMaster && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMaster}
                  onChange={(e) => setFormData({ ...formData, isMaster: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-zinc-700">
                  Jadikan Master Administrator (Akses Penuh Kedua Kampus)
                </span>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password Akun"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                required
              />
              <Input
                label="Konfirmasi Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ulangi password"
                required
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddAdmin}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Buat Akun</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        className="z-50"
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mb-3 text-amber-600">
            <KeyIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">Reset Password Administrator</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-5">
            Kirimkan tautan pemulihan password ke email <strong>{selectedAdmin?.email}</strong>?
          </p>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Tautan Reset'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Delete Admin */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        className="z-50"
      >
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-3 text-rose-600">
            <TrashIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">Hapus Akun Administrator</h3>
          <p className="text-xs text-zinc-500 mt-1 mb-5">
            Apakah Anda yakin ingin menghapus akun <strong>{selectedAdmin?.fullName}</strong> ({selectedAdmin?.email})?
          </p>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteAdmin}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;