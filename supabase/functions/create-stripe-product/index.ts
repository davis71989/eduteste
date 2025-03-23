import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { getStripe, criarProduto, criarPreco } from "../_shared/stripe-fix.ts"

// Deno serve handler
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verificar autenticação
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Não autorizado' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Obter os dados do corpo da requisição
    const { nome, descricao, preco, planoId } = await req.json()
    
    if (!nome || !preco || !planoId) {
      return new Response(
        JSON.stringify({ error: 'nome, preco e planoId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inicializar Stripe
    const stripe = getStripe()
    
    // Metadados para associar o produto ao plano
    const metadata = { plano_id: planoId };
    
    try {
      // Criar produto no Stripe
      const product = await criarProduto(
        stripe, 
        nome, 
        descricao || `Plano ${nome}`, 
        metadata
      );
      
      // Criar preço para o produto
      const price = await criarPreco(
        stripe,
        product.id,
        preco,
        metadata
      );
      
      // Retornar os IDs criados
      return new Response(
        JSON.stringify({ 
          success: true,
          productId: product.id,
          priceId: price.id,
          nome: nome,
          planoId: planoId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Erro ao criar produto ou preço:', error);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao acessar a API do Stripe: ${error.message}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Erro interno: ${error.message}`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 