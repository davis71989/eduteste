import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { fetchAiResponse } from './openRouterClient'

// Tipos
export type Simulado = {
  id: string
  user_id: string
  child_id: string
  titulo: string
  descricao: string
  materia: string
  ano_escolar: string
  qtd_questoes: number
  link_compartilhavel: string | null
  foi_gerado_por_ia: boolean
  completo: boolean
  score: number | null
  created_at: string
  updated_at: string
}

export type QuestaoSimulado = {
  id: string
  simulado_id: string
  ordem: number
  pergunta: string
  opcao_a: string
  opcao_b: string
  opcao_c: string
  opcao_d: string
  resposta_correta: 'A' | 'B' | 'C' | 'D'
  explicacao: string | null
  resposta_aluno: 'A' | 'B' | 'C' | 'D' | null
  created_at: string
  updated_at: string
}

export type CompartilhamentoSimulado = {
  id: string
  simulado_id: string
  metodo: 'email' | 'whatsapp' | 'impressao'
  destinatario: string | null
  enviado_em: string
}

// Criar cliente Supabase
export function createClient() {
  return createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}

// Funções para interagir com a API de simulados
export async function criarSimulado(simuladoData: Omit<Simulado, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('simulados')
    .insert(simuladoData)
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar simulado: ${error.message}`)
  return data
}

export async function buscarSimuladosPorUsuario(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('simulados')
    .select(`
      *,
      children:child_id (id, name, age, grade)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Erro ao buscar simulados: ${error.message}`)
  return data || []
}

export async function buscarSimuladoPorId(simuladoId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('simulados')
    .select(`
      *,
      children:child_id (id, name, age, grade),
      questoes:questoes_simulado (*)
    `)
    .eq('id', simuladoId)
    .single()

  if (error) throw new Error(`Erro ao buscar simulado: ${error.message}`)
  return data
}

export async function criarQuestoesSimulado(questoes: Omit<QuestaoSimulado, 'id' | 'created_at' | 'updated_at'>[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questoes_simulado')
    .insert(questoes)
    .select()

  if (error) throw new Error(`Erro ao criar questões: ${error.message}`)
  return data
}

export async function responderQuestao(questaoId: string, resposta: 'A' | 'B' | 'C' | 'D') {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questoes_simulado')
    .update({ resposta_aluno: resposta })
    .eq('id', questaoId)
    .select()
    .single()

  if (error) throw new Error(`Erro ao responder questão: ${error.message}`)
  return data
}

export async function registrarCompartilhamento(
  simuladoId: string, 
  metodo: 'email' | 'whatsapp' | 'impressao', 
  destinatario?: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('compartilhamento_simulados')
    .insert({
      simulado_id: simuladoId,
      metodo,
      destinatario: destinatario || null
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao registrar compartilhamento: ${error.message}`)
  return data
}

export async function buscarFilhosPorUsuario(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  if (error) throw new Error(`Erro ao buscar filhos: ${error.message}`)
  return data || []
}

