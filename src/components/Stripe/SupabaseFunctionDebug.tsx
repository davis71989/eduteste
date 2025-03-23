import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase';

type EdgeFunctionParams = {
  [key: string]: any;
};

export function SupabaseFunctionDebug() {
  const { toast } = useToast();
  const [functionName, setFunctionName] = useState('stripe-create-checkout');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [paramsText, setParamsText] = useState('{\n  "planoId": "0b8a742e-228f-4c76-92e4-32f6cb737de1"\n}');
  const [showAuthHeader, setShowAuthHeader] = useState(true);
  const [functionsAvailable, setFunctionsAvailable] = useState([
    'stripe-create-checkout',
    'stripe-webhook',
    'stripe-cancel-subscription',
    'process-ai-query'
  ]);

  // Validar e converter o texto de parâmetros para objeto JSON
  const getParamsObject = (): EdgeFunctionParams => {
    try {
      return JSON.parse(paramsText);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no formato JSON',
        description: 'Os parâmetros devem estar em formato JSON válido.'
      });
      return {};
    }
  };

  const testFunction = async () => {
    try {
      setLoading(true);
      setStatus('Preparando...');
      
      // Validar o nome da função
      if (!functionName) {
        throw new Error('Selecione uma função para testar');
      }
      
      // Obter os parâmetros como objeto JSON
      const params = getParamsObject();
      console.log(`Testando função ${functionName} com parâmetros:`, params);
      
      // Configurar cabeçalhos
      let headers: Record<string, string> = {};
      
      // Adicionar token de autenticação se necessário
      if (showAuthHeader) {
        setStatus('Obtendo token de autenticação...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError || !authData?.session?.access_token) {
          console.error('Erro de autenticação:', authError);
          console.log('Dados da sessão:', authData);
          throw new Error('Não foi possível obter o token de autenticação. Verifique se está logado.');
        }
        
        headers = {
          Authorization: `Bearer ${authData.session.access_token}`
        };
        
        console.log('Token de autenticação adicionado aos cabeçalhos:', 
          authData.session.access_token.substring(0, 15) + '...');
        console.log('Cookies disponíveis:', document.cookie.length > 0);
      }
      
      // Chamar a função Edge
      setStatus(`Enviando requisição para ${functionName}...`);
      const startTime = Date.now();
      
      console.log(`Invocando função Edge ${functionName} com body:`, params);
      console.log(`Cabeçalhos enviados:`, headers);

      // Tentar obter o URL da função
      try {
        const functionUrl = `https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1/${functionName}`;
        console.log('URL da função Edge (manual):', functionUrl);
      } catch (error) {
        console.log('Não foi possível determinar o URL da função');
      }

      const { data, error } = await supabase.functions.invoke(
        functionName,
        {
          body: params,
          headers
        }
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`Resposta de ${functionName} (${responseTime}ms):`, { data, error });
      
      if (error) {
        throw new Error(`Erro na função ${functionName}: ${error.message}`);
      }
      
      // Atualizar resultado e status
      setResult({
        data,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Sucesso!',
        description: `Função ${functionName} respondeu em ${responseTime}ms.`
      });
      
      setStatus('Requisição processada com sucesso');
    } catch (error: any) {
      console.error(`Erro ao testar função ${functionName}:`, error);
      
      setResult({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || `Falha ao chamar ${functionName}`
      });
      
      setStatus('Falha na requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Testar Função Edge</CardTitle>
          <CardDescription>Configure e teste funções Edge do Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="functionName">Nome da Função</Label>
            <Select
              value={functionName}
              onValueChange={setFunctionName}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {functionsAvailable.map((fn) => (
                  <SelectItem key={fn} value={fn}>
                    {fn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="params">Parâmetros (JSON)</Label>
            <Textarea
              id="params"
              value={paramsText}
              onChange={(e) => setParamsText(e.target.value)}
              className="font-mono h-36 resize-none"
              placeholder='{\n  "key": "value"\n}'
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="authHeader"
              checked={showAuthHeader}
              onChange={(e) => setShowAuthHeader(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="authHeader">Incluir cabeçalho de autenticação</Label>
          </div>
          
          <Button
            onClick={testFunction}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Executando...' : 'Testar Função'}
          </Button>
          
          {status && (
            <div className="mt-2 text-sm text-blue-600 font-medium">
              Status: {status}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
          <CardDescription>Resposta da Função Edge</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              {result.responseTime && (
                <div className="text-sm">
                  <span className="font-medium">Tempo de resposta:</span> {result.responseTime}
                </div>
              )}
              
              {result.timestamp && (
                <div className="text-sm">
                  <span className="font-medium">Timestamp:</span> {result.timestamp}
                </div>
              )}
              
              <div className="overflow-auto">
                <pre className="bg-gray-100 p-4 rounded-md text-sm max-h-[300px] overflow-auto">
                  {JSON.stringify(result.data || result.error || result, null, 2)}
                </pre>
              </div>
              
              {result.data?.url && (
                <Button
                  className="w-full"
                  onClick={() => window.open(result.data.url, '_blank')}
                >
                  Abrir URL de Resposta
                </Button>
              )}
            </div>
          ) : (
            <p className="text-gray-500">
              Envie uma requisição para ver o resultado aqui.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 