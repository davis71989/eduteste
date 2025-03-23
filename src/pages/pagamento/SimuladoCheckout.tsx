import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlanService } from '@/lib/services/planService'
import { supabase as createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/use-toast'

const SimuladoCheckout = () => {
  const { sessionId, planoId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plano, setPlano] = useState<any>(null)
  const [completingPayment, setCompletingPayment] = useState(false)

  useEffect(() => {
    const loadPlanDetails = async () => {
      // Verificar se temos o ID da sessão e do plano
      if (!sessionId || !planoId) {
        navigate('/planos')
        return
      }

      try {
        // Buscar o plano pelo ID
        const { data, error } = await createClient
          .from('planos')
          .select('*')
          .eq('id', planoId)
          .single()

        if (error || !data) {
          console.error('Erro ao buscar plano:', error)
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar os detalhes do plano.',
            variant: 'destructive'
          })
          navigate('/planos')
          return
        }

        setPlano(data)
      } catch (error) {
        console.error('Erro ao processar dados do plano:', error)
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao processar os dados. Tente novamente.',
          variant: 'destructive'
        })
        navigate('/planos')
      } finally {
        setLoading(false)
      }
    }

    loadPlanDetails()
  }, [sessionId, planoId, navigate])

  const getNextResetDate = () => {
    const now = new Date();
    const resetDate = new Date();
    
    // Define a data de reset para o primeiro dia do próximo mês
    resetDate.setMonth(now.getMonth() + 1);
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);
    
    return resetDate.toISOString();
  }

  const handleCompletePurchase = async () => {
    if (!user || !sessionId || !planoId) return

    setCompletingPayment(true)

    try {
      // 1. Buscar a assinatura pelo sessionId exato
      let { data: assinatura, error } = await createClient
        .from('assinaturas')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .single()
        
      // Se não encontrar pelo ID exato, tenta buscar com ILIKE para caso o ID tenha sido modificado de alguma forma
      if (error || !assinatura) {
        const { data: assinaturaFallback, error: errorFallback } = await createClient
          .from('assinaturas')
          .select('*')
          .ilike('stripe_checkout_session_id', `%${sessionId}%`)
          .eq('status', 'pendente')
          .single()
          
        if (errorFallback || !assinaturaFallback) {
          throw new Error('Assinatura não encontrada')
        }
        
        assinatura = assinaturaFallback
      }
      
      // 2. Atualizar a assinatura para ativa
      const { error: updateError } = await createClient
        .from('assinaturas')
        .update({ status: 'ativo' })
        .eq('id', assinatura.id)
        
      if (updateError) throw updateError
      
      // 3. Buscar os limites do plano
      const { data: planoData, error: planoError } = await createClient
        .from('planos')
        .select('*')
        .eq('id', planoId)
        .single()
        
      if (planoError || !planoData) throw new Error('Plano não encontrado')
      
      // 4. Definir próxima data de reset
      const nextResetDate = getNextResetDate()
      
      // 5. Verificar e atualizar registros de ai_usage
      const { data: aiUsageExistente, error: aiUsageError } = await createClient
        .from('ai_usage')
        .select('*')
        .eq('usuario_id', user.id)
        .single()
        
      if (aiUsageError && aiUsageError.code !== 'PGRST116') {
        // Se for um erro diferente de "não encontrado"
        throw aiUsageError
      }
      
      if (aiUsageExistente) {
        // Atualizar registro existente
        await createClient
          .from('ai_usage')
          .update({
            tokens_used: 0,
            tokens_limit: planoData.ai_tokens_limit,
            next_reset_date: nextResetDate
          })
          .eq('usuario_id', user.id)
      } else {
        // Criar novo registro
        await createClient
          .from('ai_usage')
          .insert({
            usuario_id: user.id,
            tokens_used: 0,
            tokens_limit: planoData.ai_tokens_limit,
            next_reset_date: nextResetDate
          })
      }
      
      // 6. Verificar e atualizar registros de chat_usage
      const { data: chatUsageExistente, error: chatUsageError } = await createClient
        .from('chat_usage')
        .select('*')
        .eq('usuario_id', user.id)
        .single()
        
      if (chatUsageError && chatUsageError.code !== 'PGRST116') {
        // Se for um erro diferente de "não encontrado"
        throw chatUsageError
      }
      
      if (chatUsageExistente) {
        // Atualizar registro existente
        await createClient
          .from('chat_usage')
          .update({
            mensagens_usadas: 0,
            mensagens_limite: planoData.chat_mensagens_limit,
            next_reset_date: nextResetDate
          })
          .eq('usuario_id', user.id)
      } else {
        // Criar novo registro
        await createClient
          .from('chat_usage')
          .insert({
            usuario_id: user.id,
            mensagens_usadas: 0,
            mensagens_limite: planoData.chat_mensagens_limit,
            next_reset_date: nextResetDate
          })
      }

      // 7. Redirecionar para página de sucesso
      toast({
        title: 'Sucesso',
        description: 'Sua assinatura foi ativada com sucesso!',
        variant: 'default'
      })
      
      navigate('/pagamento/sucesso')
    } catch (error) {
      console.error('Erro ao completar pagamento:', error)
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível completar seu pagamento. Por favor, tente novamente ou entre em contato com o suporte.',
        variant: 'destructive'
      })
    } finally {
      setCompletingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8 text-center">Simulação de Pagamento</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
        
        <div className="border-t border-b py-4 my-4">
          <div className="flex justify-between mb-2">
            <span>Plano:</span>
            <span className="font-medium">{plano?.nome}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Valor:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(plano?.preco_mensal || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Período:</span>
            <span className="font-medium">Mensal</span>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleCompletePurchase}
            disabled={completingPayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {completingPayment ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Processando...</span>
              </span>
            ) : (
              'Finalizar Pagamento'
            )}
          </button>
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-500">
        Esta é uma simulação de pagamento para fins de teste. <br />
        Em um ambiente de produção, você seria redirecionado para o checkout do Stripe.
      </p>
    </div>
  )
}

export default SimuladoCheckout 