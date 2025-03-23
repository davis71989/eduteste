/**
 * API Endpoint para lidar com webhooks do Stripe
 * 
 * Este arquivo processa notificações do Stripe sobre eventos como
 * pagamentos bem-sucedidos, assinaturas renovadas, etc.
 */

import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar cliente do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Inicializar cliente do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Processa um webhook de evento checkout.session.completed
 * Este evento é disparado quando um cliente completa o checkout
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('Processando checkout completo:', session.id);
    
    const customerId = session.customer;
    const userId = session.client_reference_id;
    const priceId = session.line_items?.data[0]?.price?.id || session.metadata?.price_id;
    
    if (!userId) {
      console.error('ID do usuário não encontrado no checkout session');
      return { success: false, error: 'User ID not found' };
    }
    
    // Obter dados da assinatura
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Obter período da assinatura
    const subscriptionPeriodStart = new Date(subscription.current_period_start * 1000);
    const subscriptionPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    // Criar ou atualizar registro de assinatura no Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        interval: subscription.items.data[0].plan.interval,
        current_period_start: subscriptionPeriodStart.toISOString(),
        current_period_end: subscriptionPeriodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar assinatura no Supabase:', error);
      return { success: false, error: 'Error saving subscription' };
    }
    
    // Atualizar status do usuário para premium
    const { error: userError } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (userError) {
      console.error('Erro ao atualizar perfil do usuário:', userError);
      return { success: false, error: 'Error updating user profile' };
    }
    
    console.log(`Assinatura ${subscription.id} processada com sucesso para o usuário ${userId}`);
    return { success: true, subscription: data };
    
  } catch (error) {
    console.error('Erro ao processar checkout completo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Processa um webhook de evento customer.subscription.updated
 * Este evento é disparado quando uma assinatura é atualizada
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processando atualização de assinatura:', subscription.id);
    
    // Obter período da assinatura
    const subscriptionPeriodStart = new Date(subscription.current_period_start * 1000);
    const subscriptionPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    // Atualizar registro de assinatura no Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: subscriptionPeriodStart.toISOString(),
        current_period_end: subscriptionPeriodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar assinatura no Supabase:', error);
      return { success: false, error: 'Error updating subscription' };
    }
    
    // Atualizar status do usuário
    const { error: userError } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user_id);
    
    if (userError) {
      console.error('Erro ao atualizar perfil do usuário:', userError);
      return { success: false, error: 'Error updating user profile' };
    }
    
    console.log(`Assinatura ${subscription.id} atualizada com sucesso para o usuário ${data.user_id}`);
    return { success: true, subscription: data };
    
  } catch (error) {
    console.error('Erro ao processar atualização de assinatura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Processa um webhook de evento customer.subscription.deleted
 * Este evento é disparado quando uma assinatura é cancelada
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processando cancelamento de assinatura:', subscription.id);
    
    // Atualizar registro de assinatura no Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao marcar assinatura como cancelada no Supabase:', error);
      return { success: false, error: 'Error updating subscription' };
    }
    
    // Atualizar status do usuário
    const { error: userError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user_id);
    
    if (userError) {
      console.error('Erro ao atualizar perfil do usuário:', userError);
      return { success: false, error: 'Error updating user profile' };
    }
    
    console.log(`Assinatura ${subscription.id} cancelada com sucesso para o usuário ${data.user_id}`);
    return { success: true, subscription: data };
    
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Endpoint principal de Webhook
 */
export async function handleWebhook(req, res) {
  try {
    // Obter a assinatura do webhook
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      console.error('Assinatura do webhook não encontrada');
      return { status: 400, body: { error: 'Webhook signature required' } };
    }
    
    // Obter o corpo bruto da requisição
    const payload = req.body;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não definido');
      return { status: 500, body: { error: 'Webhook secret not configured' } };
    }
    
    // Verificar evento com o Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error(`Erro na verificação do webhook: ${err.message}`);
      return { status: 400, body: { error: `Webhook verification failed: ${err.message}` } };
    }
    
    // Processar diferentes tipos de eventos
    let result;
    
    console.log(`Processando evento do Stripe: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object);
        break;
        
      default:
        console.log(`Evento não processado: ${event.type}`);
        result = { success: true, message: `Unhandled event type: ${event.type}` };
    }
    
    // Retornar resposta para o Stripe
    return { 
      status: result.success ? 200 : 400,
      body: result
    };
    
  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return { 
      status: 500, 
      body: { error: `Webhook processing error: ${error.message}` } 
    };
  }
}

// Função auxiliar para lidar com expressjs
export default async function handleWebhookRequest(req, res) {
  const result = await handleWebhook(req, res);
  res.status(result.status).json(result.body);
} 