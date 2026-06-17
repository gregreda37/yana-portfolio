import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blush-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/admin/login" replace />;
}
