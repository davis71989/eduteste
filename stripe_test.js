const Stripe = require('stripe');

// Obter a chave da linha de comando ou usar a padrão
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51R5UY2RvXVt1661QzpxXn1JXxblpubjzhRMeNWg45Ck4tOty7i1c1HmNJc0hXJLQVXGRNhNxvN2OVUHXF1jV0U6300OmqbHePv';

// Limpar a chave para remover caracteres invisíveis ou espaços extras
const cleanKey = stripeKey.trim();
console.log(`Usando chave: ${cleanKey.substring(0, 7)}...${cleanKey.substring(cleanKey.length - 4)}`);

// Inicializar o cliente Stripe com a chave limpa
const stripe = Stripe(cleanKey);

// Planos do sistema
const plans = [
  {
    id: '0b8a742e-228f-4c76-92e4-32f6cb737de1',
    name: 'Básico',
    description: 'Plano básico com recursos limitados',
    price: 100, // R$ 1.00 em centavos
    oldProductId: 'prod_RzVUyy88KVqHA3',
    oldPriceId: 'price_1R5WTiRvXVt1661Q84Zla8YN'
  },
  {
    id: 'e147dc1f-9a63-46c5-b4cb-3bad639c8162',
    name: 'Intermediário',
    description: 'Plano intermediário com mais recursos',
    price: 1000, // R$ 10.00 em centavos
    oldProductId: 'prod_RzVUceVCXu4FAn',
    oldPriceId: 'price_1R5WTjRvXVt1661QtZo3y15J'
  },
  {
    id: '8c8d495a-a9b8-40a6-a0da-57b1977ebc45',
    name: 'Avançado',
    description: 'Plano avançado com recursos estendidos',
    price: 1990, // R$ 19.90 em centavos
    oldProductId: 'prod_RzVU0Y8RwlXgZM',
    oldPriceId: 'price_1R5WTjRvXVt1661QLfaiQjDm'
  },
  {
    id: '85e05cbc-de9f-46e9-b563-678e20b5cc5a',
    name: 'Premium',
    description: 'Plano premium com todos os recursos',
    price: 3990, // R$ 39.90 em centavos
    oldProductId: 'prod_RzVU2NMfhZQ6OW',
    oldPriceId: 'price_1R5WTkRvXVt1661QtrBGt9Tc'
  }
];

// Armazenar produtos criados para relatório final
const newProducts = [];

// Função para verificar produtos no Stripe
async function checkStripeProducts() {
  console.log('Verificando produtos do Stripe...');
  
  try {
    // Verificar se a conexão com o Stripe está funcionando
    console.log('Verificando conexão com o Stripe...');
    const products = await stripe.products.list({ limit: 100 });
    console.log(`Encontrados ${products.data.length} produtos no Stripe.`);
    
    // Verificar produtos existentes com os mesmos nomes
    const existingProductNames = products.data.map(product => product.name.toLowerCase());
    const duplicateNames = plans.filter(plan => 
      existingProductNames.includes(plan.name.toLowerCase())
    );
    
    if (duplicateNames.length > 0) {
      console.log('Os seguintes produtos já existem com o mesmo nome:');
      duplicateNames.forEach(plan => {
        console.log(`- ${plan.name}`);
      });
      console.log('Continuando mesmo assim (criará novos produtos)...');
    }
    
    // Criar produtos novos
    console.log('Iniciando criação de novos produtos...');
    await createStripeProducts();
    
    // Mostrar resumo
    console.log('\n===== RESUMO DOS PRODUTOS CRIADOS =====');
    console.log('Você precisará atualizar estes IDs no banco de dados:');
    newProducts.forEach(product => {
      console.log(`\nPlano: ${product.name}`);
      console.log(`- Novo ID do Produto: ${product.productId}`);
      console.log(`- Novo ID do Preço: ${product.priceId}`);
      console.log(`- ID interno: ${product.internalId}`);
    });
    
    // SQL para atualização
    if (newProducts.length > 0) {
      console.log('\n===== SQL PARA ATUALIZAÇÃO =====');
      const sqlUpdates = newProducts.map(product => 
        `UPDATE planos SET stripe_product_id = '${product.productId}', stripe_price_id = '${product.priceId}' WHERE id = '${product.internalId}';`
      );
      console.log(sqlUpdates.join('\n'));
    }
    
    console.log('\nVerificação concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao verificar produtos:', error);
    
    // Verificar se é um erro de autenticação
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️ ERRO DE AUTENTICAÇÃO DO STRIPE ⚠️');
      console.error('Verifique se a chave API está correta e se não contém caracteres invisíveis.');
      console.error('Dica: Tente copiar a chave diretamente do painel do Stripe novamente.');
    }
  }
}

// Função para criar todos os produtos
async function createStripeProducts() {
  try {
    console.log('Criando produtos e preços no Stripe...');
    
    for (const plan of plans) {
      await createProduct(plan);
    }
    
    console.log('Todos os produtos e preços foram criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar produtos:', error);
    throw error;
  }
}

// Função para criar um único produto e seu preço
async function createProduct(plan) {
  try {
    console.log(`Criando produto: ${plan.name}`);
    
    // Criar produto
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        internal_id: plan.id
      }
    });
    
    console.log(`Produto criado: ${product.id}`);
    
    // Criar preço para o produto
    console.log(`Criando preço para ${plan.name}: R$ ${(plan.price/100).toFixed(2)}`);
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'brl',
      recurring: {
        interval: 'month'
      },
      metadata: {
        internal_id: plan.id
      }
    });
    
    console.log(`Produto ${plan.name} criado com sucesso! Produto ID: ${product.id}, Preço ID: ${price.id}`);
    
    // Armazenar novo produto para relatório final
    newProducts.push({
      name: plan.name,
      productId: product.id,
      priceId: price.id,
      internalId: plan.id
    });
  } catch (error) {
    console.error(`Erro ao criar ${plan.name}:`, error);
    throw error;
  }
}

// Executar a verificação
checkStripeProducts(); 