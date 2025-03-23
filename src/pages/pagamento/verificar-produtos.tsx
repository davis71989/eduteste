import { StripeProductCheck } from "../../components/Stripe/StripeProductCheck";
import { Toaster } from "../../components/ui/toaster";

export default function VerificarProdutosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Verificação de Produtos do Stripe</h1>
      <p className="text-muted-foreground mb-8">
        Verifique e recrie os produtos do Stripe necessários para o sistema de pagamentos.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <StripeProductCheck />
      </div>
      
      <Toaster />
    </div>
  );
} 