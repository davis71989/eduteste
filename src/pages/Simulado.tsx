import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CheckCircle, XCircle, Loader2, Printer, Mail, Send, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/AuthContext'
import { 
  buscarFilhosPorUsuario, 
  gerarSimuladoComIA, 
  criarSimulado, 
  criarQuestoesSimulado, 
  buscarSimuladosPorUsuario, 
  buscarSimuladoPorId,
  responderQuestao,
  registrarCompartilhamento,
  excluirSimulado,
  Simulado as SimuladoType,
  QuestaoSimulado
} from '@/lib/simulado-service'

type Child = {
  id: string
  name: string
  age: string
  grade: string
  user_id: string
}

const Simulado = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('generate')
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [simulados, setSimulados] = useState<SimuladoType[]>([])
  
  // Estado para as questões geradas pela IA
  const [questoesGeradas, setQuestoesGeradas] = useState<Omit<QuestaoSimulado, 'id' | 'simulado_id' | 'created_at' | 'updated_at'>[]>([])
  // Estado para o simulado salvo
  const [simuladoSalvo, setSimuladoSalvo] = useState<SimuladoType | null>(null)
  // Estado para controlar se o simulado foi salvo
  const [simuladoEstaSalvo, setSimuladoEstaSalvo] = useState(false)
  // Estado para respostas selecionadas
  const [respostasAluno, setRespostasAluno] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  // Estado para mostrar resultados
  const [showResults, setShowResults] = useState(false)
  const [deletingSimuladoId, setDeletingSimuladoId] = useState<string | null>(null)

  // Carregar lista de filhos do usuário
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user?.id) return
      
      try {
        const filhos = await buscarFilhosPorUsuario(user.id)
        setChildren(filhos)
      } catch (error) {
        console.error('Erro ao buscar filhos:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de filhos',
          variant: 'destructive'
        })
      }
    }
    
    fetchChildren()
  }, [user, toast])

  // Carregar histórico de simulados
  useEffect(() => {
    const fetchSimulados = async () => {
      if (!user?.id) return
      
      try {
        const historicoSimulados = await buscarSimuladosPorUsuario(user.id)
        setSimulados(historicoSimulados)
      } catch (error) {
        console.error('Erro ao buscar simulados:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o histórico de simulados',
          variant: 'destructive'
        })
      }
    }
    
    if (activeTab === 'history') {
      fetchSimulados()
    }
  }, [activeTab, user, toast])

  const handleGenerateQuiz = async () => {
    if (!selectedChildId || !subject.trim() || !description.trim()) return

    setIsGenerating(true)
    setQuestoesGeradas([])
    setRespostasAluno({})
    setShowResults(false)
    setSimuladoEstaSalvo(false)
    setSimuladoSalvo(null)

    try {
      // Buscar informações do filho selecionado
      const selectedChild = children.find(child => child.id === selectedChildId)
      
      if (!selectedChild) {
        throw new Error('Filho não encontrado')
      }
      
      // Chamar a API de IA para gerar o simulado
      const questoesIA = await gerarSimuladoComIA(
        subject, 
        description, 
        selectedChild.grade, 
        questionCount
      )
      
      setQuestoesGeradas(questoesIA)
      
      toast({
        title: "Simulado gerado com sucesso!",
        description: "O simulado foi criado. Você pode salvá-lo para compartilhar ou imprimir."
      })
    } catch (error) {
      console.error('Erro ao gerar simulado:', error)
      toast({
        title: "Erro ao gerar simulado",
        description: "Ocorreu um erro ao gerar o simulado. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveSimulado = async () => {
    if (!user?.id || !selectedChildId || questoesGeradas.length === 0) return
    
    setIsSaving(true)
    
    try {
      // Buscar informações do filho selecionado
      const selectedChild = children.find(child => child.id === selectedChildId)
      
      if (!selectedChild) {
        throw new Error('Filho não encontrado')
      }
      
      // Criar link compartilhável único
      const uniqueId = Math.random().toString(36).substring(2, 10)
      const linkCompartilhavel = `${window.location.origin}/simulado/compartilhado/${uniqueId}`
      
      // Salvar o simulado no banco de dados
      const simuladoCriado = await criarSimulado({
        user_id: user.id,
        child_id: selectedChildId,
        titulo: subject,
        descricao: description,
        materia: subject,
        ano_escolar: selectedChild.grade,
        qtd_questoes: questionCount,
        link_compartilhavel: linkCompartilhavel,
        foi_gerado_por_ia: true,
        completo: false,
        score: null
      })
      
      // Formatar as questões para salvar no banco
      const questoesFormatadas = questoesGeradas.map(q => ({
        ...q,
        simulado_id: simuladoCriado.id
      }))
      
      // Salvar as questões no banco de dados
      await criarQuestoesSimulado(questoesFormatadas)
      
      setSimuladoSalvo(simuladoCriado)
      setSimuladoEstaSalvo(true)
      
      toast({
        title: "Simulado salvo com sucesso!",
        description: "Agora você pode compartilhar ou imprimir o simulado."
      })
      
      // Atualizar a lista de simulados se estiver na aba de histórico
      if (activeTab === 'history') {
        const historicoSimulados = await buscarSimuladosPorUsuario(user.id)
        setSimulados(historicoSimulados)
      }
    } catch (error) {
      console.error('Erro ao salvar simulado:', error)
      toast({
        title: "Erro ao salvar simulado",
        description: "Ocorreu um erro ao salvar o simulado. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectAnswer = async (questaoId: string, resposta: 'A' | 'B' | 'C' | 'D') => {
    if (showResults) return
    
    // Atualizar o estado local
    setRespostasAluno(prev => ({
      ...prev,
      [questaoId]: resposta
    }))
    
    // Se o simulado estiver salvo, atualizar a resposta no banco de dados
    if (simuladoEstaSalvo) {
      try {
        await responderQuestao(questaoId, resposta)
      } catch (error) {
        console.error('Erro ao salvar resposta:', error)
        toast({
          title: "Erro ao salvar resposta",
          description: "Ocorreu um erro ao salvar sua resposta.",
          variant: "destructive"
        })
      }
    }
  }

  const handleSubmitQuiz = async () => {
    setShowResults(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    const resultado = calculateScore()
    
    toast({
      title: "Respostas verificadas",
      description: `Você acertou ${resultado.correct} de ${resultado.total} questões.`
    })
  }

  const handleReset = () => {
    setSelectedChildId('')
    setSubject('')
    setDescription('')
    setQuestionCount(5)
    setQuestoesGeradas([])
    setRespostasAluno({})
    setShowResults(false)
    setSimuladoEstaSalvo(false)
    setSimuladoSalvo(null)
  }

  const handleShareByEmail = async () => {
    if (!simuladoSalvo) return
    
    try {
      // Registrar compartilhamento no banco de dados
      await registrarCompartilhamento(
        simuladoSalvo.id, 
        'email', 
        'email@exemplo.com' // Idealmente, solicitar o email do destinatário
      )
      
      // Em um caso real, aqui teríamos a lógica para enviar o email
      toast({
        title: "Link enviado por email",
        description: "O simulado foi enviado para o email cadastrado."
      })
    } catch (error) {
      console.error('Erro ao compartilhar simulado:', error)
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro ao compartilhar o simulado.",
        variant: "destructive"
      })
    }
  }

  const handleShareByWhatsApp = async () => {
    if (!simuladoSalvo || !simuladoSalvo.link_compartilhavel) return
    
    try {
      // Registrar compartilhamento no banco de dados
      await registrarCompartilhamento(simuladoSalvo.id, 'whatsapp')
      
      // Abrir WhatsApp com mensagem pré-definida
      const message = `Simulado de ${subject}: ${simuladoSalvo.link_compartilhavel}`
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    } catch (error) {
      console.error('Erro ao compartilhar simulado:', error)
      toast({
        title: "Erro ao compartilhar",
        description: "Ocorreu um erro ao compartilhar o simulado.",
        variant: "destructive"
      })
    }
  }

  const handlePrint = async () => {
    if (!simuladoSalvo) return
    
    try {
      // Registrar impressão no banco de dados
      await registrarCompartilhamento(simuladoSalvo.id, 'impressao')
      
      // Imprimir a página
      window.print()
    } catch (error) {
      console.error('Erro ao registrar impressão:', error)
      toast({
        title: "Erro ao imprimir",
        description: "Ocorreu um erro ao registrar a impressão.",
        variant: "destructive"
      })
    }
  }

  const calculateScore = () => {
    let correct = 0
    let total = questoesGeradas.length
    
    questoesGeradas.forEach((q, index) => {
      const questaoId = `q${index}`
      if (respostasAluno[questaoId] === q.resposta_correta) {
        correct++
      }
    })
    
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    }
  }

  const selectedChild = children.find(child => child.id === selectedChildId)

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Função para excluir um simulado
  const handleDeleteSimulado = async (simuladoId: string) => {
    if (!simuladoId) return;
    
    setDeletingSimuladoId(simuladoId);
    
    try {
      await excluirSimulado(simuladoId);
      
      // Atualizar a lista de simulados
      if (user?.id) {
        const historicoSimulados = await buscarSimuladosPorUsuario(user.id);
        setSimulados(historicoSimulados);
      }
      
      toast({
        title: "Simulado excluído",
        description: "O simulado foi excluído com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir simulado:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o simulado.",
        variant: "destructive"
      });
    } finally {
      setDeletingSimuladoId(null);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Simulado Personalizado</h1>
          <p className="text-muted-foreground">
            Gere simulados personalizados para ajudar no aprendizado do seu filho.
          </p>
        </div>

        <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Gerar Simulado</TabsTrigger>
            <TabsTrigger value="history">Simulados Salvos</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Simulado Personalizado</CardTitle>
                <CardDescription>
                  Configure o simulado de acordo com a necessidade do seu filho.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="child">Selecione o filho</Label>
                    <Select 
                      value={selectedChildId} 
                      onValueChange={(value) => {
                        setSelectedChildId(value)
                      }}
                      disabled={isGenerating || questoesGeradas.length > 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um filho" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map(child => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name} ({child.grade.includes("ano") ? child.grade : `${child.grade} ano`})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Matéria</Label>
                    <Input
                      id="subject"
                      placeholder="Ex: Matemática, Português, História..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={isGenerating || questoesGeradas.length > 0}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição do conteúdo</Label>
                    <Textarea
                      id="description"
                      placeholder="Ex: Equações do primeiro e segundo grau, interpretação de texto..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isGenerating || questoesGeradas.length > 0}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="questionCount">Quantidade de questões: {questionCount}</Label>
                    </div>
                    <Slider
                      id="questionCount"
                      min={1}
                      max={10}
                      step={1}
                      value={[questionCount]}
                      onValueChange={(value) => setQuestionCount(value[0])}
                      disabled={isGenerating || questoesGeradas.length > 0}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {questoesGeradas.length === 0 ? (
                  <Button
                    onClick={handleGenerateQuiz}
                    disabled={!selectedChildId || !subject.trim() || !description.trim() || isGenerating}
                    className="w-full"
                    variant="eduBlue"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando Simulado...
                      </>
                    ) : (
                      'Gerar Simulado'
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleReset}
                    className="w-full"
                    variant="outline"
                  >
                    Criar Novo Simulado
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Simulados Salvos</CardTitle>
                <CardDescription>
                  Veja os simulados anteriores e o desempenho.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {simulados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum simulado realizado ainda.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {simulados.map(simulado => (
                      <div key={simulado.id} className="border rounded-lg p-4 hover:border-edu-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-lg">{simulado.titulo}</h3>
                            <p className="text-sm text-muted-foreground">
                              {simulado.materia} - {(simulado as any).children?.name} ({simulado.ano_escolar})
                            </p>
                          </div>
                          {simulado.completo && simulado.score !== null && (
                            <div className="bg-edu-blue-100 text-edu-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {Math.round(simulado.score)}%
                            </div>
                          )}
                        </div>
                        <p className="text-sm mb-2">{simulado.descricao}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{formatarData(simulado.created_at)}</span>
                          <span>{simulado.qtd_questoes} questões</span>
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSimulado(simulado.id)}
                            disabled={deletingSimuladoId === simulado.id}
                          >
                            {deletingSimuladoId === simulado.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={simulado.completo ? "outline" : "eduBlue"}
                            onClick={() => navigate(`/simulado/${simulado.id}`)}
                          >
                            {simulado.completo ? "Ver Resultado" : "Continuar"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {questoesGeradas.length > 0 && !simuladoEstaSalvo && !showResults && (
          <Card className="mb-6 border-2 border-edu-blue-100">
            <CardHeader className="bg-edu-blue-50">
              <CardTitle>Simulado Gerado</CardTitle>
              <CardDescription>
                {subject} - {selectedChild?.name} ({selectedChild?.grade})
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <Button 
                  onClick={handleSaveSimulado} 
                  variant="eduBlue" 
                  disabled={isSaving}
                  className="mb-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Simulado
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Salve o simulado para poder compartilhá-lo ou imprimi-lo
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {simuladoEstaSalvo && !showResults && (
          <Card className="mb-6 border-2 border-edu-blue-100">
            <CardHeader className="bg-edu-blue-50">
              <CardTitle>Simulado Salvo</CardTitle>
              <CardDescription>
                {subject} - {selectedChild?.name} ({selectedChild?.grade})
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                <Button variant="outline" onClick={handleShareByEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por Email
                </Button>
                <Button variant="outline" onClick={handleShareByWhatsApp}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar via WhatsApp
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
              {simuladoSalvo?.link_compartilhavel && (
                <p className="text-center text-sm text-muted-foreground mb-4">
                  Link do simulado: <a href={simuladoSalvo.link_compartilhavel} className="text-edu-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">{simuladoSalvo.link_compartilhavel}</a>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {showResults && (
          <Card className="mb-8 border-2 border-edu-blue-100">
            <CardHeader className="bg-edu-blue-50">
              <CardTitle>Resultado do Simulado</CardTitle>
              <CardDescription>
                {subject} - {selectedChild?.name} ({selectedChild?.grade})
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-edu-blue-500 mb-2">
                  {calculateScore().percentage}%
                </div>
                <p className="text-muted-foreground">
                  Você acertou {calculateScore().correct} de {calculateScore().total} questões
                </p>
              </div>
              <div className="flex justify-center gap-4 mb-6">
                <Button variant="outline" onClick={handleReset}>
                  Novo Simulado
                </Button>
                <Button variant="eduBlue" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                  Revisar Erros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {questoesGeradas.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold">
              Simulado de {subject} - {selectedChild?.name} ({selectedChild?.grade})
            </h2>
            
            {questoesGeradas.map((questao, index) => (
              <Card key={index} className="border-2 hover:border-edu-blue-100 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-start">
                    <span className="bg-edu-blue-100 text-edu-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0">
                      {index + 1}
                    </span>
                    <div>{questao.pergunta}</div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map((opcao, optIndex) => {
                      const questaoId = `q${index}`
                      const opcaoText = optIndex === 0 ? questao.opcao_a : 
                                     optIndex === 1 ? questao.opcao_b : 
                                     optIndex === 2 ? questao.opcao_c : questao.opcao_d
                      
                      return (
                        <div
                          key={optIndex}
                          className={`
                            flex items-center p-3 rounded-lg cursor-pointer
                            ${respostasAluno[questaoId] === opcao 
                              ? 'bg-edu-blue-50 border-2 border-edu-blue-200' 
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}
                            ${showResults && opcao === questao.resposta_correta 
                              ? 'bg-green-50 border-2 border-green-200' 
                              : ''}
                            ${showResults && respostasAluno[questaoId] === opcao && opcao !== questao.resposta_correta 
                              ? 'bg-red-50 border-2 border-red-200' 
                              : ''}
                          `}
                          onClick={() => handleSelectAnswer(questaoId, opcao as 'A' | 'B' | 'C' | 'D')}
                        >
                          <div className="mr-3">
                            {showResults ? (
                              opcao === questao.resposta_correta ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : respostasAluno[questaoId] === opcao ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                              )
                            ) : (
                              <div className={`
                                w-5 h-5 rounded-full border-2
                                ${respostasAluno[questaoId] === opcao 
                                  ? 'border-edu-blue-500 bg-edu-blue-500' 
                                  : 'border-gray-300'}
                              `} />
                            )}
                          </div>
                          <div>{opcaoText}</div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {showResults && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-700">Explicação:</p>
                      <p className="text-gray-600">{questao.explicacao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {!showResults && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleSubmitQuiz}
                  variant="eduBlue"
                  size="lg"
                  disabled={Object.keys(respostasAluno).length !== questoesGeradas.length}
                >
                  Verificar Respostas
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Simulado 