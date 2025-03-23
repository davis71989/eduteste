// Script para verificar as variáveis de ambiente das funções Edge
const { execSync } = require('child_process');

function checkEdgeFunctionVars() {
  console.log('Verificando variáveis de ambiente das funções Edge...\n');
  
  // Lista de funções Edge relacionadas ao Stripe
  const functions = [
    'get-stripe-key',
    'check-stripe-product',
    'create-stripe-product',
    'stripe-create-checkout',
    'stripe-cancel-subscription',
    'stripe-webhook'
  ];
  
  // Variáveis que devem estar configuradas
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'BASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  // Verifica cada função
  for (const func of functions) {
    console.log(`\n== Verificando função: ${func} ==`);
    
    try {
      // Executa o comando para listar as variáveis de ambiente
      const result = execSync(`npx supabase secrets list ${func}`).toString();
      
      // Verifica cada variável necessária
      for (const requiredVar of requiredVars) {
        if (result.includes(requiredVar)) {
          console.log(`✅ ${requiredVar}: configurada`);
        } else {
          console.log(`❌ ${requiredVar}: NÃO configurada`);
        }
      }
    } catch (error) {
      console.error(`Erro ao verificar variáveis para ${func}:`, error.message);
    }
  }
  
  console.log('\n== Sugestões de comandos para configurar variáveis ==');
  console.log(`
Para configurar todas as variáveis necessárias:

npx supabase secrets set --env-file .env.local

Ou configure cada variável manualmente:

npx supabase secrets set STRIPE_SECRET_KEY=sua_chave_secreta_stripe
npx supabase secrets set STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe
npx supabase secrets set BASE_URL=https://seu-site.com
npx supabase secrets set SUPABASE_URL=https://projeto.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=sua_chave_anon
  `);
}

checkEdgeFunctionVars(); 