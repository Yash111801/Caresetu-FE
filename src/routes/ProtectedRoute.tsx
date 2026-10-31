import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

type Props = {
  permission?: string
  role?: string
}

export function ProtectedRoute({ permission, role }: Props) {
  const location = useLocation()
  const { user, bootstrapped, hasPermission, hasRole } = useAuthStore()

  if (!bootstrapped) {
    return <div className="center">Loading…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/forbidden" replace />
  }

  if (role && !hasRole(role)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
