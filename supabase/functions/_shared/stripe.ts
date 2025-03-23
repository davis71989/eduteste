// Configuração do Stripe

// Importar a biblioteca do Stripe para Deno
import Stripe from 'https://esm.sh/stripe@12.1.1?deno-std=0.177.0';
import { debugLog } from './config.ts';

// Obter a chave secreta do Stripe das variáveis de ambiente
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Verificar se a chave existe
if (!STRIPE_SECRET_KEY) {
  console.error('ERRO CRÍTICO: Variável de ambiente STRIPE_SECRET_KEY não encontrada!');
  console.error('Por favor, configure a variável STRIPE_SECRET_KEY com npx supabase secrets set');
} else {
  console.log('STRIPE_SECRET_KEY encontrada (primeiros 5 caracteres):', STRIPE_SECRET_KEY.substring(0, 5) + '...');
}

// Declarar a variável antes para poder exportá-la
let stripe: Stripe;

// Inicializar cliente do Stripe
try {
  console.log('Inicializando cliente Stripe...');
  
  stripe = new Stripe(STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });
  
  console.log('Cliente Stripe inicializado com sucesso');
  
  // Validar a chave tentando uma operação simples
  stripe.customers.list({ limit: 1 })
    .then(() => console.log('Chave do Stripe validada com sucesso'))
    .catch(err => console.error('ERRO ao validar chave do Stripe:', err.message));
} catch (error) {
  console.error('ERRO FATAL ao inicializar cliente Stripe:', error);
  // Criamos um objeto vazio para evitar erros de runtime, mas ele não funcionará
  stripe = {} as Stripe;
}

// Exportar o cliente Stripe
export { stripe };

// Função para verificar se o cliente Stripe está configurado corretamente
export async function testStripeConnection() {
  try {
    console.log('Testando conexão com o Stripe...');
    // Tenta buscar uma lista vazia de produtos para testar a conexão
    const products = await stripe.products.list({ limit: 1 });
    console.log('Conexão com Stripe bem-sucedida!');
    return {
      success: true,
      message: `Conexão com Stripe bem-sucedida. API Version: ${stripe.getApiField('version')}`
    };
  } catch (error) {
    console.error('Erro ao conectar com Stripe:', error);
    return {
      success: false,
      message: `Erro ao conectar com Stripe: ${error.message}`,
      error
    };
  }
}

// Configurações do produto (exemplo)
export const productConfig = {
  currency: 'brl',
  recurring: {
    interval: 'month'
  }
};

// Função para inicializar Stripe
export const getStripe = async () => {
  const stripe = await import('https://esm.sh/stripe@12.5.0');
  return new stripe.default(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
}; 