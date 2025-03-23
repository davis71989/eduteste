import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, MessageSquare, Calendar, ArrowRight, Upload, Brain, Clock, Award, TrendingUp, BarChart3, BookMarked, CheckCircle, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AiUsageStats from '@/components/AiUsageStats'
import { getUserChildren, getChildActivities, getChildSubjects, RecentActivity, Subject, getUserProfile } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/ui/use-toast'

// Tipo para os dados do filho
type Child = {
  id: string
  name: string
  age: string
  grade: string
  school: string
}

const Dashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  
  // Estado para o nome do usuário
  const [userName, setUserName] = useState('')
  
  // Estado para armazenar a lista de filhos
  const [children, setChildren] = useState<Child[]>([])

  // Estado para o filho selecionado atualmente
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  // Estado para atividades recentes
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  // Estado para matérias
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Filho atualmente selecionado
  const selectedChild = children.find(child => child.id === selectedChildId) || children[0]

  // Carregar dados dos filhos, atividades e matérias
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        
        // Obter nome do usuário dos metadados
        const nameFromMetadata = user.user_metadata?.name || user.user_metadata?.full_name || '';
        
        // Tentar obter o nome do perfil do usuário
        try {
          const userProfile = await getUserProfile(user.id);
          if (userProfile && userProfile.name) {
            setUserName(userProfile.name);
          } else {
            setUserName(nameFromMetadata || user.email?.split('@')[0] || 'Responsável');
          }
        } catch (error) {
          console.error('Erro ao buscar perfil:', error);
          setUserName(nameFromMetadata || user.email?.split('@')[0] || 'Responsável');
        }
        
        // Buscar filhos do usuário
        const userChildren = await getUserChildren(user.id)
        
        if (userChildren.length === 0) {
          setLoading(false)
          return // Sem filhos, não há necessidade de buscar mais dados
        }
        
        setChildren(userChildren)
        
        // Selecionar o primeiro filho por padrão se nenhum estiver selecionado
        const firstChildId = userChildren[0]?.id
        if (firstChildId && !selectedChildId) {
          setSelectedChildId(firstChildId)
          
          // Carregar atividades e matérias do primeiro filho
          const [childActivities, childSubjects] = await Promise.all([
            getChildActivities(firstChildId),
            getChildSubjects(firstChildId)
          ])
          
          setRecentActivities(childActivities)
          setSubjects(childSubjects)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus dados. Tente novamente.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [user, toast])

  // Carregar dados quando o filho selecionado mudar
  useEffect(() => {
    const loadChildData = async () => {
      if (!selectedChildId) return
      
      try {
        setLoading(true)
        
        // Carregar atividades e matérias do filho selecionado
        const [childActivities, childSubjects] = await Promise.all([
          getChildActivities(selectedChildId),
          getChildSubjects(selectedChildId)
        ])
        
        setRecentActivities(childActivities)
        setSubjects(childSubjects)
      } catch (error) {
        console.error('Erro ao carregar dados do filho:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (selectedChildId) {
      loadChildData()
    }
  }, [selectedChildId])

  const features = [
    {
      title: 'Ajuda com Tarefas',
      description: 'Envie a foto da tarefa ou digite o enunciado para receber orientações passo a passo.',
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-700',
      link: '/task-help'
    },
    {
      title: 'Simulados',
      description: 'Prepare seus filhos para provas com simulados personalizados e explicações detalhadas.',
      icon: Brain,
      color: 'bg-purple-100 text-purple-700',
      link: '/simulado'
    },
    {
      title: 'Chat IA Educacional',
      description: 'Tire dúvidas a qualquer momento com nosso assistente virtual especializado em educação.',
      icon: MessageSquare,
      color: 'bg-green-100 text-green-700',
      link: '/ai-chat'
    },
    {
      title: 'Rotina de Estudos',
      description: 'Crie e gerencie uma rotina de estudos personalizada para seus filhos.',
      icon: Calendar,
      color: 'bg-orange-100 text-orange-700',
      link: '/study-routine'
    }
  ]

  // Filtrar atividades do filho selecionado
  const filteredActivities = recentActivities.filter(activity => activity.child_id === selectedChildId)

  // Filtrar matérias do filho selecionado
  const filteredSubjects = subjects.filter(subject => subject.child_id === selectedChildId)

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Função para obter o ícone da atividade
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Award className="h-5 w-5 text-blue-500" />
      case 'task':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'study':
        return <BookOpen className="h-5 w-5 text-yellow-500" />
      case 'help':
        return <BookMarked className="h-5 w-5 text-purple-500" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'pending':
        return 'text-yellow-500'
      case 'in-progress':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  // Função para trocar o filho selecionado
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId)
  }

  // Exibir mensagem quando não há filhos cadastrados
  if (children.length === 0 && !loading) {
    return (
      <div className="container py-8">
        <div className="bg-gradient-to-r from-edu-blue-500 to-edu-blue-600 rounded-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao EduPais!</h1>
          <p className="opacity-90">Para começar, adicione seus filhos no seu perfil.</p>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-4">Você ainda não tem filhos cadastrados</h2>
          <p className="text-muted-foreground mb-8">Adicione seus filhos para acompanhar seu progresso e ajudá-los nos estudos.</p>
          <Link to="/profile">
            <Button variant="eduBlue">Ir para o Perfil</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Mostrar tela de carregamento
  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p>Carregando informações...</p>
        </div>
      </div>
    )
  }

  // Se não há um filho selecionado (o que não deveria acontecer se a lista não estiver vazia)
  if (!selectedChild) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p>Erro ao carregar informações do filho. Tente novamente.</p>
          <Link to="/profile">
            <Button variant="outline" className="mt-4">Ir para o Perfil</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Banner de boas-vindas */}
      <div className="bg-gradient-to-r from-edu-blue-500 to-edu-blue-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Olá, {userName}!</h1>
            <p className="opacity-90">Como podemos ajudar você e seus filhos hoje?</p>
          </div>
          
          {/* Seletor de filho */}
          <div className="mt-4 md:mt-0">
            {children.length > 1 ? (
              <div className="relative">
                <select
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-md px-4 py-2 appearance-none pr-10"
                  value={selectedChildId}
                  onChange={(e) => handleChildChange(e.target.value)}
                >
                  {children.map(child => (
                    <option key={child.id} value={child.id} className="text-gray-800">
                      {child.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
              </div>
            ) : (
              <div className="bg-white/20 px-4 py-2 rounded-md">
                <span>Filho: {selectedChild.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funcionalidades principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={index} className="border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {feature.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Link to={feature.link} className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={feature.title.includes('Em breve')}
                  >
                    {feature.title.includes('Em breve') ? 'Em breve' : 'Acessar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Seção de acesso rápido */}
      <div className="mb-8">
        {/* Atividades recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas interações de {selectedChild?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredActivities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Nenhuma atividade recente encontrada.</p>
                <p className="text-sm mt-2">
                  As atividades aparecerão aqui quando seu filho começar a usar o sistema.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <span className={`text-xs ${getStatusColor(activity.status)}`}>
                          {activity.status === 'completed' ? 'Concluído' : 
                           activity.status === 'pending' ? 'Pendente' : 'Em andamento'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {activity.subject} • {formatDate(activity.date)}
                        </span>
                        {activity.score !== undefined && (
                          <span className="text-xs font-medium">
                            {activity.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link to="/activities" className="w-full">
              <Button variant="outline" className="w-full">
                Ver Todas Atividades
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Dashboard detalhado */}
      <div className="grid gap-6 md:grid-cols-12 mb-8">
        {/* Progresso por matéria */}
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-edu-blue-500" />
              Progresso por Matéria
            </CardTitle>
            <CardDescription>
              Acompanhe o desempenho de {selectedChild?.name} em cada matéria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Nenhuma matéria encontrada para este aluno.</p>
                <p className="text-sm mt-2">
                  As matérias serão adicionadas conforme o aluno utiliza o sistema.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubjects.map((subject) => (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{subject.name}</span>
                      <span className="text-sm">{subject.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${subject.color}`} 
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Última atividade: {formatDate(subject.last_activity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-edu-blue-500" />
              Estatísticas
            </CardTitle>
            <CardDescription>
              Resumo de desempenho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-edu-blue-500">
                    {filteredActivities.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tarefas Completas
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-500">
                    {filteredActivities.filter(a => a.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tarefas Pendentes
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-500">
                  {filteredActivities.filter(a => a.type === 'quiz' && a.score !== undefined).length > 0 
                    ? Math.round(filteredActivities
                        .filter(a => a.type === 'quiz' && a.score !== undefined)
                        .reduce((sum, activity) => sum + (activity.score || 0), 0) / 
                      filteredActivities.filter(a => a.type === 'quiz' && a.score !== undefined).length)
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Média nos Quizzes
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {filteredSubjects.length > 0 
                    ? Math.round(filteredSubjects.reduce((sum, subject) => sum + subject.progress, 0) / filteredSubjects.length)
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Progresso Geral
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novas seções adicionadas */}
      <div className="grid gap-6 md:grid-cols-12 mb-8">
        {/* Agendamentos */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-edu-blue-500" />
              Agendamentos
            </CardTitle>
            <CardDescription>
              Veja e gerencie suas próximas atividades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Implementação futura para agendamentos */}
            <div className="py-6 text-center text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p>Nenhum agendamento futuro disponível</p>
              <p className="text-xs mt-1">Os agendamentos aparecerão aqui quando forem criados</p>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de uso da IA */}
        {user?.id && (
          <div className="md:col-span-8">
            <AiUsageStats userId={user.id} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 