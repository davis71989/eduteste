import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/badge';

/**
 * Componente para depuração do Stripe
 * Exibe informações sobre o estado atual de integração com o Stripe
 * e permite testar funcionalidades específicas
 */
export function StripeDebug() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeMode, setStripeMode] = useState<'desenvolvimento' | 'teste' | 'produção'>('desenvolvimento');

  useEffect(() => {
    fetchData();
    
    // Determinar o modo do Stripe
    if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
      if (import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_test_')) {
        setStripeMode('teste');
      } else if (import.meta.env.VITE_STRIPE_PUBLIC_KEY?.startsWith('pk_live_')) {
        setStripeMode('produção');
      } else {
        setStripeMode('desenvolvimento');
      }
    } else {
      setStripeMode('produção');
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        // Buscar assinaturas do usuário
        const { data: userAssinaturas, error: assinaturasError } = await supabase
          .from('assinaturas')
          .select('*, planos(*)')
          .eq('usuario_id', sessionData.session.user.id);
          
        if (assinaturasError) throw assinaturasError;
        
        setAssinaturas(userAssinaturas || []);
        setUserInfo(sessionData.session.user);
      }
      
      // Buscar todos os planos
      const { data: planosData, error: planosError } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true);
        
      if (planosError) throw planosError;
      
      setPlanos(planosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }
  
  // Testar trigger de webhook manualmente
  async function testWebhook(eventType: string) {
    try {
      alert(`Esta função simula um evento ${eventType} do Stripe.
      
Em um ambiente real, você usaria o CLI do Stripe para disparar eventos de teste:
stripe trigger ${eventType}

Ou usaria o Dashboard do Stripe para simular ações que disparariam eventos.`);
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
    }
  }
  
  // Limpar dados de teste do Stripe
  async function limparDadosTeste() {
    try {
      if (!confirm('Isso vai limpar todos os dados de teste relacionados ao Stripe. Continuar?')) {
        return;
      }
      
      if (!userInfo?.id) return;
      
      // Cancelar assinaturas ativas
      const { error: updateError } = await supabase
        .from('assinaturas')
        .update({ status: 'cancelada' })
        .eq('usuario_id', userInfo.id)
        .eq('status', 'ativa');
        
      if (updateError) throw updateError;
      
      await fetchData();
      alert('Dados de teste limpos com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
      alert('Erro ao limpar dados: ' + (error as Error).message);
    }
  }

  // Formatar status para exibição
  function formatarStatus(status: string) {
    const statusMap: Record<string, { label: string, variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' }> = {
      'ativa': { label: 'Ativa', variant: 'success' },
      'cancelada': { label: 'Cancelada', variant: 'destructive' },
      'pendente': { label: 'Pendente', variant: 'outline' },
      'trial': { label: 'Período de Teste', variant: 'secondary' },
    };
    
    return statusMap[status] || { label: status, variant: 'default' };
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug do Stripe</CardTitle>
          <CardDescription>
            Ferramenta para auxiliar testes e depuração da integração com o Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium mb-1">Modo do Stripe:</h3>
              <Badge 
                variant={stripeMode === 'desenvolvimento' ? 'outline' : stripeMode === 'teste' ? 'secondary' : 'default'}
              >
                {stripeMode}
              </Badge>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-1">Usuário:</h3>
              {userInfo ? (
                <p>{userInfo.email}</p>
              ) : (
                <p className="text-muted-foreground">Nenhum usuário logado</p>
              )}
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-1">Assinaturas:</h3>
              {assinaturas.length > 0 ? (
                <div className="space-y-2">
                  {assinaturas.map((assinatura) => (
                    <div key={assinatura.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{assinatura.planos?.nome || 'Plano não encontrado'}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {assinatura.id.substring(0, 8)}...
                          </p>
                        </div>
                        <Badge variant={formatarStatus(assinatura.status).variant as any}>
                          {formatarStatus(assinatura.status).label}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm">
                        <p>Checkout: {assinatura.stripe_checkout_session_id || 'N/A'}</p>
                        <p>Cliente: {assinatura.stripe_customer_id || 'N/A'}</p>
                        <p>Assinatura: {assinatura.stripe_subscription_id || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma assinatura encontrada</p>
              )}
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-1">Planos Disponíveis:</h3>
              {planos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {planos.map((plano) => (
                    <div key={plano.id} className="border p-2 rounded-md text-sm">
                      <p><span className="font-medium">{plano.nome}</span> - R$ {Number(plano.preco).toFixed(2)}</p>
                      <p className="text-muted-foreground text-xs">Product ID: {plano.stripe_product_id || 'N/A'}</p>
                      <p className="text-muted-foreground text-xs">Price ID: {plano.stripe_price_id || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum plano encontrado</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start space-y-2">
          <div className="flex space-x-2">
            <Button 
              onClick={() => testWebhook('checkout.session.completed')}
              variant="outline"
              size="sm"
            >
              Simular Checkout Concluído
            </Button>
            <Button 
              onClick={() => testWebhook('customer.subscription.updated')}
              variant="outline"
              size="sm"
            >
              Simular Atualização
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => testWebhook('customer.subscription.deleted')}
              variant="outline"
              size="sm"
            >
              Simular Cancelamento
            </Button>
            <Button 
              onClick={() => testWebhook('invoice.paid')}
              variant="outline"
              size="sm"
            >
              Simular Pagamento
            </Button>
          </div>
          <div className="mt-2">
            <Button 
              onClick={limparDadosTeste}
              variant="destructive"
              size="sm"
            >
              Limpar Dados de Teste
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 