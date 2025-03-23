import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StripeCheckout } from '../components/Planos/StripeCheckout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  intervalo: string;
  tokens_limit: number;
  messages_limit: number;
  ativo: boolean;
}

export default function Planos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [intervalo, setIntervalo] = useState<'month' | 'year'>('month');
  const navigate = useNavigate();

  // Verificar se existe um parâmetro de sucesso na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sucesso = urlParams.get('sucesso');
    if (sucesso === 'true') {
      // Redirecionar para o dashboard
      navigate('/dashboard');
    }
  }, [navigate]);
  
  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .order('preco', { ascending: true });

        if (error) throw error;
        
        // Normalizar os intervalos para garantir compatibilidade
        const planosNormalizados = data?.map(plano => ({
          ...plano,
          intervalo: plano.intervalo === 'mensal' ? 'month' : 
                     plano.intervalo === 'anual' ? 'year' : 
                     plano.intervalo
        })) || [];
        
        setPlanos(planosNormalizados);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanos();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Escolha seu Plano</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-lg border">
              <Skeleton className="h-8 w-24 mb-4" />
              <Skeleton className="h-5 w-full mb-2" />
              <Skeleton className="h-8 w-32 mb-6" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-10 w-full mt-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Escolha seu Plano</h1>
      
      <Tabs 
        defaultValue="month" 
        className="w-full max-w-md mx-auto mb-8"
        onValueChange={(value) => setIntervalo(value as 'month' | 'year')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="month">Mensal</TabsTrigger>
          <TabsTrigger value="year">Anual</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planos
          .filter(plano => plano.intervalo === intervalo)
          .map((plano) => (
            <div key={plano.id} className="p-6 rounded-lg border border-border flex flex-col">
              <h3 className="text-xl font-semibold">{plano.nome}</h3>
              <p className="text-muted-foreground mb-4">{plano.descricao}</p>
              
              <div className="mb-6">
                <span className="text-3xl font-bold">
                  R$ {plano.preco.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              
              <div className="space-y-2 mb-6 flex-grow">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>{plano.tokens_limit} tokens/mês</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>{plano.messages_limit} mensagens/mês</span>
                </div>
                
                <h4 className="font-medium mt-4">Recursos:</h4>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Acesso Básico</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Suporte Email</span>
                </div>
                
                {plano.preco > 0 && (
                  <>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Materiais Avançados</span>
                    </div>
                  </>
                )}
                
                {plano.preco >= 19.90 && (
                  <>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Suporte Prioritário</span>
                    </div>
                  </>
                )}
                
                {plano.preco >= 39.90 && (
                  <>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Conteúdo Exclusivo</span>
                    </div>
                  </>
                )}
              </div>
              
              <StripeCheckout 
                planoId={plano.id} 
                precoPlano={plano.preco}
                nomePlano={plano.nome}
              />
            </div>
          ))}
      </div>
    </div>
  );
} 