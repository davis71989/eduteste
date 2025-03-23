// Script para testar CORS e autenticação com funções Edge do Supabase
// Execute: node test_cors_issue.js

const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vkcwgfrihmfdbouxigef.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('Erro: VITE_SUPABASE_ANON_KEY não definido');
  console.log('Execute: VITE_SUPABASE_ANON_KEY=seu_valor_aqui node test_cors_issue.js');
  process.exit(1);
}

// URL da função Edge
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Credenciais de teste (substitua por credenciais válidas)
const TEST_EMAIL = 'seuemail@exemplo.com'; // Substitua por um email válido
const TEST_PASSWORD = 'sua_senha'; // Substitua por uma senha válida

// Inicializar o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false // Sessão apenas em memória para testes
  }
});

async function testStripeFunction() {
  try {
    console.log('=== Teste de CORS e Autenticação para Funções Edge do Supabase ===');
    console.log(`URL base: ${FUNCTIONS_URL}`);

    // 1. Teste de autenticação
    console.log('\n1. Autenticando usuário de teste...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (authError) {
      console.error('Erro de autenticação:', authError);
      return;
    }

    console.log('✅ Autenticação bem-sucedida');
    console.log(`ID do usuário: ${authData.user.id}`);
    console.log(`Token (primeiros 20 caracteres): ${authData.session.access_token.substring(0, 20)}...`);

    // 2. Teste da função get-stripe-key (deve ser mais simples)
    console.log('\n2. Testando a função get-stripe-key...');
    try {
      const keyResponse = await fetch(`${FUNCTIONS_URL}/get-stripe-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'x-application-name': 'EduPais'
        }
      });

      console.log(`Status da resposta: ${keyResponse.status} ${keyResponse.statusText}`);
      
      // Capturar todos os cabeçalhos da resposta
      console.log('Cabeçalhos da resposta:');
      keyResponse.headers.forEach((value, name) => {
        console.log(`  ${name}: ${value}`);
      });

      const keyData = await keyResponse.text();
      console.log('Resposta:', keyData);

      // Verificar se temos uma resposta JSON válida
      try {
        const keyJson = JSON.parse(keyData);
        if (keyJson.publicKey) {
          console.log('✅ Função get-stripe-key retornou chave válida');
        } else {
          console.log('⚠️ Função get-stripe-key não retornou uma chave pública');
        }
      } catch (jsonError) {
        console.error('⚠️ Resposta não é um JSON válido:', jsonError);
      }
    } catch (keyError) {
      console.error('❌ Erro ao chamar get-stripe-key:', keyError);
    }

    // 3. Teste da função stripe-create-checkout
    console.log('\n3. Testando a função stripe-create-checkout...');

    // Valor de planoId que exista no banco (ajuste conforme necessário)
    const planoId = '1'; // Substitua pelo ID de um plano existente

    try {
      // Primeiro, fazemos uma requisição OPTIONS para verificar CORS
      console.log('3.1 Enviando requisição OPTIONS (preflight CORS)...');
      const preflightResponse = await fetch(`${FUNCTIONS_URL}/stripe-create-checkout`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type, x-application-name',
          'Origin': 'http://localhost:5173'
        }
      });

      console.log(`Status do preflight: ${preflightResponse.status} ${preflightResponse.statusText}`);
      
      // Capturar todos os cabeçalhos da resposta
      console.log('Cabeçalhos da resposta de preflight:');
      preflightResponse.headers.forEach((value, name) => {
        console.log(`  ${name}: ${value}`);
      });

      // Agora, fazemos a requisição POST real
      console.log('\n3.2 Enviando requisição POST para criação de checkout...');
      const checkoutResponse = await fetch(`${FUNCTIONS_URL}/stripe-create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`,
          'x-application-name': 'EduPais'
        },
        body: JSON.stringify({ planoId })
      });

      console.log(`Status da resposta: ${checkoutResponse.status} ${checkoutResponse.statusText}`);
      
      // Capturar todos os cabeçalhos da resposta
      console.log('Cabeçalhos da resposta:');
      checkoutResponse.headers.forEach((value, name) => {
        console.log(`  ${name}: ${value}`);
      });

      const checkoutText = await checkoutResponse.text();
      console.log('Resposta (texto):', checkoutText);

      // Verificar se temos uma resposta JSON válida
      try {
        const checkoutJson = JSON.parse(checkoutText);
        if (checkoutJson.url) {
          console.log('✅ Função stripe-create-checkout retornou URL de sucesso');
          console.log(`URL: ${checkoutJson.url}`);
        } else if (checkoutJson.error) {
          console.log('⚠️ Função retornou erro:', checkoutJson.error);
          if (checkoutJson.details) {
            console.log('Detalhes:', checkoutJson.details);
          }
        }
      } catch (jsonError) {
        console.error('⚠️ Resposta não é um JSON válido:', jsonError);
      }
    } catch (checkoutError) {
      console.error('❌ Erro ao chamar stripe-create-checkout:', checkoutError);
    }

  } catch (error) {
    console.error('Erro geral no teste:', error);
  }
}

// Executar os testes
testStripeFunction()
  .then(() => console.log('\nTestes concluídos'))
  .catch(err => console.error('Erro inesperado:', err)); 