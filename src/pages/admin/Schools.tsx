import { useState } from 'react'
import { 
  School, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Search, 
  Filter, 
  Download,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

// Tipo para escolas
type SchoolType = {
  id: string
  name: string
  type: 'pública' | 'privada'
  location: {
    city: string
    state: string
    address: string
    coordinates: [number, number] // latitude, longitude
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  stats: {
    students: number
    parents: number
    content: number
  }
  dateAdded: string
}

const SchoolsPage = () => {
  // Dados fictícios de escolas
  const [schools] = useState<SchoolType[]>([
    {
      id: '1',
      name: 'Escola Municipal São José',
      type: 'pública',
      location: {
        city: 'São Paulo',
        state: 'SP',
        address: 'Rua das Flores, 123',
        coordinates: [-23.550520, -46.633308]
      },
      contact: {
        phone: '(11) 3456-7890',
        email: 'contato@saojose.edu.br',
        website: 'www.escaolasaojose.edu.br'
      },
      stats: {
        students: 850,
        parents: 620,
        content: 245
      },
      dateAdded: '10/01/2023'
    },
    {
      id: '2',
      name: 'Colégio Estadual Monteiro Lobato',
      type: 'pública',
      location: {
        city: 'Rio de Janeiro',
        state: 'RJ',
        address: 'Av. Brasil, 1500',
        coordinates: [-22.9068, -43.1729]
      },
      contact: {
        phone: '(21) 3456-7890',
        email: 'contato@monteirolobato.edu.br'
      },
      stats: {
        students: 1200,
        parents: 850,
        content: 320
      },
      dateAdded: '15/01/2023'
    },
    {
      id: '3',
      name: 'Colégio São Francisco',
      type: 'privada',
      location: {
        city: 'Belo Horizonte',
        state: 'MG',
        address: 'Rua dos Ipês, 500',
        coordinates: [-19.9167, -43.9345]
      },
      contact: {
        phone: '(31) 3456-7890',
        email: 'contato@saofrancisco.edu.br',
        website: 'www.colegiosaofrancisco.edu.br'
      },
      stats: {
        students: 650,
        parents: 520,
        content: 180
      },
      dateAdded: '22/01/2023'
    },
    {
      id: '4',
      name: 'Instituto Educacional Novo Horizonte',
      type: 'privada',
      location: {
        city: 'Curitiba',
        state: 'PR',
        address: 'Av. das Araucárias, 789',
        coordinates: [-25.4290, -49.2671]
      },
      contact: {
        phone: '(41) 3456-7890',
        email: 'contato@novohorizonte.edu.br',
        website: 'www.novohorizonte.edu.br'
      },
      stats: {
        students: 480,
        parents: 390,
        content: 150
      },
      dateAdded: '05/02/2023'
    },
    {
      id: '5',
      name: 'Escola Estadual Castro Alves',
      type: 'pública',
      location: {
        city: 'Salvador',
        state: 'BA',
        address: 'Rua do Sol, 456',
        coordinates: [-12.9714, -38.5014]
      },
      contact: {
        phone: '(71) 3456-7890',
        email: 'contato@castroalves.edu.br'
      },
      stats: {
        students: 920,
        parents: 720,
        content: 280
      },
      dateAdded: '18/02/2023'
    },
    {
      id: '6',
      name: 'Colégio Dom Pedro II',
      type: 'privada',
      location: {
        city: 'Recife',
        state: 'PE',
        address: 'Av. Boa Viagem, 1000',
        coordinates: [-8.0476, -34.8770]
      },
      contact: {
        phone: '(81) 3456-7890',
        email: 'contato@dompedro.edu.br',
        website: 'www.colegiodompedro.edu.br'
      },
      stats: {
        students: 750,
        parents: 580,
        content: 210
      },
      dateAdded: '25/02/2023'
    }
  ])

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado para filtro de tipo
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  
  // Filtragem de escolas
  const filteredSchools = schools.filter(school => {
    // Filtro de pesquisa
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.location.state.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de tipo
    const matchesType = typeFilter === 'all' || school.type === typeFilter
    
    return matchesSearch && matchesType
  })
  
  // Paginação
  const indexOfLastSchool = currentPage * itemsPerPage
  const indexOfFirstSchool = indexOfLastSchool - itemsPerPage
  const currentSchools = filteredSchools.slice(indexOfFirstSchool, indexOfLastSchool)
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage)
  
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Calculando totais para estatísticas
  const schoolStats = {
    totalSchools: schools.length,
    publicSchools: schools.filter(school => school.type === 'pública').length,
    privateSchools: schools.filter(school => school.type === 'privada').length,
    totalStudents: schools.reduce((acc, school) => acc + school.stats.students, 0),
    totalParents: schools.reduce((acc, school) => acc + school.stats.parents, 0),
    totalContent: schools.reduce((acc, school) => acc + school.stats.content, 0)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Gerenciamento de Escolas</h1>
          <p className="text-gray-500">Visualize e gerencie todas as escolas cadastradas no sistema.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Adicionar Escola
        </Button>
      </div>

      {/* Resumo das escolas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Escolas Cadastradas</p>
                <div className="flex items-baseline mt-1">
                  <h3 className="text-2xl font-bold">{schoolStats.totalSchools}</h3>
                  <span className="ml-2 text-xs text-gray-500">
                    ({schoolStats.publicSchools} públicas, {schoolStats.privateSchools} privadas)
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <School className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Alunos Registrados</p>
                <h3 className="text-2xl font-bold mt-1">{schoolStats.totalStudents.toLocaleString()}</h3>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pais Participantes</p>
                <h3 className="text-2xl font-bold mt-1">{schoolStats.totalParents.toLocaleString()}</h3>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
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
                placeholder="Buscar por nome ou localização..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Todos os tipos</option>
                  <option value="pública">Públicas</option>
                  <option value="privada">Privadas</option>
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

      {/* Lista de escolas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
          <CardDescription>
            {filteredSchools.length} escolas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentSchools.map((school) => (
              <Card key={school.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {school.location.city}, {school.location.state}
                      </CardDescription>
                    </div>
                    <Badge className={
                      school.type === 'pública' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }>
                      {school.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      {school.location.address}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-2" />
                      {school.contact.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {school.contact.email}
                    </div>
                    {school.contact.website && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Globe className="h-4 w-4 mr-2" />
                        {school.contact.website}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Alunos</p>
                      <p className="font-bold">{school.stats.students}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Pais</p>
                      <p className="font-bold">{school.stats.parents}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Conteúdos</p>
                      <p className="font-bold">{school.stats.content}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t justify-between">
                  <span className="text-xs text-gray-500">Adicionada em {school.dateAdded}</span>
                  <div className="flex items-center gap-2">
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
                </CardFooter>
              </Card>
            ))}
          </div>

          {currentSchools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma escola encontrada.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {indexOfFirstSchool + 1}-{Math.min(indexOfLastSchool, filteredSchools.length)} de {filteredSchools.length} escolas
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

      {/* Mapa e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Distribuição Geográfica
            </CardTitle>
            <CardDescription>
              Visualização das escolas no mapa do Brasil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder para o mapa - em uma aplicação real seria integrado com uma API de mapas */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Mapa com a localização das escolas</p>
                <p className="text-sm text-gray-400">
                  (Em uma implementação real, seria integrado com Google Maps ou similar)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Estatísticas
            </CardTitle>
            <CardDescription>
              Métricas de desempenho por escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="engagement">
              <TabsList className="w-full">
                <TabsTrigger value="engagement" className="flex-1">Engajamento</TabsTrigger>
                <TabsTrigger value="content" className="flex-1">Conteúdo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="engagement" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Taxa de Participação dos Pais</p>
                  <div className="space-y-1">
                    {schools.slice(0, 5).map(school => (
                      <div key={school.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{school.name}</span>
                          <span>{Math.round((school.stats.parents / school.stats.students) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${Math.round((school.stats.parents / school.stats.students) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Conteúdos Educacionais por Escola</p>
                  <div className="space-y-1">
                    {schools.slice(0, 5).map(school => (
                      <div key={school.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[200px]">{school.name}</span>
                          <span>{school.stats.content}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(school.stats.content / 350) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Ver Relatório Completo
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default SchoolsPage 