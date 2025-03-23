/**
 * Script para configurar o ambiente de teste do Stripe
 * 
 * Este script ajuda a instalar e configurar tudo que é necessário para testar
 * a integração com o Stripe em modo de teste.
 * 
 * Uso:
 * node scripts/setup-stripe-test.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função para imprimir mensagens coloridas
const print = {
  title: (text) => console.log(`\n${colors.bright}${colors.cyan}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✓ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}✗ ${text}${colors.reset}`),
  warn: (text) => console.log(`${colors.yellow}! ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.blue}→ ${text}${colors.reset}`),
  step: (text) => console.log(`\n${colors.bright}${text}${colors.reset}`)
};

// Criar interface para perguntas
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Pergunta ao usuário
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}? ${question}${colors.reset} `, (answer) => {
      resolve(answer);
    });
  });
};

// Verificar se um comando existe
const checkCommand = (command) => {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

// Verifica se o Stripe CLI já está instalado
const checkStripeCLI = () => {
  return checkCommand('stripe');
};

// Verifica se existe .env com as variáveis necessárias
const checkEnvVars = () => {
  try {
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) {
      return { success: false, message: 'Arquivo .env não encontrado. Crie um com as variáveis STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET.' };
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasStripeSecretKey = envContent.includes('STRIPE_SECRET_KEY=');
    const hasStripePublicKey = envContent.includes('VITE_STRIPE_PUBLIC_KEY=');
    const hasStripeWebhookSecret = envContent.includes('STRIPE_WEBHOOK_SECRET=');

    if (!hasStripeSecretKey || !hasStripePublicKey) {
      return { 
        success: false, 
        message: 'Variáveis STRIPE_SECRET_KEY e/ou VITE_STRIPE_PUBLIC_KEY não encontradas no .env' 
      };
    }

    const isTestMode = envContent.includes('STRIPE_SECRET_KEY=sk_test_');
    if (!isTestMode) {
      return { 
        success: false, 
        message: 'STRIPE_SECRET_KEY deve começar com sk_test_ para modo de teste' 
      };
    }

    return { 
      success: true, 
      hasWebhookSecret: hasStripeWebhookSecret,
      message: 'Variáveis de ambiente OK' 
    };
  } catch (error) {
    return { success: false, message: `Erro ao verificar variáveis de ambiente: ${error.message}` };
  }
};

// Função principal
const main = async () => {
  print.title('=== CONFIGURAÇÃO DO AMBIENTE DE TESTE DO STRIPE ===');
  
  // Verificar se o Stripe CLI já está instalado
  const hasStripeCLI = checkStripeCLI();
  if (hasStripeCLI) {
    print.success('Stripe CLI já está instalado');
  } else {
    print.error('Stripe CLI não está instalado');
    print.info('Instruções de instalação:');
    
    if (process.platform === 'win32') {
      print.info('Windows: https://stripe.com/docs/stripe-cli#windows');
      print.info('Baixe e instale o executável do Stripe CLI');
    } else if (process.platform === 'darwin') {
      print.info('macOS: execute o comando "brew install stripe/stripe-cli/stripe"');
    } else {
      print.info('Linux: https://stripe.com/docs/stripe-cli#linux');
    }
    
    const install = await prompt('Deseja continuar mesmo sem o Stripe CLI? (s/n)');
    if (install.toLowerCase() !== 's') {
      print.warn('Configuração cancelada. Instale o Stripe CLI e tente novamente.');
      rl.close();
      return;
    }
  }
  
  // Verificar variáveis de ambiente
  const envCheck = checkEnvVars();
  if (envCheck.success) {
    print.success(envCheck.message);
    
    if (!envCheck.hasWebhookSecret) {
      print.warn('STRIPE_WEBHOOK_SECRET não encontrada no .env');
      print.info('Você precisará configurar manualmente esta variável após executar "stripe listen"');
    }
  } else {
    print.error(envCheck.message);
    const answer = await prompt('Deseja continuar mesmo assim? (s/n)');
    if (answer.toLowerCase() !== 's') {
      print.warn('Configuração cancelada.');
      rl.close();
      return;
    }
  }
  
  // Verificar se o script stripe-setup.js existe
  const stripeSetupPath = path.resolve('scripts', 'stripe-setup.js');
  if (fs.existsSync(stripeSetupPath)) {
    print.success('Script stripe-setup.js encontrado');
    
    const runSetup = await prompt('Deseja executar o script de configuração de planos no Stripe? (s/n)');
    if (runSetup.toLowerCase() === 's') {
      print.step('Executando script de configuração de planos...');
      try {
        execSync('npm run stripe:setup', { stdio: 'inherit' });
        print.success('Planos configurados com sucesso no Stripe!');
      } catch (error) {
        print.error(`Erro ao executar script de configuração: ${error.message}`);
      }
    }
  } else {
    print.warn('Script stripe-setup.js não encontrado. Pulando configuração de planos.');
  }
  
  if (hasStripeCLI) {
    print.step('Login no Stripe CLI');
    print.info('Para prosseguir, você precisa estar logado no Stripe CLI.');
    
    const checkLogin = await prompt('Você já está logado no Stripe CLI? (s/n)');
    if (checkLogin.toLowerCase() !== 's') {
      try {
        print.info('Executando "stripe login"...');
        execSync('stripe login', { stdio: 'inherit' });
        print.success('Login realizado com sucesso!');
      } catch (error) {
        print.error(`Erro ao fazer login: ${error.message}`);
        rl.close();
        return;
      }
    }
    
    print.step('Webhook Listener');
    print.info('Para testar webhooks localmente, você precisa iniciar o listener do Stripe.');
    
    const startListener = await prompt('Deseja iniciar o listener do webhook agora? (s/n)');
    if (startListener.toLowerCase() === 's') {
      print.info('Em um novo terminal, execute: npm run stripe:webhook');
      print.info('Anote o webhook signing secret gerado e adicione ao seu .env como STRIPE_WEBHOOK_SECRET');
    }
  }
  
  print.step('Modificação para testes');
  print.info('Para testar o Stripe em ambiente de desenvolvimento, você pode:');
  print.info('1. Acessar a página de debug em: http://localhost:5187/pagamento/debug');
  print.info('2. Editar src/components/Planos/StripeCheckout.tsx e definir useStripeInDevMode = true');
  
  print.title('=== CONFIGURAÇÃO CONCLUÍDA ===');
  print.info('Seu ambiente de teste do Stripe está configurado!');
  print.info('Para testar eventos do webhook, execute em outro terminal:');
  print.info('  npm run stripe:test:checkout');
  
  rl.close();
};

// Executar função principal
main().catch(error => {
  console.error(`Erro: ${error.message}`);
  process.exit(1);
}); 