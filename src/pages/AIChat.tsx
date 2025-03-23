import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { sendChatMessage, getChatUsage, ChatUsageInfo, ChatMessage } from '@/lib/chatService'
import { useAuth } from '@/lib/AuthContext'

// Mapeamento do tipo ChatMessage para Message usado na interface
type Message = {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const AIChat = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou o assistente educacional do EduPais. Como posso ajudar você hoje?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [chatUsage, setChatUsage] = useState<ChatUsageInfo>({
    used: 0,
    limit: 50,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    percentUsed: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar informações de uso
  useEffect(() => {
    const loadUsageInfo = async () => {
      if (!user?.id) return
      
      try {
        const usage = await getChatUsage(user.id)
        setChatUsage(usage)
      } catch (error) {
        console.error('Erro ao carregar informações de uso:', error)
      }
    }
    
    loadUsageInfo()
  }, [user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || !user?.id) return
    
    // Verificar limite de uso
    if (chatUsage.used >= chatUsage.limit) {
      toast({
        title: 'Limite atingido',
        description: 'Você atingiu o limite mensal de mensagens do chat. Considere fazer upgrade para um plano premium.',
        variant: 'destructive'
      })
      return
    }
    
    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setIsLoading(true)
    
    try {
      // Enviar mensagem para o serviço de chat
      const response = await sendChatMessage(
        user.id,
        conversationId,
        userInput,
        messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.sender === 'user' ? 'user' : 'assistant',
          createdAt: msg.timestamp
        }))
      )
      
      // Atualizar ID da conversa
      setConversationId(response.conversationId)
      
      // Adicionar resposta do bot
      const botMessage: Message = {
        id: response.messageId,
        content: response.response,
        sender: 'bot',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
      
      // Atualizar informações de uso
      const updatedUsage = await getChatUsage(user.id)
      setChatUsage(updatedUsage)
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Não foi possível processar sua mensagem. Tente novamente.',
        variant: 'destructive'
      })
      
      // Adicionar mensagem de erro do bot
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        sender: 'bot',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const formatResetDate = (date: Date | null) => {
    if (!date) return 'em breve'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chat IA Educacional</h1>
          <p className="text-muted-foreground">
            Converse com nosso assistente virtual para tirar dúvidas sobre o uso do EduPais e sobre educação.
          </p>
        </div>
        
        {/* Informações de uso */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Seu uso mensal do chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{chatUsage.used} de {chatUsage.limit} mensagens</span>
                <span>{chatUsage.percentUsed}%</span>
              </div>
              <Progress value={chatUsage.percentUsed} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Seu limite redefine em: {formatResetDate(chatUsage.resetDate)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Assistente Educacional</CardTitle>
            <CardDescription>
              Tire dúvidas sobre o EduPais ou peça orientações educacionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 mb-4 h-[400px] overflow-y-auto p-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[80%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-edu-blue-500 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="mr-2 mt-0.5">
                      {message.sender === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] rounded-lg p-4 bg-slate-100 text-slate-800">
                    <div className="mr-2 mt-0.5">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Digitando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <Textarea
                placeholder="Digite sua dúvida aqui..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[80px] flex-1"
                disabled={isLoading || chatUsage.used >= chatUsage.limit}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10" 
                disabled={isLoading || !input.trim() || chatUsage.used >= chatUsage.limit}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar mensagem</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sugestões de Perguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-edu-blue-500 text-left"
                    onClick={() => setInput("Quais são os recursos disponíveis no EduPais?")}
                    disabled={isLoading || chatUsage.used >= chatUsage.limit}
                  >
                    Quais são os recursos disponíveis no EduPais?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-edu-blue-500 text-left"
                    onClick={() => setInput("Como faço para criar um simulado personalizado?")}
                    disabled={isLoading || chatUsage.used >= chatUsage.limit}
                  >
                    Como faço para criar um simulado personalizado?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-edu-blue-500 text-left"
                    onClick={() => setInput("Quais são os planos e preços do EduPais?")}
                    disabled={isLoading || chatUsage.used >= chatUsage.limit}
                  >
                    Quais são os planos e preços do EduPais?
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-edu-blue-100 text-edu-blue-700 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Pergunte sobre como usar as funcionalidades do EduPais</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-edu-blue-100 text-edu-blue-700 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Tire dúvidas sobre os planos e recursos disponíveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-edu-blue-100 text-edu-blue-700 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Peça dicas para melhor utilizar o aplicativo com seus filhos</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AIChat 