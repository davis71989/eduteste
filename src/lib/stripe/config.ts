// Configuração do Stripe
// Este arquivo contém as configurações básicas para integração com o Stripe
// NÃO coloque chaves secretas diretamente aqui, use variáveis de ambiente

// Configuração do Stripe no lado do cliente

// Obter a chave pública do Stripe a partir das variáveis de ambiente
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Verificar se a chave está configurada
if (!STRIPE_PUBLIC_KEY) {
  console.error('[STRIPE] Erro crítico: VITE_STRIPE_PUBLIC_KEY não está definido no ambiente');
} else {
  console.log('[STRIPE] Chave pública configurada (primeiros 10 caracteres):', 
    STRIPE_PUBLIC_KEY.substring(0, 10) + '...');
}

// URLs para função Edge do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Verificar URL do Supabase
if (!SUPABASE_URL) {
  console.error('[STRIPE] Erro crítico: VITE_SUPABASE_URL não está definido no ambiente');
}

// Configurações para o ambiente de desenvolvimento ou produção
export const IS_DEVELOPMENT = import.meta.env.DEV;

// URL base para as funções Edge do Stripe
export const STRIPE_FUNCTIONS_URL = IS_DEVELOPMENT 
  ? 'http://localhost:54321/functions/v1' 
  : `${SUPABASE_URL}/functions/v1`;

console.log('[STRIPE] Configuração inicializada, ambiente:', IS_DEVELOPMENT ? 'desenvolvimento' : 'produção');
console.log('[STRIPE] URL de funções:', STRIPE_FUNCTIONS_URL);

// As chaves a seguir são para uso EXCLUSIVO no backend/API
// Nunca devem ser expostas para o cliente
export const stripeConfig = {
  // Apenas para referência no código - essas variáveis devem estar no .env do servidor
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

// Intervalos de pagamento suportados
export const PAYMENT_INTERVALS = {
  MONTHLY: 'month',
  YEARLY: 'year',
};

// Domínio base para redirecionamentos após checkout
export const BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://seu-dominio.com' // Substitua pelo seu domínio de produção
  : 'http://localhost:5173';

// URLs de sucesso e cancelamento
export const SUCCESS_URL = `${BASE_URL}/pagamento/sucesso`;
export const CANCEL_URL = `${BASE_URL}/pagamento/cancelado`;

// Status de assinatura no sistema
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ativo',
  CANCELED: 'cancelado',
  PAST_DUE: 'inadimplente',
  PENDING: 'pendente',
  TRIAL: 'trial',
  UNPAID: 'não pago',
}; 