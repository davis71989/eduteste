/**
 * Script para configurar produtos e preços no Stripe
 * 
 * Este script cria ou atualiza os produtos e preços no Stripe para uso
 * em ambiente de teste. Execute-o para garantir que sua conta Stripe tenha
 * todos os planos necessários para testes.
 * 
 * Uso:
 * node scripts/stripe-setup.js
 */

// Importar dependências
const stripe = require('stripe');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

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

// Verificar chave secreta do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error(`${colors.red}Erro: STRIPE_SECRET_KEY não encontrada no arquivo .env${colors.reset}`);
  console.log(`${colors.yellow}Por favor, adicione sua chave secreta do Stripe no arquivo .env:${colors.reset}`);
  console.log(`STRIPE_SECRET_KEY=sk_test_...`);
  process.exit(1);
}

// Verificar se é uma chave de teste
if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error(`${colors.red}Erro: Este script deve ser usado apenas com chaves de teste do Stripe (sk_test_)${colors.reset}`);
  console.log(`${colors.yellow}Por favor, use uma chave de teste para evitar modificar sua conta de produção${colors.reset}`);
  process.exit(1);
}

// Inicializar cliente do Stripe
const client = stripe(process.env.STRIPE_SECRET_KEY);

// Definir os planos a serem criados
const plans = [
  {
    id: 'basic',
    name: 'Plano Básico',
    description: 'Acesso a recursos essenciais para educadores iniciantes',
    features: [
      'Criação de até 3 salas de aula',
      'Acesso a materiais básicos',
      'Suporte por email'
    ],
    prices: [
      {
        currency: 'brl',
        unit_amount: 2990, // R$ 29,90
        recurring: {
          interval: 'month'
        },
        nickname: 'Mensal'
      },
      {
        currency: 'brl',
        unit_amount: 28990, // R$ 289,90 (≈ 10 meses)
        recurring: {
          interval: 'year'
        },
        nickname: 'Anual'
      }
    ],
    metadata: {
      order: '1'
    }
  },
  {
    id: 'pro',
    name: 'Plano Profissional',
    description: 'Recursos avançados para educadores experientes',
    features: [
      'Criação de até 10 salas de aula',
      'Acesso completo aos materiais',
      'Análises avançadas de desempenho',
      'Suporte prioritário'
    ],
    prices: [
      {
        currency: 'brl',
        unit_amount: 5990, // R$ 59,90
        recurring: {
          interval: 'month'
        },
        nickname: 'Mensal'
      },
      {
        currency: 'brl',
        unit_amount: 58990, // R$ 589,90 (≈ 10 meses)
        recurring: {
          interval: 'year'
        },
        nickname: 'Anual'
      }
    ],
    metadata: {
      order: '2',
      recommended: 'true'
    }
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    description: 'Solução completa para instituições e educadores profissionais',
    features: [
      'Salas de aula ilimitadas',
      'Materiais exclusivos',
      'Integrações com plataformas externas',
      'Análises detalhadas e relatórios',
      'Suporte 24/7 via chat e telefone',
      'Treinamentos exclusivos'
    ],
    prices: [
      {
        currency: 'brl',
        unit_amount: 9990, // R$ 99,90
        recurring: {
          interval: 'month'
        },
        nickname: 'Mensal'
      },
      {
        currency: 'brl',
        unit_amount: 97990, // R$ 979,90 (≈ 10 meses)
        recurring: {
          interval: 'year'
        },
        nickname: 'Anual'
      }
    ],
    metadata: {
      order: '3'
    }
  }
];

// Função para criar ou atualizar produtos e preços
async function setupStripeProducts() {
  console.log(`${colors.cyan}${colors.bright}=== CONFIGURAÇÃO DE PRODUTOS E PREÇOS NO STRIPE ===${colors.reset}\n`);
  
  try {
    // Mapeamento para armazenar os produtos e preços criados
    const createdProducts = {};
    const createdPrices = {};
    
    // Criar arquivo de saída
    const outputData = {
      products: {},
      prices: {}
    };
    
    // Processar cada plano
    for (const plan of plans) {
      console.log(`${colors.blue}→ Processando plano: ${plan.name}${colors.reset}`);
      
      // Verificar se o produto já existe
      let product;
      try {
        product = await client.products.retrieve(plan.id);
        console.log(`${colors.yellow}! Produto já existe, atualizando...${colors.reset}`);
        
        // Atualizar produto existente
        product = await client.products.update(plan.id, {
          name: plan.name,
          description: plan.description,
          metadata: {
            ...plan.metadata,
            features: JSON.stringify(plan.features)
          }
        });
      } catch (error) {
        // Criar novo produto
        console.log(`${colors.green}+ Criando novo produto...${colors.reset}`);
        product = await client.products.create({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          metadata: {
            ...plan.metadata,
            features: JSON.stringify(plan.features)
          }
        });
      }
      
      // Armazenar produto criado
      createdProducts[plan.id] = product;
      outputData.products[plan.id] = {
        id: product.id,
        name: product.name,
        description: product.description,
        metadata: product.metadata
      };
      
      // Criar preços para o produto
      for (const priceData of plan.prices) {
        const nickname = priceData.nickname;
        const interval = priceData.recurring.interval;
        const priceKey = `${plan.id}_${interval}`;
        
        console.log(`${colors.blue}  → Criando preço: ${nickname} (${interval})${colors.reset}`);
        
        // Criar preço
        const price = await client.prices.create({
          product: product.id,
          ...priceData,
          lookup_key: priceKey
        });
        
        // Armazenar preço criado
        createdPrices[priceKey] = price;
        outputData.prices[priceKey] = {
          id: price.id,
          nickname: price.nickname,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          product: price.product,
          lookup_key: price.lookup_key
        };
      }
      
      console.log(`${colors.green}✓ Plano ${plan.name} configurado com sucesso!${colors.reset}\n`);
    }
    
    // Salvar dados em arquivo local
    const outputPath = path.resolve('src', 'data', 'stripe-products.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    console.log(`${colors.green}✓ Dados salvos em ${outputPath}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}=== CONFIGURAÇÃO CONCLUÍDA COM SUCESSO ===${colors.reset}`);
    
    // Imprimir informações úteis
    console.log(`\n${colors.yellow}Informações para uso:${colors.reset}`);
    console.log(`1. Produtos e preços estão disponíveis na sua conta Stripe`);
    console.log(`2. Os IDs de preço para checkout são:`);
    
    for (const plan of plans) {
      const monthlyKey = `${plan.id}_month`;
      const yearlyKey = `${plan.id}_year`;
      
      if (outputData.prices[monthlyKey]) {
        console.log(`   - ${plan.name} (Mensal): ${outputData.prices[monthlyKey].id}`);
      }
      
      if (outputData.prices[yearlyKey]) {
        console.log(`   - ${plan.name} (Anual): ${outputData.prices[yearlyKey].id}`);
      }
    }
    
    console.log(`\n${colors.blue}Para testar, use o StripeDebug ou acesse o painel do Stripe:${colors.reset}`);
    console.log(`https://dashboard.stripe.com/test/products`);
    
  } catch (error) {
    console.error(`${colors.red}Erro durante a configuração:${colors.reset}`, error);
    process.exit(1);
  }
}

// Executar script
setupStripeProducts().catch(error => {
  console.error(`${colors.red}Erro não tratado:${colors.reset}`, error);
  process.exit(1);
}); 