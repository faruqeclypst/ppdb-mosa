import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/admin/layout/Sidebar';
import Header from '../components/admin/layout/Header';
import Footer from '../components/admin/layout/Footer';
import DataPendaftar from '../components/admin/DataPendaftar';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Routes>
            <Route index element={<div>Dashboard Overview</div>} />
            <Route path="pendaftar" element={<DataPendaftar />} />
            <Route path="settings" element={<div>Settings Page</div>} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard; 