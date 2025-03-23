import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Award, LogOut, Menu, X, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'

const Header = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Award className="h-6 w-6 text-edu-blue-500" />
          <span className="font-bold text-xl hidden sm:inline">EduPais</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/profile')}
              className="text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4 mr-1" />
              Perfil
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
          <nav className="container mx-auto px-4 py-3 flex flex-col">
            <Button 
              variant="ghost" 
              className="justify-start py-2 px-3"
              onClick={() => {
                navigate('/profile')
                setIsMenuOpen(false)
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Perfil
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start py-2 px-3 text-red-600"
              onClick={() => {
                handleLogout()
                setIsMenuOpen(false)
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header 