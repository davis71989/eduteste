import { createClient } from '@supabase/supabase-js';

// Script para atualizar os IDs dos produtos do Stripe no banco de dados
// Execute com: node scripts/update-stripe-products.jsx

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Novos IDs gerados para os produtos Stripe
const novosIds = [
  {
    id: "0b8a742e-228f-4c76-92e4-32f6cb737de1",
    nome: "Básico",
    stripeProductId: "prod_RzadbDZjP4fWbh",
    stripePriceId: "price_1R5bSQRrfuwybnpzFKmWDejc"
  },
  {
    id: "e147dc1f-9a63-46c5-b4cb-3bad639c8162",
    nome: "Intermediário",
    stripeProductId: "prod_RzadVKYOEVxPRR",
    stripePriceId: "price_1R5bSRRrfuwybnpz39OJF00O"
  },
  {
    id: "8c8d495a-a9b8-40a6-a0da-57b1977ebc45",
    nome: "Avançado",
    stripeProductId: "prod_RzadJUZYO1FJk0",
    stripePriceId: "price_1R5bSSRrfuwybnpzsI8S4Al7"
  },
  {
    id: "85e05cbc-de9f-46e9-b563-678e20b5cc5a",
    nome: "Premium",
    stripeProductId: "prod_RzadDfw8KbRCSD",
    stripePriceId: "price_1R5bSTRrfuwybnpzxZDV6bVi"
  }
];

// Função principal
async function atualizarProdutos() {
  console.log('Iniciando atualização dos produtos no banco de dados...');
  
  // Atualizar cada produto
  for (const produto of novosIds) {
    console.log(`\nAtualizando plano: ${produto.nome} (${produto.id})`);
    
    const { data, error } = await supabase
      .from('planos')
      .update({
        stripe_product_id: produto.stripeProductId,
        stripe_price_id: produto.stripePriceId,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', produto.id);
    
    if (error) {
      console.error(`Erro ao atualizar ${produto.nome}:`, error);
    } else {
      console.log(`✓ Plano ${produto.nome} atualizado com sucesso!`);
    }
  }
  
  // Verificar se os produtos foram atualizados
  const { data: planosAtualizados, error: erroConsulta } = await supabase
    .from('planos')
    .select('id, nome, stripe_product_id, stripe_price_id');
  
  if (erroConsulta) {
    console.error('Erro ao consultar planos atualizados:', erroConsulta);
    return;
  }
  
  console.log('\n=== PLANOS ATUALIZADOS ===');
  planosAtualizados.forEach(plano => {
    console.log(`${plano.nome}: Product ID=${plano.stripe_product_id}, Price ID=${plano.stripe_price_id}`);
  });
  
  console.log('\nAtualização concluída!');
}

// Executar a função principal
atualizarProdutos()
  .catch(error => {
    console.error('Erro durante a execução:', error);
    process.exit(1);
  }); 