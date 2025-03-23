// Supabase Edge Function para criação de sessão de checkout no Stripe
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { stripe } from '../_shared/stripe.ts';
import { corsHeaders, handleCorsOptions } from '../_shared/cors.ts';
import { Database } from '../_shared/supabase.types.ts';
import { SERVER_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, debugLog } from '../_shared/config.ts';

// Log de inicialização
console.log(`[INIT] Inicializando função stripe-create-checkout com:
- SUPABASE_URL: ${SUPABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO'}
- SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'NÃO CONFIGURADO'}
- SERVER_URL: ${SERVER_URL || 'Não definido'}
- Stripe disponível: ${!!stripe}`);

// Resposta com erro
function errorResponse(status: number, message: string, details?: any) {
  console.error(`[ERROR] ${status}: ${message}`, details);
  return new Response(
    JSON.stringify({
      error: message,
      details: details,
      success: false
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Resposta com sucesso
function successResponse(data: any) {
  console.log('[SUCCESS] Respondendo com sucesso:', data ? 'Dados disponíveis' : 'Sem dados');
  return new Response(
    JSON.stringify({
      ...data,
      success: true
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

Deno.serve(async (req: Request) => {
  console.log(`[${new Date().toISOString()}] Recebida requisição para stripe-create-checkout`);
  
  // Verificar método HTTP
  if (req.method === 'OPTIONS') {
    console.log('Respondendo à requisição CORS preflight');
    return handleCorsOptions(req) || 
      new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log(`Método não permitido: ${req.method}`);
    return errorResponse(405, 'Método não permitido');
  }

  try {
    // Verificar variáveis de ambiente necessárias
    if (!SUPABASE_URL) {
      console.error('Variável de ambiente MY_SUPABASE_URL não configurada');
      return errorResponse(500, 'Configuração incompleta: MY_SUPABASE_URL ausente');
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Variável de ambiente MY_SERVICE_ROLE_KEY não configurada');
      return errorResponse(500, 'Configuração incompleta: MY_SERVICE_ROLE_KEY ausente');
    }

    if (!stripe) {
      console.error('Cliente Stripe não inicializado corretamente');
      return errorResponse(500, 'Configuração incompleta: Cliente Stripe não disponível');
    }

    // Verificar token de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Token de autenticação ausente');
      return errorResponse(401, 'Não autorizado. Token ausente.');
    }

    console.log('Auth header encontrado (começa com):', authHeader.substring(0, 15) + '...');
    const token = authHeader.replace('Bearer ', '');

    // Inicializar cliente Supabase
    console.log('Inicializando cliente Supabase Admin...');
    const supabaseAdmin = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar usuário
    console.log('Verificando autenticação do usuário...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      return errorResponse(401, 'Não autorizado. Usuário não encontrado ou sessão inválida.', 
        userError ? userError.message : 'Token inválido');
    }

    console.log(`Usuário autenticado: ${user.id.substring(0, 6)}...`);

    // Obter dados do usuário
    console.log('Buscando perfil do usuário na tabela profiles...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email_notifications, created_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return errorResponse(500, 'Erro ao buscar perfil do usuário', profileError.message);
    }

    if (!profile) {
      console.log('Perfil de usuário não encontrado');
      return errorResponse(404, 'Perfil de usuário não encontrado');
    }

    // Processar payload da requisição
    console.log('Processando corpo da requisição...');
    const bodyText = await req.text();
    console.log('Corpo da requisição:', bodyText);
    
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (e) {
      console.error('Erro ao analisar corpo da requisição:', e, 'Texto:', bodyText);
      return errorResponse(400, 'Payload inválido: não foi possível analisar JSON');
    }
    
    const { planoId } = requestData;

    if (!planoId) {
      console.log('planoId ausente na requisição');
      return errorResponse(400, 'ID do plano é obrigatório');
    }

    console.log(`Buscando detalhes do plano: ${planoId}`);
    const { data: plano, error: planoError } = await supabaseAdmin
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single();

    if (planoError || !plano) {
      console.error('Erro ao buscar plano:', planoError);
      return errorResponse(404, 'Plano não encontrado', planoError?.message);
    }

    if (!plano.stripe_price_id) {
      console.log('Plano sem stripe_price_id definido');
      return errorResponse(400, 'Este plano não possui um ID de preço válido no Stripe');
    }

    console.log(`Criando sessão de checkout para preço: ${plano.stripe_price_id}`);
    
    // Verificar se o usuário já possui uma assinatura deste plano
    console.log('Verificando assinaturas existentes...');
    const { data: existingSubscription, error: subscriptionError } = await supabaseAdmin
      .from('assinaturas')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('plano_id', planoId)
      .eq('status', 'ativa')
      .maybeSingle();

    if (subscriptionError) {
      console.error('Erro ao verificar assinatura:', subscriptionError);
      // Continue mesmo com erro (não é crítico)
    }

    if (existingSubscription) {
      console.log('Usuário já possui este plano ativo');
      return errorResponse(400, 'Você já possui uma assinatura ativa deste plano');
    }

    // Criar sessão de checkout do Stripe
    console.log('Criando sessão de checkout no Stripe...');
    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        line_items: [
          {
            price: plano.stripe_price_id,
            quantity: 1
          }
        ],
        mode: plano.recorrente ? 'subscription' : 'payment',
        allow_promotion_codes: true,
        success_url: `${SERVER_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SERVER_URL}/planos`,
        metadata: {
          user_id: user.id,
          plan_id: planoId,
          plan_name: plano.nome,
          environment: Deno.env.get('ENVIRONMENT') || 'development'
        }
      });

      if (!session || !session.url) {
        console.error('Sessão do Stripe criada sem URL de redirecionamento');
        return errorResponse(500, 'Erro ao criar sessão de checkout');
      }

      console.log(`Sessão de checkout criada com sucesso: ${session.id}`);
      return successResponse({ url: session.url });
    } catch (stripeError: any) {
      console.error('Erro do Stripe:', stripeError);
      return errorResponse(
        500,
        'Erro ao criar sessão de checkout',
        stripeError.message || 'Erro desconhecido do Stripe'
      );
    }
  } catch (error: any) {
    console.error('Erro interno:', error);
    return errorResponse(
      500,
      'Erro interno ao processar a requisição',
      error.message || 'Erro interno desconhecido'
    );
  }
});
