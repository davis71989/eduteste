import { AiResponse } from './aiService';

/**
 * Chave API para o OpenRouter
 */
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Modelo Gemini 2.0 Pro que suporta análise de imagens (gratuito)
 */
const MODEL = 'google/gemini-2.0-pro-exp-02-05:free';

/**
 * Interface para opções das requisições ao OpenRouter
 */
export interface OpenRouterOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  imageUrl?: string; // URL da imagem para processamento
  childInfo?: {
    name?: string;
    age?: number;
    grade?: number;
    interests?: string[];
  };
  subject?: string;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  userCountry?: string; // País do usuário para contextualização educacional
}

/**
 * Cliente para integração com a API OpenRouter
 */
export async function fetchAiResponse(options: OpenRouterOptions): Promise<AiResponse> {
  const { 
    prompt, 
    systemPrompt, 
    maxTokens = 1000, 
    temperature = 0.7,
    imageUrl,
    childInfo,
    subject,
    difficultyLevel 
  } = options;

  // Personalizar o prompt do sistema com base no contexto educacional
  const enhancedSystemPrompt = systemPrompt || createDefaultSystemPrompt(childInfo, subject, difficultyLevel, options.userCountry);

  try {
    // Verificar se a chave API está disponível
    if (!OPENROUTER_API_KEY) {
      throw new Error('Chave API OpenRouter não configurada');
    }

    // Preparar mensagens, incluindo a imagem se disponível
    const messages = [];
    
    // Adicionar prompt do sistema
    messages.push({ role: 'system', content: enhancedSystemPrompt });
    
    // Se tiver imagem, adicionar a URL da imagem ou dados base64 no conteúdo usando o formato do Gemini
    if (imageUrl) {
      console.log('Preparando conteúdo com imagem para o modelo', MODEL);
      
      // Verificar se a imagem é base64 ou URL
      const isBase64 = imageUrl.startsWith('data:');
      
      messages.push({ 
        role: 'user', 
        content: [
          { type: 'text', text: prompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: isBase64 ? imageUrl : imageUrl,
              detail: "high" // Alto nível de detalhe para melhor análise de texto nas imagens
            } 
          }
        ]
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    console.log('Enviando requisição para OpenRouter:', {
      endpoint: OPENROUTER_URL,
      model: MODEL,
      messageCount: messages.length,
      hasImage: !!imageUrl
    });

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'EduPais - Assistente Educacional'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na resposta da IA:', errorData);
      throw new Error(`Erro na API OpenRouter: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.';
    const tokensUsed = data.usage?.total_tokens || 0;

    return {
      response: aiMessage,
      tokens: tokensUsed
    };
  } catch (error) {
    console.error('Erro ao chamar a API OpenRouter:', error);
    throw error;
  }
}

/**
 * Cria o prompt de sistema padrão com contexto do aluno e da matéria
 */
function createDefaultSystemPrompt(
  childInfo: OpenRouterOptions['childInfo'], 
  subject?: string, 
  difficultyLevel?: string, 
  userCountry?: string
): string {
  // Construir contexto baseado nas informações da criança
  let childContext = '';
  if (childInfo) {
    childContext = `
Você está conversando com um pai que quer ajudar ${childInfo.name ? 'seu filho ' + childInfo.name : 'seu filho'} 
${childInfo.age ? `de ${childInfo.age} anos` : ''}
${childInfo.grade ? `estudante do ${childInfo.grade}º ano` : ''}.
${childInfo.interests && childInfo.interests.length > 0 ? `Interesses: ${childInfo.interests.join(', ')}` : ''}
`;
  }

  // Contexto da matéria
  const subjectContext = subject ? `O tema principal é ${subject}.` : '';
  
  // Ajustar dificuldade das explicações
  let difficultyContext = '';
  if (difficultyLevel) {
    if (difficultyLevel === 'easy') {
      difficultyContext = 'Use explicações simples e diretas, adequadas para crianças mais novas.';
    } else if (difficultyLevel === 'medium') {
      difficultyContext = 'Use explicações equilibradas, adequadas para a idade da criança.';
    } else if (difficultyLevel === 'hard') {
      difficultyContext = 'Use explicações mais detalhadas que estimulem o pensamento crítico.';
    }
  }
  
  // Contexto específico do país
  let countryContext = '';
  if (userCountry) {
    countryContext = `
CONTEXTO EDUCACIONAL: O aluno estuda no sistema educacional do ${userCountry}.
Adapte suas explicações ao currículo, terminologia e abordagem pedagógica usados em ${userCountry}.
`;
  }

  // Prompt de sistema combinando todos os contextos
  return `
Você é um assistente educacional especializado que ajuda pais a auxiliarem seus filhos nas tarefas escolares.
${childContext}
${subjectContext}
${difficultyContext}
${countryContext}

DIRETRIZES PARA ANALISAR TAREFAS:
1. Analise minuciosamente a tarefa para identificar TODOS os exercícios.
2. Leia cuidadosamente cada palavra, número e instrução na tarefa.
3. Resolva CADA exercício individualmente.
4. Mesmo com informações incompletas, faça seu melhor para entender e resolver o conteúdo.

FORMATO DA RESPOSTA: 
Responda SEMPRE em formato JSON, com a seguinte estrutura:

\`\`\`json
{
  "introducao": "Breve saudação ao usuário informando que você é um assistente educacional especializado e que vai ajudar a resolver a tarefa",
  "exercicios": [
    {
      "numero": 1,
      "enunciado": "Texto completo do enunciado do exercício",
      "resposta": "Resposta correta e direta",
      "explicacao": "Explicação passo a passo para os pais ensinarem as crianças",
      "aplicacaoCotidiano": "Exemplo prático do cotidiano relacionado ao exercício" 
    },
    {
      "numero": 2,
      "enunciado": "...",
      "resposta": "...",
      "explicacao": "...",
      "aplicacaoCotidiano": "..." 
    }
  ]
}
\`\`\`

IMPORTANTE:
- A resposta DEVE ser um JSON válido, sem comentários ou markdown adicionais.
- Se não conseguir criar um exemplo para aplicação no cotidiano, use "Não se aplica".
- Forneça APENAS respostas para exercícios que você identificou na tarefa.
- Se existirem vários exercícios, resolva TODOS individualmente.
- Seja conciso e direto em suas explicações.
- Ajuste o nível da explicação de acordo com a idade e ano escolar da criança.

Seja um verdadeiro professor, forneça respostas educativas que realmente ajudem os pais a ensinarem seus filhos.
`;
} 