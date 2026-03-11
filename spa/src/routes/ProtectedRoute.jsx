import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // User not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User logged in but does not have the required role
    // Redirect to their respective dashboard instead
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'Mess_Admin') return <Navigate to="/mess-admin/monitor" replace />;
    if (user.role === 'College_Admin') return <Navigate to="/college-admin/analytics" replace />;
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}
