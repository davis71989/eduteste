import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useToast } from '../ui/use-toast';
import { useStripeStatus } from '../../lib/hooks/useStripeStatus';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

// Lista de planos esperados
const expectedPlans = [
  'Básico',
  'Intermediário',
  'Avançado',
  'Premium'
];

// Definição do enum STRIPE_STATUS
export enum STRIPE_STATUS {
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

type EstadoPlano = {
  id: string;
  nome: string;
  stripeProductId?: string;
  stripePriceId?: string;
  existeNoBanco: boolean;
  existeNoStripe: boolean;
  carregando: boolean;
  erro?: string;
};

// Tipo para novos produtos criados
type NovoProduto = {
  nome: string;
  planoId: string;
  produtoId: string;
  precoId: string;
};

interface StripeProductCheckProps {
  expectedPlan: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function StripeProductCheck({ 
  expectedPlan, 
  children, 
  fallback = null 
}: StripeProductCheckProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const { user, refreshUser } = useAuth();
  const { status: stripeStatus } = useStripeStatus();

  useEffect(() => {
    // Verificação de plano só deve ocorrer se for um dos planos conhecidos
    if (!expectedPlans.includes(expectedPlan)) {
      console.error(`Plano desconhecido: ${expectedPlan}`);
      setLoading(false);
      setError(`Plano desconhecido: ${expectedPlan}`);
      return;
    }

    async function checkProduct() {
      try {
        setLoading(true);
        setError(null);

        // Verificar se o usuário está autenticado
        if (!user) {
          await refreshUser();
          if (!user) {
            setError('Usuário não autenticado');
            setLoading(false);
            return;
          }
        }

        // URL da função Edge do Supabase que verifica o produto
        const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
          ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1`
          : 'https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1';

        // Obter token de acesso
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.access_token) {
          console.error('Erro ao obter sessão:', sessionError);
          setError('Erro ao verificar seu plano. Por favor, faça login novamente.');
          setLoading(false);
          return;
        }

        // Verificar se o produto está disponível para o usuário
        const response = await fetch(`${FUNCTIONS_URL}/check-stripe-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'x-application-name': 'EduPais'
          },
          body: JSON.stringify({ planName: expectedPlan })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro ${response.status} ao verificar produto:`, errorText);
          
          // Se for erro 401, tentar atualizar a sessão
          if (response.status === 401) {
            await refreshUser();
            setError('Verifique sua autenticação e tente novamente.');
          } else {
            setError(`Erro ao verificar acesso ao plano ${expectedPlan}`);
          }
          
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Resposta da verificação de produto:', data);

        if (data.hasAccess) {
          setHasAccess(true);
        } else {
          console.log(`Usuário não tem acesso ao plano ${expectedPlan}`);
          setHasAccess(false);
        }
      } catch (err: any) {
        console.error('Erro ao verificar produto:', err);
        setError(err.message || 'Erro desconhecido ao verificar plano');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    if (stripeStatus === STRIPE_STATUS.CONNECTED) {
      checkProduct();
    } else if (stripeStatus === STRIPE_STATUS.ERROR) {
      setLoading(false);
      setError('Erro ao conectar com o Stripe');
    }
  }, [expectedPlan, stripeStatus, user, refreshUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('Erro em StripeProductCheck:', error);
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
        <p>Erro ao verificar acesso ao plano.</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Renderiza o conteúdo filho se o usuário tiver acesso, ou o conteúdo alternativo se não
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

export function StripeProductCheckOld() {
  const [planos, setPlanos] = useState<EstadoPlano[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [verificandoStripe, setVerificandoStripe] = useState(false);
  const [produtosNovos, setProdutosNovos] = useState<NovoProduto[]>([]);
  const [stripeKey, setStripeKey] = useState('');
  const [stripeKeyObtida, setStripeKeyObtida] = useState(false);

  const { toast } = useToast();

  // Função para carregar dados do banco
  const carregarPlanos = useCallback(async () => {
    setCarregando(true);
    try {
      // Inicializar com os planos esperados
      const planosIniciais = expectedPlans.map(plano => ({
        id: plano,
        nome: plano,
        existeNoBanco: false,
        existeNoStripe: false,
        carregando: true
      }));
      
      setPlanos(planosIniciais);

      // Buscar planos do banco
      const { data: planosDB, error } = await supabase
        .from('planos')
        .select('id, nome, stripe_product_id, stripe_price_id');

      if (error) {
        throw new Error(`Erro ao buscar planos: ${error.message}`);
      }

      // Atualizar estado com dados do banco
      setPlanos(planosAntigos => 
        planosAntigos.map(plano => {
          const planoDB = planosDB?.find((p: { id: string }) => p.id === plano.id);
          return {
            ...plano,
            existeNoBanco: !!planoDB,
            stripeProductId: planoDB?.stripe_product_id || undefined,
            stripePriceId: planoDB?.stripe_price_id || undefined,
            carregando: true
          };
        })
      );

      // Buscar chave do Stripe da função Edge
      await buscarStripeKey();
      
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        variant: "destructive",
        title: 'Erro ao carregar planos',
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  // Buscar chave do Stripe da função Edge
  const buscarStripeKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-key`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao obter chave do Stripe: ${error}`);
      }
      
      const result = await response.json();
      if (result.key) {
        setStripeKey(result.key);
        setStripeKeyObtida(true);
      } else {
        throw new Error('Chave do Stripe não encontrada na resposta');
      }
    } catch (error) {
      console.error('Erro ao obter chave do Stripe:', error);
      toast({
        variant: "destructive",
        title: 'Erro ao obter chave do Stripe',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  // Verificar produtos no Stripe
  const verificarProdutosStripe = useCallback(async () => {
    if (!stripeKeyObtida || !stripeKey) {
      toast({
        variant: "destructive",
        title: 'Chave do Stripe não disponível',
        description: 'A chave do Stripe não foi obtida. Tente recarregar a página.',
      });
      return;
    }

    setVerificandoStripe(true);
    setProdutosNovos([]);

    try {
      // Atualizar estado para indicar verificação
      setPlanos(planosAntigos => 
        planosAntigos.map(plano => ({
          ...plano,
          carregando: true,
          existeNoStripe: false,
          erro: undefined
        }))
      );

      // Para cada plano, verificar se existe no Stripe
      for (const plano of planos) {
        if (!plano.stripeProductId || !plano.stripePriceId) {
          // Se não tiver IDs do Stripe, marcar como não existente
          setPlanos(planosAntigos => 
            planosAntigos.map(p => 
              p.id === plano.id 
                ? { ...p, existeNoStripe: false, carregando: false }
                : p
            )
          );
          continue;
        }

        try {
          // Verificar produto no Stripe
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('Usuário não autenticado');
          }
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-stripe-product`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ 
              productId: plano.stripeProductId,
              priceId: plano.stripePriceId
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
          }
          
          const result = await response.json();

          // Atualizar estado do plano
          setPlanos(planosAntigos => 
            planosAntigos.map(p => 
              p.id === plano.id 
                ? { 
                    ...p, 
                    existeNoStripe: result.exists, 
                    carregando: false,
                    erro: result.exists ? undefined : 'Produto não encontrado no Stripe'
                  }
                : p
            )
          );
        } catch (error) {
          console.error(`Erro ao verificar plano ${plano.nome}:`, error);
          
          // Atualizar estado com erro
          setPlanos(planosAntigos => 
            planosAntigos.map(p => 
              p.id === plano.id 
                ? { 
                    ...p, 
                    existeNoStripe: false, 
                    carregando: false,
                    erro: error instanceof Error ? error.message : 'Erro desconhecido'
                  }
                : p
            )
          );
        }
      }
    } catch (error) {
      console.error('Erro ao verificar produtos no Stripe:', error);
      toast({
        variant: "destructive",
        title: 'Erro ao verificar produtos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setVerificandoStripe(false);
    }
  }, [planos, stripeKeyObtida, stripeKey, toast]);

