// Script para testar a função de checkout do Stripe
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// URLs e tokens
const SUPABASE_URL = process.env.SUPABASE_URL;
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Token de autenticação (substitua por um token válido)
// Este token deve ser obtido após login no sistema
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error('❌ Token não fornecido. Use: node test_stripe_checkout.js SEU_TOKEN');
  console.error('Para obter um token, faça login no aplicativo e copie o valor do cookie "sb-access-token"');
  process.exit(1);
}

console.log('🔑 Usando token:', TOKEN.substring(0, 15) + '...');

// ID do plano a ser testado (substitua pelo ID real do seu plano)
const PLANO_ID = process.argv[3] || 'e147dc1f-9a63-46c5-b4cb-3bad639c8162';

console.log('🧾 Testando checkout para plano:', PLANO_ID);

// Função principal
async function testarCheckout() {
  try {
    console.log(`🌐 URL da função: ${FUNCTIONS_URL}/stripe-create-checkout`);
    
    // Fazer a requisição para a função Edge
    const response = await fetch(`${FUNCTIONS_URL}/stripe-create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'x-application-name': 'EduPais'
      },
      body: JSON.stringify({ planoId: PLANO_ID })
    });
    
    // Obter resposta como texto para depuração
    const responseText = await response.text();
    
    console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);
    console.log('📄 Resposta completa:');
    console.log(responseText);
    
    // Tentar analisar como JSON se possível
    try {
      const responseData = JSON.parse(responseText);
      
      if (response.ok && responseData.url) {
        console.log('✅ Checkout criado com sucesso!');
        console.log('🔗 URL de checkout:', responseData.url);
      } else {
        console.error('❌ Erro retornado pela API:', responseData.error || 'Erro desconhecido');
        if (responseData.details) {
          console.error('📋 Detalhes:', responseData.details);
        }
      }
    } catch (e) {
      console.error('❌ Erro ao analisar resposta JSON:', e);
    }
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error);
  }
}

// Executar o teste
testarCheckout(); 