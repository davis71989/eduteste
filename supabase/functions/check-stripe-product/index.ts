import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'
import { corsHeaders } from '../_shared/cors.ts'
import { getStripe, verificarProduto, verificarPreco } from "../_shared/stripe-fix.ts"

// Deno serve handler
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o usuário é admin consultando sua função
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (rolesError || !userRoles || userRoles.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Acesso restrito a administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter IDs dos produtos do corpo da requisição
    const requestData = await req.json()
    const { productId, priceId } = requestData

    if (!productId || !priceId) {
      return new Response(
        JSON.stringify({ error: 'productId e priceId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inicializar Stripe
    const stripe = getStripe()
    
    try {
      // Verificar produto
      const produtoResultado = await verificarProduto(stripe, productId)
      
      // Se o produto não existe, retornar erro
      if (!produtoResultado.existe) {
        return new Response(
          JSON.stringify({ 
            exists: false,
            error: 'Produto não encontrado no Stripe'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Verificar preço
      const precoResultado = await verificarPreco(stripe, priceId)
      
      // Se o preço não existe, retornar erro
      if (!precoResultado.existe) {
        return new Response(
          JSON.stringify({ 
            exists: false, 
            product: produtoResultado.produto,
            price: null,
            error: 'Preço não encontrado no Stripe'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Verificar se o preço pertence ao produto
      const priceMatchesProduct = precoResultado.preco.product === productId
      
      return new Response(
        JSON.stringify({ 
          exists: true, 
          product: produtoResultado.produto, 
          price: precoResultado.preco,
          priceMatchesProduct: priceMatchesProduct
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Erro ao verificar produto/preço:', error)
      
      return new Response(
        JSON.stringify({ 
          exists: false,
          error: `Erro ao acessar a API do Stripe: ${error.message}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    // Tratar erros inesperados
    console.error('Erro na função check-stripe-product:', error)
    
    return new Response(
      JSON.stringify({ error: `Erro interno: ${error.message}` }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}) 