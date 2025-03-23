import { useState } from 'react'
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download, 
  Calendar, 
  Users, 
  School, 
  BookOpen,
  ArrowUp,
  ArrowDown,
  Filter,
  FileText,
  Share2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const Reports = () => {
  // Estado para período selecionado
  const [period, setPeriod] = useState('mes')
  
  // Estatísticas fictícias
  const statistics = {
    usersTotal: 2548,
    usersGrowth: 12.8,
    usersActive: 1875,
    childrenTotal: 3205,
    childrenGrowth: 8.5,
    childrenActive: 2890,
    schoolsTotal: 128,
    schoolsGrowth: 4.2,
    schoolsActive: 120,
    contentTotal: 856,
    contentGrowth: 15.3,
    contentViews: 45280
  }
  
  // Dados fictícios para os gráficos
  const chartData = {
    userSignups: [120, 145, 132, 165, 178, 189, 210, 215, 198, 220, 232, 245],
    activeUsers: [90, 105, 112, 125, 138, 155, 170, 185, 178, 190, 210, 220],
    pageViews: [3500, 4200, 3800, 4500, 5200, 5800, 6100, 6500, 6200, 6800, 7200, 7500],
    contentEngagement: [450, 520, 480, 550, 620, 680, 710, 750, 720, 780, 820, 850]
  }
  
  // Dados fictícios para distribuição por séries
  const gradeDistribution = [
    { grade: '1º Ano', count: 310, percentage: 9.7 },
    { grade: '2º Ano', count: 345, percentage: 10.8 },
    { grade: '3º Ano', count: 380, percentage: 11.9 },
    { grade: '4º Ano', count: 420, percentage: 13.1 },
    { grade: '5º Ano', count: 480, percentage: 15.0 },
    { grade: '6º Ano', count: 455, percentage: 14.2 },
    { grade: '7º Ano', count: 360, percentage: 11.2 },
    { grade: '8º Ano', count: 280, percentage: 8.7 },
    { grade: '9º Ano', count: 175, percentage: 5.4 }
  ]
  
  // Dados fictícios para distribuição por assunto
  const subjectEngagement = [
    { subject: 'Matemática', views: 12850, percentage: 28.4 },
    { subject: 'Português', views: 10230, percentage: 22.6 },
    { subject: 'Ciências', views: 8750, percentage: 19.3 },
    { subject: 'História', views: 5430, percentage: 12.0 },
    { subject: 'Geografia', views: 4320, percentage: 9.5 },
    { subject: 'Inglês', views: 2150, percentage: 4.7 },
    { subject: 'Artes', views: 980, percentage: 2.2 },
    { subject: 'Outros', views: 570, percentage: 1.3 }
  ]
  
  // Gerar gráfico de barras simplificado para estatísticas de usuários
  const BarChartSimple = ({ data, maxValue }: { data: number[], maxValue: number }) => {
    return (
      <div className="flex items-end h-24 gap-1">
        {data.map((value, index) => {
          const height = (value / maxValue) * 100
          return (
            <div 
              key={index} 
              className="bg-edu-blue-500 hover:bg-edu-blue-600 rounded-t w-full"
              style={{ height: `${height}%` }}
              title={`${value}`}
            ></div>
          )
        })}
      </div>
    )
  }
  
  // Gerar gráfico de linha simplificado
  const LineChartSimple = ({ data, maxValue }: { data: number[], maxValue: number }) => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - (value / maxValue) * 100
      return `${x},${y}`
    }).join(' ')
    
    return (
      <div className="h-24 w-full relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            className="stroke-edu-blue-500 stroke-2 fill-none"
          />
        </svg>
      </div>
    )
  }
  
  // Componente de KPI Card
  const KpiCard = ({ 
    title, 
    value, 
    growth, 
    icon, 
    chartData, 
    maxValue 
  }: { 
    title: string, 
    value: number, 
    growth: number, 
    icon: React.ReactNode,
    chartData: number[],
    maxValue: number
  }) => {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
              <div className="text-2xl font-bold mt-1">{value.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-full bg-gray-100">
              {icon}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center gap-2">
            <span className={`flex items-center text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {Math.abs(growth)}%
            </span>
            <span className="text-gray-500 text-sm">vs. período anterior</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <BarChartSimple data={chartData} maxValue={maxValue} />
        </CardFooter>
      </Card>
    )
  }
  
  // Componente de Trending Card
  const TrendingCard = ({ 
    title, 
    value, 
    trend, 
    description,
    chartData,
    maxValue
  }: { 
    title: string, 
    value: number, 
    trend: number, 
    description: string,
    chartData: number[],
    maxValue: number
  }) => {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              {Math.abs(trend)}%
            </div>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChartSimple data={chartData} maxValue={maxValue} />
        </CardContent>
      </Card>
    )
  }
  
  // Gerar barra de progresso
  const ProgressBar = ({ percentage }: { percentage: number }) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-edu-blue-500 h-2 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Relatórios e Análises</h1>
          <p className="text-gray-500">Visualize estatísticas e métricas da plataforma EduPais</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Últimas 24 horas</SelectItem>
              <SelectItem value="semana">Última semana</SelectItem>
              <SelectItem value="mes">Último mês</SelectItem>
              <SelectItem value="trimestre">Último trimestre</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar size={16} />
            Calendário
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="schools">Escolas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Cards KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard 
              title="Usuários" 
              value={statistics.usersTotal} 
              growth={statistics.usersGrowth} 
              icon={<Users className="h-5 w-5 text-edu-blue-600" />}
              chartData={chartData.userSignups}
              maxValue={Math.max(...chartData.userSignups) * 1.2}
            />
            
            <KpiCard 
              title="Filhos Cadastrados" 
              value={statistics.childrenTotal} 
              growth={statistics.childrenGrowth} 
              icon={<Users className="h-5 w-5 text-green-600" />}
              chartData={chartData.activeUsers}
              maxValue={Math.max(...chartData.activeUsers) * 1.2}
            />
            
            <KpiCard 
              title="Escolas" 
              value={statistics.schoolsTotal} 
              growth={statistics.schoolsGrowth} 
              icon={<School className="h-5 w-5 text-purple-600" />}
              chartData={[95, 100, 105, 110, 115, 118, 120, 122, 124, 126, 127, 128]}
              maxValue={130}
            />
            
            <KpiCard 
              title="Conteúdos" 
              value={statistics.contentTotal} 
              growth={statistics.contentGrowth} 
              icon={<BookOpen className="h-5 w-5 text-yellow-600" />}
              chartData={[680, 700, 720, 735, 750, 765, 780, 795, 810, 825, 840, 856]}
              maxValue={900}
            />
          </div>
          
          {/* Gráficos de tendências */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <TrendingCard 
              title="Visualizações de Página" 
              value={chartData.pageViews[chartData.pageViews.length - 1]} 
              trend={8.5} 
              description="Total de visualizações no último mês"
              chartData={chartData.pageViews}
              maxValue={Math.max(...chartData.pageViews) * 1.2}
            />
            
            <TrendingCard 
              title="Engajamento com Conteúdo" 
              value={chartData.contentEngagement[chartData.contentEngagement.length - 1]} 
              trend={12.3} 
              description="Interações com conteúdo educacional"
              chartData={chartData.contentEngagement}
              maxValue={Math.max(...chartData.contentEngagement) * 1.2}
            />
          </div>
          
          {/* Distribuição por séries e assuntos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Séries</CardTitle>
                <CardDescription>Número de crianças cadastradas por série</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeDistribution.map((item) => (
                    <div key={item.grade}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.grade}</span>
                        <span className="text-sm text-gray-500">{item.count} ({item.percentage}%)</span>
                      </div>
                      <ProgressBar percentage={item.percentage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engajamento por Matéria</CardTitle>
                <CardDescription>Visualizações de conteúdo por matéria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectEngagement.map((item) => (
                    <div key={item.subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.subject}</span>
                        <span className="text-sm text-gray-500">{item.views.toLocaleString()} ({item.percentage}%)</span>
                      </div>
                      <ProgressBar percentage={item.percentage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise de Usuários</CardTitle>
                  <CardDescription>Detalhes de cadastro, acesso e atividade</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Filter size={14} />
                    Filtrar
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <FileText size={14} />
                    Relatório
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Share2 size={14} />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Por favor, selecione o período e os filtros desejados para visualizar as estatísticas detalhadas de usuários.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise de Conteúdo</CardTitle>
                  <CardDescription>Métricas de visualização e engajamento</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Filter size={14} />
                    Filtrar
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <FileText size={14} />
                    Relatório
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Share2 size={14} />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Por favor, selecione o período e os filtros desejados para visualizar as estatísticas detalhadas de conteúdo.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise de Escolas</CardTitle>
                  <CardDescription>Distribuição e atividade por instituição</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Filter size={14} />
                    Filtrar
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <FileText size={14} />
                    Relatório
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Share2 size={14} />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Por favor, selecione o período e os filtros desejados para visualizar as estatísticas detalhadas de escolas.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Análise Financeira</CardTitle>
                  <CardDescription>Receitas, assinaturas e métricas de negócio</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Filter size={14} />
                    Filtrar
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <FileText size={14} />
                    Relatório
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Share2 size={14} />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Por favor, selecione o período e os filtros desejados para visualizar as estatísticas financeiras detalhadas.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Atalhos para relatórios frequentes */}
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">Relatórios Frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="flex items-center gap-2 justify-start h-auto py-4 px-4">
            <Users size={18} className="text-edu-blue-600" />
            <div className="text-left">
              <div className="font-medium">Usuários Ativos</div>
              <div className="text-sm text-gray-500">Últimos 30 dias</div>
            </div>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start h-auto py-4 px-4">
            <BarChart3 size={18} className="text-green-600" />
            <div className="text-left">
              <div className="font-medium">Crescimento Mensal</div>
              <div className="text-sm text-gray-500">Comparativo</div>
            </div>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start h-auto py-4 px-4">
            <PieChart size={18} className="text-purple-600" />
            <div className="text-left">
              <div className="font-medium">Distribuição Regional</div>
              <div className="text-sm text-gray-500">Por estado</div>
            </div>
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-500">
        Os dados apresentados nesta página são fictícios e servem apenas para demonstração.
      </div>
    </div>
  )
}

export default Reports 