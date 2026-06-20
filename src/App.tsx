import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/landingpage/Header';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/utils/ScrollToTop';

// Lazy load pages untuk code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PPDBFormPage = lazy(() => import('./pages/PPDBFormPage'));
const InfoPPDBPage = lazy(() => import('./pages/InfoPPDBPage'));

// Loading component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);
 
// Layout wrapper component
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);
 
  if (isAuthPage) {
    return <>{children}</>;
  }
 
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
    </div>
  );
};
 
// Route wrapper component
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPPDBFormRoute = location.pathname.startsWith('/ppdb/form');
 
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
      </Routes>
    );
  }
 
  if (isPPDBFormRoute) {
    return (
      <Routes>
        <Route path="/ppdb/form" element={<Suspense fallback={<PageLoader />}><PPDBFormPage /></Suspense>} />
      </Routes>
    );
  }
 
  return (
    <PublicLayout>
      <Routes>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
        <Route path="/info-spmb" element={<Suspense fallback={<PageLoader />}><InfoPPDBPage /></Suspense>} />
        <Route path="/ppdb" element={<Suspense fallback={<PageLoader />}><PPDBFormPage /></Suspense>} />
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
      </Routes>
    </PublicLayout>
  );
};
 
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};
 
export default App;