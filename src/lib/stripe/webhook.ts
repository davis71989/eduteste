// Webhook handler para o Stripe
import Stripe from 'stripe';
import { supabase } from '../supabase';

// Inicializa o cliente Stripe com a chave secreta
const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});

/**
 * Função para processar eventos de webhook do Stripe
 * @param event Evento do Stripe
 */
export const handleStripeWebhook = async (event: Stripe.Event) => {
  try {
    console.log('Processando evento do Stripe:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      default:
        console.log(`Evento não processado: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    throw error;
  }
};

/**
 * Processar checkout completado
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  console.log('Checkout completado:', session.id);
  
  // Verificar se temos os metadados necessários
  if (!session.metadata?.userId || !session.metadata?.planoId) {
    console.error('Metadados incompletos na sessão:', session.metadata);
    return;
  }

  try {
    // Buscar a assinatura criada pelo checkout
    const { data: checkoutData, error: checkoutError } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('stripe_checkout_session_id', session.id)
      .single();

    if (checkoutError) {
      console.error('Erro ao buscar sessão de checkout:', checkoutError);
      return;
    }

    // Atualizar a assinatura para status ativa
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({
        status: 'ativa',
        stripe_subscription_id: session.subscription as string,
        updated_at: new Date().toISOString()
      })
      .eq('id', checkoutData.id);

    if (updateError) {
      console.error('Erro ao atualizar assinatura:', updateError);
    }
  } catch (error) {
    console.error('Erro ao processar checkout completado:', error);
  }
};

/**
 * Processar fatura paga
 */
const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
  console.log('Fatura paga:', invoice.id);
  
  try {
    // Verificar se temos o ID da assinatura
    if (!invoice.subscription) {
      console.error('Fatura sem ID de assinatura');
      return;
    }

    // Obter período da assinatura da fatura
    const periodStart = new Date(invoice.period_start * 1000).toISOString();
    const periodEnd = new Date(invoice.period_end * 1000).toISOString();

    // Atualizar a assinatura com o novo período
    const { error } = await supabase
      .from('assinaturas')
      .update({
        periodo_atual_inicio: periodStart,
        periodo_atual_fim: periodEnd,
        status: 'ativa',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Erro ao atualizar período da assinatura:', error);
    }
  } catch (error) {
    console.error('Erro ao processar fatura paga:', error);
  }
};

/**
 * Processar atualização de assinatura
 */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  console.log('Assinatura atualizada:', subscription.id);
  
  try {
    // Obter dados do cliente e plano
    const customerId = subscription.customer as string;
    const status = subscription.status === 'active' ? 'ativa' : 
                  subscription.status === 'trialing' ? 'trial' : 
                  subscription.status === 'canceled' ? 'cancelada' : 'pendente';

    // Atualizar a assinatura no banco de dados
    const { error } = await supabase
      .from('assinaturas')
      .update({
        status,
        renovacao_automatica: subscription.cancel_at_period_end ? false : true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Erro ao atualizar assinatura:', error);
    }
  } catch (error) {
    console.error('Erro ao processar atualização de assinatura:', error);
  }
};

/**
 * Processar cancelamento de assinatura
 */
const handleSubscriptionCanceled = async (subscription: Stripe.Subscription) => {
  console.log('Assinatura cancelada:', subscription.id);
  
  try {
    // Marcar a assinatura como cancelada no banco de dados
    const { error } = await supabase
      .from('assinaturas')
      .update({
        status: 'cancelada',
        renovacao_automatica: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Erro ao cancelar assinatura:', error);
    }
  } catch (error) {
    console.error('Erro ao processar cancelamento de assinatura:', error);
  }
}; 