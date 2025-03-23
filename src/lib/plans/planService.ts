import { supabase } from '../supabase'

export type Plan = {
  id: string
  nome: string
  descricao: string
  preco: number
  intervalo: string
  recursos: Record<string, boolean>
  ativo: boolean
  tokens_limit: number
  messages_limit: number
  stripe_price_id?: string
  stripe_product_id?: string
  criado_em?: string
  atualizado_em?: string
}

export type CreatePlanInput = Omit<Plan, 'id' | 'criado_em' | 'atualizado_em'>
export type UpdatePlanInput = Partial<Omit<Plan, 'id' | 'criado_em' | 'atualizado_em'>>

// Função para verificar se o usuário é admin
const isAdmin = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return data?.role === 'admin'
}

// Obter todos os planos ativos
export const getAllPlans = async (): Promise<Plan[]> => {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .eq('ativo', true)
    .order('preco', { ascending: true })
  
  if (error) {
    console.error('Erro ao buscar planos:', error)
    throw new Error('Não foi possível obter os planos')
  }
  
  return data || []
}

// Obter plano por ID
export const getPlanById = async (id: string): Promise<Plan | null> => {
  const { data, error } = await supabase
    .from('planos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Erro ao buscar plano:', error)
    throw new Error('Não foi possível obter o plano')
  }
  
  return data
}

// Criar um novo plano (apenas admin)
export const createPlan = async (planData: CreatePlanInput): Promise<Plan> => {
  // Verificar permissões
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Apenas administradores podem criar planos')
  }
  
  const { data, error } = await supabase
    .from('planos')
    .insert(planData)
    .select()
    .single()
  
  if (error) {
    console.error('Erro ao criar plano:', error)
    throw new Error('Não foi possível criar o plano')
  }
  
  return data
}

// Atualizar um plano (apenas admin)
export const updatePlan = async (id: string, planData: UpdatePlanInput): Promise<Plan> => {
  // Verificar permissões
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Apenas administradores podem atualizar planos')
  }
  
  const { data, error } = await supabase
    .from('planos')
    .update(planData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Erro ao atualizar plano:', error)
    throw new Error('Não foi possível atualizar o plano')
  }
  
  return data
}

// Excluir um plano (apenas admin) - na verdade, desativa o plano
export const deletePlan = async (id: string): Promise<void> => {
  // Verificar permissões
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Apenas administradores podem excluir planos')
  }
  
  // Em vez de excluir, apenas desativa o plano
  const { error } = await supabase
    .from('planos')
    .update({ ativo: false })
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao excluir plano:', error)
    throw new Error('Não foi possível excluir o plano')
  }
}

// Função para obter o plano ativo de um usuário
export const getUserActivePlan = async (userId: string): Promise<Plan | null> => {
  // Busca a assinatura ativa do usuário
  const { data: assinatura, error: assinaturaError } = await supabase
    .from('assinaturas')
    .select('plano_id')
    .eq('usuario_id', userId)
    .eq('status', 'ativo')
    .single()
  
  if (assinaturaError && assinaturaError.code !== 'PGRST116') { // Código para "nenhum registro encontrado"
    console.error('Erro ao buscar assinatura:', assinaturaError)
    throw new Error('Não foi possível obter a assinatura do usuário')
  }
  
  // Se não tiver assinatura, retorna null
  if (!assinatura) return null
  
  // Busca o plano da assinatura
  const { data: plano, error: planoError } = await supabase
    .from('planos')
    .select('*')
    .eq('id', assinatura.plano_id)
    .single()
  
  if (planoError) {
    console.error('Erro ao buscar plano da assinatura:', planoError)
    throw new Error('Não foi possível obter os detalhes do plano')
  }
  
  return plano
}

