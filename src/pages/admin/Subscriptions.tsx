import { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Calendar,
  BadgeDollarSign,
  BarChart3,
  UserPlus,
  ArrowUpDown,
  Plus,
  ArrowUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

// Definição dos tipos
type SubscriptionPlan = {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
}

type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid'

type Subscription = {
  id: string
  userId: string
  userName: string
  userEmail: string
  planId: string
  planName: string
  status: SubscriptionStatus
  startDate: string
  endDate: string
  renewalDate: string
  amount: number
  interval: 'monthly' | 'yearly'
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix'
  lastPayment: string
  createdAt: string
}

const Subscriptions = () => {
  // Planos fictícios
  const [plans] = useState<SubscriptionPlan[]>([
    {
      id: 'basic',
      name: 'Plano Básico',
      price: 19.90,
      interval: 'monthly',
      features: ['Acesso a conteúdo básico', 'Calendário escolar', 'Até 2 filhos por conta']
    },
    {
      id: 'standard',
      name: 'Plano Família',
      price: 29.90,
      interval: 'monthly',
      features: ['Acesso a todo conteúdo', 'Calendário escolar', 'Até 5 filhos por conta', 'Relatórios de progresso']
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 249.90,
      interval: 'yearly',
      features: ['Acesso a todo conteúdo', 'Calendário escolar', 'Filhos ilimitados', 'Relatórios de progresso', 'Suporte prioritário']
    }
  ])

  // Assinaturas fictícias
  const [subscriptions] = useState<Subscription[]>([
    {
      id: 'sub_1',
      userId: 'user_1',
      userName: 'João Silva',
      userEmail: 'joao.silva@example.com',
      planId: 'standard',
      planName: 'Plano Família',
      status: 'active',
      startDate: '10/01/2023',
      endDate: '',
      renewalDate: '10/06/2023',
      amount: 29.90,
      interval: 'monthly',
      paymentMethod: 'credit_card',
      lastPayment: '10/05/2023',
      createdAt: '10/01/2023'
    },
    {
      id: 'sub_2',
      userId: 'user_2',
      userName: 'Maria Oliveira',
      userEmail: 'maria.oliveira@example.com',
      planId: 'premium',
      planName: 'Plano Premium',
      status: 'active',
      startDate: '15/02/2023',
      endDate: '',
      renewalDate: '15/02/2024',
      amount: 249.90,
      interval: 'yearly',
      paymentMethod: 'pix',
      lastPayment: '15/02/2023',
      createdAt: '15/02/2023'
    },
    {
      id: 'sub_3',
      userId: 'user_3',
      userName: 'Pedro Santos',
      userEmail: 'pedro.santos@example.com',
      planId: 'basic',
      planName: 'Plano Básico',
      status: 'past_due',
      startDate: '05/03/2023',
      endDate: '',
      renewalDate: '05/06/2023',
      amount: 19.90,
      interval: 'monthly',
      paymentMethod: 'credit_card',
      lastPayment: '05/03/2023',
      createdAt: '05/03/2023'
    },
    {
      id: 'sub_4',
      userId: 'user_4',
      userName: 'Ana Souza',
      userEmail: 'ana.souza@example.com',
      planId: 'standard',
      planName: 'Plano Família',
      status: 'canceled',
      startDate: '20/01/2023',
      endDate: '20/04/2023',
      renewalDate: '',
      amount: 29.90,
      interval: 'monthly',
      paymentMethod: 'debit_card',
      lastPayment: '20/03/2023',
      createdAt: '20/01/2023'
    },
    {
      id: 'sub_5',
      userId: 'user_5',
      userName: 'Lucas Mendes',
      userEmail: 'lucas.mendes@example.com',
      planId: 'basic',
      planName: 'Plano Básico',
      status: 'trialing',
      startDate: '01/05/2023',
      endDate: '',
      renewalDate: '01/06/2023',
      amount: 0,
      interval: 'monthly',
      paymentMethod: 'credit_card',
      lastPayment: '',
      createdAt: '01/05/2023'
    },
    {
      id: 'sub_6',
      userId: 'user_6',
      userName: 'Juliana Costa',
      userEmail: 'juliana.costa@example.com',
      planId: 'premium',
      planName: 'Plano Premium',
      status: 'active',
      startDate: '12/12/2022',
      endDate: '',
      renewalDate: '12/12/2023',
      amount: 249.90,
      interval: 'yearly',
      paymentMethod: 'bank_transfer',
      lastPayment: '12/12/2022',
      createdAt: '12/12/2022'
    },
    {
      id: 'sub_7',
      userId: 'user_7',
      userName: 'Roberto Alves',
      userEmail: 'roberto.alves@example.com',
      planId: 'standard',
      planName: 'Plano Família',
      status: 'unpaid',
      startDate: '18/02/2023',
      endDate: '',
      renewalDate: '18/05/2023',
      amount: 29.90,
      interval: 'monthly',
      paymentMethod: 'pix',
      lastPayment: '18/03/2023',
      createdAt: '18/02/2023'
    },
    {
      id: 'sub_8',
      userId: 'user_8',
      userName: 'Camila Pereira',
      userEmail: 'camila.pereira@example.com',
      planId: 'standard',
      planName: 'Plano Família',
      status: 'active',
      startDate: '25/03/2023',
      endDate: '',
      renewalDate: '25/06/2023',
      amount: 29.90,
      interval: 'monthly',
      paymentMethod: 'credit_card',
      lastPayment: '25/04/2023',
      createdAt: '25/03/2023'
    }
  ])

  // Estados para pesquisa e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  
  // Estado para ordenação
  const [sortField, setSortField] = useState<keyof Subscription>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Função para obter o texto e cor do status
  const getStatusInfo = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return { 
          label: 'Ativa', 
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />
        }
      case 'canceled':
        return { 
          label: 'Cancelada', 
          color: 'bg-gray-100 text-gray-800',
          icon: <XCircle className="h-4 w-4 text-gray-600" /> 
        }
      case 'past_due':
        return { 
          label: 'Atrasada', 
          color: 'bg-orange-100 text-orange-800',
          icon: <AlertCircle className="h-4 w-4 text-orange-600" />
        }
      case 'trialing':
        return { 
          label: 'Período de Teste', 
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock className="h-4 w-4 text-blue-600" />
        }
      case 'unpaid':
        return { 
          label: 'Não Paga', 
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-4 w-4 text-red-600" />
        }
      default:
        return { 
          label: status, 
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="h-4 w-4" />
        }
    }
  }

  // Filtragem de assinaturas
  const filteredSubscriptions = subscriptions.filter(subscription => {
    // Filtro de pesquisa
    const matchesSearch = 
      subscription.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter
    
    // Filtro de plano
    const matchesPlan = planFilter === 'all' || subscription.planId === planFilter
    
    return matchesSearch && matchesStatus && matchesPlan
  })
  
  // Ordenação de assinaturas
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (sortField === 'amount') {
      return sortDirection === 'asc' 
        ? a[sortField] - b[sortField] 
        : b[sortField] - a[sortField]
    }
    
    return sortDirection === 'asc'
      ? a[sortField].localeCompare(b[sortField])
      : b[sortField].localeCompare(a[sortField])
  })
  
  // Função para alternar o campo de ordenação
  const toggleSort = (field: keyof Subscription) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Estatísticas de assinaturas
  const subscriptionStats = {
    total: subscriptions.length,
    active: subscriptions.filter(sub => sub.status === 'active').length,
    canceled: subscriptions.filter(sub => sub.status === 'canceled').length,
    trial: subscriptions.filter(sub => sub.status === 'trialing').length,
    pastDue: subscriptions.filter(sub => sub.status === 'past_due').length,
    unpaid: subscriptions.filter(sub => sub.status === 'unpaid').length,
    monthlyRevenue: subscriptions
      .filter(sub => sub.status === 'active' && sub.interval === 'monthly')
      .reduce((sum, sub) => sum + sub.amount, 0),
    yearlyRevenue: subscriptions
      .filter(sub => sub.status === 'active' && sub.interval === 'yearly')
      .reduce((sum, sub) => sum + (sub.amount / 12), 0),
  }

  const totalMRR = subscriptionStats.monthlyRevenue + subscriptionStats.yearlyRevenue

  // Obter o ícone para o método de pagamento
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4 text-gray-600" />
      case 'bank_transfer':
        return <BadgeDollarSign className="h-4 w-4 text-gray-600" />
      case 'pix':
        return <img src="/pix-icon.svg" alt="Pix" className="h-4 w-4" onError={(e) => {
          e.currentTarget.src = '';
          e.currentTarget.style.display = 'none';
        }} />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Assinaturas</h1>
          <p className="text-gray-500">Gerencie os planos e assinaturas dos usuários</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus size={16} />
          Nova Assinatura
        </Button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-edu-blue-100">
              <Users className="h-5 w-5 text-edu-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Assinantes</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{subscriptionStats.total}</p>
                <p className="text-sm text-green-600">{subscriptionStats.active} ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <BadgeDollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Receita Mensal (MRR)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">R$ {totalMRR.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em Período de Teste</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{subscriptionStats.trial}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Problemas de Pagamento</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{subscriptionStats.pastDue + subscriptionStats.unpaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="subscriptions" className="mb-6">
        <TabsList className="mb-6">
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscriptions">
          {/* Ferramentas de pesquisa e filtro */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center">
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Todos os status</option>
                      <option value="active">Ativas</option>
                      <option value="canceled">Canceladas</option>
                      <option value="past_due">Atrasadas</option>
                      <option value="trialing">Em teste</option>
                      <option value="unpaid">Não pagas</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                    >
                      <option value="all">Todos os planos</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter size={16} />
                    Mais Filtros
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download size={16} />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de assinaturas */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Assinaturas</CardTitle>
              <CardDescription>
                {filteredSubscriptions.length} assinaturas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('userName')}
                        >
                          Usuário
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        Plano
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('status')}
                        >
                          Status
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('startDate')}
                        >
                          Data Início
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('renewalDate')}
                        >
                          Renovação
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('amount')}
                        >
                          Valor
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </button>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                        Pagamento
                      </th>
                      <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubscriptions.map((subscription) => {
                      const statusInfo = getStatusInfo(subscription.status)
                      
                      return (
                        <tr key={subscription.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{subscription.userName}</span>
                              <span className="text-sm text-gray-500">{subscription.userEmail}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{subscription.planName}</span>
                              <span className="text-sm text-gray-500">
                                {subscription.interval === 'monthly' ? 'Mensal' : 'Anual'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Badge className={statusInfo.color}>
                                {statusInfo.icon}
                                <span className="ml-1">{statusInfo.label}</span>
                              </Badge>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {subscription.startDate}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {subscription.renewalDate || '-'}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {subscription.amount > 0 ? `R$ ${subscription.amount.toFixed(2)}` : 'Grátis'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(subscription.paymentMethod)}
                              <span className="text-sm text-gray-600 capitalize">
                                {subscription.paymentMethod === 'credit_card' 
                                  ? 'Cartão de Crédito' 
                                  : subscription.paymentMethod === 'debit_card'
                                    ? 'Cartão de Débito'
                                    : subscription.paymentMethod === 'bank_transfer'
                                      ? 'Transferência'
                                      : 'Pix'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                className="p-1 rounded-md text-gray-500 hover:text-edu-blue-700 hover:bg-edu-blue-50"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="p-1 rounded-md text-gray-500 hover:text-red-700 hover:bg-red-50"
                                title="Cancelar"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button 
                                className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                title="Mais opções"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {sortedSubscriptions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">
                          Nenhuma assinatura encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {sortedSubscriptions.length} de {filteredSubscriptions.length} assinaturas
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.interval === 'monthly' ? 'Cobrança mensal' : 'Cobrança anual'}
                  </CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm">
                      {plan.interval === 'monthly' ? '/mês' : '/ano'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1">Editar</Button>
                  <Button className="flex-1">Gerenciar</Button>
                </CardFooter>
              </Card>
            ))}

            {/* Card para adicionar novo plano */}
            <Card className="flex flex-col border-dashed border-2 border-gray-300 bg-gray-50">
              <CardContent className="flex items-center justify-center flex-grow py-10">
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus size={18} />
                  Adicionar Novo Plano
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise de Assinaturas</CardTitle>
                  <CardDescription>Métricas e tendências de crescimento</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="last30days">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                      <SelectItem value="lastYear">Último ano</SelectItem>
                      <SelectItem value="allTime">Todo o período</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm text-gray-500">MRR (Receita Mensal Recorrente)</div>
                    <div className="text-2xl font-bold">R$ {totalMRR.toFixed(2)}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <ArrowUp size={12} />
                      8.2% vs mês anterior
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm text-gray-500">Novos Assinantes</div>
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <ArrowUp size={12} />
                      12.5% vs mês anterior
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm text-gray-500">Churn Rate</div>
                    <div className="text-2xl font-bold">2.4%</div>
                    <div className="text-xs text-red-600 flex items-center gap-1">
                      <ArrowUp size={12} />
                      0.3% vs mês anterior
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Crescimento da Receita</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>Gráfico de análise de crescimento disponível na versão completa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Distribuição por Plano</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {plans.map((plan) => {
                        const count = subscriptions.filter(sub => sub.planId === plan.id && sub.status !== 'canceled').length
                        const percentage = (count / subscriptionStats.total) * 100
                        
                        return (
                          <div key={plan.id}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{plan.name}</span>
                              <span className="text-sm text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-edu-blue-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {['active', 'trialing', 'past_due', 'unpaid', 'canceled'].map((status) => {
                        const statusInfo = getStatusInfo(status as SubscriptionStatus)
                        const count = subscriptions.filter(sub => sub.status === status).length
                        const percentage = (count / subscriptionStats.total) * 100
                        
                        return (
                          <div key={status}>
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {statusInfo.icon}
                                <span className="text-sm font-medium">{statusInfo.label}</span>
                              </div>
                              <span className="text-sm text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 
                                  status === 'trialing' ? 'bg-blue-500' : 
                                  status === 'past_due' ? 'bg-orange-500' : 
                                  status === 'unpaid' ? 'bg-red-500' : 'bg-gray-500'}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Subscriptions 