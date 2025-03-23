// Script para recriar produtos do Stripe usando fetch
const apiKey = 'sk_test_51R5UY2RvXVt1661QzpxXn1JXxblpubjzhRMeNWg45Ck4tOty7i1c1HmNJc0hXJLQVXGRNhNxvN2OVUHXF1jV0U6300OmqbHePv';
const base64ApiKey = btoa(`${apiKey}:`);

// Dados dos planos a serem criados
const plans = [
  {
    id: '0b8a742e-228f-4c76-92e4-32f6cb737de1',
    name: 'Básico',
    description: 'Plano básico com recursos limitados',
    price: 100, // R$ 1.00 em centavos
    productId: 'prod_RzVUyy88KVqHA3',
    priceId: 'price_1R5WTiRvXVt1661Q84Zla8YN'
  },
  {
    id: 'e147dc1f-9a63-46c5-b4cb-3bad639c8162',
    name: 'Intermediário',
    description: 'Plano intermediário com mais recursos',
    price: 1000, // R$ 10.00 em centavos
    productId: 'prod_RzVUceVCXu4FAn',
    priceId: 'price_1R5WTjRvXVt1661QtZo3y15J'
  },
  {
    id: '8c8d495a-a9b8-40a6-a0da-57b1977ebc45',
    name: 'Avançado',
    description: 'Plano avançado com recursos estendidos',
    price: 1990, // R$ 19.90 em centavos
    productId: 'prod_RzVU0Y8RwlXgZM',
    priceId: 'price_1R5WTjRvXVt1661QLfaiQjDm'
  },
  {
    id: '85e05cbc-de9f-46e9-b563-678e20b5cc5a',
    name: 'Premium',
    description: 'Plano premium com todos os recursos',
    price: 3990, // R$ 39.90 em centavos
    productId: 'prod_RzVU2NMfhZQ6OW',
    priceId: 'price_1R5WTkRvXVt1661QtrBGt9Tc'
  }
];

// Função para verificar produtos existentes
async function checkProducts() {
  try {
    console.log('Verificando produtos do Stripe...');
    
    const response = await fetch('https://api.stripe.com/v1/products?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${base64ApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do Stripe: ${errorData.error?.message || 'Erro desconhecido'}`);
    }
    
    const data = await response.json();
    console.log(`Encontrados ${data.data.length} produtos no Stripe.`);
    
    if (data.data.length === 0) {
      console.log('Nenhum produto encontrado. Recriando produtos...');
      await createProducts();
    } else {
      console.log('Produtos encontrados:');
      data.data.forEach(product => {
        console.log(`- ${product.id}: ${product.name}`);
      });
      
      // Verificar produtos necessários
      const missingProducts = plans.filter(plan => 
        !data.data.some(product => product.id === plan.productId)
      );
      
      if (missingProducts.length > 0) {
        console.log(`${missingProducts.length} produtos necessários estão faltando. Criando...`);
        await createMissingProducts(missingProducts);
      } else {
        console.log('Todos os produtos necessários estão presentes!');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar produtos:', error.message);
  }
}

// Função para criar todos os produtos
async function createProducts() {
  try {
    console.log('Criando produtos e preços no Stripe...');
    
    for (const plan of plans) {
      await createProduct(plan);
    }
    
    console.log('Todos os produtos e preços foram criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar produtos:', error.message);
  }
}

// Função para criar produtos específicos que faltam
async function createMissingProducts(missingPlans) {
  try {
    for (const plan of missingPlans) {
      await createProduct(plan);
    }
  } catch (error) {
    console.error('Erro ao criar produtos faltantes:', error.message);
  }
}

// Função para criar um único produto e seu preço
async function createProduct(plan) {
  try {
    console.log(`Criando produto: ${plan.name}`);
    
    // Criar produto
    const productParams = new URLSearchParams();
    productParams.append('id', plan.productId);
    productParams.append('name', plan.name);
    productParams.append('description', plan.description);
    productParams.append('metadata[internal_id]', plan.id);
    
    const productResponse = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64ApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: productParams
    });
    
    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      throw new Error(`Erro ao criar produto: ${errorData.error?.message || 'Erro desconhecido'}`);
    }
    
    const product = await productResponse.json();
    console.log(`Produto criado: ${product.id}`);
    
    // Criar preço para o produto
    console.log(`Criando preço para ${plan.name}: R$ ${(plan.price/100).toFixed(2)}`);
    
    const priceParams = new URLSearchParams();
    priceParams.append('id', plan.priceId);
    priceParams.append('product', product.id);
    priceParams.append('unit_amount', plan.price);
    priceParams.append('currency', 'brl');
    priceParams.append('recurring[interval]', 'month');
    priceParams.append('metadata[internal_id]', plan.id);
    
    const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64ApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: priceParams
    });
    
    if (!priceResponse.ok) {
      const errorData = await priceResponse.json();
      throw new Error(`Erro ao criar preço: ${errorData.error?.message || 'Erro desconhecido'}`);
    }
    
    const price = await priceResponse.json();
    console.log(`Produto ${plan.name} criado com sucesso! Produto ID: ${product.id}, Preço ID: ${price.id}`);
  } catch (error) {
    console.error(`Erro ao criar ${plan.name}:`, error.message);
  }
}

// Executar a verificação dos produtos
checkProducts(); 