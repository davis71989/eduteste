import { supabase } from './supabase'
import { fetchAiResponse, OpenRouterOptions } from './openRouterClient'
import { formatAiResponse } from './formatAiResponse'
import { checkUserLimits, updateTokenUsage } from './plans/planService'

export interface AiQueryParams {
  query: string
  childId?: string
  subject: string
  userId: string
  imageUrl?: string
  difficultyLevel?: 'easy' | 'medium' | 'hard'
}

export interface AiResponse {
  response: string
  tokens: number
}

export interface QueryHistoryItem {
  id: string
  query: string
  response: string
  subject: string
  childId?: string
  tokens: number
  createdAt: Date
}

interface QueryHistoryData {
  id: string
  query: string
  response: string
  subject: string
  child_id?: string
  tokens: number
  created_at: string
}

/**
 * Processa uma consulta de IA usando OpenRouter com modelo Claude
 */
export async function processAiQuery(params: AiQueryParams): Promise<AiResponse> {
  try {
    console.log('Processando consulta IA com parâmetros:', {
      tipo: params.imageUrl ? 'imagem' : 'texto',
      tamanhoDaImagem: params.imageUrl ? `${Math.round(params.imageUrl.length / 1024)}KB` : 'N/A',
      childId: params.childId || 'não especificado',
      subject: params.subject,
    });
    
    // Verificar limites do plano do usuário
    const userLimits = await checkUserLimits(params.userId);
    
    if (userLimits.tokensRemaining <= 0) {
      throw new Error('Você atingiu o limite de tokens do seu plano. Considere fazer upgrade para um plano superior.');
    }
    
    // Definir dificuldade da consulta
    const difficultyLevel = params.difficultyLevel || 'medium'
    
    // Construir o prompt com base no assunto e consulta
    const prompt = buildPrompt(params.query, params.subject, difficultyLevel, params.childId)
    
    // Configurar opções para o modelo
    const options: OpenRouterOptions = {
      prompt: prompt,
      maxTokens: calculateMaxTokens(params),
      temperature: calculateTemperature(difficultyLevel),
    }
    
    // Se houver uma imagem, adicionar ao prompt
    if (params.imageUrl) {
      options.imageUrl = params.imageUrl
    }

    // Envia a consulta para a API do OpenRouter
    const response = await fetchAiResponse(options)
    
    // Formatar a resposta
    const formattedResponse = formatAiResponse(response.response)
    
    // Registrar o uso de tokens
    await updateTokenUsage(params.userId, response.tokens)
    
    // Salvar no histórico
    await saveQueryHistory({
      userId: params.userId,
      childId: params.childId,
      query: params.query,
      response: formattedResponse,
      subject: params.subject,
      tokens: response.tokens
    })
    
    return {
      response: formattedResponse,
      tokens: response.tokens
    }
  } catch (error) {
    console.error('Erro ao processar consulta IA:', error)
    throw error
  }
}

/**
 * Calcula a temperatura ideal com base no nível de dificuldade
 */
function calculateTemperature(difficultyLevel: string): number {
  switch (difficultyLevel) {
    case 'easy':
      return 0.2; // Mais determinístico para respostas simples
    case 'hard':
      return 0.5; // Mais criativo para respostas avançadas
    case 'medium':
    default:
      return 0.3; // Balanceado para a maioria dos casos
  }
}

/**
 * Calcula o número máximo de tokens com base nos parâmetros
 */
function calculateMaxTokens(params: AiQueryParams): number {
  // Padrão para a maioria das consultas
  let maxTokens = 2000;
  
  // Se for uma imagem, aumentar o limite para permitir análise detalhada
  if (params.imageUrl) {
    maxTokens = 3000;
  }
  
  // Se for nível difícil, aumentar tokens para respostas mais elaboradas
  if (params.difficultyLevel === 'hard') {
    maxTokens += 500;
  }
  
  return maxTokens;
}

/**
 * Constrói o prompt adequado com base nos parâmetros
 */
function buildPrompt(query: string, subject: string, difficultyLevel: string, childId?: string): string {
  // Se for análise de imagem, usar um prompt específico
  if (query.includes('[Imagem de tarefa enviada]')) {
    return `
ANALISE ESTA IMAGEM DE TAREFA ESCOLAR:

Esta é a imagem da tarefa na matéria de ${subject || 'escola'}.

* IDENTIFIQUE e RESOLVA cada exercício/questão visível na imagem.
* MOSTRE todas as etapas de solução e explique como ensinar cada conceito.
* FORNEÇA a resposta completa e correta para cada questão.
* NÃO IGNORE nenhum exercício visível na imagem.

Formato para cada exercício:
1. Primeiramente, transcreva a questão/exercício.
2. Apresente a resposta correta.
3. Explique como resolver passo a passo.
4. Dê exemplos do cotidiano que facilitem o entendimento.

COMECE DIRETAMENTE com a resolução dos exercícios. NÃO mencione que está analisando uma imagem.
`;
  }
  
  // Para consultas de texto normais
  return `
Você está ajudando com uma dúvida sobre ${subject || 'educação'}.
Questão do usuário: ${query}

Responda de forma ${difficultyLevel === 'easy' ? 'simples e direta' : 
                    difficultyLevel === 'hard' ? 'detalhada e aprofundada' : 
                    'clara e adequada'} para ajudar no aprendizado.
`;
}

/**
 * Salva uma consulta no histórico
 */
async function saveQueryHistory(data: {
  userId: string
  childId?: string
  query: string
  response: string
  subject: string
  tokens: number
}): Promise<void> {
  try {
    const { error } = await supabase.from('ai_query_history').insert({
      user_id: data.userId,
      child_id: data.childId,
      query: data.query,
      response: data.response,
      subject: data.subject,
      tokens: data.tokens
    })
    
    if (error) throw error
  } catch (error) {
    console.error('Erro ao salvar histórico de consulta:', error)
    // Não propagar o erro para não interromper a experiência do usuário
  }
}

/**
 * Obtém o histórico de consultas do usuário
 */
export async function getQueryHistory(userId: string): Promise<QueryHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('ai_query_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map((item: QueryHistoryData) => ({
      id: item.id,
      query: item.query,
      response: item.response,
      subject: item.subject,
      childId: item.child_id,
      tokens: item.tokens,
      createdAt: new Date(item.created_at)
    }))
  } catch (error) {
    console.error('Erro ao buscar histórico de consultas:', error)
    return []
  }
}

/**
 * Verifica o uso atual de tokens do usuário e retorna informações sobre o limite
 */
export async function getUserAiUsage(userId: string): Promise<{
  used: number
  limit: number
  resetDate: Date | null
  percentUsed: number
}> {
  try {
    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado, retornar valores padrão
        return {
          used: 0,
          limit: 10000,
          resetDate: null,
          percentUsed: 0
        }
      }
      throw error
    }
    
    return {
      used: data.tokens_used,
      limit: data.tokens_limit,
      resetDate: data.reset_date ? new Date(data.reset_date) : null,
      percentUsed: (data.tokens_used / data.tokens_limit) * 100
    }
  } catch (error) {
    console.error('Erro ao verificar uso da IA:', error)
    // Retornar valores padrão em caso de erro
    return {
      used: 0,
      limit: 10000,
      resetDate: null,
      percentUsed: 0
    }
  }
} 