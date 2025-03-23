import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Se ainda estiver carregando, exiba uma tela de carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-blue-500"></div>
      </div>
    )
  }

  // Se não estiver autenticado, redirecione para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se estiver autenticado, renderize o componente filho
  return <>{children}</>
}

export default ProtectedRoute 