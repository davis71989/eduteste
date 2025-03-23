import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    // Simulando uma autenticação
    setTimeout(() => {
      // Credenciais de demonstração: admin@edupais.com / admin123
      if (email === 'admin@edupais.com' && password === 'admin123') {
        navigate('/admin/dashboard')
      } else {
        setError('Credenciais inválidas. Tente admin@edupais.com / admin123')
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-edu-blue-500 text-white p-2 rounded-lg">
            <BookOpen size={32} />
          </div>
          <div className="ml-2">
            <h1 className="text-2xl font-bold">EduPais</h1>
            <p className="text-sm text-gray-500">Painel Administrativo</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Acesso Restrito</CardTitle>
            <CardDescription className="text-center">
              Faça login para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3 mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@edupais.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <a href="#" className="text-xs text-edu-blue-600 hover:underline">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-gray-300 text-edu-blue-600 focus:ring-edu-blue-500 h-4 w-4"
                  />
                  <Label htmlFor="remember" className="text-sm">Lembrar-me</Label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isLoading}
              >
                {isLoading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-gray-500">
              Acesso restrito a administradores autorizados.
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>EduPais © {new Date().getFullYear()}. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin 