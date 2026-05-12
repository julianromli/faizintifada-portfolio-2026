import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken } from '../../lib/admin-api';

export function RequireAdmin({ children }: { children: ReactNode }) {
  if (!getAdminToken()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}
