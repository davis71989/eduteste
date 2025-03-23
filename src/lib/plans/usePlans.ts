import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { Plan } from './planService'

// Hook para buscar todos os planos ativos
export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .order('preco', { ascending: true })
        
        if (error) throw error
        
        setPlans(data || [])
      } catch (err: any) {
        console.error('Erro ao buscar planos:', err)
        setError(err.message || 'Erro ao buscar planos')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Função para recarregar os planos
  const refetch = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('preco', { ascending: true })
      
      if (error) throw error
      
      setPlans(data || [])
      setError(null)
    } catch (err: any) {
      console.error('Erro ao recarregar planos:', err)
      setError(err.message || 'Erro ao recarregar planos')
    } finally {
      setLoading(false)
    }
  }

  return { plans, loading, error, refetch }
}

// Hook para buscar um plano específico por ID
export const usePlan = (planId: string | null) => {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) {
      setPlan(null)
      setLoading(false)
      return
    }

    const fetchPlan = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('id', planId)
          .single()
        
        if (error) throw error
        
        setPlan(data)
      } catch (err: any) {
        console.error(`Erro ao buscar plano ${planId}:`, err)
        setError(err.message || 'Erro ao buscar plano')
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [planId])

  return { plan, loading, error }
}

// Hook para buscar o plano ativo do usuário atual
export const useUserPlan = () => {
  const [userPlan, setUserPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limits, setLimits] = useState({
    tokensRemaining: 0,
    messagesRemaining: 0
  })

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        setLoading(true)
        
        // Buscar o usuário atual
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setUserPlan(null)
          return
        }
        
        // Buscar a assinatura ativa do usuário
        const { data: assinatura, error: assinaturaError } = await supabase
          .from('assinaturas')
          .select('plano_id')
          .eq('usuario_id', user.id)
          .eq('status', 'ativo')
          .single()
        
        if (assinaturaError && assinaturaError.code !== 'PGRST116') {
          throw assinaturaError
        }
        
        // Se não tiver assinatura, retorna null
        if (!assinatura) {
          setUserPlan(null)
          return
        }
        
        // Buscar o plano da assinatura
        const { data: plano, error: planoError } = await supabase
          .from('planos')
          .select('*')
          .eq('id', assinatura.plano_id)
          .single()
        
        if (planoError) throw planoError
        
        setUserPlan(plano)
        
        // Buscar os limites de uso
        await fetchUserLimits(user.id, plano)
      } catch (err: any) {
        console.error('Erro ao buscar plano do usuário:', err)
        setError(err.message || 'Erro ao buscar plano do usuário')
      } finally {
        setLoading(false)
      }
    }

    const fetchUserLimits = async (userId: string, plan: Plan | null) => {
      if (!plan) return
      
      try {
        // Buscar o uso atual de tokens
        const { data: aiUsage, error: aiError } = await supabase
          .from('ai_usage')
          .select('tokens_used')
          .eq('user_id', userId)
          .single()
        
        if (aiError && aiError.code !== 'PGRST116') {
          throw aiError
        }
        
        // Buscar o uso atual de mensagens
        const { data: chatUsage, error: chatError } = await supabase
          .from('chat_usage')
          .select('messages_used')
          .eq('user_id', userId)
          .single()
        
        if (chatError && chatError.code !== 'PGRST116') {
          throw chatError
        }
        
        const tokensUsed = aiUsage?.tokens_used || 0
        const messagesUsed = chatUsage?.messages_used || 0
        
        setLimits({
          tokensRemaining: Math.max(0, plan.tokens_limit - tokensUsed),
          messagesRemaining: Math.max(0, plan.messages_limit - messagesUsed)
        })
      } catch (err: any) {
        console.error('Erro ao buscar limites do usuário:', err)
        // Não definimos o erro aqui para não interromper o carregamento do plano
      }
    }

    fetchUserPlan()
  }, [])

  // Função para recarregar os dados do plano do usuário
  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Buscar o usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUserPlan(null)
        return
      }
      
      // Buscar a assinatura ativa do usuário
      const { data: assinatura, error: assinaturaError } = await supabase
        .from('assinaturas')
        .select('plano_id')
        .eq('usuario_id', user.id)
        .eq('status', 'ativo')
        .single()
      
      if (assinaturaError && assinaturaError.code !== 'PGRST116') {
        throw assinaturaError
      }
      
      // Se não tiver assinatura, retorna null
      if (!assinatura) {
        setUserPlan(null)
        return
      }
      
      // Buscar o plano da assinatura
      const { data: plano, error: planoError } = await supabase
        .from('planos')
        .select('*')
        .eq('id', assinatura.plano_id)
        .single()
      
      if (planoError) throw planoError
      
      setUserPlan(plano)
      
      // Atualizar os limites
      await fetchUserLimits(user.id, plano)
    } catch (err: any) {
      console.error('Erro ao recarregar plano do usuário:', err)
      setError(err.message || 'Erro ao recarregar plano do usuário')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserLimits = async (userId: string, plan: Plan | null) => {
    if (!plan) return
    
    try {
      // Buscar o uso atual de tokens
      const { data: aiUsage, error: aiError } = await supabase
        .from('ai_usage')
        .select('tokens_used')
        .eq('user_id', userId)
        .single()
      
      if (aiError && aiError.code !== 'PGRST116') {
        throw aiError
      }
      
      // Buscar o uso atual de mensagens
      const { data: chatUsage, error: chatError } = await supabase
        .from('chat_usage')
        .select('messages_used')
        .eq('user_id', userId)
        .single()
      
      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError
      }
      
      const tokensUsed = aiUsage?.tokens_used || 0
      const messagesUsed = chatUsage?.messages_used || 0
      
      setLimits({
        tokensRemaining: Math.max(0, plan.tokens_limit - tokensUsed),
        messagesRemaining: Math.max(0, plan.messages_limit - messagesUsed)
      })
    } catch (err: any) {
      console.error('Erro ao buscar limites do usuário:', err)
      // Não definimos o erro aqui para não interromper o carregamento do plano
    }
  }

  return { userPlan, loading, error, limits, refetch }
}