  // Recriar produtos no Stripe
  const recriarProdutos = async () => {
    if (!stripeKeyObtida || !stripeKey) {
      toast({
        variant: "destructive",
        title: 'Chave do Stripe não disponível',
        description: 'A chave do Stripe não foi obtida. Tente recarregar a página.',
      });
      return;
    }

    if (!confirm('ATENÇÃO: Esta ação irá criar NOVOS produtos no Stripe com NOVOS IDs. Você precisará atualizar esses IDs no banco de dados depois. Deseja continuar?')) {
      return;
    }

    setVerificandoStripe(true);
    setProdutosNovos([]);

    try {
      // Obter a sessão para autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Para cada plano, criar um novo produto no Stripe
      for (const plano of planos.filter(p => p.existeNoBanco)) {
        try {
          // Atualizar estado para indicar processamento
          setPlanos(planosAntigos => 
            planosAntigos.map(p => 
              p.id === plano.id 
                ? { ...p, carregando: true, erro: undefined }
                : p
            )
          );

          // Encontrar dados do plano esperado
          const planoEsperado = expectedPlans.find(p => p === plano.nome);
          if (!planoEsperado) {
            throw new Error('Dados do plano não encontrados');
          }

          // Criar produto no Stripe
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-product`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ 
              nome: planoEsperado,
              descricao: planoEsperado,
              preco: planoEsperado,
              planoId: plano.id
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
          }
          
          const result = await response.json();

          // Adicionar o novo produto à lista
          setProdutosNovos(produtos => [
            ...produtos,
            {
              nome: planoEsperado,
              planoId: plano.id,
              produtoId: result.productId,
              precoId: result.priceId
            }
          ]);

          // Atualizar estado do plano
          setPlanos(planosAntigos => 
            planosAntigos.map(p => 
              p.id === plano.id 
                ? { 
                    ...p, 
                    carregando: false,
                    erro: undefined
                  }
                : p
            )
          );
        } catch (error) {
          console.error(`Erro ao criar plano ${plano.nome}:`, error);
          
          // Atualizar estado com erro
          setPlanos(planosAntigos => 
            planosAntigos.map(p => 
              p.id === plano.id 
                ? { 
                    ...p, 
                    carregando: false,
                    erro: error instanceof Error ? error.message : 'Erro desconhecido'
                  }
                : p
            )
          );
        }
      }

      // Se produtos foram criados com sucesso, mostrar mensagem
      if (produtosNovos.length > 0) {
        toast({
          title: 'Produtos criados com sucesso',
          description: `${produtosNovos.length} produtos foram criados no Stripe. Use o SQL gerado para atualizar o banco de dados.`,
        });
      }
    } catch (error) {
      console.error('Erro ao recriar produtos no Stripe:', error);
      toast({
        variant: "destructive",
        title: 'Erro ao recriar produtos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setVerificandoStripe(false);
    }
  };

  // Gerar SQL para atualização dos IDs
  const gerarSQL = () => {
    if (produtosNovos.length === 0) return '';

    return produtosNovos.map(produto => 
      `UPDATE planos SET stripe_product_id = '${produto.produtoId}', stripe_price_id = '${produto.precoId}' WHERE id = '${produto.planoId}';`
    ).join('\n');
  };

  // Executar SQL para atualização dos IDs
  const executarSQL = async () => {
    if (produtosNovos.length === 0) {
      toast({
        variant: "destructive",
        title: 'Nenhum produto novo',
        description: 'Não há produtos novos para atualizar no banco de dados.',
      });
      return;
    }

    if (!confirm('Esta ação irá atualizar os IDs do Stripe no banco de dados. Deseja continuar?')) {
      return;
    }

    setCarregando(true);

    try {
      for (const produto of produtosNovos) {
        const { error } = await supabase
          .from('planos')
          .update({
            stripe_product_id: produto.produtoId,
            stripe_price_id: produto.precoId
          })
          .eq('id', produto.planoId);

        if (error) {
          throw new Error(`Erro ao atualizar plano ${produto.nome}: ${error.message}`);
        }
      }

      toast({
        title: 'IDs atualizados com sucesso',
        description: `${produtosNovos.length} planos foram atualizados no banco de dados.`,
      });

      // Limpar produtos novos e recarregar dados
      setProdutosNovos([]);
      await carregarPlanos();
    } catch (error) {
      console.error('Erro ao executar SQL:', error);
      toast({
        variant: "destructive",
        title: 'Erro ao atualizar IDs',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Carregar planos ao montar o componente
  useEffect(() => {
    carregarPlanos();
  }, [carregarPlanos]);

  // Status geral dos planos
  const todosPlanosExistemNoBanco = planos.every(plano => plano.existeNoBanco);
  const todosPlanosExistemNoStripe = planos.every(plano => plano.existeNoStripe);
  const algumPlanoPossuiErro = planos.some(plano => !!plano.erro);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Verificação de Produtos do Stripe</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={carregarPlanos}
              disabled={carregando}
            >
              {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Recarregar
            </Button>
            <Button 
              onClick={verificarProdutosStripe}
              disabled={verificandoStripe || carregando || !stripeKeyObtida}
            >
              {verificandoStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Verificar no Stripe
            </Button>
          </div>
        </div>

        {!stripeKeyObtida && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Chave do Stripe não disponível</AlertTitle>
            <AlertDescription>
              Não foi possível obter a chave do Stripe. Verifique se a função Edge 'get-stripe-key' está configurada corretamente.
            </AlertDescription>
          </Alert>
        )}

        {carregando ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {!todosPlanosExistemNoBanco && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Planos não encontrados no banco de dados</AlertTitle>
                <AlertDescription>
                  Alguns planos esperados não foram encontrados no banco de dados. Verifique a configuração dos planos.
                </AlertDescription>
              </Alert>
            )}

            {todosPlanosExistemNoBanco && !todosPlanosExistemNoStripe && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Produtos não encontrados no Stripe</AlertTitle>
                <AlertDescription>
                  Alguns produtos não foram encontrados no Stripe ou não puderam ser verificados. 
                  Você pode recriá-los clicando no botão "Recriar Produtos no Stripe".
                </AlertDescription>
              </Alert>
            )}

            {todosPlanosExistemNoBanco && todosPlanosExistemNoStripe && !algumPlanoPossuiErro && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Configuração válida</AlertTitle>
                <AlertDescription>
                  Todos os planos estão corretamente configurados no banco de dados e no Stripe.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <div className="grid grid-cols-5 items-center p-4 font-medium">
                <div>Nome</div>
                <div>Banco de Dados</div>
                <div>Stripe</div>
                <div>Produto ID</div>
                <div>Preço ID</div>
              </div>

              <ScrollArea className="h-[300px]">
                {planos.map(plano => (
                  <div key={plano.id} className="grid grid-cols-5 items-center border-t p-4">
                    <div className="font-medium">{plano.nome}</div>
                    <div>
                      {plano.existeNoBanco 
                        ? <span className="text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Sim</span>
                        : <span className="text-red-500 flex items-center"><AlertTriangle className="h-4 w-4 mr-1" /> Não</span>
                      }
                    </div>
                    <div>
                      {plano.carregando 
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : plano.existeNoStripe 
                          ? <span className="text-green-500 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Sim</span>
                          : <span className="text-red-500 flex items-center"><AlertTriangle className="h-4 w-4 mr-1" /> Não</span>
                      }
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={plano.stripeProductId || 'N/A'}>
                      {plano.stripeProductId || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={plano.stripePriceId || 'N/A'}>
                      {plano.stripePriceId || 'N/A'}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {todosPlanosExistemNoBanco && !todosPlanosExistemNoStripe && !verificandoStripe && (
              <div className="flex justify-end">
                <Button 
                  onClick={recriarProdutos}
                  disabled={carregando || !stripeKeyObtida}
                  variant="destructive"
                >
                  Recriar Produtos no Stripe
                </Button>
              </div>
            )}

            {produtosNovos.length > 0 && (
              <div className="space-y-4 mt-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Produtos criados com sucesso</AlertTitle>
                  <AlertDescription>
                    {produtosNovos.length} produtos foram criados no Stripe. Use o SQL abaixo para atualizar o banco de dados ou clique no botão "Atualizar Banco de Dados" para fazer isso automaticamente.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2">SQL para atualização:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {gerarSQL()}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={executarSQL}
                    disabled={carregando}
                  >
                    Atualizar Banco de Dados
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 