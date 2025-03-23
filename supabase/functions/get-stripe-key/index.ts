import { corsHeaders } from '../_shared/cors.ts'

// Resposta com erro
function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({
      error: message,
      success: false
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    }
  );
}

// Resposta com sucesso
function successResponse(data: any) {
  return new Response(
    JSON.stringify({
      ...data,
      success: true
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    }
  );
}

// Função Edge para obter a chave pública do Stripe
Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Recebida requisição para get-stripe-key`);
  
  // Tratamento de CORS para requisições OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Respondendo à requisição CORS preflight');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Esta função só aceita método GET
  if (req.method !== 'GET') {
    return errorResponse(405, 'Método não permitido');
  }
  
  try {
    // Obter a chave pública do Stripe das variáveis de ambiente
    const STRIPE_PUBLIC_KEY = Deno.env.get('VITE_STRIPE_PUBLIC_KEY') || 'pk_test_51R5UY2RvXVt1661QUcLHMrje4FL2BNIaCt06NJsoQvvggGC4Ql11ADs5it8YAzDsWZMHrC8rQXwagNKP7Z3v7BCr00INmv8hye';
    
    if (!STRIPE_PUBLIC_KEY) {
      console.error('Chave pública do Stripe não encontrada');
      return errorResponse(500, 'Chave do Stripe não configurada no servidor');
    }
    
    console.log('Retornando chave pública do Stripe (primeiros caracteres):', STRIPE_PUBLIC_KEY.substring(0, 10) + '...');
    
    // Retornar a chave pública para o cliente
    return successResponse({ key: STRIPE_PUBLIC_KEY });
  } catch (error) {
    console.error('Erro ao obter chave do Stripe:', error);
    return errorResponse(500, 'Erro interno ao obter chave do Stripe');
  }
}); 