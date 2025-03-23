import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts';

// Interfaces para os parâmetros e respostas
interface AiQueryParams {
  prompt: string;
  model: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AiResponse {
  response: string;
  tokens: number;
}

/**
 * Edge Function para processar consultas de IA
 * 
 * Esta função necessita que você configure suas chaves de API no Supabase:
 * 1. OPENAI_API_KEY para usar o ChatGPT
 * 2. ANTHROPIC_API_KEY para usar o Claude
 * 3. DEEPSEEK_API_KEY para usar o Deepseek
 * 
 * Atualmente, este é um placeholder que será completado quando você adicionar as chaves da API.
 */
serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar o método da requisição
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Método não permitido. Apenas POST é suportado.'
        }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter parâmetros da requisição
    const params: AiQueryParams = await req.json()
    
    // Validar parâmetros obrigatórios
    if (!params.prompt) {
      return new Response(
        JSON.stringify({ error: 'O parâmetro "prompt" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Verificar se temos as chaves de API configuradas
    // const apiKey = Deno.env.get(getApiKeyEnvName(params.model || 'gpt-3.5-turbo'))
    
    // if (!apiKey) {
    //   return new Response(
    //     JSON.stringify({ 
    //       error: `Chave de API não configurada para o modelo ${params.model}. Configure a variável de ambiente correspondente no Supabase.`
    //     }),
    //     { status: 500, headers: { 'Content-Type': 'application/json' } }
    //   )
    // }
    
    // Placeholder: Esta parte será implementada quando as chaves de API forem fornecidas
    // Por enquanto, retornaremos uma resposta simulada
    
    const simulatedResponse: AiResponse = {
      response: `<h3 class="text-lg font-semibold mb-2">Resolução da tarefa:</h3>
      <p>Esta é uma resposta simulada para a consulta. Quando você configurar suas chaves de API, receberá respostas reais dos modelos de IA.</p>
      <ol class="list-decimal pl-5 space-y-2 mt-3">
        <li>Primeiro passo: Analise o problema com cuidado.</li>
        <li>Segundo passo: Identifique os conceitos relevantes.</li>
        <li>Terceiro passo: Aplique as fórmulas adequadas.</li>
        <li>Quarto passo: Verifique sua resposta.</li>
      </ol>
      <p class="mt-4 mb-2 font-medium">Solução:</p>
      <p>Esta é a solução do problema. Substitua este texto configurando uma chave de API válida.</p>
      <p class="mt-3 text-sm text-muted-foreground">Esta resposta foi adaptada ao nível ${params.difficulty || 'medium'}.</p>`,
      tokens: 250
    }
    
    return new Response(
      JSON.stringify(simulatedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Erro ao processar consulta:', error)
    
    return new Response(
      JSON.stringify({ 
        error: `Erro ao processar consulta: ${error.message || 'Erro desconhecido'}` 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Função auxiliar para determinar o nome da variável de ambiente da chave de API com base no modelo
function getApiKeyEnvName(model: string): string {
  if (model.startsWith('gpt')) {
    return 'OPENAI_API_KEY'
  } else if (model.includes('claude')) {
    return 'ANTHROPIC_API_KEY'
  } else if (model.includes('deepseek')) {
    return 'DEEPSEEK_API_KEY'
  }
  // Padrão para OpenAI
  return 'OPENAI_API_KEY'
} 