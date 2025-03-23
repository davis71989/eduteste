import { 
  Users, 
  School, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  ArrowRight,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const AdminDashboard = () => {
  // Dados fictícios das estatísticas
  const stats = [
    {
      title: 'Usuários Ativos',
      value: '8,492',
      change: '+12.3%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Escolas Cadastradas',
      value: '385',
      change: '+5.4%',
      trend: 'up',
      icon: School,
      color: 'bg-green-100 text-green-700'
    },
    {
      title: 'Conteúdos Educacionais',
      value: '1,278',
      change: '+16.2%',
      trend: 'up',
      icon: BookOpen,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 156,240',
      change: '-2.5%',
      trend: 'down',
      icon: CreditCard,
      color: 'bg-orange-100 text-orange-700'
    }
  ]

  // Dados fictícios dos planos
  const plans = [
    {
      name: 'Plano Básico',
      users: 4215,
      percentage: 49,
      color: 'bg-blue-500'
    },
    {
      name: 'Plano Famíliar',
      users: 2854,
      percentage: 33,
      color: 'bg-green-500'
    },
    {
      name: 'Plano Premium',
      users: 1423,
      percentage: 18,
      color: 'bg-purple-500'
    }
  ]

  // Dados fictícios das atividades recentes
  const recentActivities = [
    {
      id: 1,
      action: 'Novo usuário registrado',
      name: 'Maria Silva',
      email: 'maria.silva@exemplo.com',
      time: '5 minutos atrás'
    },
    {
      id: 2,
      action: 'Conteúdo adicionado',
      name: 'Frações para 5º Ano',
      category: 'Matemática',
      time: '1 hora atrás'
    },
    {
      id: 3,
      action: 'Escola cadastrada',
      name: 'Colégio São Francisco',
      location: 'São Paulo, SP',
      time: '3 horas atrás'
    },
    {
      id: 4,
      action: 'Assinatura atualizada',
      name: 'Carlos Mendes',
      plan: 'Básico → Premium',
      time: '5 horas atrás'
    },
    {
      id: 5,
      action: 'Ticket de suporte',
      name: 'Problemas com acesso',
      status: 'Aberto',
      time: '1 dia atrás'
    }
  ]

  // Dados fictícios dos últimos feedbacks
  const feedbacks = [
    {
      id: 1,
      content: "O aplicativo tem sido essencial para acompanhar o progresso dos meus filhos na escola.",
      rating: 5,
      user: "João Paulo",
      date: "21/03/2023"
    },
    {
      id: 2,
      content: "Gostaria que tivesse mais conteúdo para alunos do ensino médio.",
      rating: 4,
      user: "Ana Costa",
      date: "18/03/2023"
    },
    {
      id: 3,
      content: "Encontrei dificuldades para configurar as notificações.",
      rating: 3,
      user: "Roberto Alves",
      date: "15/03/2023"
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-500">Bem-vindo ao painel de controle do EduPais.</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-500 flex items-center">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                      {stat.change}
                    </span> {' '}
                    comparado ao mês anterior
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Seção principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Distribuição de planos */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Distribuição de Planos
              </CardTitle>
              <CardDescription>
                Detalhamento dos usuários por tipo de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {plans.map((plan) => (
                  <div key={plan.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-sm text-gray-500">
                        {plan.users} usuários ({plan.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${plan.color} rounded-full`} 
                        style={{ width: `${plan.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Usuários ativos por mês</h4>
                <div className="h-48 w-full bg-gray-50 rounded-lg flex items-end justify-between p-4">
                  {/* Gráfico simplificado - colunas representando dados mensais */}
                  {[35, 42, 48, 55, 62, 68, 72, 75, 78, 83, 85, 82].map((value, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-5 bg-edu-blue-500 rounded-t-sm" 
                        style={{ height: `${value * 1.8}px` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">
                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Ver Relatório Detalhado
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Feedbacks Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Feedbacks Recentes
            </CardTitle>
            <CardDescription>
              Últimos comentários dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="p-3 border rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{feedback.user}</span>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-4 h-4 ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{feedback.content}</p>
                <p className="text-xs text-gray-500 mt-2">{feedback.date}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Ver Todos os Feedbacks
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Últimas ações e eventos na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-edu-blue-100 flex items-center justify-center">
                    <span className="text-edu-blue-700 text-sm font-bold">{activity.id}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{activity.action}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          {activity.name && <span>{activity.name} </span>}
                          {activity.email && <span className="text-gray-400">({activity.email})</span>}
                          {activity.category && <span>• {activity.category}</span>}
                          {activity.location && <span>• {activity.location}</span>}
                          {activity.plan && <span>• {activity.plan}</span>}
                          {activity.status && (
                            <Badge className="bg-red-100 text-red-800 ml-2">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2 md:mt-0">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Ver Todas as Atividades
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default AdminDashboard 