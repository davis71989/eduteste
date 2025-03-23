import { supabase } from './supabase'
import { fetchAiResponse, OpenRouterOptions } from './openRouterClient'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
}

export interface ChatConversation {
  id: string
  messages: ChatMessage[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatUsageInfo {
  used: number
  limit: number
  resetDate: Date | null
  percentUsed: number
}

/**
 * Processa uma mensagem do chat usando OpenRouter
 */
export async function sendChatMessage(
  userId: string,
  conversationId: string | null,
  message: string,
  previousMessages: ChatMessage[] = []
): Promise<{
  response: string;
  conversationId: string;
  messageId: string;
}> {
  try {
    // Verificar limite de uso
    const { used, limit } = await getChatUsage(userId);
    if (used >= limit) {
      throw new Error(
        'Você atingiu o limite mensal de mensagens no chat. Considere fazer upgrade para um plano premium.'
      );
    }

    // Criar conversação se necessário
    let chatId = conversationId;
    if (!chatId) {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (error) throw error;
      chatId = data.id;
    }

    // Formatar mensagens anteriores para o formato do OpenRouter
    const formattedMessages = previousMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Adicionar a nova mensagem do usuário
    formattedMessages.push({
      role: 'user',
      content: message
    });

    // Configurar instrução do sistema
    const systemPrompt = `
Você é um assistente de chat do EduPais, uma plataforma educacional para ajudar pais a apoiarem a educação de seus filhos.

LIMITAÇÕES E FUNÇÕES:
1. Responda APENAS perguntas sobre:
   - Como usar o aplicativo EduPais
   - Planos e custos da plataforma
   - Dicas para educação de crianças
   - Funcionalidades disponíveis no EduPais
   - Questões educacionais gerais
   - Resolução de problemas do aplicativo
   - Resolução de questões simples e se precisar de algo mais complexo ou que seja necessario mais contexto, responda para utulizar a função de tarefas.
   - Se a solicitação do usuário for a resolução de questões não simples, responda mas de forma resumida e direta e informe que para mais detalhes é melhor utilizar a opção de tarefas que além de conter mais contexto, contem um guia de como orientar o seu filho.

2. NÃO responda sobre:
   - Tópicos não relacionados à educação ou ao aplicativo ou a resolução de questões simples.
   - Conteúdo impróprio ou perigoso
   - Temas políticos, religiosos ou controversos

FORMATO DE RESPOSTA:
- Seja conciso e direto
- Use linguagem simples e acessível
- Seja amigável e prestativo
- Ofereça dicas práticas quando apropriado

Se o usuário perguntar sobre algo fora dessas limitações, educadamente informe que você só pode ajudar com questões relacionadas ao aplicativo EduPais e educação infantil.
`;

    // Configurar a chamada para o OpenRouter
    const openRouterOptions: OpenRouterOptions = {
      prompt: message,
      systemPrompt,
      maxTokens: 1000,
      temperature: 0.7
    };

    // Fazer a chamada para o modelo de IA
    const aiResponse = await fetchAiResponse(openRouterOptions);

    // Salvar a mensagem do usuário
    const { data: userMessageData, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: chatId,
        content: message,
        role: 'user',
        user_id: userId
      })
      .select('id')
      .single();

    if (userMessageError) throw userMessageError;

    // Salvar a resposta da IA
    const { data: assistantMessageData, error: assistantMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: chatId,
        content: aiResponse.response,
        role: 'assistant',
        user_id: userId
      })
      .select('id')
      .single();

    if (assistantMessageError) throw assistantMessageError;

    // Atualizar uso de tokens (sempre incrementa em 1)
    await recordChatUsage(userId);

    // Garantir que chatId não é null
    if (!chatId) throw new Error('Falha ao criar ID de conversa');

    return {
      response: aiResponse.response,
      conversationId: chatId,
      messageId: assistantMessageData.id
    };
  } catch (error) {
    console.error('Erro ao processar mensagem de chat:', error);
    throw error;
  }
}

/**
 * Obtém as mensagens de uma conversa
 */
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      content: item.content,
      role: item.role,
      createdAt: new Date(item.created_at)
    }));
  } catch (error) {
    console.error('Erro ao buscar mensagens da conversa:', error);
    throw error;
  }
}

/**
 * Obtém todas as conversas de um usuário
 */
export async function getUserConversations(userId: string): Promise<ChatConversation[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        chat_messages:chat_messages(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      messages: item.chat_messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: new Date(msg.created_at)
      }))
    }));
  } catch (error) {
    console.error('Erro ao buscar conversas do usuário:', error);
    throw error;
  }
}

/**
 * Registra o uso do chat
 */
async function recordChatUsage(userId: string): Promise<void> {
  try {
    // Verificar se o usuário já tem um registro de uso
    const { data: existingUsage, error: fetchError } = await supabase
      .from('chat_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 é o código para "nenhum resultado encontrado"
      throw fetchError;
    }

    // Sempre incrementa em 1, cada mensagem consome 1 token
    const incrementAmount = 1;

    if (existingUsage) {
      // Atualizar o registro existente
      const { error: updateError } = await supabase
        .from('chat_usage')
        .update({
          messages_used: existingUsage.messages_used + incrementAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUsage.id);

      if (updateError) throw updateError;
    } else {
      // Criar um novo registro
      const { error: insertError } = await supabase
        .from('chat_usage')
        .insert({
          user_id: userId,
          messages_used: incrementAmount,
          messages_limit: 50, // Limite de 50 mensagens para plano gratuito
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        });

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Erro ao registrar uso do chat:', error);
    // Não propagar o erro para não interromper a experiência do usuário
  }
}

/**
 * Obtém informações de uso do chat para um usuário
 */
export async function getChatUsage(userId: string): Promise<ChatUsageInfo> {
  try {
    const { data, error } = await supabase
      .from('chat_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado, retornar valores padrão
        return {
          used: 0,
          limit: 50,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          percentUsed: 0
        };
      }
      throw error;
    }

    const used = data.messages_used;
    const limit = data.messages_limit;
    const resetDate = data.reset_date ? new Date(data.reset_date) : null;
    const percentUsed = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

    return {
      used,
      limit,
      resetDate,
      percentUsed
    };
  } catch (error) {
    console.error('Erro ao obter uso do chat:', error);
    // Retornar valores padrão em caso de erro
    return {
      used: 0,
      limit: 50,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      percentUsed: 0
    };
  }
} 