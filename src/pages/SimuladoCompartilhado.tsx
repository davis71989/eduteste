import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
  buscarSimuladoPorId, 
  responderQuestao, 
  QuestaoSimulado, 
  Simulado as SimuladoType,
  createClient
} from '@/lib/simulado-service'

const SimuladoCompartilhado = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [simulado, setSimulado] = useState<SimuladoType | null>(null)
  const [questoes, setQuestoes] = useState<QuestaoSimulado[]>([])
  const [respostasAluno, setRespostasAluno] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    const fetchSimulado = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        
        // Primeiro, tentamos buscar pelo id direto
        try {
          const simuladoData = await buscarSimuladoPorId(id)
          setSimulado(simuladoData)
          setQuestoes(simuladoData.questoes || [])
          
          // Pré-preencher respostas existentes
          const respostas: Record<string, 'A' | 'B' | 'C' | 'D'> = {}
          simuladoData.questoes?.forEach((q: QuestaoSimulado) => {
            if (q.resposta_aluno) {
              respostas[q.id] = q.resposta_aluno
            }
          })
          setRespostasAluno(respostas)
          
          return
        } catch (error) {
          console.log('Não encontrado por ID direto, tentando por link')
        }
        
        // Se não encontramos pelo ID direto, tentamos buscar pelo link compartilhável
        const supabase = createClient()
        const { data, error } = await supabase
          .from('simulados')
          .select(`
            *,
            children:child_id (id, name, age, grade),
            questoes:questoes_simulado (*)
          `)
          .eq('link_compartilhavel', `${window.location.origin}/simulado/compartilhado/${id}`)
          .single()
        
        if (error || !data) {
          throw new Error('Simulado não encontrado')
        }
        
        setSimulado(data)
        setQuestoes(data.questoes || [])
        
        // Pré-preencher respostas existentes
        const respostas: Record<string, 'A' | 'B' | 'C' | 'D'> = {}
        data.questoes?.forEach((q: QuestaoSimulado) => {
          if (q.resposta_aluno) {
            respostas[q.id] = q.resposta_aluno
          }
        })
        setRespostasAluno(respostas)
      } catch (error) {
        console.error('Erro ao buscar simulado:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível encontrar o simulado solicitado.',
          variant: 'destructive'
        })
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSimulado()
  }, [id, navigate, toast])
  
  const handleSelectAnswer = async (questaoId: string, resposta: 'A' | 'B' | 'C' | 'D') => {
    if (showResults) return
    
    // Atualizar o estado local
    setRespostasAluno(prev => ({
      ...prev,
      [questaoId]: resposta
    }))
    
    // Atualizar no banco de dados
    try {
      await responderQuestao(questaoId, resposta)
    } catch (error) {
      console.error('Erro ao salvar resposta:', error)
    }
  }
  
  const handleSubmitQuiz = async () => {
    if (questoes.length === 0 || Object.keys(respostasAluno).length !== questoes.length) return
    
    setSubmitting(true)
    
    try {
      // Atualizar o simulado como completo e definir a pontuação
      const resultado = calculateScore()
      
      const supabase = createClient()
      await supabase
        .from('simulados')
        .update({
          completo: true,
          score: resultado.percentage
        })
        .eq('id', simulado?.id)
      
      setShowResults(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      toast({
        title: "Simulado concluído!",
        description: `Você acertou ${resultado.correct} de ${resultado.total} questões.`
      })
    } catch (error) {
      console.error('Erro ao submeter simulado:', error)
      toast({
        title: "Erro ao finalizar",
        description: "Ocorreu um erro ao finalizar o simulado.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  const calculateScore = () => {
    let correct = 0
    let total = questoes.length
    
    questoes.forEach(q => {
      if (respostasAluno[q.id] === q.resposta_correta) {
        correct++
      }
    })
    
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Carregando simulado...</p>
      </div>
    )
  }
  
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{simulado?.titulo}</h1>
          <p className="text-muted-foreground">
            {simulado?.descricao} - {(simulado as any)?.children?.name} ({simulado?.ano_escolar})
          </p>
        </div>
        
        {showResults && (
          <Card className="mb-8 border-2 border-edu-blue-100">
            <CardHeader className="bg-edu-blue-50">
              <CardTitle>Resultado do Simulado</CardTitle>
              <CardDescription>
                {simulado?.materia} - {simulado?.qtd_questoes} questões
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
                <Button variant="eduBlue" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                  Revisar Respostas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-6 mb-8">
          {questoes.map((questao, index) => (
            <Card key={questao.id} className="border-2 hover:border-edu-blue-100 transition-colors">
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
                    const opcaoText = optIndex === 0 ? questao.opcao_a : 
                                   optIndex === 1 ? questao.opcao_b : 
                                   optIndex === 2 ? questao.opcao_c : questao.opcao_d
                    
                    return (
                      <div
                        key={optIndex}
                        className={`
                          flex items-center p-3 rounded-lg cursor-pointer
                          ${respostasAluno[questao.id] === opcao 
                            ? 'bg-edu-blue-50 border-2 border-edu-blue-200' 
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}
                          ${showResults && opcao === questao.resposta_correta 
                            ? 'bg-green-50 border-2 border-green-200' 
                            : ''}
                          ${showResults && respostasAluno[questao.id] === opcao && opcao !== questao.resposta_correta 
                            ? 'bg-red-50 border-2 border-red-200' 
                            : ''}
                        `}
                        onClick={() => handleSelectAnswer(questao.id, opcao as 'A' | 'B' | 'C' | 'D')}
                      >
                        <div className="mr-3">
                          {showResults ? (
                            opcao === questao.resposta_correta ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : respostasAluno[questao.id] === opcao ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )
                          ) : (
                            <div className={`
                              w-5 h-5 rounded-full border-2
                              ${respostasAluno[questao.id] === opcao 
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
                disabled={Object.keys(respostasAluno).length !== questoes.length || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Respostas'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimuladoCompartilhado 