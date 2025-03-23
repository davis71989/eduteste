import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { supabase, updatePassword } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Verificar se o usuário veio de um link de redefinição
  useEffect(() => {
    const checkHash = async () => {
      // Verificar se temos um hash na URL
      const hash = window.location.hash
      if (hash) {
        try {
          // Tentar recuperar o tipo de hash e o token de acesso
          const { data, error } = await supabase.auth.getSession()
          
          if (error || !data.session) {
            setError('Link de redefinição inválido ou expirado. Solicite um novo link.')
          }
        } catch (err) {
          console.error("Erro ao verificar a sessão:", err)
          setError('Ocorreu um erro ao verificar sua sessão')
        }
      } else {
        // Redirecionar para a página de login se não houver hash
        navigate('/login')
      }
    }
    
    checkHash()
  }, [navigate])

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar senhas
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setIsLoading(true)
    try {
      await updatePassword(password)
      
      toast({
        title: 'Senha atualizada com sucesso!',
        description: 'Sua senha foi atualizada. Você já pode fazer login com a nova senha.',
        variant: 'default',
      })
      
      // Redirecionar para login
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      setError('Não foi possível redefinir sua senha. Tente novamente ou solicite um novo link.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Award className="h-8 w-8 text-edu-blue-500" />
              <span className="font-bold text-3xl">EduPais</span>
            </div>
            <p className="text-muted-foreground">
              Redefina sua senha para continuar
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Redefinir Senha</CardTitle>
              <CardDescription>
                Digite e confirme sua nova senha
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    A senha deve ter pelo menos 8 caracteres
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  variant="eduBlue" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Atualizando...
                    </div>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword 