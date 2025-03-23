// Supabase Edge Function para processar webhooks do Stripe
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@12.16.0';
import { corsHeaders } from '../_shared/cors.ts';

// Inicialização do Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Cliente Supabase para acesso ao banco
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// Status de assinatura conforme as restrições do banco de dados
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ativa',
  CANCELED: 'cancelada',
  PENDING: 'pendente',
  TRIAL: 'trial',
  PAST_DUE: 'pendente' // Como não temos 'inadimplente' na lista permitida, marcamos como pendente
};

// Verificar a assinatura do webhook para garantir que é do Stripe
const verifyStripeSignature = (payload: string, signature: string) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    throw new Error('Webhook secret não configurado');
  }
  
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (err) {
    throw new Error(`Webhook Error: ${err.message}`);
  }
};

// Processar evento de checkout concluído
const handleCheckoutSessionCompleted = async (session: any) => {
  const { subscription, customer, metadata } = session;
  const { userId, planoId } = metadata || {};
  
  if (!userId || !planoId || !subscription) {
    return { error: 'Dados insuficientes no evento checkout.session.completed' };
  }
  
  // Atualizar os dados da assinatura no Supabase
  const { error } = await supabaseAdmin
    .from('assinaturas')
    .update({
      stripe_subscription_id: subscription,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    })
    .eq('usuario_id', userId)
    .eq('plano_id', planoId)
    .eq('stripe_customer_id', customer);
  
  if (error) {
    return { error: error.message };
  }
  
  // Buscar informações do plano para definir os limites iniciais
  const { data: plano } = await supabaseAdmin
    .from('planos')
    .select('tokens_limit, messages_limit')
    .eq('id', planoId)
    .single();
  
  if (plano) {
    // Atualizar tokens e mensagens restantes do usuário
    await supabaseAdmin
      .from('assinaturas')
      .update({
        tokens_restantes: plano.tokens_limit,
        messages_restantes: plano.messages_limit,
      })
      .eq('usuario_id', userId)
      .eq('plano_id', planoId);
  }
  
  return { success: true };
};

// Processar evento de assinatura atualizada
const handleSubscriptionUpdated = async (subscription: any) => {
  // Obter informações completas da assinatura
  const expandedSubscription = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ['default_payment_method', 'customer', 'items.data.price.product'],
  });
  
  const { customer, status, current_period_start, current_period_end, items } = expandedSubscription;
  const priceId = items.data[0]?.price.id;
  
  // Buscar o plano correspondente no Supabase
  const { data: planoData } = await supabaseAdmin
    .from('planos')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();
  
  if (!planoData) {
    return { error: 'Plano não encontrado' };
  }
  
  // Mapear o status do Stripe para o status do nosso sistema
  let mappedStatus;
  switch (status) {
    case 'active':
      mappedStatus = SUBSCRIPTION_STATUS.ACTIVE;
      break;
    case 'canceled':
      mappedStatus = SUBSCRIPTION_STATUS.CANCELED;
      break;
    case 'past_due':
      mappedStatus = SUBSCRIPTION_STATUS.PAST_DUE;
      break;
    case 'unpaid':
      mappedStatus = SUBSCRIPTION_STATUS.PAST_DUE;
      break;
    case 'trialing':
      mappedStatus = SUBSCRIPTION_STATUS.TRIAL;
      break;
    default:
      mappedStatus = status;
  }
  
  // Buscar o usuário associado a esse customer_id
  const { data: assinatura } = await supabaseAdmin
    .from('assinaturas')
    .select('usuario_id')
    .eq('stripe_customer_id', customer)
    .single();
  
  if (!assinatura) {
    return { error: 'Assinatura não encontrada' };
  }
  
  // Atualizar a assinatura no Supabase
  const { error } = await supabaseAdmin
    .from('assinaturas')
    .update({
      status: mappedStatus,
      plano_id: planoData.id,
      periodo_atual_inicio: new Date(current_period_start * 1000).toISOString(),
      periodo_atual_fim: new Date(current_period_end * 1000).toISOString(),
    })
    .eq('usuario_id', assinatura.usuario_id)
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
};

// Processar evento de fatura paga
const handleInvoicePaid = async (invoice: any) => {
  const { subscription, customer } = invoice;
  
  if (!subscription) {
    return { error: 'Fatura sem assinatura associada' };
  }
  
  // Buscar a assinatura no banco de dados
  const { data: assinatura } = await supabaseAdmin
    .from('assinaturas')
    .select('usuario_id, plano_id')
    .eq('stripe_subscription_id', subscription)
    .eq('stripe_customer_id', customer)
    .single();
  
  if (!assinatura) {
    return { error: 'Assinatura não encontrada' };
  }
  
  // Buscar limites do plano
  const { data: plano } = await supabaseAdmin
    .from('planos')
    .select('tokens_limit, messages_limit')
    .eq('id', assinatura.plano_id)
    .single();
  
  if (!plano) {
    return { error: 'Plano não encontrado' };
  }
  
  // Renovar os limites mensais do usuário
  const { error } = await supabaseAdmin
    .from('assinaturas')
    .update({
      tokens_restantes: plano.tokens_limit,
      messages_restantes: plano.messages_limit,
      status: SUBSCRIPTION_STATUS.ACTIVE, // Garantir que o status está ativo
    })
    .eq('usuario_id', assinatura.usuario_id)
    .eq('plano_id', assinatura.plano_id);
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
};

// Processar todos os tipos de eventos
const handleEvent = async (event: any) => {
  switch (event.type) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(event.data.object);
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return await handleSubscriptionUpdated(event.data.object);
      
    case 'invoice.paid':
      return await handleInvoicePaid(event.data.object);
      
    case 'invoice.payment_failed':
      // Marcar a assinatura como inadimplente
      const subscription = event.data.object.subscription;
      if (subscription) {
        await supabaseAdmin
          .from('assinaturas')
          .update({ status: SUBSCRIPTION_STATUS.PAST_DUE })
          .eq('stripe_subscription_id', subscription);
      }
      return { success: true };
      
    default:
      return { success: true, message: `Evento ${event.type} recebido mas não processado` };
  }
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
    
    // Ler o corpo da requisição como texto
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Assinatura do Stripe ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar a assinatura
    let event;
    try {
      event = verifyStripeSignature(payload, signature);
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Processar o evento
    const result = await handleEvent(event);
    
    if (result.error) {
      console.error(`Erro ao processar evento ${event.type}:`, result.error);
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 