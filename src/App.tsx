import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './lib/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import TaskHelp from './pages/TaskHelp'
import Simulado from './pages/Simulado'
import SimuladoDetalhes from './pages/SimuladoDetalhes'
import SimuladoCompartilhado from './pages/SimuladoCompartilhado'
import AIChat from './pages/AIChat'
import StudyRoutine from './pages/StudyRoutine'
import Profile from './pages/Profile'
import Planos from './pages/Planos'
import PagamentoSucesso from './pages/pagamento/sucesso'
import PagamentoCancelado from './pages/pagamento/cancelado'
import SimuladoCheckout from './pages/pagamento/simulado'
import StripeDebugPage from './pages/pagamento/debug'
import TestEdgeFunctionPage from './pages/pagamento/test-edge'
import TestFunctionsPage from './pages/pagamento/test-functions'
import RecreateStripeProductsPage from './pages/pagamento/recreate-stripe-products'
import VerificarProdutosPage from './pages/pagamento/verificar-produtos'
import { ToastProvider } from './components/ui/toast'

// Páginas do Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSchools from './pages/admin/Schools'
import AdminContent from './pages/admin/Content'
import AdminReports from './pages/admin/Reports'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminSupport from './pages/admin/Support'
import AdminSettings from './pages/admin/Settings'
import AdminLogin from './pages/admin/Login'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Welcome />} />
          <Route path="login" element={<Login />} />
          <Route path="redefinir-senha" element={<ResetPassword />} />
          
          {/* Rotas da aplicação principal - protegidas */}
          <Route 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="task-help" element={<TaskHelp />} />
            <Route path="simulado" element={<Simulado />} />
            <Route path="simulado/:id" element={<SimuladoDetalhes />} />
            <Route path="ai-chat" element={<AIChat />} />
            <Route path="study-routine" element={<StudyRoutine />} />
            <Route path="profile" element={<Profile />} />
            <Route path="planos" element={<Planos />} />
          </Route>

          {/* Rotas públicas de simulado compartilhado */}
          <Route path="simulado/compartilhado/:id" element={<SimuladoCompartilhado />} />
          
          {/* Rotas de pagamento */}
          <Route path="pagamento">
            <Route path="sucesso" element={<PagamentoSucesso />} />
            <Route path="cancelado" element={<PagamentoCancelado />} />
            <Route path="debug" element={<StripeDebugPage />} />
            <Route path="test-edge" element={<TestEdgeFunctionPage />} />
            <Route path="test-functions" element={<TestFunctionsPage />} />
            <Route path="verificar-produtos" element={<VerificarProdutosPage />} />
            <Route path="recreate-products" element={<RecreateStripeProductsPage />} />
          </Route>

          {/* Rotas do painel administrativo */}
          <Route path="admin/login" element={<AdminLogin />} />
          <Route 
            path="admin" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="schools" element={<AdminSchools />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App 