// Função para gerar simulado usando IA
export async function gerarSimuladoComIA(materia: string, descricao: string, anoEscolar: string, qtdQuestoes: number) {
  try {
    console.log('Gerando simulado com IA para:', {materia, descricao, anoEscolar, qtdQuestoes});
    
    // Preparar o prompt para a API
    const prompt = `
      Gere um simulado para um aluno do ${anoEscolar} sobre ${materia}, 
      especificamente sobre: ${descricao}.
      
      O simulado deve conter ${qtdQuestoes} questões de múltipla escolha, 
      cada uma com 4 alternativas (A, B, C, D) e apenas uma correta.
      
      Cada questão deve incluir:
      1. Pergunta clara e adequada para o nível escolar
      2. 4 alternativas bem elaboradas
      3. Indicação da resposta correta (A, B, C ou D)
      4. Uma explicação detalhada da resposta correta
      
      Formate a resposta como um objeto JSON com a seguinte estrutura:
      {
        "questoes": [
          {
            "pergunta": "Texto da pergunta",
            "opcao_a": "Texto da opção A",
            "opcao_b": "Texto da opção B",
            "opcao_c": "Texto da opção C",
            "opcao_d": "Texto da opção D",
            "resposta_correta": "A", (ou B, C, D)
            "explicacao": "Explicação detalhada da resposta correta"
          },
          ...mais questões...
        ]
      }
    `
    
    // Configurar a chamada para o OpenRouter
    console.log('Preparando requisição para OpenRouter');
    
    // Chamar o modelo via OpenRouter
    const systemPrompt = `
    Você é um assistente especializado em criar simulados educacionais.
    Você deve gerar questões claras, concisas e adequadas ao nível escolar do aluno.
    Use linguagem apropriada para alunos do ${anoEscolar}.
    Todas as questões devem ter uma resposta correta bem definida.
    A resposta deve estar no formato JSON exatamente como especificado no prompt.
    `;

    try {
      // Para fins de desenvolvimento, se a chave do OpenRouter não estiver definida
      if (!import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY === 'sk-default-openrouter-key') {
        console.log('Usando questões fictícias para desenvolvimento');
        return generateFakeQuestions(materia, descricao, qtdQuestoes);
      }
      
      // Chamar a API OpenRouter
      const aiResponse = await fetchAiResponse({
        prompt,
        systemPrompt,
        maxTokens: 3500,
        temperature: 0.7
      });
      
      console.log('Resposta recebida da API OpenRouter');
      
      // Registrar uso da API no Supabase para controle
      const supabase = createClient();
      try {
        await supabase
          .from('ai_usage')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            prompt_tokens: prompt.length,
            completion_tokens: aiResponse.response.length,
            model: 'openrouter',
            endpoint: 'simulado'
          })
      } catch (error) {
        console.error('Erro ao registrar uso da API:', error);
        // Continuar mesmo se houver erro no registro
      }
      
      // Processar e normalizar o resultado
      let questoes: Omit<QuestaoSimulado, 'id' | 'simulado_id' | 'created_at' | 'updated_at'>[] = [];
      
      // Verificar se a resposta contém um objeto ou texto JSON
      let responseText = aiResponse.response;
      let parsedData;
      
      try {
        // Tentar encontrar um objeto JSON na resposta
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          // Se não encontrou json, tentar parsear a resposta diretamente
          parsedData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Erro ao processar resposta JSON:', parseError);
        parsedData = { questoes: [] };
      }
      
      console.log('Estrutura de dados recebida:', 
        parsedData.questoes ? `${parsedData.questoes.length} questões encontradas` : 'Sem questões');
      
      // Extrair as questões do resultado parseado
      if (parsedData.questoes && Array.isArray(parsedData.questoes)) {
        questoes = parsedData.questoes.map((q: any, index: number) => {
          // Garantir que a resposta_correta seja um valor válido
          let resposta = q.resposta_correta || 'A';
          // Normalizar para maiúsculo
          resposta = resposta.toUpperCase();
          // Garantir que seja apenas A, B, C ou D
          if (!['A', 'B', 'C', 'D'].includes(resposta)) {
            resposta = 'A';
          }
          
          return {
            ordem: index + 1,
            pergunta: q.pergunta || `Pergunta ${index + 1}`,
            opcao_a: q.opcao_a || 'Opção A',
            opcao_b: q.opcao_b || 'Opção B',
            opcao_c: q.opcao_c || 'Opção C',
            opcao_d: q.opcao_d || 'Opção D',
            resposta_correta: resposta as 'A' | 'B' | 'C' | 'D',
            explicacao: q.explicacao || 'Não fornecida',
            resposta_aluno: null
          };
        });
      } 
      
      // Se não conseguiu extrair questões ou não há questões suficientes, usar dados de fallback
      if (questoes.length < qtdQuestoes) {
        console.log(`Questões insuficientes (${questoes.length}/${qtdQuestoes}), adicionando fallbacks`);
        const questoesAdicionais = qtdQuestoes - questoes.length;
        const respostas: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        
        for (let i = 0; i < questoesAdicionais; i++) {
          const index = questoes.length;
          questoes.push({
            ordem: index + 1,
            pergunta: `Pergunta ${index + 1} sobre ${materia}: ${descricao}?`,
            opcao_a: `Opção A para pergunta ${index + 1}`,
            opcao_b: `Opção B para pergunta ${index + 1}`,
            opcao_c: `Opção C para pergunta ${index + 1}`,
            opcao_d: `Opção D para pergunta ${index + 1}`,
            resposta_correta: respostas[Math.floor(Math.random() * 4)],
            explicacao: `Explicação detalhada para a pergunta ${index + 1} sobre ${materia}.`,
            resposta_aluno: null
          })
        }
      }
      
      // Limitar ao número solicitado
      return questoes.slice(0, qtdQuestoes);
      
    } catch (apiError) {
      console.error('Erro ao chamar OpenRouter API:', apiError);
      return generateFakeQuestions(materia, descricao, qtdQuestoes);
    }
    
  } catch (error) {
    console.error('Erro ao gerar simulado com IA:', error);
    
    // Em caso de erro, retornar questões de fallback
    return generateFakeQuestions(materia, descricao, qtdQuestoes);
  }
}