// Hook para permitir que administradores gerenciem planos
export const useAdminPlans = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { plans, loading: plansLoading, error: plansError, refetch: refetchPlans } = usePlans()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true)
        
        // Buscar o usuário atual
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setIsAdmin(false)
          return
        }
        
        // Verificar se o usuário é admin
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        setIsAdmin(data?.role === 'admin')
      } catch (err) {
        console.error('Erro ao verificar status de admin:', err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  // Criar um novo plano (apenas admin)
  const createPlan = async (planData: Omit<Plan, 'id' | 'criado_em' | 'atualizado_em'>) => {
    if (!isAdmin) {
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
    
    // Recarregar a lista de planos
    await refetchPlans()
    
    return data
  }

  // Atualizar um plano (apenas admin)
  const updatePlan = async (id: string, planData: Partial<Omit<Plan, 'id' | 'criado_em' | 'atualizado_em'>>) => {
    if (!isAdmin) {
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
    
    // Recarregar a lista de planos
    await refetchPlans()
    
    return data
  }

  // Desativar um plano (apenas admin)
  const deletePlan = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Apenas administradores podem excluir planos')
    }
    
    const { error } = await supabase
      .from('planos')
      .update({ ativo: false })
      .eq('id', id)
    
    if (error) {
      console.error('Erro ao excluir plano:', error)
      throw new Error('Não foi possível excluir o plano')
    }
    
    // Recarregar a lista de planos
    await refetchPlans()
  }

  return {
    isAdmin,
    loading: loading || plansLoading,
    plans,
    error: plansError,
    createPlan,
    updatePlan,
    deletePlan,
    refetch: refetchPlans
  }
} 