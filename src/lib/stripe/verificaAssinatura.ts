// Funções para verificar o status da assinatura e consumo de recursos
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { SUBSCRIPTION_STATUS } from './config';

// Interface para informações da assinatura
export interface AssinaturaInfo {
  id: string;
  plano_id: string;
  nome_plano: string;
  status: string;
  ativa: boolean;
  tokens_restantes: number;
  messages_restantes: number;
  data_inicio: string;
  data_fim: string | null;
  periodo_atual_inicio: string | null;
  periodo_atual_fim: string | null;
  renovacao_automatica: boolean;
  stripe_subscription_id: string | null;
}

// Verificar se o usuário tem uma assinatura ativa
export const verificarAssinaturaAtiva = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('status')
    .eq('usuario_id', userId)
    .in('status', [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL])
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
};

// Obter informações detalhadas da assinatura do usuário
export const obterInfoAssinatura = async (userId: string): Promise<AssinaturaInfo | null> => {
  const { data, error } = await supabase
    .from('assinaturas')
    .select(`
      id,
      plano_id,
      status,
      data_inicio,
      data_fim,
      renovacao_automatica,
      tokens_restantes,
      messages_restantes,
      periodo_atual_inicio,
      periodo_atual_fim,
      stripe_subscription_id,
      planos (
        nome
      )
    `)
    .eq('usuario_id', userId)
    .order('data_inicio', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const ativa = [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL].includes(data.status);
  
  // O Supabase retorna dados aninhados de diferentes formas dependendo da consulta
  let nomePlano = 'Sem plano';
  if (data.planos) {
    // Se for um array com elementos
    if (Array.isArray(data.planos) && data.planos.length > 0) {
      nomePlano = String(data.planos[0].nome);
    } 
    // Se for um objeto simples
    else if (typeof data.planos === 'object' && 'nome' in data.planos) {
      nomePlano = String(data.planos.nome);
    }
  }

  return {
    id: data.id,
    plano_id: data.plano_id,
    nome_plano: nomePlano,
    status: data.status,
    ativa,
    tokens_restantes: data.tokens_restantes || 0,
    messages_restantes: data.messages_restantes || 0,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim,
    periodo_atual_inicio: data.periodo_atual_inicio,
    periodo_atual_fim: data.periodo_atual_fim,
    renovacao_automatica: data.renovacao_automatica || false,
    stripe_subscription_id: data.stripe_subscription_id,
  };
};

// Verificar se o usuário tem tokens suficientes
export const verificarTokensDisponiveis = async (userId: string, quantidadeNecessaria = 1): Promise<boolean> => {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('tokens_restantes, status')
    .eq('usuario_id', userId)
    .in('status', [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL])
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (data.tokens_restantes || 0) >= quantidadeNecessaria;
};

// Verificar se o usuário tem mensagens suficientes
export const verificarMensagensDisponiveis = async (userId: string, quantidadeNecessaria = 1): Promise<boolean> => {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('messages_restantes, status')
    .eq('usuario_id', userId)
    .in('status', [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL])
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (data.messages_restantes || 0) >= quantidadeNecessaria;
};

// Consumir tokens da assinatura do usuário
export const consumirTokens = async (userId: string, quantidade = 1): Promise<boolean> => {
  // Primeiro verificamos se o usuário tem tokens suficientes
  const temTokens = await verificarTokensDisponiveis(userId, quantidade);
  if (!temTokens) {
    return false;
  }

  // Atualizar o contador de tokens
  const { error } = await supabase.rpc('decrementar_tokens', {
    usuario_id_param: userId,
    quantidade_param: quantidade
  });

  return !error;
};

// Consumir mensagens da assinatura do usuário
export const consumirMensagens = async (userId: string, quantidade = 1): Promise<boolean> => {
  // Primeiro verificamos se o usuário tem mensagens suficientes
  const temMensagens = await verificarMensagensDisponiveis(userId, quantidade);
  if (!temMensagens) {
    return false;
  }

  // Atualizar o contador de mensagens
  const { error } = await supabase.rpc('decrementar_mensagens', {
    usuario_id_param: userId,
    quantidade_param: quantidade
  });

  return !error;
};

// Cancelar assinatura
export const cancelarAssinatura = async (
  subscriptionId: string, 
  cancelAtPeriodEnd = true
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
      body: {
        subscriptionId,
        cancelAtPeriodEnd
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      message: cancelAtPeriodEnd 
        ? 'Sua assinatura será cancelada ao final do período atual' 
        : 'Assinatura cancelada com sucesso'
    };
  } catch (error) {
    return { success: false, error: 'Erro ao processar solicitação de cancelamento' };
  }
}; 