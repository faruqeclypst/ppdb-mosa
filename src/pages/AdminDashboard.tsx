import React from 'react';
import Header from '../components/admin/layout/Header';
import Footer from '../components/admin/layout/Footer';
import Sidebar from '../components/admin/layout/Sidebar';

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard Admin</h2>
          {/* Tambahkan komponen dashboard di sini */}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard; 