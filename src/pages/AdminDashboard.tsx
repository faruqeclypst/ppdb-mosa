import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/admin/layout/Sidebar';
import Header from '../components/admin/layout/Header';
import Footer from '../components/admin/layout/Footer';
import { 
  AcademicCapIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import classNames from 'classnames';

// Lazy load admin components
const DataPendaftar = lazy(() => import('../components/admin/DataPendaftar'));
const DataDraft = lazy(() => import('../components/admin/DataDraft'));
const DashboardPage = lazy(() => import('../components/admin/DashboardPage'));
const DashboardPJJPage = lazy(() => import('../components/admin/DashboardPJJPage'));
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const PPDBSettings = lazy(() => import('../components/admin/PPDBSettings'));

// Loading component untuk admin
const AdminLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const mobileMenuItems = [
    { path: '/admin', icon: AcademicCapIcon, label: 'Reguler' },
    { path: '/admin/dashboard-pjj', icon: BuildingOfficeIcon, label: 'PJJ' },
    { path: '/admin/pendaftar', icon: UserGroupIcon, label: 'Pendaftar' },
    { path: '/admin/pendaftar-pjj', icon: UserGroupIcon, label: 'Pendaftar PJJ' },
    { path: '/admin/settings', icon: AdjustmentsHorizontalIcon, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50/70 font-sans">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:pl-64 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense fallback={<AdminLoader />}>
              <Routes>
                <Route index element={<DashboardPage />} />
                <Route path="dashboard-pjj" element={<DashboardPJJPage />} />
                <Route path="pendaftar" element={<DataPendaftar mode="regular" />} />
                <Route path="pendaftar-pjj" element={<DataPendaftar mode="pjj" />} />
                <Route path="draft" element={<DataDraft mode="regular" />} />
                <Route path="draft-pjj" element={<DataDraft mode="pjj" />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<PPDBSettings />} />
              </Routes>
            </Suspense>
          </div>
        </main>

        <Footer />

        {/* Mobile Scroll to Top Button */}
        <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-2 z-30">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 bg-emerald-600 text-white rounded-full shadow-lg active:scale-95 transition-transform"
            aria-label="Scroll ke atas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30">
          <div className="flex justify-around items-center px-2 py-1">
            {mobileMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => classNames(
                  'flex flex-col items-center py-2 px-2 rounded-lg transition-colors',
                  isActive 
                    ? 'text-emerald-700 font-bold' 
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] mt-1 text-center whitespace-nowrap">{item.label}</span>
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