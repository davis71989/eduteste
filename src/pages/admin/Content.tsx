import { useState } from 'react'
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  FileText,
  BookmarkPlus,
  BookmarkCheck,
  Video,
  FileQuestion,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

// Tipo de conteúdo
type ContentType = {
  id: string
  title: string
  type: 'lesson' | 'quiz' | 'video' | 'exercise'
  subject: string
  grade: string
  author: string
  status: 'draft' | 'published' | 'archived'
  created: string
  updated: string
  views: number
  likes: number
}

const ContentPage = () => {
  // Dados fictícios de conteúdo
  const [contents] = useState<ContentType[]>([
    {
      id: '1',
      title: 'Frações para o 5º Ano',
      type: 'lesson',
      subject: 'Matemática',
      grade: '5º Ano',
      author: 'Maria Silva',
      status: 'published',
      created: '15/02/2023',
      updated: '18/02/2023',
      views: 1240,
      likes: 85
    },
    {
      id: '2',
      title: 'Quiz sobre Interpretação de Texto',
      type: 'quiz',
      subject: 'Português',
      grade: '4º Ano',
      author: 'João Pereira',
      status: 'published',
      created: '10/02/2023',
      updated: '12/02/2023',
      views: 950,
      likes: 72
    },
    {
      id: '3',
      title: 'Vídeo: Sistema Solar Explicado',
      type: 'video',
      subject: 'Ciências',
      grade: '6º Ano',
      author: 'Carlos Santos',
      status: 'published',
      created: '05/03/2023',
      updated: '05/03/2023',
      views: 1876,
      likes: 134
    },
    {
      id: '4',
      title: 'Exercícios de Verbos',
      type: 'exercise',
      subject: 'Português',
      grade: '7º Ano',
      author: 'Ana Costa',
      status: 'draft',
      created: '18/03/2023',
      updated: '20/03/2023',
      views: 0,
      likes: 0
    },
    {
      id: '5',
      title: 'História do Brasil: Período Colonial',
      type: 'lesson',
      subject: 'História',
      grade: '8º Ano',
      author: 'Roberto Alves',
      status: 'published',
      created: '22/02/2023',
      updated: '25/02/2023',
      views: 780,
      likes: 63
    },
    {
      id: '6',
      title: 'Quiz de Geografia: Capitais do Brasil',
      type: 'quiz',
      subject: 'Geografia',
      grade: '5º Ano',
      author: 'Maria Silva',
      status: 'published',
      created: '01/03/2023',
      updated: '02/03/2023',
      views: 920,
      likes: 78
    },
    {
      id: '7',
      title: 'Exercícios de Multiplicação e Divisão',
      type: 'exercise',
      subject: 'Matemática',
      grade: '3º Ano',
      author: 'João Pereira',
      status: 'archived',
      created: '10/01/2023',
      updated: '15/01/2023',
      views: 550,
      likes: 41
    },
    {
      id: '8',
      title: 'Vídeo: Experimentos de Ciências',
      type: 'video',
      subject: 'Ciências',
      grade: '4º Ano',
      author: 'Ana Costa',
      status: 'published',
      created: '28/02/2023',
      updated: '28/02/2023',
      views: 1430,
      likes: 112
    }
  ])

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados para filtros
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Estado para ordenação
  const [sortField, setSortField] = useState<keyof ContentType>('updated')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Filtragem de conteúdo
  const filteredContents = contents.filter(content => {
    // Filtro de pesquisa
    const matchesSearch = 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.author.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de matéria
    const matchesSubject = subjectFilter === 'all' || content.subject === subjectFilter
    
    // Filtro de tipo
    const matchesType = typeFilter === 'all' || content.type === typeFilter
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter
    
    return matchesSearch && matchesSubject && matchesType && matchesStatus
  })
  
  // Ordenação de conteúdo
  const sortedContents = [...filteredContents].sort((a, b) => {
    if (sortField === 'views' || sortField === 'likes') {
      return sortDirection === 'asc' 
        ? a[sortField] - b[sortField] 
        : b[sortField] - a[sortField]
    }
    
    return sortDirection === 'asc'
      ? a[sortField].localeCompare(b[sortField])
      : b[sortField].localeCompare(a[sortField])
  })
  
  // Função para alternar o campo de ordenação
  const toggleSort = (field: keyof ContentType) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Obter o ícone correspondente ao tipo de conteúdo
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <FileText className="h-5 w-5 text-blue-600" />
      case 'quiz':
        return <FileQuestion className="h-5 w-5 text-purple-600" />
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />
      case 'exercise':
        return <BookmarkCheck className="h-5 w-5 text-green-600" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // Obter a classe de cor para o status
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Obter o label para o status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado'
      case 'draft':
        return 'Rascunho'
      case 'archived':
        return 'Arquivado'
      default:
        return status
    }
  }

  // Resumo do conteúdo
  const contentSummary = {
    total: contents.length,
    published: contents.filter(content => content.status === 'published').length,
    draft: contents.filter(content => content.status === 'draft').length,
    archived: contents.filter(content => content.status === 'archived').length,
    lessons: contents.filter(content => content.type === 'lesson').length,
    quizzes: contents.filter(content => content.type === 'quiz').length,
    videos: contents.filter(content => content.type === 'video').length,
    exercises: contents.filter(content => content.type === 'exercise').length
  }

  // Lista de matérias únicas para o filtro
  const subjects = Array.from(new Set(contents.map(content => content.subject)))

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Conteúdo Educacional</h1>
          <p className="text-gray-500">Gerencie os materiais didáticos, exercícios, vídeos e quizzes.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Adicionar Conteúdo
        </Button>
      </div>

      {/* Resumo do conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-100">
              <BookOpen className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{contentSummary.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="status">
              <TabsList className="w-full">
                <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
                <TabsTrigger value="type" className="flex-1">Tipo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="status" className="pt-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Publicados</div>
                    <div className="font-bold text-green-600">{contentSummary.published}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Rascunhos</div>
                    <div className="font-bold text-yellow-600">{contentSummary.draft}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Arquivados</div>
                    <div className="font-bold text-gray-600">{contentSummary.archived}</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="type" className="pt-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Lições</div>
                    <div className="font-bold text-blue-600">{contentSummary.lessons}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Quizzes</div>
                    <div className="font-bold text-purple-600">{contentSummary.quizzes}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Vídeos</div>
                    <div className="font-bold text-red-600">{contentSummary.videos}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Exercícios</div>
                    <div className="font-bold text-green-600">{contentSummary.exercises}</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Conteúdo mais popular</span>
              <span className="text-xs text-gray-500">visualizações/likes</span>
            </div>
            <div className="space-y-2">
              {contents
                .sort((a, b) => b.views - a.views)
                .slice(0, 3)
                .map((content, index) => (
                  <div key={content.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                    <div className="flex-1 truncate">
                      <div className="text-sm font-medium truncate">{content.title}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{content.subject}</span>
                        <span>•</span>
                        <span>{content.grade}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {content.views.toLocaleString()} / {content.likes}
                    </div>
                  </div>
                ))}
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
                placeholder="Buscar por título ou autor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="all">Todas as matérias</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Todos os tipos</option>
                  <option value="lesson">Lições</option>
                  <option value="quiz">Quizzes</option>
                  <option value="video">Vídeos</option>
                  <option value="exercise">Exercícios</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <select
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edu-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os status</option>
                  <option value="published">Publicados</option>
                  <option value="draft">Rascunhos</option>
                  <option value="archived">Arquivados</option>
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

      {/* Tabela de conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conteúdo</CardTitle>
          <CardDescription>
            {filteredContents.length} itens encontrados
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
                      onClick={() => toggleSort('title')}
                    >
                      Título
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Matéria</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Série/Ano</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => toggleSort('author')}
                    >
                      Autor
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => toggleSort('updated')}
                    >
                      Atualizado
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => toggleSort('views')}
                    >
                      Views
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedContents.map((content) => (
                  <tr key={content.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {getContentTypeIcon(content.type)}
                        <span className="font-medium">{content.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 capitalize">{content.type}</td>
                    <td className="py-4 px-4 text-gray-600">{content.subject}</td>
                    <td className="py-4 px-4 text-gray-600">{content.grade}</td>
                    <td className="py-4 px-4 text-gray-600">{content.author}</td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusClass(content.status)}>
                        {getStatusLabel(content.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{content.updated}</td>
                    <td className="py-4 px-4 text-gray-600">{content.views.toLocaleString()}</td>
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

                {sortedContents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhum conteúdo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {sortedContents.length} de {filteredContents.length} itens
          </div>
          
          <Button variant="outline" className="flex items-center gap-2">
            Ver Todos
            <ChevronDown size={16} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ContentPage 