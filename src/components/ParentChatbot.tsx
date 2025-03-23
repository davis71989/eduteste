import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Paperclip, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { processAiQuery } from '@/lib/aiService'
import { getUserSettings } from '@/lib/supabase'

// Tipos para as mensagens do chat
type MessageType = 'user' | 'bot'

interface Message {
  id: string
  content: string
  type: MessageType
  timestamp: Date
  isLoading?: boolean
}

interface ParentChatbotProps {
  childName?: string
  userAvatar?: string
  userId: string
  childId?: string
}

const ParentChatbot = ({ childName, userAvatar, userId, childId }: ParentChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: childName 
        ? `Olá! Sou o assistente educacional da EduPais. Como posso ajudar você com o aprendizado de ${childName} hoje?`
        : 'Olá! Sou o assistente educacional da EduPais. Como posso ajudar você com a educação do seu filho(a) hoje?',
      type: 'bot',
      timestamp: new Date()
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [subject, setSubject] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [userSettings, setUserSettings] = useState<any>({ difficultyLevel: 'medium' })
  
  // Carregar configurações do usuário ao inicializar
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) return;
      
      try {
        const settings = await getUserSettings(userId);
        console.log('Configurações do usuário carregadas no chat:', settings);
        setUserSettings(settings);
      } catch (error) {
        console.error('Erro ao carregar configurações do usuário no chat:', error);
        // Manter as configurações padrão em caso de erro
      }
    };
    
    loadUserSettings();
  }, [userId]);
  
  // Função para rolar para o final da conversa
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Rolar para baixo quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // Função para enviar mensagem para a IA e receber resposta
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return
    
    // Gerar ID único para a mensagem
    const userMessageId = Date.now().toString()
    
    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: userMessageId,
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    
    // Simular carregamento da resposta
    setIsTyping(true)
    
    // Gerar ID único para a resposta
    const botMessageId = (Date.now() + 1).toString()
    
    // Adicionar mensagem de carregamento
    const loadingMessage: Message = {
      id: botMessageId,
      content: '',
      type: 'bot',
      timestamp: new Date(),
      isLoading: true
    }
    
    setMessages(prev => [...prev, loadingMessage])
    
    try {
      // Chamar a API de IA usando processAiQuery
      const aiResponse = await processAiQuery({
        query: inputValue,
        userId: userId,
        childId: childId,
        subject: subject,
        difficultyLevel: userSettings.difficultyLevel
      })
      
      // Atualizar mensagem com a resposta
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId
          ? { ...msg, content: aiResponse.response, isLoading: false }
          : msg
      ))
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      // Tratar erro
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId
          ? { ...msg, content: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.", isLoading: false }
          : msg
      ))
    } finally {
      setIsTyping(false)
    }
  }
  
  // Lidar com tecla Enter para enviar mensagem
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-edu-blue-700">Assistente Educacional</CardTitle>
            <CardDescription>
              Tire suas dúvidas sobre educação e desenvolvimento infantil
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-edu-blue-50 text-edu-blue-700">
            EduPais IA
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 h-[400px] overflow-y-auto p-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className={message.type === 'user' ? 'bg-edu-blue-100' : 'bg-green-100'}>
                  {message.type === 'user' ? (
                    <>
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-edu-blue-100 text-edu-blue-700">
                        <User size={16} />
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-green-100 text-green-700">
                      <Bot size={16} />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.type === 'user'
                      ? 'bg-edu-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center justify-center h-6">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    message.type === 'bot' ? (
                      <div dangerouslySetInnerHTML={{ __html: message.content }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )
                  )}
                  <div 
                    className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-edu-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-3">
        <div className="flex w-full items-center space-x-2">
          <Button variant="outline" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            className="flex-1 min-h-10 resize-none"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === '' || isTyping}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ParentChatbot 