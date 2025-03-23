/**
 * Script para escutar os webhooks do Stripe usando Stripe CLI
 * 
 * Este script inicia o Stripe CLI no modo de escuta para receber eventos
 * em tempo real. Use este script durante o desenvolvimento para testar
 * a integração com webhooks do Stripe.
 * 
 * Uso:
 * node scripts/stripe-webhook-listen.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se o Stripe CLI está instalado
try {
  const checkStripe = require('child_process').execSync('stripe --version', { 
    stdio: ['ignore', 'pipe', 'ignore'] 
  });
  console.log(`\x1b[32m✓ Stripe CLI detectado: ${checkStripe.toString().trim()}\x1b[0m`);
} catch (error) {
  console.error('\x1b[31m✗ Stripe CLI não encontrado. Por favor, instale-o primeiro:\x1b[0m');
  console.log('\x1b[34mWindows: https://stripe.com/docs/stripe-cli#windows');
  console.log('macOS: brew install stripe/stripe-cli/stripe');
  console.log('Linux: https://stripe.com/docs/stripe-cli#linux\x1b[0m');
  process.exit(1);
}

// Configuração do endpoint de webhook
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5173/api/stripe-webhook';

// Comando para iniciar o modo de escuta
console.log('\x1b[36m\n=== INICIANDO STRIPE WEBHOOK LISTENER ===\x1b[0m');
console.log(`\x1b[34m→ Encaminhando eventos para: ${WEBHOOK_URL}\x1b[0m`);
console.log('\x1b[33m! IMPORTANTE: Copie a chave de assinatura (webhook signing secret) gerada abaixo\x1b[0m');
console.log('\x1b[33m! e adicione ao seu arquivo .env como STRIPE_WEBHOOK_SECRET=...\x1b[0m\n');

// Iniciar o Stripe CLI no modo de escuta
const stripeProcess = spawn('stripe', [
  'listen',
  '--forward-to', WEBHOOK_URL,
  '--skip-verify' // Pular verificação SSL para desenvolvimento local
]);

// Gerar log para stdout
stripeProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Destacar a chave de webhook quando for exibida
  if (output.includes('whsec_')) {
    const parts = output.split('whsec_');
    if (parts.length > 1) {
      const secret = 'whsec_' + parts[1].split(' ')[0].trim();
      console.log(output.replace(secret, `\x1b[32m${secret}\x1b[0m`));
      
      // Sugerir adicionar ao .env
      console.log('\n\x1b[33m! Adicione esta chave ao seu .env:\x1b[0m');
      console.log(`\x1b[33mSTRIPE_WEBHOOK_SECRET=${secret}\x1b[0m\n`);
    } else {
      console.log(output);
    }
  } else {
    console.log(output);
  }
});

// Gerar log para stderr
stripeProcess.stderr.on('data', (data) => {
  console.error(`\x1b[31mErro: ${data.toString()}\x1b[0m`);
});

// Tratar encerramento do processo
stripeProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`\x1b[31mO processo Stripe CLI foi encerrado com código ${code}\x1b[0m`);
  }
  console.log('\x1b[36m=== STRIPE WEBHOOK LISTENER ENCERRADO ===\x1b[0m');
  process.exit(code);
});

// Gerenciar encerramento do script
const shutdown = () => {
  console.log('\n\x1b[33mEncerrando webhook listener...\x1b[0m');
  stripeProcess.kill();
};

// Capturar CTRL+C e outros sinais de encerramento
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown); 