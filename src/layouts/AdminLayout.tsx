import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  School, 
  BookOpen, 
  Settings, 
  BarChart, 
  CreditCard, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronDown,
  FileText
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Efeito para verificar o tamanho da tela e ajustar o menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Verificar o tamanho inicial
    handleResize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', handleResize);

    // Limpar listener ao desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fechar menu mobile quando mudar de página
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/admin/dashboard'
    },
    { 
      icon: Users, 
      label: 'Usuários', 
      path: '/admin/users'
    },
    { 
      icon: School, 
      label: 'Escolas', 
      path: '/admin/schools'
    },
    { 
      icon: BookOpen, 
      label: 'Conteúdo Educacional', 
      path: '/admin/content'
    },
    { 
      icon: BarChart, 
      label: 'Relatórios', 
      path: '/admin/reports'
    },
    { 
      icon: CreditCard, 
      label: 'Planos e Assinaturas', 
      path: '/admin/subscriptions'
    },
    { 
      icon: FileText, 
      label: 'Feedback e Suporte', 
      path: '/admin/support'
    },
    { 
      icon: Settings, 
      label: 'Configurações', 
      path: '/admin/settings'
    }
  ]

  const toggleSidebar = () => {
    // Só permitir toggle do sidebar em telas maiores
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(!isSidebarOpen)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Em dispositivos móveis, abrir ou fechar o sidebar ao clicar no botão
    if (window.innerWidth < 768) {
      setIsSidebarOpen(!isMobileMenuOpen);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar para desktop e mobile */}
      <aside 
        className={`bg-white border-r border-gray-200 fixed md:static inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="p-6 flex items-center justify-between h-16">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            {isSidebarOpen ? (
              <>
                <div className="bg-edu-blue-500 text-white p-1 rounded">
                  <BookOpen size={20} />
                </div>
                <span className="font-bold text-xl">EduPais</span>
                <span className="bg-edu-blue-100 text-edu-blue-700 text-xs font-medium px-2 py-0.5 rounded">Admin</span>
              </>
            ) : (
              <div className="bg-edu-blue-500 text-white p-1 rounded mx-auto">
                <BookOpen size={20} />
              </div>
            )}
          </Link>
          <button 
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={toggleMobileMenu}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-edu-blue-50 text-edu-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-edu-blue-700' : 'text-gray-500'} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {isSidebarOpen && (
            <div className="pt-6 mt-6 border-t border-gray-200">
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} className="mr-2" />
                Sair
              </Button>
            </div>
          )}
        </div>

        <div 
          className="absolute right-0 top-1/2 -mr-3 hidden md:block cursor-pointer"
          onClick={toggleSidebar}
        >
          <button className="rounded-full p-1 bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-700">
            {isSidebarOpen 
              ? <ChevronDown size={16} className="rotate-90" /> 
              : <ChevronDown size={16} className="-rotate-90" />
            }
          </button>
        </div>
      </aside>

      {/* Mobile menu overlay - aumentando zIndex para garantir que cubra tudo */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sticky top-0 z-10">
          <button 
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 md:hidden"
            onClick={toggleMobileMenu}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1"></div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src="/admin-avatar.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-gray-500">admin@edupais.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout 