import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/admin/layout/Sidebar';
import Header from '../components/admin/layout/Header';
import Footer from '../components/admin/layout/Footer';
import DataPendaftar from '../components/admin/DataPendaftar';
import DashboardPage from '../components/admin/DashboardPage';
import UserManagement from '../components/admin/UserManagement';

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
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="pendaftar" element={<DataPendaftar />} />
            <Route path="users" element={<UserManagement />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard; 