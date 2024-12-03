import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/landingpage/Header';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PPDBFormPage from './pages/PPDBFormPage';
import InfoPPDBPage from './pages/InfoPPDBPage';
import { AuthProvider } from './contexts/AuthContext';
import Footer from './components/landingpage/Footer';
import ScrollToTop from './components/utils/ScrollToTop';
 
// Layout wrapper component
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
 
  if (isAuthPage) {
    return <>{children}</>;
  }
 
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
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
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    );
  }
 
  if (isPPDBFormRoute) {
    return (
      <Routes>
        <Route path="/ppdb/form" element={<PPDBFormPage />} />
      </Routes>
    );
  }
 
  return (
    <PublicLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/info-ppdb" element={<InfoPPDBPage />} />
        <Route path="/ppdb" element={<PPDBFormPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
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