import { useState } from 'react'
import { ArrowRight, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePlans, useUserPlan } from '@/lib/plans/usePlans'
import { PlanCard } from '@/components/plans/PlanCard'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle } from 'lucide-react'

export default function Plans() {
  const navigate = useNavigate()
  const { plans, loading: plansLoading, error: plansError } = usePlans()
  const { userPlan, loading: userPlanLoading, error: userPlanError, limits } = useUserPlan()
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null)
  
  const loading = plansLoading || userPlanLoading
  const error = plansError || userPlanError
  
  const handleSubscribe = (planId: string) => {
    setSubscribingPlanId(planId)
    // TODO: integrar com Stripe na etapa seguinte
    console.log('Assinar plano', planId)
    // Por enquanto, simular redirecionamento para checkout
    setTimeout(() => {
      alert(`Redirecionando para checkout do plano ${planId}...`)
      setSubscribingPlanId(null)
    }, 1500)
  }
  
  const handleManageSubscription = () => {
    // TODO: integrar com Stripe na etapa seguinte
    console.log('Gerenciar assinatura')
    // Por enquanto, simular abertura do portal de gerenciamento
    alert('Redirecionando para portal de gerenciamento de assinatura...')
  }
  
  const getTokensUsagePercentage = () => {
    if (!userPlan) return 0
    const used = userPlan.tokens_limit - limits.tokensRemaining
    return Math.min(100, Math.max(0, (used / userPlan.tokens_limit) * 100))
  }
  
  const getMessagesUsagePercentage = () => {
    if (!userPlan) return 0
    const used = userPlan.messages_limit - limits.messagesRemaining
    return Math.min(100, Math.max(0, (used / userPlan.messages_limit) * 100))
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Planos e Assinaturas</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Escolha o plano que melhor atende às suas necessidades. Todos os planos incluem acesso à plataforma EduPais.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando planos...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              {error}. Por favor, tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {userPlan && (
              <div className="bg-card border rounded-lg p-6 max-w-4xl mx-auto mb-8">
                <h2 className="text-xl font-bold mb-4">Seu plano atual: {userPlan.nome}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Tokens restantes</span>
                        <span className="text-sm font-medium">{limits.tokensRemaining} de {userPlan.tokens_limit}</span>
                      </div>
                      <Progress value={getTokensUsagePercentage()} className="h-2" />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Mensagens restantes</span>
                        <span className="text-sm font-medium">{limits.messagesRemaining} de {userPlan.messages_limit}</span>
                      </div>
                      <Progress value={getMessagesUsagePercentage()} className="h-2" />
                    </div>
                    
                    {(limits.tokensRemaining < userPlan.tokens_limit * 0.1 || 
                      limits.messagesRemaining < userPlan.messages_limit * 0.1) && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Limite próximo</AlertTitle>
                        <AlertDescription>
                          Você está perto de atingir o limite do seu plano. Considere fazer upgrade para um plano superior.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <Button 
                      variant="default" 
                      onClick={handleManageSubscription}
                      className="w-full md:w-auto md:self-end"
                    >
                      Gerenciar assinatura
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={userPlan?.id === plan.id}
                  onSubscribe={(planId) => handleSubscribe(planId)}
                  onManage={handleManageSubscription}
                />
              ))}
            </div>
          </>
        )}
        
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-4">Perguntas frequentes</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Como funcionam os limites de tokens e mensagens?</h3>
              <p className="text-muted-foreground text-sm">
                Tokens são usados para processar solicitações de IA, enquanto as mensagens são contabilizadas em conversas no chat. Ambos os limites são renovados mensalmente.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-muted-foreground text-sm">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor imediatamente.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Como faço para cancelar minha assinatura?</h3>
              <p className="text-muted-foreground text-sm">
                Você pode cancelar sua assinatura através do portal de gerenciamento de assinatura. O acesso continua disponível até o final do período pago.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Os limites acumulam de um mês para outro?</h3>
              <p className="text-muted-foreground text-sm">
                Não, os limites de tokens e mensagens são renovados no início de cada ciclo de cobrança e não acumulam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 