import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Toaster } from "../../components/ui/toaster";
import { useState } from "react";

export default function RecreateStripeProductsPage() {
  const [logs, setLogs] = useState<Array<{ message: string; type: 'info' | 'success' | 'error' }>>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Função para adicionar logs
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
  };

  // Função para verificar produtos existentes
  const checkProducts = async () => {
    setLoading(true);
    setStatus('Verificando produtos...');
    
    try {
      addLog('Iniciando verificação de produtos do Stripe...');
      
      // Solicitar a chave API
      const apiKey = prompt('Insira a chave secreta do Stripe (sk_test_...)');
      if (!apiKey) {
        throw new Error('Chave API não fornecida');
      }
      
      const base64ApiKey = btoa(`${apiKey}:`);
      
      addLog('Conectando à API do Stripe...');
      
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
      addLog(`Encontrados ${data.data.length} produtos no Stripe.`);
      
      if (data.data.length === 0) {
        addLog('Nenhum produto encontrado. Recriando produtos...', 'info');
        await createProducts(base64ApiKey);
      } else {
        addLog('Produtos encontrados:');
        data.data.forEach((product: any) => {
          addLog(`- ${product.id}: ${product.name}`);
        });
        
        // Verificar produtos necessários
        const missingProducts = plans.filter(plan => 
          !data.data.some((product: any) => product.id === plan.productId)
        );
        
        if (missingProducts.length > 0) {
          addLog(`${missingProducts.length} produtos necessários estão faltando. Criando...`, 'info');
          await createMissingProducts(missingProducts, base64ApiKey);
        } else {
          addLog('Todos os produtos necessários estão presentes!', 'success');
        }
      }
      
      setStatus('Verificação concluída com sucesso!');
    } catch (error: any) {
      addLog(`Erro: ${error.message}`, 'error');
      setStatus(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar todos os produtos
  const createProducts = async (base64ApiKey: string) => {
    try {
      addLog('Criando produtos e preços no Stripe...');
      
      for (const plan of plans) {
        await createProduct(plan, base64ApiKey);
      }
      
      addLog('Todos os produtos e preços foram criados com sucesso!', 'success');
    } catch (error: any) {
      addLog(`Erro ao criar produtos: ${error.message}`, 'error');
    }
  };

  // Função para criar produtos específicos que faltam
  const createMissingProducts = async (missingPlans: typeof plans, base64ApiKey: string) => {
    try {
      for (const plan of missingPlans) {
        await createProduct(plan, base64ApiKey);
      }
      addLog('Produtos faltantes criados com sucesso!', 'success');
    } catch (error: any) {
      addLog(`Erro ao criar produtos faltantes: ${error.message}`, 'error');
    }
  };

  // Função para criar um único produto e seu preço
  const createProduct = async (plan: typeof plans[0], base64ApiKey: string) => {
    try {
      addLog(`Criando produto: ${plan.name}`);
      
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
      addLog(`Produto criado: ${product.id}`);
      
      // Criar preço para o produto
      addLog(`Criando preço para ${plan.name}: R$ ${(plan.price/100).toFixed(2)}`);
      
      const priceParams = new URLSearchParams();
      priceParams.append('id', plan.priceId);
      priceParams.append('product', product.id);
      priceParams.append('unit_amount', plan.price.toString());
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
      addLog(`Produto ${plan.name} criado com sucesso! Produto ID: ${product.id}, Preço ID: ${price.id}`, 'success');
    } catch (error: any) {
      addLog(`Erro ao criar ${plan.name}: ${error.message}`, 'error');
      throw error;
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus(null);
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-primary">Recriação de Produtos do Stripe</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
            <CardDescription>
              Este utilitário verifica e recria os produtos do Stripe necessários para o funcionamento do sistema de assinaturas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Use esta ferramenta somente se os produtos do Stripe precisarem ser recriados.</p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={checkProducts} 
                disabled={loading}
                variant="default"
              >
                {loading ? "Processando..." : "Verificar Produtos do Stripe"}
              </Button>
              
              <Button
                onClick={clearLogs}
                variant="outline"
                disabled={logs.length === 0}
              >
                Limpar Logs
              </Button>
            </div>
            
            {status && (
              <div className={`mt-4 p-3 rounded-md ${
                status.startsWith('Erro') 
                  ? 'bg-red-100 text-red-800' 
                  : status.includes('sucesso') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
              }`}>
                {status}
              </div>
            )}
          </CardContent>
        </Card>
        
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border rounded-md p-4 max-h-96 overflow-y-auto font-mono text-sm">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`mb-1 ${
                      log.type === 'error' 
                        ? 'text-red-600' 
                        : log.type === 'success' 
                          ? 'text-green-600' 
                          : 'text-gray-700'
                    }`}
                  >
                    [{new Date().toLocaleTimeString()}] {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Toaster />
    </div>
  );
} 