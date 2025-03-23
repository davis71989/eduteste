import { useState } from 'react'
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Reply,
  Tag
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

// Tipos
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketCategory = 'account' | 'billing' | 'technical' | 'content' | 'feedback' | 'other'

type Ticket = {
  id: string
  subject: string
  message: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  dateCreated: string
  lastUpdated: string
  assignedTo?: string
  responses: TicketResponse[]
}

type TicketResponse = {
  id: string
  ticketId: string
  message: string
  createdBy: string
  createdByName: string
  createdByAvatar?: string
  isStaff: boolean
  dateCreated: string
}

// Status formatados
const statusInfo = {
  open: { 
    label: 'Aberto', 
    class: 'bg-blue-100 text-blue-800',
    icon: <MessageSquare className="h-4 w-4 text-blue-500" />
  },
  in_progress: { 
    label: 'Em Andamento', 
    class: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-4 w-4 text-yellow-500" />
  },
  resolved: { 
    label: 'Resolvido', 
    class: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-4 w-4 text-green-500" />
  },
  closed: { 
    label: 'Fechado', 
    class: 'bg-gray-100 text-gray-800',
    icon: <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

// Prioridades formatadas
const priorityInfo = {
  low: { 
    label: 'Baixa', 
    class: 'bg-green-100 text-green-800' 
  },
  medium: { 
    label: 'Média', 
    class: 'bg-blue-100 text-blue-800' 
  },
  high: { 
    label: 'Alta', 
    class: 'bg-orange-100 text-orange-800' 
  },
  urgent: { 
    label: 'Urgente', 
    class: 'bg-red-100 text-red-800' 
  }
}

// Categorias formatadas
const categoryInfo = {
  account: { 
    label: 'Conta', 
    class: 'bg-purple-100 text-purple-800' 
  },
  billing: { 
    label: 'Pagamento', 
    class: 'bg-indigo-100 text-indigo-800' 
  },
  technical: { 
    label: 'Técnico', 
    class: 'bg-blue-100 text-blue-800' 
  },
  content: { 
    label: 'Conteúdo', 
    class: 'bg-green-100 text-green-800' 
  },
  feedback: { 
    label: 'Feedback', 
    class: 'bg-yellow-100 text-yellow-800' 
  },
  other: { 
    label: 'Outros', 
    class: 'bg-gray-100 text-gray-800' 
  }
}

const Support = () => {
  // Dados fictícios de tickets
  const [tickets] = useState<Ticket[]>([
    {
      id: '1',
      subject: 'Problema ao acessar página de tarefas',
      message: 'Não consigo visualizar a página de tarefas do meu filho. Aparece uma tela branca.',
      status: 'open',
      priority: 'medium',
      category: 'technical',
      userId: 'user1',
      userName: 'Maria Oliveira',
      userEmail: 'maria.oliveira@exemplo.com',
      dateCreated: '21/03/2023 14:35',
      lastUpdated: '21/03/2023 14:35',
      responses: []
    },
    {
      id: '2',
      subject: 'Dúvida sobre cobrança',
      message: 'Fui cobrado duas vezes no mês de março. Gostaria de solicitar o reembolso de uma das cobranças.',
      status: 'in_progress',
      priority: 'high',
      category: 'billing',
      userId: 'user2',
      userName: 'João Silva',
      userEmail: 'joao.silva@exemplo.com',
      dateCreated: '20/03/2023 10:22',
      lastUpdated: '21/03/2023 09:15',
      assignedTo: 'Carlos Financeiro',
      responses: [
        {
          id: 'resp1',
          ticketId: '2',
          message: 'Estamos verificando o problema com nossa equipe financeira. Por favor, poderia informar os detalhes do seu cartão (últimos 4 dígitos) e as datas das cobranças?',
          createdBy: 'staff1',
          createdByName: 'Carlos Financeiro',
          isStaff: true,
          dateCreated: '20/03/2023 11:45'
        },
        {
          id: 'resp2',
          ticketId: '2',
          message: 'Os últimos dígitos do cartão são 3456. As cobranças foram nos dias 01/03 e 15/03, ambas de R$ 29,90.',
          createdBy: 'user2',
          createdByName: 'João Silva',
          isStaff: false,
          dateCreated: '21/03/2023 09:15'
        }
      ]
    },
    {
      id: '3',
      subject: 'Conteúdo inapropriado detectado',
      message: 'Encontrei um erro ortográfico em uma atividade de português para o 5º ano.',
      status: 'resolved',
      priority: 'low',
      category: 'content',
      userId: 'user3',
      userName: 'Ana Costa',
      userEmail: 'ana.costa@exemplo.com',
      dateCreated: '15/03/2023 16:50',
      lastUpdated: '18/03/2023 10:30',
      assignedTo: 'Pedro Conteúdo',
      responses: [
        {
          id: 'resp3',
          ticketId: '3',
          message: 'Obrigado por reportar! Pode nos informar exatamente em qual atividade e onde está o erro?',
          createdBy: 'staff2',
          createdByName: 'Pedro Conteúdo',
          isStaff: true,
          dateCreated: '16/03/2023 09:20'
        },
        {
          id: 'resp4',
          ticketId: '3',
          message: 'É na atividade "Verbos no tempo presente", na terceira questão. A palavra "fazemos" está escrita como "fazemo".',
          createdBy: 'user3',
          createdByName: 'Ana Costa',
          isStaff: false,
          dateCreated: '16/03/2023 14:35'
        },
        {
          id: 'resp5',
          ticketId: '3',
          message: 'Corrigimos o erro. Muito obrigado por nos ajudar a melhorar o conteúdo!',
          createdBy: 'staff2',
          createdByName: 'Pedro Conteúdo',
          isStaff: true,
          dateCreated: '18/03/2023 10:30'
        }
      ]
    },
    {
      id: '4',
      subject: 'Feedback sobre nova funcionalidade',
      message: 'Adorei a nova funcionalidade de calendário escolar! Seria possível adicionar opção para sincronizar com Google Calendar?',
      status: 'open',
      priority: 'low',
      category: 'feedback',
      userId: 'user4',
      userName: 'Roberto Alves',
      userEmail: 'roberto.alves@exemplo.com',
      dateCreated: '19/03/2023 18:15',
      lastUpdated: '19/03/2023 18:15',
      responses: []
    },
    {
      id: '5',
      subject: 'Não consigo redefinir minha senha',
      message: 'Solicitei redefinição de senha mas não recebi o email. Já verifiquei a pasta de spam e não está lá.',
      status: 'closed',
      priority: 'medium',
      category: 'account',
      userId: 'user5',
      userName: 'Fernanda Santos',
      userEmail: 'fernanda.santos@exemplo.com',
      dateCreated: '10/03/2023 08:45',
      lastUpdated: '12/03/2023 15:20',
      assignedTo: 'Marcos Suporte',
      responses: [
        {
          id: 'resp6',
          ticketId: '5',
          message: 'Verificamos seu caso e enviamos novamente o email de redefinição. Por favor, confirme se recebeu.',
          createdBy: 'staff3',
          createdByName: 'Marcos Suporte',
          isStaff: true,
          dateCreated: '10/03/2023 09:30'
        },
        {
          id: 'resp7',
          ticketId: '5',
          message: 'Recebi e consegui redefinir a senha. Muito obrigada pela ajuda!',
          createdBy: 'user5',
          createdByName: 'Fernanda Santos',
          isStaff: false,
          dateCreated: '10/03/2023 10:15'
        },
        {
          id: 'resp8',
          ticketId: '5',
          message: 'Ótimo! Estamos fechando este ticket. Se precisar de mais ajuda, é só abrir um novo chamado.',
          createdBy: 'staff3',
          createdByName: 'Marcos Suporte',
          isStaff: true,
          dateCreated: '12/03/2023 15:20'
        }
      ]
    },
    {
      id: '6',
      subject: 'Sugestão de nova matéria',
      message: 'Gostaria de sugerir a inclusão de conteúdos sobre educação financeira para crianças.',
      status: 'in_progress',
      priority: 'medium',
      category: 'content',
      userId: 'user6',
      userName: 'Paulo Mendes',
      userEmail: 'paulo.mendes@exemplo.com',
      dateCreated: '18/03/2023 11:25',
      lastUpdated: '19/03/2023 14:30',
      assignedTo: 'Camila Conteúdo',
      responses: [
        {
          id: 'resp9',
          ticketId: '6',
          message: 'Obrigada pela sugestão! Estamos justamente planejando uma seção de educação financeira. Você teria sugestões específicas de tópicos?',
          createdBy: 'staff4',
          createdByName: 'Camila Conteúdo',
          isStaff: true,
          dateCreated: '19/03/2023 14:30'
        }
      ]
    }
  ])

  // Estado para pesquisa e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Estado para ticket selecionado
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [responseText, setResponseText] = useState('')

  // Filtragem de tickets
  const filteredTickets = tickets.filter(ticket => {
    // Filtro de pesquisa
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    
    // Filtro de prioridade
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    
    // Filtro de categoria
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })
  
  // Ordenação de tickets (mais recentes primeiro)
  const sortedTickets = [...filteredTickets].sort((a, b) => 
    new Date(b.lastUpdated.split(' ')[0].split('/').reverse().join('-')).getTime() - 
    new Date(a.lastUpdated.split(' ')[0].split('/').reverse().join('-')).getTime()
  )
  
  // Paginação
  const indexOfLastTicket = currentPage * itemsPerPage
  const indexOfFirstTicket = indexOfLastTicket - itemsPerPage
  const currentTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket)
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage)
  
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Estatísticas de tickets
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(ticket => ticket.status === 'open').length,
    inProgress: tickets.filter(ticket => ticket.status === 'in_progress').length,
    resolved: tickets.filter(ticket => ticket.status === 'resolved').length,
    closed: tickets.filter(ticket => ticket.status === 'closed').length,
    highPriority: tickets.filter(ticket => ticket.priority === 'high' || ticket.priority === 'urgent').length
  }

  // Função para visualizar um ticket
  const viewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
  }

  // Função para enviar resposta (simulada)
  const sendResponse = () => {
    if (selectedTicket && responseText.trim()) {
      alert(`Resposta enviada ao ticket #${selectedTicket.id}: ${responseText}`)
      setResponseText('')
      // Em um sistema real, aqui você enviaria a resposta para o servidor
      // e atualizaria o estado local após a confirmação
    }
  }

  // Função para fechar visualização de ticket
  const closeTicketView = () => {
    setSelectedTicket(null)
    setResponseText('')
  }

  // Função para atualizar status de um ticket (simulada)
  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    alert(`Status do ticket #${ticketId} atualizado para: ${statusInfo[newStatus].label}`)
    // Em um sistema real, aqui você enviaria a atualização para o servidor
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Suporte e Atendimento</h1>
          <p className="text-gray-500">Gerencie solicitações de suporte dos usuários</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <MessageSquare className="h-8 w-8 text-gray-500 mb-2" />
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{ticketStats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-blue-500 mb-2">
              {statusInfo.open.icon}
            </div>
            <p className="text-sm text-gray-500">Abertos</p>
            <p className="text-2xl font-bold">{ticketStats.open}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-yellow-500 mb-2">
              {statusInfo.in_progress.icon}
            </div>
            <p className="text-sm text-gray-500">Em Andamento</p>
            <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-green-500 mb-2">
              {statusInfo.resolved.icon}
            </div>
            <p className="text-sm text-gray-500">Resolvidos</p>
            <p className="text-2xl font-bold">{ticketStats.resolved}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="text-gray-500 mb-2">
              {statusInfo.closed.icon}
            </div>
            <p className="text-sm text-gray-500">Fechados</p>
            <p className="text-2xl font-bold">{ticketStats.closed}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-gray-500">Alta Prioridade</p>
            <p className="text-2xl font-bold">{ticketStats.highPriority}</p>
          </CardContent>
        </Card>
      </div>

      {/* Interface principal */}
      <div className="space-y-6">
        {selectedTicket ? (
          <div className="space-y-6">
            {/* Cabeçalho do ticket */}
            <div className="flex justify-between items-start">
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-2"
                  onClick={closeTicketView}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge className={statusInfo[selectedTicket.status].class}>
                    {statusInfo[selectedTicket.status].icon}
                    <span className="ml-1">{statusInfo[selectedTicket.status].label}</span>
                  </Badge>
                  <Badge className={priorityInfo[selectedTicket.priority].class}>
                    {priorityInfo[selectedTicket.priority].label}
                  </Badge>
                  <Badge className={categoryInfo[selectedTicket.category].class}>
                    {categoryInfo[selectedTicket.category].label}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={selectedTicket.status}
                  onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
                
                <Button variant="outline" size="sm">
                  <Edit className="mr-1 h-4 w-4" /> Editar
                </Button>
              </div>
            </div>
            
            {/* Detalhes do ticket */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={selectedTicket.userAvatar} alt={selectedTicket.userName} />
                    <AvatarFallback>{selectedTicket.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-medium">{selectedTicket.userName}</span>
                        <span className="text-gray-500 text-sm ml-2">{selectedTicket.userEmail}</span>
                      </div>
                      <span className="text-xs text-gray-500">{selectedTicket.dateCreated}</span>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Ticket #{selectedTicket.id}
                      {selectedTicket.assignedTo && (
                        <span className="ml-2">Atribuído para: {selectedTicket.assignedTo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Histórico de respostas */}
            {selectedTicket.responses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Histórico de Respostas</h3>
                {selectedTicket.responses.map((response) => (
                  <Card key={response.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={response.createdByAvatar} alt={response.createdByName} />
                          <AvatarFallback>{response.createdByName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium">{response.createdByName}</span>
                              {response.isStaff && (
                                <Badge className="ml-2 bg-edu-blue-100 text-edu-blue-800">Equipe</Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{response.dateCreated}</span>
                          </div>
                          
                          <div className={`p-4 rounded-lg ${response.isStaff ? 'bg-edu-blue-50' : 'bg-gray-50'}`}>
                            <p className="whitespace-pre-wrap">{response.message}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Formulário de resposta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Responder</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Digite sua resposta..."
                  className="min-h-32"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  <Button variant="outline" size="sm" className="mr-2">
                    Anexar Arquivo
                  </Button>
                  <Button variant="outline" size="sm">
                    Modelos de Resposta
                  </Button>
                </div>
                <Button onClick={sendResponse} disabled={!responseText.trim()}>
                  <Reply className="mr-2 h-4 w-4" />
                  Enviar Resposta
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div>
            {/* Ferramentas de pesquisa e filtro */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por assunto, usuário ou conteúdo..."
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
                        <option value="open">Abertos</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="resolved">Resolvidos</option>
                        <option value="closed">Fechados</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <select
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="all">Todas as prioridades</option>
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <select
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="all">Todas as categorias</option>
                        <option value="account">Conta</option>
                        <option value="billing">Pagamento</option>
                        <option value="technical">Técnico</option>
                        <option value="content">Conteúdo</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Outros</option>
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

            {/* Lista de tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets de Suporte</CardTitle>
                <CardDescription>
                  {filteredTickets.length} tickets encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentTickets.length > 0 ? (
                  <div className="space-y-4">
                    {currentTickets.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => viewTicket(ticket)}
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <div className="flex gap-2">
                            <Badge className={statusInfo[ticket.status].class}>
                              {statusInfo[ticket.status].label}
                            </Badge>
                            <Badge className={priorityInfo[ticket.priority].class}>
                              {priorityInfo[ticket.priority].label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-gray-600 line-clamp-2">
                          {ticket.message}
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.userAvatar} alt={ticket.userName} />
                              <AvatarFallback className="text-xs">{ticket.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{ticket.userName}</span>
                            <Badge className={categoryInfo[ticket.category].class + " text-xs"}>
                              {categoryInfo[ticket.category].label}
                            </Badge>
                          </div>
                          
                          <div className="text-gray-500 text-xs">
                            <span>Atualizado: {ticket.lastUpdated}</span>
                            <span className="ml-2">Ticket #{ticket.id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum ticket encontrado com os filtros atuais.
                  </div>
                )}
              </CardContent>
              {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, filteredTickets.length)} de {filteredTickets.length} tickets
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Support 