// Configurações compartilhadas entre funções Edge

// URL base para redirecionamentos após checkout
export const SERVER_URL = Deno.env.get('SERVER_URL') || 'http://localhost:5173';

// URL do Supabase para conexão com o banco de dados
export const SUPABASE_URL = Deno.env.get('MY_SUPABASE_URL') || '';

// Chave de service role do Supabase para operações privilegiadas
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('MY_SERVICE_ROLE_KEY') || '';

// Ambiente (development, staging, production)
export const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'development';

// Configurações de produtos do Stripe
export const STRIPE_PRODUCTS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  INTERMEDIARY: 'intermediary',
  ADVANCED: 'advanced',
};

// Configurações de debug
export const DEBUG = ENVIRONMENT === 'development';

// Função para log condicional no ambiente de desenvolvimento
export function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Configurações de redirecionamento padrão
export const DEFAULT_SUCCESS_URL = `${SERVER_URL}/checkout/success`;
export const DEFAULT_CANCEL_URL = `${SERVER_URL}/planos`;

// Tempo padrão para expiração de tokens em segundos (30 minutos)
export const DEFAULT_TOKEN_EXPIRY = 30 * 60; 