// Função para verificar limites do usuário
export const checkUserLimits = async (userId: string): Promise<{
  tokensRemaining: number,
  messagesRemaining: number,
  planInfo: Plan | null
}> => {
  // Obter o plano ativo do usuário
  const planInfo = await getUserActivePlan(userId)
  
  if (!planInfo) {
    // Se não tiver plano, definir limites padrão
    return {
      tokensRemaining: 0,
      messagesRemaining: 0,
      planInfo: null
    }
  }
  
  // Buscar o uso atual de tokens
  const { data: aiUsage, error: aiError } = await supabase
    .from('ai_usage')
    .select('tokens_used, tokens_limit')
    .eq('user_id', userId)
    .single()
  
  if (aiError && aiError.code !== 'PGRST116') {
    console.error('Erro ao buscar uso de AI:', aiError)
    throw new Error('Não foi possível verificar o uso de tokens')
  }
  
  // Buscar o uso atual de mensagens
  const { data: chatUsage, error: chatError } = await supabase
    .from('chat_usage')
    .select('messages_used, messages_limit')
    .eq('user_id', userId)
    .single()
  
  if (chatError && chatError.code !== 'PGRST116') {
    console.error('Erro ao buscar uso de chat:', chatError)
    throw new Error('Não foi possível verificar o uso de mensagens')
  }
  
  const tokensUsed = aiUsage?.tokens_used || 0
  const messagesUsed = chatUsage?.messages_used || 0
  
  return {
    tokensRemaining: Math.max(0, planInfo.tokens_limit - tokensUsed),
    messagesRemaining: Math.max(0, planInfo.messages_limit - messagesUsed),
    planInfo
  }
}

// Função para atualizar o uso de tokens
export const updateTokenUsage = async (userId: string, tokensToAdd: number): Promise<void> => {
  // Verificar se o registro existe
  const { data: exists } = await supabase
    .from('ai_usage')
    .select('id, tokens_used')
    .eq('user_id', userId)
    .single()
  
  if (exists) {
    // Atualizar o registro existente
    const { error } = await supabase
      .from('ai_usage')
      .update({
        tokens_used: exists.tokens_used + tokensToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('id', exists.id)
    
    if (error) {
      console.error('Erro ao atualizar uso de tokens:', error)
      throw new Error('Não foi possível atualizar o uso de tokens')
    }
  } else {
    // Obter o plano do usuário para definir o limite
    const planInfo = await getUserActivePlan(userId)
    const tokensLimit = planInfo?.tokens_limit || 0
    
    // Criar um novo registro
    const { error } = await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        tokens_used: tokensToAdd,
        tokens_limit: tokensLimit,
        reset_date: getNextResetDate(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Erro ao criar registro de uso de tokens:', error)
      throw new Error('Não foi possível registrar o uso de tokens')
    }
  }
}

// Função para atualizar o uso de mensagens
export const updateMessageUsage = async (userId: string, messagesToAdd: number): Promise<void> => {
  // Verificar se o registro existe
  const { data: exists } = await supabase
    .from('chat_usage')
    .select('id, messages_used')
    .eq('user_id', userId)
    .single()
  
  if (exists) {
    // Atualizar o registro existente
    const { error } = await supabase
      .from('chat_usage')
      .update({
        messages_used: exists.messages_used + messagesToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('id', exists.id)
    
    if (error) {
      console.error('Erro ao atualizar uso de mensagens:', error)
      throw new Error('Não foi possível atualizar o uso de mensagens')
    }
  } else {
    // Obter o plano do usuário para definir o limite
    const planInfo = await getUserActivePlan(userId)
    const messagesLimit = planInfo?.messages_limit || 0
    
    // Criar um novo registro
    const { error } = await supabase
      .from('chat_usage')
      .insert({
        user_id: userId,
        messages_used: messagesToAdd,
        messages_limit: messagesLimit,
        reset_date: getNextResetDate(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Erro ao criar registro de uso de mensagens:', error)
      throw new Error('Não foi possível registrar o uso de mensagens')
    }
  }
}

// Função auxiliar para calcular a próxima data de reset (primeiro dia do próximo mês)
const getNextResetDate = (): string => {
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  return nextMonth.toISOString()
}

// TODO: integrar com Stripe na etapa seguinte
export const createStripeSubscription = async (userId: string, planId: string): Promise<void> => {
  // Implementação futura com Stripe
  console.log('TODO: Implementar integração com Stripe', { userId, planId })
}

// TODO: integrar com Stripe na etapa seguinte
export const cancelStripeSubscription = async (subscriptionId: string): Promise<void> => {
  // Implementação futura com Stripe
  console.log('TODO: Implementar cancelamento de assinatura no Stripe', { subscriptionId })
} 