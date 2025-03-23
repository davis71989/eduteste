import { useState } from 'react'
import { 
  User, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// Tipo para usuários
type UserType = {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  plan: 'básico' | 'familiar' | 'premium'
  children: number
  dateJoined: string
  lastLogin: string
  avatarUrl?: string
}

const statusLabels = {
  active: { label: 'Ativo', class: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', class: 'bg-gray-100 text-gray-800' }
}

const planLabels = {
  'básico': { label: 'Básico', class: 'bg-blue-100 text-blue-800' },
  'familiar': { label: 'Familiar', class: 'bg-purple-100 text-purple-800' },
  'premium': { label: 'Premium', class: 'bg-yellow-100 text-yellow-800' }
}

const UsersPage = () => {
  // Dados fictícios de usuários
  const [users] = useState<UserType[]>([
    { 
      id: '1', 
      name: 'João Paulo Silva', 
      email: 'joao.silva@exemplo.com', 
      status: 'active', 
      plan: 'familiar', 
      children: 2, 
      dateJoined: '15/01/2023', 
      lastLogin: '21/03/2023',
      avatarUrl: '/avatar-placeholder.png'
    },
    { 
      id: '2', 
      name: 'Maria Oliveira', 
      email: 'maria.oliveira@exemplo.com', 
      status: 'active', 
      plan: 'premium', 
      children: 3, 
      dateJoined: '22/02/2023', 
      lastLogin: '21/03/2023' 
    },
    { 
      id: '3', 
      name: 'Carlos Santos', 
      email: 'carlos.santos@exemplo.com', 
      status: 'inactive', 
      plan: 'básico', 
      children: 1, 
      dateJoined: '03/12/2022', 
      lastLogin: '18/02/2023' 
    },
    { 
      id: '4', 
      name: 'Ana Beatriz Costa', 
      email: 'ana.costa@exemplo.com', 
      status: 'active', 
      plan: 'básico', 
      children: 2, 
      dateJoined: '10/03/2023', 
      lastLogin: '20/03/2023' 
    },
    { 
      id: '5', 
      name: 'Roberto Alves', 
      email: 'roberto.alves@exemplo.com', 
      status: 'active', 
      plan: 'familiar', 
      children: 2, 
      dateJoined: '05/01/2023', 
      lastLogin: '15/03/2023' 
    },
    { 
      id: '6', 
      name: 'Patricia Mendes', 
      email: 'patricia.mendes@exemplo.com', 
      status: 'inactive', 
      plan: 'básico', 
      children: 1, 
      dateJoined: '12/12/2022', 
      lastLogin: '10/01/2023' 
    },
    { 
      id: '7', 
      name: 'Fernando Gomes', 
      email: 'fernando.gomes@exemplo.com', 
      status: 'active', 
      plan: 'premium', 
      children: 3, 
      dateJoined: '20/02/2023', 
      lastLogin: '19/03/2023' 
    },
    { 
      id: '8', 
      name: 'Luciana Martins', 
      email: 'luciana.martins@exemplo.com', 
      status: 'active', 
      plan: 'familiar', 
      children: 2, 
      dateJoined: '08/03/2023', 
      lastLogin: '21/03/2023' 
    }
  ])

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Filtragem de usuários
  const filteredUsers = users.filter(user => {
    // Filtro de pesquisa
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    
    // Filtro de plano
    const matchesPlan = planFilter === 'all' || user.plan === planFilter
    
    return matchesSearch && matchesStatus && matchesPlan
  })
  
  // Paginação
  const indexOfLastUser = currentPage * itemsPerPage
  const indexOfFirstUser = indexOfLastUser - itemsPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Resumo dos usuários
  const userSummary = {
    total: users.length,
    active: users.filter(user => user.status === 'active').length,
    inactive: users.filter(user => user.status === 'inactive').length,
    basicPlan: users.filter(user => user.plan === 'básico').length,
    familyPlan: users.filter(user => user.plan === 'familiar').length,
    premiumPlan: users.filter(user => user.plan === 'premium').length
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Gerenciamento de Usuários</h1>
          <p className="text-gray-500">Visualize e gerencie todos os usuários do sistema.</p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus size={16} />
          Adicionar Usuário
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100">
              <User className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Usuários</p>
              <p className="text-2xl font-bold">{userSummary.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuários Ativos</p>
              <p className="text-2xl font-bold">{userSummary.active}</p>
              <p className="text-xs text-gray-500">({Math.round((userSummary.active / userSummary.total) * 100)}% do total)</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <XCircle className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuários Inativos</p>
              <p className="text-2xl font-bold">{userSummary.inactive}</p>
              <p className="text-xs text-gray-500">({Math.round((userSummary.inactive / userSummary.total) * 100)}% do total)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ferramentas de pesquisa e filtro */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                >
                  <option value="all">Todos os planos</option>
                  <option value="básico">Básico</option>
                  <option value="familiar">Familiar</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Filter size={16} />
                Filtros
              </Button>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Download size={16} />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuários encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Nome</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Plano</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Filhos</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Data de Cadastro</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Último Acesso</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{user.email}</td>
                    <td className="py-4 px-4">
                      <Badge className={statusLabels[user.status].class}>
                        {statusLabels[user.status].label}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={planLabels[user.plan].class}>
                        {planLabels[user.plan].label}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">{user.children}</td>
                    <td className="py-4 px-4 text-gray-600">{user.dateJoined}</td>
                    <td className="py-4 px-4 text-gray-600">{user.lastLogin}</td>
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
                          title="Excluir"
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
                ))}

                {currentUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuários
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
      </Card>
    </div>
  )
}

export default UsersPage 