import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Toaster } from '../../components/ui/toaster';
import { useToast } from '../../components/ui/use-toast';
import { supabase } from '../../lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

export default function TestEdgeFunctionPage() {
  const { toast } = useToast();
  const [planoId, setPlanoId] = useState('mensal');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testEdgeFunction = async () => {
    try {
      setLoading(true);
      setStatus('Obtendo sessão de autenticação...');
      setDebugInfo(null);
      
      // Obter um token de acesso fresco para autenticação
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setDebugInfo({ authError });
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!authData?.session?.access_token) {
        setDebugInfo({ authData });
        throw new Error('Sessão de autenticação inválida. Tente fazer login novamente.');
      }
      
      setStatus('Verificando usuário atual...');
      
      // Obter dados do usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        setDebugInfo({ userError, userData });
        throw new Error('Não foi possível obter dados do usuário atual');
      }
      
      const userEmail = userData.user.email;
      const userId = userData.user.id;
      
      setDebugInfo({
        ...debugInfo,
        user: {
          id: userId,
          email: userEmail,
          tokenLength: authData.session.access_token.length
        }
      });
      
      setStatus('Enviando requisição para Edge Function...');
      console.log('Enviando requisição para Edge Function com planoId:', planoId);
      console.log('Token de acesso disponível:', !!authData.session.access_token);
      
      // Criar cabeçalhos com token explícito
      const headers = {
        Authorization: `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      };
      
      setDebugInfo({
        ...debugInfo,
        headers: {
          Authorization: `Bearer ${authData.session.access_token.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Cabeçalhos da requisição:', headers);
      
      // Registrar momento do início da chamada
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke(
        'stripe-create-checkout',
        {
          body: { planoId },
          headers
        }
      );
      
      // Calcular tempo de resposta
      const responseTime = Date.now() - startTime;
      
      console.log(`Resposta da Edge Function (${responseTime}ms):`, { data, error });
      
      setDebugInfo({
        ...debugInfo,
        responseTime,
        response: { data, error }
      });
      
      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }
      
      setResult(data);
      toast({
        title: 'Sucesso!',
        description: 'A Edge Function respondeu com sucesso.',
      });
      
      // Se houver uma URL de checkout, mostrar botão para acessá-la
      if (data?.url) {
        setStatus('URL de checkout gerada com sucesso!');
      } else {
        setStatus('A requisição foi bem-sucedida, mas não retornou uma URL de checkout.');
      }
    } catch (error: any) {
      console.error('Erro ao testar Edge Function:', error);
      setResult({ error: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Falha ao chamar a Edge Function',
      });
      setStatus('Falha ao conectar com a Edge Function');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Teste da Edge Function</h1>
      <p className="text-gray-600 mb-6">
        Esta página permite testar a Edge Function que cria uma sessão de checkout do Stripe.
      </p>
      
      <Alert className="mb-6">
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Para testar esta funcionalidade, certifique-se de que:
          <ul className="list-disc ml-6 mt-2">
            <li>Você está logado no sistema</li>
            <li>A função Edge <code>stripe-create-checkout</code> está publicada no Supabase</li>
            <li>As variáveis de ambiente do Stripe estão configuradas corretamente</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros</CardTitle>
            <CardDescription>Configure os parâmetros para teste</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="planoId">ID do Plano</Label>
                <Input 
                  id="planoId" 
                  value={planoId} 
                  onChange={(e) => setPlanoId(e.target.value)}
                  placeholder="ex: mensal, anual"
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={testEdgeFunction}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Enviando...' : 'Testar Edge Function'}
              </Button>
              
              {status && (
                <div className="mt-2 text-sm text-blue-600">
                  Status: {status}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>Resposta da Edge Function</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-[300px]">
                  {JSON.stringify(result, null, 2)}
                </pre>
                
                {result.url && (
                  <Button 
                    className="mt-4 w-full" 
                    onClick={() => window.open(result.url, '_blank')}
                  >
                    Ir para Checkout
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Envie a requisição para ver o resultado aqui.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {debugInfo && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações de Depuração</CardTitle>
            <CardDescription>Detalhes técnicos para diagnóstico</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-[300px]">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      
      <Toaster />
    </div>
  );
} 