// Script para testar a conexão com a função Edge do Supabase
const SUPABASE_URL = 'https://vkcwgfrihmfdbouxigef.supabase.co';
const ANON_KEY = ''; // Preencha com sua chave anônima

async function testEdgeFunction() {
  console.log('Testando conexão com a função Edge...');
  
  try {
    // Teste simples de acesso à API do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/planos?select=*`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Conexão com Supabase OK!');
      console.log(`Encontrados ${data.length} planos.`);
    } else {
      console.error('Erro ao conectar à API do Supabase:', await response.text());
    }
    
    // Agora tente acessar a função Edge
    console.log('\nTestando CORS para a função Edge...');
    const corsResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-stripe-key`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name'
      }
    });
    
    console.log('Status do preflight CORS:', corsResponse.status);
    console.log('Cabeçalhos de resposta CORS:');
    for (const [key, value] of corsResponse.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
  }
}

testEdgeFunction(); 