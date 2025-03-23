import { Outlet } from 'react-router-dom'
import { Home, BookOpen, MessageSquare, Calendar, User, Menu, X, LogOut, Settings, Sun, Moon, Brain, CreditCard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/AuthContext'
import { getUserProfile } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

// Interface para itens de navegação
interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  disabled?: boolean;
}

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return
      
      try {
        // Obter dados do perfil
        const userProfile = await getUserProfile(user.id)
        if (userProfile) {
          setProfileData({
            name: userProfile.name || user.user_metadata?.name || '',
            email: user.email || '',
            phone: userProfile.phone || ''
          })
        } else {
          // Se não existe perfil, usar dados básicos
          setProfileData({
            name: user.user_metadata?.name || '',
            email: user.email || '',
            phone: ''
          })
        }
      } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error)
      }
    }
    
    fetchProfileData()
  }, [user])

  const navItems: NavItem[] = [
    { icon: Home, label: 'Início', path: '/dashboard' },
    { icon: BookOpen, label: 'Tarefas', path: '/task-help' },
    { icon: Brain, label: 'Simulado', path: '/simulado' },
    { icon: MessageSquare, label: 'Chat IA', path: '/ai-chat' },
    { icon: Calendar, label: 'Rotina', path: '/study-routine' },
    { icon: CreditCard, label: 'Planos', path: '/planos' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  
  // Obtém as iniciais do nome para o avatar
  const getInitials = () => {
    if (!profileData.name) return user?.email?.substring(0, 1).toUpperCase() || '?'
    return profileData.name.substring(0, 1).toUpperCase()
  }
  
  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar para desktop */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-edu-blue-500 text-white p-1 rounded">
                <BookOpen size={24} />
              </div>
              <span className="font-bold text-xl">EduPais</span>
            </Link>
          </div>
          
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 transition-colors ${
                      isActive ? 'text-edu-blue-500 font-semibold' : 'text-foreground/60'
                    } ${item.disabled ? 'opacity-50 cursor-not-allowed hover:text-foreground/60' : 'hover:text-foreground/80'}`}
                    onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex flex-1 items-center justify-between md:justify-end">
            <button 
              className="mr-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </button>
            
            <Button
              variant="ghost"
              size="icon"
              className="mr-4"
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-auto flex items-center gap-2 outline-none">
                  <Avatar>
                    <AvatarImage src="/avatar-placeholder.png" alt="Foto de perfil" />
                    <AvatarFallback className="bg-edu-blue-100 text-edu-blue-700 font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-sm">
                    <p className="font-medium">{profileData.name || 'Seu Perfil'}</p>
                    <p className="text-xs text-muted-foreground">{profileData.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile?tab=profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/planos')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Planos e Assinaturas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-edu-blue-500 text-white p-1 rounded">
                <BookOpen size={24} />
              </div>
              <span className="font-bold text-xl">EduPais</span>
            </Link>
            
            <button 
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={toggleMobileMenu}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Fechar menu</span>
            </button>
          </div>
          
          <nav className="container grid gap-6 py-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 text-lg font-medium ${
                    isActive ? 'text-edu-blue-500' : 'text-foreground/60'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    } else {
                      toggleMobileMenu();
                    }
                  }}
                >
                  <Icon size={24} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            <button
              className="flex items-center gap-4 text-lg font-medium text-destructive mt-4"
              onClick={handleLogout}
            >
              <LogOut size={24} />
              <span>Sair</span>
            </button>
          </nav>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} EduPais. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout 