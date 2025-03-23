import { useEffect, useRef, useState, useCallback } from 'react'
import { Upload, Image, Send, Loader2, BookOpen, Clock, Save, AlertCircle, Check, Printer, Copy, Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/AuthContext'
import { processAiQuery, getUserAiUsage, getQueryHistory, type QueryHistoryItem } from '@/lib/aiService'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getUserChildren, saveTask, getChildTasks, deleteTask, getUserTasks, type Task, getUserSettings } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { getTokensUsed, storeTokensUsed } from '@/lib/tokenStorage'
import { db } from '@/lib/db'
import router from 'next/router'
import styles from "@/styles/Home.module.css"
import TaskCard from "@/components/TaskCard"

// Interface para as tarefas vindas do banco de dados
interface DatabaseTask {
  id: string;
  titulo?: string;
  descricao?: string;
  disciplina_id?: string;
  criado_em: string | number | Date;
}

// Interface para as tarefas locais
interface LocalTask {
  id: string;
  title: string;
  response: string;
  subject: string;
  date: string | number | Date;
}

// Lista de matérias escolares com IDs do banco de dados
const SUBJECTS = [
  { id: 'e37cd521-161e-4cf1-99a9-21d14ab638f3', name: 'Português' },
  { id: 'e2a0dcf8-6b8b-491e-85a1-7416d6883175', name: 'Matemática' },
  { id: '92fdca94-38a1-4381-a669-af58c404e3f9', name: 'História' },
  { id: '72b3bec1-7df2-4df9-8bf9-075e215a0e8e', name: 'Geografia' },
  { id: 'f1c7bbd4-a546-4cf8-8777-9c1a3cc41d44', name: 'Ciências' },
  { id: '2ad9a145-9e70-427d-8747-7c3755e588a3', name: 'Inglês' },
  { id: '07a3910d-e55c-482b-af98-cae48935bb9c', name: 'Artes' },
  { id: '9a4d740f-46e8-437f-bbd2-7ae467269c79', name: 'Educação Física' },
  { id: 'other', name: 'Outra' }
]

// Opções de níveis de dificuldade
const DIFFICULTY_LEVELS: Array<{id: 'easy' | 'medium' | 'hard', name: string, description: string}> = [
  { id: 'easy', name: 'Simples', description: 'Explicações simples e diretas, para crianças mais novas' },
  { id: 'medium', name: 'Médio', description: 'Explicações equilibradas, adequadas para a idade' },
  { id: 'hard', name: 'Avançado', description: 'Explicações detalhadas que estimulam o pensamento crítico' }
]

const TaskHelp = () => {
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [taskText, setTaskText] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [children, setChildren] = useState<{id: string, name: string, age: string, grade: string, school: string}[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>(SUBJECTS[0].id)
  const [tokenUsage, setTokenUsage] = useState<{ used: number; limit: number; percentage: number }>({
    used: 0,
    limit: 30,
    percentage: 0
  })
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<string>('image')
  const [savedTasks, setSavedTasks] = useState<{id: string, title: string, response: string, subject: string, date: Date}[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState<any>({ difficultyLevel: 'medium' })
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  
  // Referência para o arquivo de upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultContainerRef = useRef<HTMLDivElement>(null)
  
  // Adicionar estado para as disciplinas
  const [subjects, setSubjects] = useState<Array<{id: string, name: string}>>([
    { id: 'math', name: 'Matemática' },
    { id: 'portuguese', name: 'Português' },
    { id: 'science', name: 'Ciências' },
    { id: 'history', name: 'História' },
    { id: 'geography', name: 'Geografia' },
    { id: 'english', name: 'Inglês' },
    { id: 'physics', name: 'Física' },
    { id: 'chemistry', name: 'Química' },
    { id: 'biology', name: 'Biologia' },
    { id: 'other', name: 'Outra' }
  ])
  
  // Carregar disciplinas do banco de dados
  const loadDisciplinas = async () => {
    try {
      const { data: disciplinas, error } = await supabase
        .from('disciplinas')
        .select('*')

      if (error) {
        console.error('Erro ao carregar disciplinas:', error)
        return
      }

      // Apenas para debug, não usamos isso ainda
      if (disciplinas && disciplinas.length > 0) {
        console.log('Disciplinas carregadas:', disciplinas)
      }
    } catch (err) {
      console.error('Erro ao carregar disciplinas:', err)
    }
  }

  // Carregar dados dos filhos e uso de tokens do usuário
  const loadInitialData = async () => {
    if (!user?.id) return
    
    try {
      // Carregar filhos com informações detalhadas
      const userChildren = await getUserChildren(user.id)
      
      // Mapear para incluir mais detalhes sobre cada filho
      const childrenWithDetails = userChildren.map(child => ({
        id: child.id,
        name: child.name,
        age: child.age || '',
        grade: child.grade || '',
        school: child.school || ''
      }))
      
      setChildren(childrenWithDetails)
      
      // Se tiver filhos, seleciona o primeiro por padrão
      if (userChildren.length > 0) {
        setSelectedChild(userChildren[0].id)
      }
      
      // Carregar uso de tokens
      const usage = await getUserAiUsage(user.id)
      setTokenUsage({
        used: usage.used,
        limit: usage.limit,
        percentage: usage.percentUsed
      })
      
      // Carregar tarefas do localStorage
      const savedTasksData = localStorage.getItem(`savedTasks_${user.id}`)
      let localTasks = []
      if (savedTasksData) {
        // Converter strings de data para objetos Date
        localTasks = JSON.parse(savedTasksData).map((task: any) => ({
          ...task,
          date: new Date(task.date),
          source: 'local' // Marcar a origem
        }))
      }
      
      // Carregar tarefas do banco de dados
      try {
        const dbTasks = await getUserTasks(user.id)
        
        // Converter tarefas do banco para o formato usado no frontend
        const formattedDbTasks = dbTasks.map((task: DatabaseTask) => ({
          id: task.id,
          title: task.titulo || '',
          response: task.descricao || '',
          subject: SUBJECTS.find(s => s.id === (task.disciplina_id || ''))?.name || 'Geral',
          date: new Date(task.criado_em || Date.now()),
          source: 'database' as const
        }))
        
        // Mesclar tarefas locais e do banco, removendo duplicatas (priorizar as do banco)
        const dbTaskIds = formattedDbTasks.map(task => task.id)
        const uniqueLocalTasks = localTasks.filter(task => !dbTaskIds.includes(task.id))
        
        // Ordenar por data (mais recentes primeiro)
        const allTasks = [...formattedDbTasks, ...uniqueLocalTasks]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
        
        setSavedTasks(allTasks)
      } catch (error) {
        console.error('Erro ao carregar tarefas do banco:', error)
        // Em caso de erro, usar apenas as tarefas locais
        setSavedTasks(localTasks)
      }
      
      // Carregar histórico
      const queryHistory = await getQueryHistory(user.id)
      setHistory(queryHistory)
      
      // Carregar configurações do usuário
      await loadUserSettings()
      
      // Carregar disciplinas do banco de dados
      await loadDisciplinas()
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  // Carregar dados quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verificar o tamanho do arquivo (limite de 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: 'Por favor, envie uma imagem com menos de 5MB.',
          variant: 'destructive'
        });
        return;
      }
      
      setIsUploading(true)
      
      // Converter a imagem para base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        
        // Verificar o tamanho da string base64
        if (base64String.length > 2 * MAX_FILE_SIZE) {
          setIsUploading(false);
          toast({
            title: 'Imagem muito grande',
            description: 'A imagem convertida é muito grande. Tente reduzir a resolução ou comprimi-la.',
            variant: 'destructive'
          });
          return;
        }
        
        setUploadedImage(base64String)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível processar a imagem. Tente novamente.',
          variant: 'destructive'
        });
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      // Verificar o tamanho do arquivo (limite de 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: 'Por favor, envie uma imagem com menos de 5MB.',
          variant: 'destructive'
        });
        return;
      }
      
      setIsUploading(true)
      
      // Converter a imagem para base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        
        // Verificar o tamanho da string base64
        if (base64String.length > 2 * MAX_FILE_SIZE) {
          setIsUploading(false);
          toast({
            title: 'Imagem muito grande',
            description: 'A imagem convertida é muito grande. Tente reduzir a resolução ou comprimi-la.',
            variant: 'destructive'
          });
          return;
        }
        
        setUploadedImage(base64String)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: 'Erro',
          description: 'Não foi possível processar a imagem. Tente novamente.',
          variant: 'destructive'
        });
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: 'Não autenticado',
        description: 'Você precisa fazer login para usar esta função.',
        variant: 'destructive'
      })
      navigate('/login')
      return
    }
    
    // Verificar se temos um query ou uma imagem
    const isImageTab = activeTab === 'image';
    const query = isImageTab ? `[Imagem de tarefa enviada]` : taskText;
    
    if (isImageTab && !uploadedImage) {
      toast({
        title: 'Erro',
        description: 'Por favor, envie uma imagem da tarefa.',
        variant: 'destructive'
      })
      return
    }
    
    if (!isImageTab && (!query || query.trim() === '')) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite o enunciado da tarefa.',
        variant: 'destructive'
      })
      return
    }
    
    if (tokenUsage.percentage >= 100) {
      toast({
        title: 'Limite mensal atingido',
        description: 'Você atingiu seu limite de 30 tarefas mensais. Aguarde o próximo mês para novas consultas.',
        variant: 'destructive'
      })
      return
    }
    
    setIsProcessing(true)
    setResult(null)
    setProcessingProgress(0)
    
    // Iniciar animação de progresso para feedback visual
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        
        // Aumentar mais rapidamente no início e mais lentamente próximo ao final
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5
        return Math.min(prev + increment, 95)
      })
    }, 500)
    
    // Feedback visual para o usuário quando estiver processando uma imagem
    if (isImageTab) {
      toast({
        title: 'Analisando imagem...',
        description: 'Nosso modelo está examinando a tarefa. Isso pode levar até 30 segundos.',
      })
    }
    
    try {
      const subject = SUBJECTS.find(s => s.id === selectedSubject)?.name || 'Geral'
      
      // Obter informações detalhadas sobre o filho selecionado
      const selectedChildInfo = children.find(child => child.id === selectedChild)
      
      // Log para debug
      console.log('Enviando consulta para processamento:', {
        tipo: activeTab === 'image' ? 'imagem' : 'texto',
        childId: selectedChild,
        subject,
        temImagem: !!uploadedImage,
        tamanhoImagem: uploadedImage ? Math.round(uploadedImage.length / 1024) + 'KB' : '0',
        difficultyLevel: selectedDifficulty
      });
      
      const response = await processAiQuery({
        query: activeTab === 'image' ? '[Imagem de tarefa enviada]' : taskText,
        childId: selectedChild || undefined,
        subject: subject,
        userId: user.id,
        imageUrl: uploadedImage || undefined,
        difficultyLevel: selectedDifficulty
      })
      
      clearInterval(progressInterval)
      setProcessingProgress(100)
      setResult(response.response)
      
      // Atualizar o uso de tokens após o processamento
      await fetchTokenUsage()
      
      // Atualizar o histórico
      const updatedHistory = await getQueryHistory(user.id)
      setHistory(updatedHistory)
      
      toast({
        title: 'Resolução completa!',
        description: 'A IA analisou a tarefa com sucesso. 1 tarefa foi consumida do seu limite mensal.',
        variant: 'default'
      })
      
    } catch (error: any) {
      console.error('Erro ao processar consulta:', error)
      
      clearInterval(progressInterval)
      setProcessingProgress(0)
      
      // Mensagem de erro personalizada com base no tipo de erro
      let errorMessage = 'Ocorreu um erro ao processar sua solicitação.'
      
      if (error.message?.includes('imagem')) {
        errorMessage = 'Não foi possível analisar a imagem. Verifique se a imagem está nítida e tente novamente.'
      } else if (error.message?.includes('API') || error.message?.includes('status')) {
        errorMessage = 'Erro de comunicação com o serviço de IA. Tente novamente mais tarde.'
      }
      
      toast({
        title: 'Erro ao processar solicitação',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const handleCopyToClipboard = () => {
    if (result) {
      // Remove tags HTML para obter apenas o texto
      const plainText = result.replace(/<[^>]*>?/gm, '');
      
      // Tenta usar a API de compartilhamento se disponível
      if (navigator.share) {
        navigator.share({
          title: 'Resolução de tarefa EduPais',
          text: plainText
        }).catch(() => {
          // Fallback para clipboard se o compartilhamento falhar
          navigator.clipboard.writeText(plainText);
          toast({
            title: 'Copiado!',
            description: 'A resolução foi copiada para a área de transferência.'
          });
        });
      } else {
        // Usa clipboard diretamente se compartilhamento não disponível
        navigator.clipboard.writeText(plainText);
        toast({
          title: 'Copiado!',
          description: 'A resolução foi copiada para a área de transferência.'
        });
      }
    }
  }

  const handlePrint = () => {
    window.print();
  }

  const handleSaveTask = async () => {
    if (!result || !user?.id || !selectedChild) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a tarefa. Verifique se selecionou um filho.',
        variant: 'destructive'
      });
      return;
    }
    
    // Se a tarefa já estiver salva (tiver um currentTaskId), remova-a
    if (currentTaskId) {
      try {
        // Se tiver um ID real do banco de dados (UUID), exclua do banco
        if (currentTaskId.length > 20) {
          await deleteTask(currentTaskId);
        }
        
        // Remover do localStorage também
        handleDeleteSavedTask(currentTaskId);
        
        toast({
          title: 'Tarefa removida',
          description: 'A tarefa foi removida com sucesso.',
          variant: 'default'
        });
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível remover a tarefa. Tente novamente.',
          variant: 'destructive'
        });
      }
      return;
    }
    
    // Extrair um título da resolução
    const parser = new DOMParser();
    const doc = parser.parseFromString(result, 'text/html');
    const firstH3 = doc.querySelector('h3');
    const title = firstH3 ? firstH3.textContent || 'Tarefa Salva' : 'Tarefa Salva';
    
    try {
      // Salvar no banco de dados Supabase
      const { success, task } = await saveTask(
        user.id,
        selectedChild,
        {
          titulo: title.length > 100 ? title.substring(0, 100) + '...' : title,
          descricao: result,
          disciplina_id: SUBJECTS.find(s => s.id === selectedSubject)?.id,
          prioridade: 'media',
          status: 'pendente',
          notas: `Criado via ajuda nas tarefas em ${new Date().toLocaleString()}`
        }
      );
      
      if (success && task) {
        // Criar um novo item de tarefa salva para o localStorage também
        const newTask = {
          id: task.id, // Usar o ID do banco de dados
          title: title.length > 50 ? title.substring(0, 50) + '...' : title,
          response: result,
          subject: SUBJECTS.find(s => s.id === selectedSubject)?.name || 'Geral',
          date: new Date()
        };
        
        // Adicionar à lista de tarefas salvas
        const updatedTasks = [newTask, ...savedTasks];
        setSavedTasks(updatedTasks);
        
        // Definir o ID da tarefa atual
        setCurrentTaskId(task.id);
        
        // Salvar no localStorage
        localStorage.setItem(`savedTasks_${user.id}`, JSON.stringify(updatedTasks));
        
        toast({
          title: 'Tarefa salva!',
          description: 'A tarefa foi salva no banco de dados e estará disponível em todos os seus dispositivos.',
          variant: 'default'
        });
      } else {
        throw new Error('Falha ao salvar tarefa no banco de dados');
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      
      // Fallback para salvar apenas no localStorage em caso de erro
      const newTaskId = Date.now().toString();
      const newTask = {
        id: newTaskId,
        title: title.length > 50 ? title.substring(0, 50) + '...' : title,
        response: result,
        subject: SUBJECTS.find(s => s.id === selectedSubject)?.name || 'Geral',
        date: new Date()
      };
      
      // Adicionar à lista de tarefas salvas
      const updatedTasks = [newTask, ...savedTasks];
      setSavedTasks(updatedTasks);
      
      // Definir o ID da tarefa atual
      setCurrentTaskId(newTaskId);
      
      // Salvar no localStorage
      localStorage.setItem(`savedTasks_${user.id}`, JSON.stringify(updatedTasks));
      
      toast({
        title: 'Tarefa salva localmente',
        description: 'Não foi possível salvar no banco de dados, mas a tarefa foi salva neste dispositivo.',
        variant: 'default'
      });
    }
  }

  const handleDeleteSavedTask = async (taskId: string) => {
    if (!user?.id) return;
    
    try {
      // Se for um ID do banco de dados (UUID), excluir do banco antes
      if (taskId.length > 20) {
        console.log('Excluindo tarefa do banco de dados:', taskId);
        await deleteTask(taskId);
      }
      
      // Atualizar estado local
      const updatedTasks = savedTasks.filter(task => task.id !== taskId);
      setSavedTasks(updatedTasks);
      
      // Se estiver removendo a tarefa atual, resetar o currentTaskId
      if (taskId === currentTaskId) {
        setCurrentTaskId(null);
      }
      
      // Atualizar localStorage
      localStorage.setItem(`savedTasks_${user.id}`, JSON.stringify(updatedTasks));
      
      toast({
        title: 'Tarefa removida',
        description: 'A tarefa foi removida com sucesso.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a tarefa do banco de dados.',
        variant: 'destructive'
      });
    }
  }

  const handleLoadSavedTask = (taskId: string) => {
    const task = savedTasks.find(task => task.id === taskId);
    if (task) {
      setResult(task.response);
      setCurrentTaskId(task.id);
      
      // Scroll para a área de resultado
      setTimeout(() => {
        const resultElement = document.querySelector('.task-resolution');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  // Função para verificar se o resultado atual já está salvo
  useEffect(() => {
    if (result && savedTasks.length > 0) {
      // Verifica se o resultado atual já existe nas tarefas salvas
      const savedTask = savedTasks.find(task => task.response === result);
      if (savedTask) {
        setCurrentTaskId(savedTask.id);
      } else {
        setCurrentTaskId(null);
      }
    } else {
      setCurrentTaskId(null);
    }
  }, [result, savedTasks]);

  const processResultForParents = (htmlContent: string): string => {
    // Substituir saudações que mencionam a criança por saudações para os pais
    let processedContent = htmlContent;
    const childName = children.find(c => c.id === selectedChild)?.name || 'seu filho';
    
    // Padrão para encontrar saudações do tipo "Olá, [Nome da criança]!" 
    const greetingPattern = /<p>(Olá,?\s+([^!.,]+)[!.,]?)\s+Vamos\s+resolver/i;
    
    // Substituir por uma saudação para os pais que menciona a criança
    if (greetingPattern.test(processedContent)) {
      processedContent = processedContent.replace(
        greetingPattern, 
        `<p>Vamos orientar ${childName} a resolver`
      );
    } 
    // Se não encontrar um padrão específico, mas tiver uma saudação genérica
    else if (processedContent.includes("<p>Olá!") || processedContent.includes("<p>Olá,")) {
      processedContent = processedContent.replace(
        /<p>(Olá,?[^<]+)/i, 
        `<p>Guia de orientação para ${childName} resolver`
      );
    }
    
    return processedContent;
  };

  /**
   * Obtém o uso de tokens do usuário atual
   */
  const fetchTokenUsage = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('ai_usage')
        .select('tokens_used, tokens_limit')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const used = data.tokens_used
        const limit = 30  // Força o limite para 30 tarefas
        const percentage = Math.min(Math.round((used / limit) * 100), 100)
        
        setTokenUsage({
          used,
          limit,
          percentage
        })
      } else {
        // Se não há dados, inicializa com zero
        setTokenUsage({
          used: 0,
          limit: 30,
          percentage: 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar uso de tokens:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seu uso mensal de tarefas.',
        variant: 'destructive'
      })
    }
  }, [user?.id, supabase, toast])

  // Adicionar useEffect para carregar o uso de tokens na inicialização
  useEffect(() => {
    if (user?.id) {
      fetchTokenUsage()
    }
  }, [user?.id, fetchTokenUsage])

  // Função para carregar as configurações do usuário
  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      const settings = await getUserSettings(user.id);
      console.log('Configurações do usuário carregadas:', settings);
      setUserSettings(settings);
      
      // Inicializar o seletor de dificuldade com base nas configurações do usuário
      if (settings.difficultyLevel) {
        // Verificar se é um valor válido
        if (['easy', 'medium', 'hard'].includes(settings.difficultyLevel)) {
          setSelectedDifficulty(settings.difficultyLevel as 'easy' | 'medium' | 'hard');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do usuário:', error);
      // Manter as configurações padrão em caso de erro
    }
  };

  // Função para formatar tarefas salvas localmente
  const formatLocalTasks = (localTasks: LocalTask[]) => {
    return localTasks.map((task) => ({
      id: task.id,
      title: task.title || '',
      response: task.response || '',
      subject: task.subject || 'Geral',
      date: new Date(task.date),
      source: 'local' as const
    }))
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ajuda com Tarefas</h1>
          <p className="text-muted-foreground">
            Envie a foto da tarefa ou digite o enunciado para receber orientações passo a passo 
            <span className="font-medium"> adaptadas ao perfil do seu filho</span>.
          </p>
        </div>
        
        {/* Status de uso de tarefas mensais */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tarefas resolvidas neste mês</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {tokenUsage.used} de {tokenUsage.limit} tarefas ({Math.round(tokenUsage.percentage)}%)
              </span>
            </div>
            <Progress value={tokenUsage.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Cada imagem ou texto processado consome 1 tarefa do seu limite mensal de 30 tarefas.
              O contador reinicia no primeiro dia de cada mês.
            </p>
          </CardContent>
        </Card>

        {isProcessing && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando a tarefa com IA...
                  </span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {processingProgress < 40 ? 
                    "Convertendo a imagem para análise..." : 
                    processingProgress < 70 ? 
                      "Detectando e processando exercícios..." : 
                      "Gerando explicações detalhadas..."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!result && activeTab === 'image' && (
          <>
            <Card className="mb-4 bg-amber-50 border-amber-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">Como obter os melhores resultados</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Para que a IA identifique e resolva corretamente os exercícios, siga estas dicas:
                    </p>
                    <ul className="text-xs text-amber-600 mt-1 list-disc pl-4 space-y-1">
                      <li>Tire uma foto com boa iluminação e foco claro no texto</li>
                      <li>Certifique-se que todos os exercícios estejam visíveis na imagem</li>
                      <li>Evite sombras, reflexos ou dedos sobre o texto</li>
                      <li>Garanta que a imagem não esteja rotacionada ou distorcida</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Enviar Imagem
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Digitar Tarefa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image">
                <Card>
                  <CardHeader>
                    <CardTitle>Envie uma foto da tarefa</CardTitle>
                    <CardDescription>
                      Tire uma foto clara da tarefa ou arraste e solte um arquivo de imagem.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="child-image">Filho</Label>
                          <Select 
                            value={selectedChild} 
                            onValueChange={setSelectedChild}
                            disabled={children.length === 0}
                          >
                            <SelectTrigger id="child-image">
                              <SelectValue placeholder="Selecione um filho" />
                            </SelectTrigger>
                            <SelectContent>
                              {children.map((child) => (
                                <SelectItem key={child.id} value={child.id}>
                                  <div className="flex flex-col">
                                    <span>{child.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {child.age ? `${child.age} anos` : ''} 
                                      {child.grade ? ` • ${child.grade}º ano` : ''}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="subject-image">Matéria</Label>
                          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger id="subject-image">
                              <SelectValue placeholder="Selecione a matéria" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUBJECTS.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="difficulty-image">Nível de Dificuldade</Label>
                        <Select 
                          value={selectedDifficulty} 
                          onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
                        >
                          <SelectTrigger id="difficulty-image">
                            <SelectValue>
                              {selectedDifficulty && DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty) && (
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium">{DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)?.name}</span>
                                  <span className="text-xs text-muted-foreground">{DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)?.description}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTY_LEVELS.map((level) => (
                              <SelectItem key={level.id} value={level.id}>
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-medium">{level.name}</span>
                                  <span className="text-xs text-muted-foreground">{level.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {selectedChild && (
                      <Card className="mb-4 bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-700">Respostas personalizadas e completas</p>
                              <p className="text-xs text-blue-600 mt-1">
                                As explicações serão adaptadas ao perfil de {children.find(c => c.id === selectedChild)?.name}, 
                                levando em consideração sua idade e ano escolar. Todas as questões da tarefa serão resolvidas com instruções para os pais.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {!uploadedImage ? (
                      <div
                        className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-10 w-10 text-edu-blue-500 animate-spin mb-4" />
                            <p className="text-sm text-muted-foreground">Enviando imagem...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <p className="font-medium mb-1">Clique para enviar ou arraste e solte</p>
                            <p className="text-sm text-muted-foreground">Suporta JPG, PNG ou PDF</p>
                          </div>
                        )}
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg overflow-hidden relative">
                        <img 
                          src={uploadedImage} 
                          alt="Tarefa enviada" 
                          className="w-full object-contain max-h-[400px]"
                          onError={(e) => {
                            console.error('Erro ao carregar imagem:', e);
                            toast({
                              title: 'Erro na imagem',
                              description: 'Houve um problema ao exibir a imagem. Tente enviar novamente.',
                              variant: 'destructive'
                            });
                            setUploadedImage(null);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/90"
                          onClick={() => setUploadedImage(null)}
                        >
                          Remover
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {uploadedImage && (
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant="eduBlue" 
                        onClick={handleSubmit}
                        disabled={isProcessing || !selectedChild}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analisando imagem com IA...
                          </>
                        ) : (
                          'Receber Orientação'
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="text">
                <Card>
                  <CardHeader>
                    <CardTitle>Digite o enunciado da tarefa</CardTitle>
                    <CardDescription>
                      Copie e cole ou digite o texto completo da tarefa para receber ajuda.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label htmlFor="child">Filho</Label>
                            <Select 
                              value={selectedChild} 
                              onValueChange={setSelectedChild}
                              disabled={children.length === 0}
                            >
                              <SelectTrigger id="child">
                                <SelectValue placeholder="Selecione um filho" />
                              </SelectTrigger>
                              <SelectContent>
                                {children.map((child) => (
                                  <SelectItem key={child.id} value={child.id}>
                                    <div className="flex flex-col">
                                      <span>{child.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {child.age ? `${child.age} anos` : ''} 
                                        {child.grade ? ` • ${child.grade}º ano` : ''}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="subject">Matéria</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                              <SelectTrigger id="subject">
                                <SelectValue placeholder="Selecione a matéria" />
                              </SelectTrigger>
                              <SelectContent>
                                {SUBJECTS.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                          <Select 
                            value={selectedDifficulty} 
                            onValueChange={(value) => setSelectedDifficulty(value as 'easy' | 'medium' | 'hard')}
                          >
                            <SelectTrigger id="difficulty">
                              <SelectValue>
                                {selectedDifficulty && DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty) && (
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">{DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)?.name}</span>
                                    <span className="text-xs text-muted-foreground">{DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)?.description}</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {DIFFICULTY_LEVELS.map((level) => (
                                <SelectItem key={level.id} value={level.id}>
                                  <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium">{level.name}</span>
                                    <span className="text-xs text-muted-foreground">{level.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Textarea
                        placeholder="Digite aqui o enunciado da tarefa..."
                        className="min-h-[200px] mb-4"
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        variant="eduBlue"
                        disabled={!taskText.trim() || isProcessing || !selectedChild}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando consulta...
                          </>
                        ) : (
                          'Receber Orientação'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {result && (
              <div className="mt-4">
                <Card className="border-none shadow-sm bg-white rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 task-resolution-header">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-edu-blue-500" />
                          <h2 className="text-lg font-semibold text-gray-800">Resolução da tarefa</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="task-resolution-badge">
                            {SUBJECTS.find(s => s.id === selectedSubject)?.name || selectedSubject}
                          </Badge>
                          <Badge variant="outline" className="task-resolution-badge">
                            {selectedChild && children.find(c => c.id === selectedChild)?.name || 'seu filho'}
                          </Badge>
                          <Badge variant="outline" className="task-resolution-badge">
                            Nível: {DIFFICULTY_LEVELS.find(d => d.id === selectedDifficulty)?.name || 'Médio'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-end gap-2 border-b pb-3">
                        <Button 
                          variant={currentTaskId ? "default" : "outline"} 
                          size="sm" 
                          onClick={handleSaveTask} 
                          className={`btn-save-task ${currentTaskId ? "saved" : ""}`}
                        >
                          {currentTaskId ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 mr-1" /> Salvo
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-4 w-4 mr-1" /> Salvar
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="hover:bg-blue-50">
                          <Printer className="h-4 w-4 mr-1" /> Imprimir
                        </Button>
                      </div>
                      
                      <div id="task-resolution-content" className="task-resolution pt-2" dangerouslySetInnerHTML={{ __html: processResultForParents(result) }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4" />
                  Tarefas Salvas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa salva ainda. Após resolver uma tarefa, 
                    use o botão "Salvar" para adicioná-la à sua lista.
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {savedTasks.map((task) => (
                      <li 
                        key={task.id} 
                        className="border rounded-lg p-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleLoadSavedTask(task.id)}  
                      >
                        <p className="font-medium mb-1 line-clamp-1">{task.title}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDate(task.date)}</span>
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">{task.subject}</span>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Chamar a função handleDeleteSavedTask e tratar assíncrono
                                handleDeleteSavedTask(task.id)
                                  .catch(error => {
                                    console.error('Erro ao excluir tarefa:', error);
                                    toast({
                                      title: 'Erro',
                                      description: 'Não foi possível remover a tarefa. Tente novamente.',
                                      variant: 'destructive'
                                    });
                                  });
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-4 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Dicas para obter melhores resultados:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Certifique-se de que a imagem está nítida e bem iluminada</li>
                <li>Inclua todo o enunciado da tarefa para um contexto completo</li>
                <li>Selecione o filho correto e a matéria adequada</li>
                <li>Para questões de matemática, inclua todo o problema</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskHelp 