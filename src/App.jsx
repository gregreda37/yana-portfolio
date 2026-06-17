import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import SetupUsername from './pages/SetupUsername';
import AdminDashboard from './admin/AdminDashboard';
import PublicPortfolio from './pages/PublicPortfolio';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin/setup" element={
            <ProtectedRoute>
              <SetupUsername />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requireUsername>
              <DataProvider>
                <AdminDashboard />
              </DataProvider>
            </ProtectedRoute>
          } />

          <Route path="/:username" element={<PublicPortfolio />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
