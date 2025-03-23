import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signIn, signUp } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/ui/use-toast'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obter a página de redirecionamento a partir do estado (se existir)
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      await signIn(loginData.email, loginData.password)
      await refreshUser() // Atualiza o estado do usuário no contexto
      navigate(from)
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      
      if (error.message === 'Invalid login credentials') {
        setError('Email ou senha inválidos')
      } else {
        setError(error.message || 'Erro ao fazer login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    // Verificar se as senhas coincidem
    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }
    
    // Verificar se a senha tem pelo menos 8 caracteres
    if (registerData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setIsLoading(false)
      return
    }
    
    // Armazenar o email antes de limpar o formulário
    const registeredEmail = registerData.email;
    
    try {
      const response = await signUp(registerData.email, registerData.password, registerData.name)
      console.log('Resposta do cadastro:', response);
      
      // Limpar o formulário
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      
      // Preencher o email no formulário de login
      setLoginData(prev => ({
        ...prev,
        email: registeredEmail
      }))
      
      // Verificar se precisa de confirmação de email
      if (response.needsEmailConfirmation) {
        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Verifique seu email para confirmar o cadastro. Você receberá um link de ativação.',
          variant: 'default',
        })
      } else {
        toast({
          title: 'Cadastro realizado com sucesso!',
          description: 'Você já pode fazer login com suas credenciais.',
          variant: 'default',
        })
      }
      
      // Mudar para a aba de login após o cadastro (com pequeno delay para garantir visibilidade do toast)
      setTimeout(() => {
        setActiveTab("login")
      }, 500);
      
    } catch (error: any) {
      console.error('Erro ao registrar:', error)
      
      if (error.message.includes('already registered') || 
          error.message.includes('already exists') || 
          error.message.includes('already taken') ||
          error.message.includes('já está registrado')) {
        setError('Este email já está cadastrado')
      } else {
        setError(error.message || 'Erro ao criar conta')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!loginData.email) {
      setError('Digite seu email para redefinir a senha')
      return
    }
    
    setIsLoading(true)
    try {
      const { resetPassword } = await import('@/lib/supabase')
      await resetPassword(loginData.email)
      toast({
        title: 'Email enviado!',
        description: 'Verifique seu email para redefinir sua senha.',
        variant: 'default',
      })
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error)
      setError(error.message || 'Erro ao enviar email de redefinição')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
              Apoiando pais na jornada educacional de seus filhos
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar sua conta
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        value={loginData.email}
                        onChange={handleLoginChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                        <a 
                          href="#" 
                          className="text-xs text-edu-blue-500 hover:underline"
                          onClick={handleForgotPassword}
                        >
                          Esqueceu a senha?
                        </a>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          value={loginData.password}
                          onChange={handleLoginChange}
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
                          Entrando...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <LogIn className="mr-2 h-4 w-4" />
                          Entrar
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Crie sua conta</CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para se cadastrar
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome Completo</Label>
                      <Input
                        id="register-name"
                        name="name"
                        placeholder="João Silva"
                        required
                        value={registerData.name}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        value={registerData.email}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          value={registerData.password}
                          onChange={handleRegisterChange}
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
                      <Label htmlFor="confirm-password">Confirmar Senha</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      variant="eduBlue" 
                      className="w-full"
                      disabled={isLoading || registerData.password !== registerData.confirmPassword}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Cadastrando...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          Criar Conta
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <a href="#" className="text-edu-blue-500 hover:underline">
                Termos de Serviço
              </a>{" "}
              e{" "}
              <a href="#" className="text-edu-blue-500 hover:underline">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} EduPais. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}

export default Login 