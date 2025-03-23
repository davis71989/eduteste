import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Plan } from '@/lib/plans/planService'

interface PlanCardProps {
  plan: Plan
  isCurrentPlan?: boolean
  onSubscribe?: (planId: string) => void
  onManage?: () => void
}

export function PlanCard({ plan, isCurrentPlan = false, onSubscribe, onManage }: PlanCardProps) {
  const getRecursos = () => {
    if (!plan.recursos) return []
    
    // Converte o JSONB para objeto se necessário
    const recursos = typeof plan.recursos === 'string' 
      ? JSON.parse(plan.recursos) 
      : plan.recursos
    
    return Object.entries(recursos)
      .filter(([_, value]) => value === true)
      .map(([key]) => {
        // Formata o nome do recurso (ex: "suporte_prioritario" -> "Suporte prioritário")
        return key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      })
  }
  
  return (
    <Card className={`w-full max-w-sm h-full flex flex-col transition-all duration-200 ${
      isCurrentPlan ? 'border-primary border-2 shadow-lg' : 'border'
    }`}>
      <CardHeader>
        {isCurrentPlan && (
          <Badge className="w-fit mb-2" variant="outline">
            Seu plano atual
          </Badge>
        )}
        <CardTitle className="text-xl font-bold">{plan.nome}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {plan.descricao}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
        <div>
          <p className="text-3xl font-bold">
            R$ {parseFloat(String(plan.preco)).toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">
              /{plan.intervalo === 'mensal' ? 'mês' : 'ano'}
            </span>
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Limites:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.tokens_limit} tokens/mês</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span>{plan.messages_limit} mensagens/mês</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Recursos:</span>
          </div>
          
          {getRecursos().map((recurso, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{recurso}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        {isCurrentPlan ? (
          <Button variant="outline" onClick={onManage} className="w-full">
            Gerenciar assinatura
          </Button>
        ) : (
          <Button 
            onClick={() => onSubscribe?.(plan.id)} 
            className="w-full"
          >
            Assinar plano
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 