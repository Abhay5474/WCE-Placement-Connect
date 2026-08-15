import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, hasRole } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !hasRole(user, ...roles)) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="text-sm text-slate-500">This area requires elevated permissions.</p>
      </div>
    );
  }
  return children;
}