// Função auxiliar para gerar questões fictícias para desenvolvimento
function generateFakeQuestions(materia: string, descricao: string, qtdQuestoes: number) {
  console.log('Gerando questões fictícias para simulado');
  
  const questoes: Omit<QuestaoSimulado, 'id' | 'simulado_id' | 'created_at' | 'updated_at'>[] = [];
  
  // Exemplos de perguntas para matemática
  const exemplosMat = [
    {
      pergunta: "Quanto é 15 + 27?",
      opcao_a: "32",
      opcao_b: "42",
      opcao_c: "52",
      opcao_d: "62",
      resposta_correta: "B" as "A" | "B" | "C" | "D",
      explicacao: "Para somar 15 + 27, somamos unidades (5 + 7 = 12) e dezenas (1 + 2 = 3). Como 12 unidades = 1 dezena + 2 unidades, temos 3 + 1 = 4 dezenas e 2 unidades, resultando em 42."
    },
    {
      pergunta: "Qual é o resultado de 8 × 9?",
      opcao_a: "63",
      opcao_b: "72",
      opcao_c: "81",
      opcao_d: "64",
      resposta_correta: "B" as "A" | "B" | "C" | "D",
      explicacao: "A multiplicação 8 × 9 significa somar o número 8 nove vezes ou o número 9 oito vezes. O resultado é 72."
    },
    {
      pergunta: "Se um retângulo tem 7cm de comprimento e 5cm de largura, qual é a sua área?",
      opcao_a: "12cm²",
      opcao_b: "35cm²",
      opcao_c: "24cm²",
      opcao_d: "30cm²",
      resposta_correta: "B" as "A" | "B" | "C" | "D",
      explicacao: "A área de um retângulo é calculada multiplicando seu comprimento pela largura: 7cm × 5cm = 35cm²"
    }
  ];
  
  // Exemplos de perguntas para português
  const exemplosPort = [
    {
      pergunta: "Qual é o plural de 'chapéu'?",
      opcao_a: "chapéis",
      opcao_b: "chapéus",
      opcao_c: "chapéues",
      opcao_d: "chapés",
      resposta_correta: "B" as "A" | "B" | "C" | "D",
      explicacao: "O plural de 'chapéu' é 'chapéus'. Palavras terminadas em 'éu' geralmente fazem o plural acrescentando-se um 's'."
    },
    {
      pergunta: "Na frase 'João comprou um livro', qual é o sujeito?",
      opcao_a: "João",
      opcao_b: "comprou",
      opcao_c: "um livro",
      opcao_d: "João comprou",
      resposta_correta: "A" as "A" | "B" | "C" | "D",
      explicacao: "O sujeito é o termo que pratica a ação do verbo. Na frase, 'João' é quem realiza a ação de comprar."
    }
  ];
  
  const exemplos = materia.toLowerCase().includes("mat") ? exemplosMat : exemplosPort;
  
  // Usar exemplos pré-definidos para as primeiras questões
  for (let i = 0; i < Math.min(exemplos.length, qtdQuestoes); i++) {
    questoes.push({
      ordem: i + 1,
      ...exemplos[i],
      resposta_aluno: null
    });
  }
  
  // Completar com questões aleatórias se necessário
  for (let i = exemplos.length; i < qtdQuestoes; i++) {
    questoes.push({
      ordem: i + 1,
      pergunta: `Pergunta ${i + 1} sobre ${materia}: ${descricao}?`,
      opcao_a: `Opção A para pergunta ${i + 1}`,
      opcao_b: `Opção B para pergunta ${i + 1}`,
      opcao_c: `Opção C para pergunta ${i + 1}`,
      opcao_d: `Opção D para pergunta ${i + 1}`,
      resposta_correta: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as 'A' | 'B' | 'C' | 'D',
      explicacao: `Explicação detalhada para a pergunta ${i + 1} sobre ${materia}.`,
      resposta_aluno: null
    });
  }
  
  return questoes;
}

// Função para excluir um simulado
export async function excluirSimulado(simuladoId: string) {
  const supabase = createClient()
  
  try {
    // Primeiro, excluir as questões relacionadas ao simulado
    const { error: questoesError } = await supabase
      .from('questoes_simulado')
      .delete()
      .eq('simulado_id', simuladoId)
    
    if (questoesError) throw new Error(`Erro ao excluir questões: ${questoesError.message}`)
    
    // Depois, excluir possíveis registros de compartilhamento
    const { error: compartilhamentoError } = await supabase
      .from('compartilhamento_simulados')
      .delete()
      .eq('simulado_id', simuladoId)
    
    if (compartilhamentoError) throw new Error(`Erro ao excluir compartilhamentos: ${compartilhamentoError.message}`)
    
    // Por fim, excluir o simulado
    const { error: simuladoError } = await supabase
      .from('simulados')
      .delete()
      .eq('id', simuladoId)
    
    if (simuladoError) throw new Error(`Erro ao excluir simulado: ${simuladoError.message}`)
    
    return true
  } catch (error) {
    console.error('Erro ao excluir simulado:', error)
    throw error
  }
} 