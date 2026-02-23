import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUserRole, hasFeatureAccess, UserRole } from '@utils/auth';
import RestrictedAccessPage from './RestrictedAccessPage';

interface FeatureProtectedRouteProps {
  feature: string;
  children: React.ReactNode;
}

const FeatureProtectedRoute = ({ feature, children }: FeatureProtectedRouteProps) => {
  const location = useLocation();
  const userRole = getCurrentUserRole();

  if (userRole === undefined) {
    return <RestrictedAccessPage />;
  }

  if (!hasFeatureAccess(feature, userRole)) {
    if (location.pathname !== '/restricted/' + feature) {
      return <Navigate to={`/restricted/${feature}`} state={{ from: location }} replace />;
    }
    return <RestrictedAccessPage />;
  }

  return <>{children}</>;
};

export default FeatureProtectedRoute;
