// Supabase Edge Function para cancelamento de assinatura no Stripe
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@12.16.0';
import { corsHeaders } from '../_shared/cors.ts';

// Inicialização do Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Status de assinatura conforme as restrições do banco de dados
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ativa',
  CANCELED: 'cancelada',
  PENDING: 'pendente',
  TRIAL: 'trial'
};

serve(async (req) => {
  // Lidar com requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Inicializar cliente Supabase usando o token do usuário
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Obter dados do corpo da requisição
    const { subscriptionId, cancelAtPeriodEnd = true } = await req.json();

    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: 'ID da assinatura é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar a assinatura no banco para confirmar que pertence ao usuário
    const { data: assinatura, error: assinaturaError } = await supabaseClient
      .from('assinaturas')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (assinaturaError || !assinatura) {
      return new Response(JSON.stringify({ error: 'Assinatura não encontrada ou não pertence ao usuário' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cancelar a assinatura no Stripe
    let resultado;
    if (cancelAtPeriodEnd) {
      // Cancelar ao final do período atual (o usuário mantém acesso até o fim)
      resultado = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancelar imediatamente
      resultado = await stripe.subscriptions.cancel(subscriptionId);
    }

    // Atualizar o status no banco de dados
    const { error: updateError } = await supabaseClient
      .from('assinaturas')
      .update({
        status: cancelAtPeriodEnd ? SUBSCRIPTION_STATUS.PENDING : SUBSCRIPTION_STATUS.CANCELED,
      })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('usuario_id', user.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Erro ao atualizar status da assinatura' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: cancelAtPeriodEnd 
        ? 'Assinatura será cancelada ao final do período atual' 
        : 'Assinatura cancelada com sucesso'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 