import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/admin/layout/Sidebar';
import Header from '../components/admin/layout/Header';
import Footer from '../components/admin/layout/Footer';
import DataPendaftar from '../components/admin/DataPendaftar';
import DashboardPage from '../components/admin/DashboardPage';
import UserManagement from '../components/admin/UserManagement';
import PPDBSettings from '../components/admin/PPDBSettings';
import { HomeIcon, UserGroupIcon, Cog6ToothIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const menuItems = [
    { path: '/admin', icon: HomeIcon, label: 'Home' },
    { path: '/admin/pendaftar', icon: UserGroupIcon, label: 'Pendaftar' },
    { path: '/admin/users', icon: Cog6ToothIcon, label: 'Admin' },
    { path: '/admin/settings', icon: AdjustmentsHorizontalIcon, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="hidden md:block fixed top-0 left-0 h-full z-[15]">
        <Sidebar />
      </div>

      <div className="md:pl-16 min-h-screen flex flex-col">
        <div className="fixed top-0 right-0 left-0 md:left-16 z-[15]">
          <Header />
        </div>

        <main className="flex-1 pt-16 pb-16">
          <div className="w-full">
            <Routes>
              <Route index element={<DashboardPage />} />
              <Route path="pendaftar" element={<DataPendaftar />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<PPDBSettings />} />
            </Routes>
          </div>
        </main>

        <div className="fixed bottom-0 right-0 left-0 md:left-16">
          <Footer />
        </div>

        <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-2 z-[15]">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 bg-blue-500 text-white rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[15]">
          <div className="flex justify-around items-center px-2 py-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => classNames(
                  'flex flex-col items-center py-2 px-3 rounded-lg',
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] mt-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="h-16 md:hidden" />
      </div>
    </div>
  );
};

export default AdminDashboard; 