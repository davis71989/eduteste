import { StripeDebug } from '../../components/Stripe/StripeDebug';
import { SupabaseFunctionDebug } from '../../components/Stripe/SupabaseFunctionDebug';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Toaster } from '../../components/ui/toaster';

export default function StripeDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Depuração do Stripe</h1>
      <p className="text-gray-600 mb-8">
        Esta página fornece ferramentas para testar e depurar a integração com o Stripe
      </p>
      
      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stripe">Testes do Stripe</TabsTrigger>
          <TabsTrigger value="functions">Funções Edge</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stripe" className="space-y-6">
          <StripeDebug />
        </TabsContent>
        
        <TabsContent value="functions" className="space-y-6">
          <SupabaseFunctionDebug />
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </div>
  );
} 