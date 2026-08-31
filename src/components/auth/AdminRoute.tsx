import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks';

// Gates admin-only pages (User Management). Always nested inside
// <ProtectedRoute> in App.tsx, so `user` is guaranteed to exist here —
// this only needs to check role, not authentication.
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((state) => state.auth.user?.role);

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
