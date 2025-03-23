import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getUserAiUsage } from '@/lib/aiService'

interface AiUsageStatsProps {
  userId: string
}

export function AiUsageStats({ userId }: AiUsageStatsProps) {
  const [usageData, setUsageData] = useState({
    used: 0,
    limit: 10000,
    resetDate: null as Date | null,
    percentUsed: 0
  })
  
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadUsageData = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const data = await getUserAiUsage(userId)
        setUsageData(data)
      } catch (error) {
        console.error('Erro ao carregar dados de uso da IA:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUsageData()
  }, [userId])
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'Não definido'
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Uso do Assistente IA</CardTitle>
        <CardDescription>
          Tokens são unidades de processamento utilizadas pela IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse">Carregando dados de uso...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {usageData.used} de {usageData.limit} tokens
                </span>
                <span className="text-sm text-muted-foreground">
                  {usageData.percentUsed.toFixed(1)}%
                </span>
              </div>
              <Progress value={usageData.percentUsed} className="h-2" />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Sua cota de uso será renovada em: {formatDate(usageData.resetDate)}</p>
            </div>
            
            <div className="text-xs bg-muted p-2 rounded">
              <p>O assistente IA está usando o modelo <strong>Gemini 2.0 Pro (gratuito via OpenRouter)</strong> para gerar respostas educacionais personalizadas e analisar imagens de tarefas.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AiUsageStats 