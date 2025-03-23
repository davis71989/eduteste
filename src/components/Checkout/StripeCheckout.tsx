import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { toast } from '../ui/use-toast';
import { supabase } from '../../lib/supabase';
import { STRIPE_PUBLIC_KEY } from '../../lib/stripe/config';

interface CheckoutProps {
  planoId: string;
  nome: string;
  preco: number;
  intervalo: string;
  descricao: string;
  features: string[];
  trial?: boolean;
}

export default function StripeCheckout({ 
  planoId, 
  nome, 
  preco, 
  intervalo, 
  descricao, 
  features,
  trial = false
}: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      console.log("Iniciando processo de checkout para o plano:", planoId);

      // Verificar se o usuário está autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Erro ao obter usuário:", userError);
      }
      
      if (!user) {
        console.log("Usuário não autenticado, redirecionando para login");
        toast({
          title: "Erro",
          description: "Você precisa estar logado para assinar um plano",
          variant: "destructive"
        });
        navigate('/login', { state: { returnUrl: window.location.pathname } });
        return;
      }

      console.log("Usuário autenticado:", user.id);

      // Buscar o plano do banco de dados para obter o stripe_price_id
      console.log("Buscando informações do plano:", planoId);
      const { data: plano, error: planoError } = await supabase
        .from('planos')
        .select('stripe_price_id')
        .eq('id', planoId)
        .single();

      if (planoError) {
        console.error("Erro ao buscar plano:", planoError);
      }

      if (planoError || !plano?.stripe_price_id) {
        console.log("Plano não encontrado ou sem stripe_price_id");
        toast({
          title: "Erro",
          description: "Não foi possível carregar as informações do plano",
          variant: "destructive"
        });
        return;
      }

      console.log("Plano encontrado, stripe_price_id:", plano.stripe_price_id);

      // Chamar endpoint para criar a sessão de checkout
      console.log("Chamando função Edge stripe-create-checkout");
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('stripe-create-checkout', {
        body: {
          priceId: plano.stripe_price_id,
          planoId,
          trial
        }
      });

      if (checkoutError) {
        console.error("Erro na função Edge:", checkoutError);
      }

      if (checkoutError || !checkoutData?.url) {
        console.log("Falha ao criar sessão de checkout", checkoutData, checkoutError);
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o checkout. Por favor, tente novamente mais tarde.",
          variant: "destructive"
        });
        return;
      }

      console.log("Sessão de checkout criada com sucesso, URL:", checkoutData.url);

      // Redirecionar para a página de checkout do Stripe
      window.location.href = checkoutData.url;
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{nome}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
        <div className="mt-4">
          <span className="text-3xl font-bold">{formatPreco(preco)}</span>
          <span className="text-gray-500 ml-1">/{intervalo === 'mensal' ? 'mês' : 'ano'}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-green-500 mr-2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubscribe} 
          className="w-full" 
          disabled={loading}
        >
          {loading ? "Processando..." : trial ? "Iniciar Trial Grátis" : "Assinar Agora"}
        </Button>
      </CardFooter>
    </Card>
  );
} 