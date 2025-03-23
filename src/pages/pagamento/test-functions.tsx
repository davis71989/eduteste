import { SupabaseFunctionDebug } from '../../components/Stripe/SupabaseFunctionDebug';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Toaster } from '../../components/ui/toaster';

export default function TestFunctionsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Teste de Funções Edge</h1>
      <p className="text-gray-600 mb-6">
        Esta página permite testar as funções Edge do Supabase configuradas no projeto.
      </p>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
          <CardDescription>Diretrizes para testes de Funções Edge</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6 space-y-2">
            <li>As funções Edge devem estar publicadas no Supabase para funcionar.</li>
            <li>Os cabeçalhos de autenticação são necessários para funções que exigem autenticação de usuário.</li>
            <li>As funções Edge são executadas em ambiente serverless no Supabase, com suas próprias variáveis de ambiente.</li>
            <li>Os parâmetros devem ser enviados em formato JSON válido no campo de texto.</li>
            <li>Erros como CORS ou falhas de rede podem indicar problemas de configuração ou implantação.</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="mb-8">
        <SupabaseFunctionDebug />
      </div>
      
      <Toaster />
    </div>
  );
} 