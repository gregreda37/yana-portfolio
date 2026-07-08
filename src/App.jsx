import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import SetupUsername from './pages/SetupUsername';
import AdminDashboard from './admin/AdminDashboard';
import ImportResume from './pages/ImportResume';
import PublicPortfolio from './pages/PublicPortfolio';
import VideoPage from './pages/VideoPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />

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

          <Route path="/admin/import" element={
            <ProtectedRoute requireUsername>
              <DataProvider>
                <ImportResume />
              </DataProvider>
            </ProtectedRoute>
          } />

          <Route path="/:username" element={<PublicPortfolio />} />
          <Route path="/:username/video" element={<VideoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
