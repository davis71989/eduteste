// Script para verificar as variáveis de ambiente necessárias para as funções Edge
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Lista de variáveis de ambiente necessárias
const requiredVariables = [
  'STRIPE_SECRET_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVER_URL',
  'ENVIRONMENT'
];

async function checkEdgeVariables() {
  try {
    console.log('Verificando variáveis de ambiente das funções Edge do Supabase...');
    
    const { stdout } = await execAsync('npx supabase secrets list');
    
    const lines = stdout.split('\n');
    const currentVariables = {};
    
    // Extrair as variáveis existentes
    for (const line of lines) {
      const match = line.match(/^\s*(\w+)\s*=\s*(.+)\s*$/);
      if (match) {
        const [, key, value] = match;
        currentVariables[key] = value;
      }
    }
    
    // Verificar variáveis necessárias
    const missing = [];
    for (const variable of requiredVariables) {
      if (!currentVariables[variable]) {
        missing.push(variable);
      } else {
        const value = currentVariables[variable];
        const maskedValue = value.length > 10 
          ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}` 
          : '***';
        console.log(`✓ ${variable} = ${maskedValue}`);
      }
    }
    
    if (missing.length > 0) {
      console.error('\n❌ Variáveis não configuradas:');
      for (const variable of missing) {
        console.error(`  - ${variable}`);
      }
      
      console.log('\nPara configurar as variáveis faltantes, execute:');
      for (const variable of missing) {
        console.log(`npx supabase secrets set ${variable}=seu_valor_aqui`);
      }
    } else {
      console.log('\n✅ Todas as variáveis de ambiente necessárias estão configuradas!');
    }
    
    // Verificar se a função está implantada
    console.log('\nVerificando implantação das funções Edge...');
    
    const { stdout: functionsOutput } = await execAsync('npx supabase functions list');
    const functions = functionsOutput.split('\n')
      .filter(line => line.trim().length > 0 && !line.includes('Functions'))
      .map(line => line.trim());
    
    const stripeFunctions = [
      'stripe-create-checkout',
      'stripe-webhook',
      'get-stripe-key',
      'check-stripe-product'
    ];
    
    const notDeployed = [];
    for (const func of stripeFunctions) {
      if (!functions.find(f => f.includes(func))) {
        notDeployed.push(func);
      } else {
        console.log(`✓ Função ${func} está implantada`);
      }
    }
    
    if (notDeployed.length > 0) {
      console.error('\n❌ Funções não implantadas:');
      for (const func of notDeployed) {
        console.error(`  - ${func}`);
      }
      
      console.log('\nPara implantar as funções, execute:');
      console.log(`npx supabase functions deploy ${notDeployed.join(' ')} --legacy-bundle --no-verify-jwt`);
    } else {
      console.log('\n✅ Todas as funções necessárias estão implantadas!');
    }
    
  } catch (error) {
    console.error('Erro ao verificar variáveis de ambiente:', error.message);
    console.error('Certifique-se de que o CLI do Supabase está instalado e configurado.');
  }
}

checkEdgeVariables();

// Instruções para correção
console.log('\n📋 Recomendações para corrigir os problemas de checkout do Stripe:');
console.log('1. Verifique se as variáveis de ambiente estão configuradas');
console.log('2. Corrija o código das funções Edge (stripe.ts e stripe-create-checkout/index.ts)');
console.log('3. Reimplante as funções Edge com:');
console.log('   npx supabase functions deploy stripe-create-checkout get-stripe-key check-stripe-product --legacy-bundle --no-verify-jwt');
console.log('4. Verifique os logs da função com:');
console.log('   npx supabase functions logs stripe-create-checkout');
console.log('5. Teste o checkout novamente no frontend'); 