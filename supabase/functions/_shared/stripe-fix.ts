// Configuração do Stripe (versão corrigida)
import Stripe from 'https://esm.sh/stripe@12.16.0?target=deno';

// Chaves do Stripe
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51R5UXrRrfuwybnpzSYI5Cf28pJvZMNczdfvcL0cNIDE6GTQZpaebMUpv7qPlU2FJoAu0uklAIK8Oi4SMXpItAZOL00WefiyyBt';
export const STRIPE_SECRET_KEY = 'sk_test_51R5UXrRrfuwybnpzwZdxo87wjmClLUJykcAKMftgtqpx5EeOJqDHsLr4K8AQvbxbuUq4M7rHOM512rQ4AcLufogK00XbhTYgox';

// Configurações do produto
export const productConfig = {
  currency: 'brl',
  recurring: {
    interval: 'month'
  }
};

// Função para inicializar Stripe com manejo adequado de erros
export const getStripe = () => {
  try {
    // Criar uma instância do Stripe com a chave secreta
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    return stripe;
  } catch (error) {
    console.error('Erro ao inicializar Stripe:', error);
    throw new Error(`Falha ao inicializar Stripe: ${error.message}`);
  }
};

// Função para verificar se um produto existe
export async function verificarProduto(stripe: Stripe, produtoId: string) {
  try {
    const produto = await stripe.products.retrieve(produtoId);
    return { existe: true, produto };
  } catch (error) {
    if (error.statusCode === 404) {
      return { existe: false, erro: 'Produto não encontrado' };
    }
    throw error;
  }
}

// Função para verificar se um preço existe
export async function verificarPreco(stripe: Stripe, precoId: string) {
  try {
    const preco = await stripe.prices.retrieve(precoId);
    return { existe: true, preco };
  } catch (error) {
    if (error.statusCode === 404) {
      return { existe: false, erro: 'Preço não encontrado' };
    }
    throw error;
  }
}

// Função para criar um produto
export async function criarProduto(
  stripe: Stripe, 
  nome: string, 
  descricao: string, 
  metadata: Record<string, string> = {}
) {
  try {
    return await stripe.products.create({
      name: nome,
      description: descricao,
      metadata
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw new Error(`Falha ao criar produto: ${error.message}`);
  }
}

// Função para criar um preço
export async function criarPreco(
  stripe: Stripe, 
  produtoId: string, 
  valorCentavos: number, 
  metadata: Record<string, string> = {}
) {
  try {
    return await stripe.prices.create({
      product: produtoId,
      unit_amount: valorCentavos,
      currency: productConfig.currency,
      recurring: productConfig.recurring,
      metadata
    });
  } catch (error) {
    console.error('Erro ao criar preço:', error);
    throw new Error(`Falha ao criar preço: ${error.message}`);
  }
} 