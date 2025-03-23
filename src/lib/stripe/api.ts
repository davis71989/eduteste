// API do Stripe
// Este arquivo contém as funções para comunicação com a API do Stripe
// IMPORTANTE: Estas funções devem ser executadas SOMENTE no servidor

import Stripe from 'stripe';
import { supabase } from '../supabase';
import { PAYMENT_INTERVALS, SUCCESS_URL, CANCEL_URL, SUBSCRIPTION_STATUS } from './config';

// Inicialização do cliente Stripe (SOMENTE PARA USO NO SERVIDOR)
// Nunca exponha esta funcionalidade no cliente/front-end
export const initStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Chave secreta do Stripe não configurada');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16' as any,
  });
};

// Criar ou obter um cliente Stripe para o usuário
export const getOrCreateCustomer = async (userId: string, email: string) => {
  // Primeiro, verificamos se o usuário já tem um customer_id
  const { data: assinaturaExistente } = await supabase
    .from('assinaturas')
    .select('stripe_customer_id')
    .eq('usuario_id', userId)
    .not('stripe_customer_id', 'is', null)
    .maybeSingle();

  if (assinaturaExistente?.stripe_customer_id) {
    return assinaturaExistente.stripe_customer_id;
  }

  // Se não, criamos um novo cliente no Stripe
  const stripe = initStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
};

// Criar um produto no Stripe para um plano
export const createStripeProduct = async (planoId: string, nome: string, descricao: string) => {
  const stripe = initStripe();
  const product = await stripe.products.create({
    name: nome,
    description: descricao,
    metadata: {
      planoId,
    },
  });
  
  return product.id;
};

// Criar um preço no Stripe para um produto/plano
export const createStripePrice = async (
  productId: string, 
  preco: number, 
  intervalo: 'month' | 'year' = 'month'
) => {
  const stripe = initStripe();
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(preco * 100), // Convertendo para centavos
    currency: 'brl',
    recurring: {
      interval: intervalo,
    },
  });
  
  return price.id;
};

// Criar uma sessão de checkout para o usuário assinar um plano
export const createCheckoutSession = async (
  userId: string,
  email: string,
  priceId: string,
  planoId: string,
  trial = false
) => {
  const stripe = initStripe();
  const customerId = await getOrCreateCustomer(userId, email);
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: SUCCESS_URL,
    cancel_url: CANCEL_URL,
    metadata: {
      userId,
      planoId,
    },
    subscription_data: trial ? {
      trial_period_days: 7, // Ajuste conforme necessário
    } : undefined,
  });
  
  // Registrar a sessão de checkout na tabela de assinaturas
  await supabase.from('assinaturas').upsert({
    usuario_id: userId,
    plano_id: planoId,
    status: trial ? SUBSCRIPTION_STATUS.TRIAL : 'pendente',
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    data_inicio: new Date().toISOString(),
  });
  
  return session.url;
};

// Cancelar uma assinatura
export const cancelSubscription = async (subscriptionId: string) => {
  const stripe = initStripe();
  return stripe.subscriptions.cancel(subscriptionId);
};

// Atualizar o plano de uma assinatura
export const updateSubscription = async (subscriptionId: string, newPriceId: string) => {
  const stripe = initStripe();
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
        price: newPriceId,
      },
    ],
  });
};

// Reativar uma assinatura cancelada (se ainda estiver no período de carência)
export const reactivateSubscription = async (subscriptionId: string) => {
  const stripe = initStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
};

// Sincronizar produtos e preços do Stripe com o banco de dados
export const syncStripePlans = async () => {
  const stripe = initStripe();
  
  // Buscar todos os produtos ativos no Stripe
  const products = await stripe.products.list({ active: true });
  
  // Buscar todos os preços ativos no Stripe
  const prices = await stripe.prices.list({ active: true });
  
  // Para cada produto, atualizar o registro correspondente no Supabase
  for (const product of products.data) {
    const planoId = product.metadata.planoId;
    if (!planoId) continue; // Ignorar produtos que não têm o metadata planoId
    
    // Encontrar os preços associados a este produto
    const productPrices = prices.data.filter(price => price.product === product.id);
    
    // Para cada preço, atualizar o plano correspondente no Supabase
    for (const price of productPrices) {
      if (!price.recurring) continue; // Ignorar preços que não são assinaturas
      
      // Atualizar o plano no Supabase
      await supabase
        .from('planos')
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id,
        })
        .eq('id', planoId)
        .eq('intervalo', price.recurring.interval === 'month' ? 'mensal' : 'anual');
    }
  }
  
  return { success: true, message: 'Planos sincronizados com sucesso' };
}; 