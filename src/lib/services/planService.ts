import { supabase } from '../supabase';
import { toast } from '../../components/ui/use-toast';

// Status de assinatura conforme as restrições do banco de dados
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ativa',
  CANCELED: 'cancelada',
  PENDING: 'pendente',
  TRIAL: 'trial'
};

// Serviço para gerenciar planos e assinaturas diretamente via Supabase
export const PlanService = {
  // Função auxiliar para calcular a próxima data de reset (primeiro dia do próximo mês)
  getNextResetDate() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toISOString();
  },

  // Ativar plano gratuito sem usar Edge Function
  async ativarPlanoGratuito(planoId: string, userId: string) {
    try {
      console.log(`Tentando ativar plano gratuito ${planoId} para usuário ${userId}`);
      
      // Verificar se o usuário existe no banco de dados
      const { data: userExists, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (userError) {
        console.error('Erro ao verificar existência do usuário:', userError);
        throw userError;
      }
      
      if (!userExists) {
        console.error('Usuário não encontrado no banco de dados');
        throw new Error('Usuário não encontrado. Verifique se o perfil está completo.');
      }
      
      console.log('Usuário confirmado no banco de dados:', userExists);
      
      // 1. Verificar se já existe assinatura ativa deste plano
      const { data: assinaturaExistente, error: checkError } = await supabase
        .from('assinaturas')
        .select('id, status')
        .eq('usuario_id', userId)
        .eq('plano_id', planoId)
        .eq('status', SUBSCRIPTION_STATUS.ACTIVE)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erro ao verificar assinatura existente:', checkError);
        throw checkError;
      }
      
      console.log('Resultado da verificação de assinatura existente:', assinaturaExistente);
      
      // Se já existe assinatura ativa deste plano, retornar sucesso
      if (assinaturaExistente?.status === SUBSCRIPTION_STATUS.ACTIVE) {
        console.log('Assinatura já existe e está ativa');
        return { success: true, message: 'Você já possui uma assinatura ativa deste plano' };
      }
      
      // 2. Verificar e cancelar todas as assinaturas ativas, se houver
      const { data: assinaturasAtivas, error: listError } = await supabase
        .from('assinaturas')
        .select('id, status')
        .eq('usuario_id', userId)
        .eq('status', SUBSCRIPTION_STATUS.ACTIVE);
      
      if (listError) {
        console.error('Erro ao listar assinaturas ativas:', listError);
      } else {
        console.log(`Encontradas ${assinaturasAtivas?.length || 0} assinaturas ativas`);
        
        if (assinaturasAtivas && assinaturasAtivas.length > 0) {
          // Cancelar uma a uma para evitar problemas
          for (const assinatura of assinaturasAtivas) {
            const { error: cancelError } = await supabase
              .from('assinaturas')
              .update({ status: SUBSCRIPTION_STATUS.CANCELED })
              .eq('id', assinatura.id);
            
            if (cancelError) {
              console.error(`Erro ao cancelar assinatura ${assinatura.id}:`, cancelError);
            }
          }
        }
      }
      
      // 3. Buscar informações do plano para obter limites
      const { data: plano, error: planoError } = await supabase
        .from('planos')
        .select('tokens_limit, messages_limit')
        .eq('id', planoId)
        .single();
        
      if (planoError || !plano) {
        console.error('Erro ao buscar plano:', planoError);
        throw planoError || new Error('Plano não encontrado');
      }
      
      console.log('Informações do plano obtidas:', plano);
      
      // 4. Criar nova assinatura
      const dataAtual = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataFim.getMonth() + 1); // Plano mensal gratuito
      
      const assinaturaData = {
        usuario_id: userId,
        plano_id: planoId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        data_inicio: dataAtual.toISOString().split('T')[0], // Formato YYYY-MM-DD para campo date
        data_fim: dataFim.toISOString().split('T')[0], // Formato YYYY-MM-DD para campo date
        periodo_atual_inicio: dataAtual.toISOString(),
        periodo_atual_fim: dataFim.toISOString(),
        tokens_restantes: plano.tokens_limit || 0,
        messages_restantes: plano.messages_limit || 0,
        renovacao_automatica: true,
        stripe_customer_id: `local_${userId}`
      };
      
      console.log('Tentando inserir assinatura com dados:', assinaturaData);
      
      const { data: novaAssinatura, error: insertError } = await supabase
        .from('assinaturas')
        .insert(assinaturaData)
        .select()
        .single();
        
      if (insertError) {
        console.error('Erro ao inserir assinatura:', insertError);
        throw insertError;
      }
      
      console.log('Assinatura criada com sucesso:', novaAssinatura);
      
      // 5. Atualizar ou criar registros em ai_usage
      // Verificar se o registro existe
      const { data: aiUsageExists } = await supabase
        .from('ai_usage')
        .select('id, tokens_used, tokens_limit')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (aiUsageExists) {
        // Atualizar o registro existente
        const { error: aiUpdateError } = await supabase
          .from('ai_usage')
          .update({
            tokens_limit: plano.tokens_limit || 0,
            reset_date: this.getNextResetDate(),
            updated_at: new Date().toISOString()
          })
          .eq('id', aiUsageExists.id);
        
        if (aiUpdateError) {
          console.error('Erro ao atualizar ai_usage:', aiUpdateError);
          // Não interrompe o fluxo, apenas loga o erro
        } else {
          console.log('Registro ai_usage atualizado com sucesso');
        }
      } else {
        // Criar um novo registro
        const { error: aiInsertError } = await supabase
          .from('ai_usage')
          .insert({
            user_id: userId,
            tokens_used: 0,
            tokens_limit: plano.tokens_limit || 0,
            reset_date: this.getNextResetDate(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (aiInsertError) {
          console.error('Erro ao criar registro de ai_usage:', aiInsertError);
          // Não interrompe o fluxo, apenas loga o erro
        } else {
          console.log('Registro ai_usage criado com sucesso');
        }
      }
      
      // 6. Atualizar ou criar registros em chat_usage
      // Verificar se o registro existe
      const { data: chatUsageExists } = await supabase
        .from('chat_usage')
        .select('id, messages_used, messages_limit')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (chatUsageExists) {
        // Atualizar o registro existente
        const { error: chatUpdateError } = await supabase
          .from('chat_usage')
          .update({
            messages_limit: plano.messages_limit || 0,
            reset_date: this.getNextResetDate(),
            updated_at: new Date().toISOString()
          })
          .eq('id', chatUsageExists.id);
        
        if (chatUpdateError) {
          console.error('Erro ao atualizar chat_usage:', chatUpdateError);
          // Não interrompe o fluxo, apenas loga o erro
        } else {
          console.log('Registro chat_usage atualizado com sucesso');
        }
      } else {
        // Criar um novo registro
        const { error: chatInsertError } = await supabase
          .from('chat_usage')
          .insert({
            user_id: userId,
            messages_used: 0,
            messages_limit: plano.messages_limit || 0,
            reset_date: this.getNextResetDate(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (chatInsertError) {
          console.error('Erro ao criar registro de chat_usage:', chatInsertError);
          // Não interrompe o fluxo, apenas loga o erro
        } else {
          console.log('Registro chat_usage criado com sucesso');
        }
      }
      
      return { 
        success: true, 
        message: 'Assinatura gratuita ativada com sucesso', 
        assinatura_id: novaAssinatura.id 
      };
    } catch (error) {
      console.error('Erro ao ativar plano gratuito:', error);
      throw error;
    }
  },

  // Criar sessão de checkout usando a Edge Function do Stripe com CORS configurado
  async criarSessaoCheckout(planoId: string, userId: string, userEmail: string) {
    try {
      // Obter token de autenticação para passar para a Edge Function
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // URL da função Edge no Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const functionUrl = `${supabaseUrl}/functions/v1/stripe-create-checkout`;

      // Chamar a função Edge com o token de autorização
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          planoId: planoId,
          free: false
        })
      });

      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na resposta da Edge Function:', errorData);
        throw new Error(errorData.error || 'Erro ao criar sessão de checkout');
      }

      // Processar a resposta
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  },

  // Criar sessão de checkout para planos pagos diretamente no banco de dados
  async criarSessaoCheckoutDireta(planoId: string, userId: string, userEmail: string) {
    try {
      console.log(`Tentando criar sessão de checkout direta para usuário ${userId} e plano ${planoId}`);
      
      // Verificar se o usuário existe no banco de dados
      const { data: userExists, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (userError) {
        console.error('Erro ao verificar existência do usuário:', userError);
        throw userError;
      }
      
      if (!userExists) {
        console.error('Usuário não encontrado no banco de dados');
        throw new Error('Usuário não encontrado. Verifique se o perfil está completo.');
      }
      
      console.log('Usuário confirmado no banco de dados:', userExists);
      
      // 1. Verificar se o plano existe e obter detalhes
      const { data: plano, error: planoError } = await supabase
        .from('planos')
        .select('*')
        .eq('id', planoId)
        .single();

      if (planoError || !plano) {
        throw new Error('Plano não encontrado');
      }

      // 2. Verificar se o plano tem um ID de preço do Stripe configurado
      if (!plano.stripe_price_id) {
        throw new Error('Este plano não está configurado para pagamento');
      }

      // 3. Registrar a intenção de checkout na tabela de assinaturas
      // Criar um ID temporário para a sessão de checkout que será atualizado pelo webhook
      const checkoutSessionId = `pending_${userId}_${new Date().getTime()}`;
      
      // Cancelar outras assinaturas pendentes, se houver
      await supabase
        .from('assinaturas')
        .update({ status: SUBSCRIPTION_STATUS.CANCELED })
        .eq('usuario_id', userId)
        .eq('status', SUBSCRIPTION_STATUS.PENDING);
        
      // Inserir nova assinatura com status pendente
      const assinaturaData = {
        usuario_id: userId,
        plano_id: planoId,
        status: SUBSCRIPTION_STATUS.PENDING,
        stripe_checkout_session_id: checkoutSessionId,
        data_inicio: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para campo date
      };
      
      console.log('Tentando inserir assinatura pendente com dados:', assinaturaData);
      
      const { error: insertError } = await supabase
        .from('assinaturas')
        .insert(assinaturaData);
        
      if (insertError) {
        console.error('Erro ao inserir assinatura pendente:', insertError);
        throw insertError;
      }

      // Já preparar registros de ai_usage e chat_usage para quando o pagamento for confirmado
      // Primeiro, verificar se já existem registros
      const { data: aiUsageExists } = await supabase
        .from('ai_usage')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      // Se não existe, criar um registro com valores zerados que serão atualizados na confirmação
      if (!aiUsageExists) {
        const { error: aiInsertError } = await supabase
          .from('ai_usage')
          .insert({
            user_id: userId,
            tokens_used: 0,
            tokens_limit: 0, // Será atualizado quando o pagamento for confirmado
            reset_date: this.getNextResetDate(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (aiInsertError) {
          console.error('Erro ao criar registro de ai_usage:', aiInsertError);
          // Não interrompe o fluxo
        } else {
          console.log('Registro ai_usage criado com valores iniciais');
        }
      }
      
      // Verificar e criar registro de chat_usage se necessário
      const { data: chatUsageExists } = await supabase
        .from('chat_usage')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!chatUsageExists) {
        const { error: chatInsertError } = await supabase
          .from('chat_usage')
          .insert({
            user_id: userId,
            messages_used: 0,
            messages_limit: 0, // Será atualizado quando o pagamento for confirmado
            reset_date: this.getNextResetDate(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (chatInsertError) {
          console.error('Erro ao criar registro de chat_usage:', chatInsertError);
          // Não interrompe o fluxo
        } else {
          console.log('Registro chat_usage criado com valores iniciais');
        }
      }

      // 4. Criar URL de simulação para o checkout
      const simCheckoutUrl = `/pagamento/simulado?session_id=${checkoutSessionId}&plano_id=${planoId}`;
      
      return { 
        url: simCheckoutUrl,
        success: true 
      };
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }
};

export default PlanService; 