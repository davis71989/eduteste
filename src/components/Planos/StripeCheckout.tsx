import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from '../../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface StripeCheckoutProps {
  planoId: string;
  precoPlano: number;
  nomePlano: string;
}

export function StripeCheckout({ planoId, precoPlano, nomePlano }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [userPlanStatus, setUserPlanStatus] = useState<'none' | 'current' | 'other'>(
    'none'
  );
  const [userPlanId, setUserPlanId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [planoCurrent, setPlanoAtual] = useState<{nome: string} | null>(null);
  const navigate = useNavigate();
  // Usar o contexto de autenticação
  const { user, refreshUser } = useAuth();
  
  // URL base do Supabase functions (garantindo que não tenha barra final)
  const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL 
    ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1` 
    : 'https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1';

  // Verificar se o usuário já possui o plano atual ou outro plano ativo
  useEffect(() => {
    const checkUserPlan = async () => {
      try {
        // Verificar se o usuário está logado usando o contexto de autenticação
        if (!user) {
          return;
        }

        // Buscar assinaturas ativas do usuário
        const { data: assinaturas, error } = await supabase
          .from('assinaturas')
          .select('id, plano_id, status')
          .eq('usuario_id', user.id)
          .eq('status', 'ativa');

        if (error) {
          console.error('Erro ao verificar assinaturas:', error);
          return;
        }

        if (assinaturas && assinaturas.length > 0) {
          // Verificar se alguma assinatura é do plano atual
          const assinaturaAtual = assinaturas.find(a => a.plano_id === planoId);
          if (assinaturaAtual) {
            setUserPlanStatus('current');
            setUserPlanId(assinaturaAtual.id);
          } else {
            // Usuário tem outro plano
            setUserPlanStatus('other');
            setUserPlanId(assinaturas[0].plano_id);
          }
        } else {
          setUserPlanStatus('none');
        }
      } catch (err) {
        console.error('Erro ao verificar status do plano:', err);
      }
    };

    checkUserPlan();
  }, [planoId, user]);

  const getAccessToken = async () => {
    try {
      // Verificar se o usuário está no contexto de autenticação
      if (!user) {
        // Tentar atualizar o usuário no contexto
        await refreshUser();
        if (!user) {
          throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
        }
      }
      
      // Obter a sessão atual
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.access_token) {
        console.error('Erro ao obter sessão:', error);
        
        // Tentar atualizar a sessão
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData?.session?.access_token) {
          console.error('Erro ao atualizar sessão:', refreshError);
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        
        console.log('Sessão atualizada com sucesso');
        return refreshData.session.access_token;
      }
      
      console.log('Token obtido com sucesso (primeiros 15 chars):', 
        data.session.access_token.substring(0, 15) + '...');
      
      return data.session.access_token;
    } catch (err) {
      console.error('Erro ao obter token de acesso:', err);
      throw new Error('Falha ao autenticar. Por favor, faça login novamente.');
    }
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário está logado
      if (!user) {
        // Tentar atualizar o usuário no contexto
        await refreshUser();
        if (!user) {
          toast({
            variant: 'destructive',
            title: 'Usuário não autenticado',
            description: 'É necessário estar logado para assinar um plano. Você será redirecionado para a página de login.',
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }
      }
      
      // Obter o token de acesso
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Não foi possível obter o token de acesso. Por favor, faça login novamente.');
      }
      
      console.log(`Iniciando checkout para plano: ${planoId}`);
      console.log(`URL da API de funções: ${FUNCTIONS_URL}/stripe-create-checkout`);
      
      // Tentativa com fetch direta
      try {
        console.log('Realizando requisição fetch para a função Edge...');
        
        const response = await fetch(`${FUNCTIONS_URL}/stripe-create-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-application-name': 'EduPais'
          },
          body: JSON.stringify({ planoId })
        });
        
        console.log('Status da resposta HTTP:', response.status, response.statusText);
        
        // Obter resposta como texto para depuração
        const responseText = await response.text();
        console.log('Resposta da função Edge (texto):', responseText);
        
        // Verificar se a resposta contém "BOOT_ERROR" (erro de inicialização da função)
        if (responseText.includes('BOOT_ERROR')) {
          throw new Error('A função Edge não conseguiu inicializar. Por favor, contate o suporte técnico.');
        }
        
        // Analisar resposta JSON se possível
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Erro ao analisar resposta JSON:', parseError);
          throw new Error(`Resposta inválida do servidor: ${responseText}`);
        }
        
        if (response.ok && responseData.url) {
          // Sucesso - redirecionar para a URL do Stripe
          toast({
            title: 'Redirecionando para o checkout',
            description: 'Você será redirecionado para a página de pagamento do Stripe',
          });
          
          window.location.href = responseData.url;
          return;
        } else {
          // Resposta com erro
          const errorMessage = responseData.error || 'Erro desconhecido';
          const errorDetails = responseData.details || '';
          
          console.error('Erro retornado pela API:', errorMessage, errorDetails);
          throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
        }
      } catch (fetchError) {
        console.error('Erro na chamada fetch:', fetchError);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Erro ao processar checkout:', error);
      
      // Verificar se é um erro específico da função Edge
      if (error.message.includes('BOOT_ERROR') || error.message.includes('Function failed to start')) {
        toast({
          variant: 'destructive',
          title: 'Erro no servidor',
          description: 'O serviço de pagamento está temporariamente indisponível. Por favor, tente novamente mais tarde ou contate o suporte.',
        });
        return;
      }
      
      // Verificar se é um erro de rede ou autenticação
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('Network error') ||
          error.message.includes('blocked by CORS policy')) {
        toast({
          variant: 'destructive',
          title: 'Erro de conexão',
          description: 'Não foi possível se conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
        });
      } else if (error.message.includes('Não autorizado') || 
                error.message.includes('Unauthorized') ||
                error.message.includes('401') ||
                error.message.includes('auth') ||
                error.message.includes('sessão expirada') ||
                error.message.includes('login')) {
        toast({
          variant: 'destructive',
          title: 'Erro de autenticação',
          description: 'Sua sessão expirou ou não foi possível autenticar. Por favor, faça login novamente.',
        });
        
        // Redirecionar para login, mas sem deslogar automaticamente para evitar problemas
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao processar checkout',
          description: error.message || 'Não foi possível iniciar o processo de pagamento',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Determinar texto e variante do botão com base no status do plano
  const getButtonText = () => {
    if (loading) return 'Processando...';
    
    if (userPlanStatus === 'current') {
      return 'Plano Atual';
    }
    
    if (precoPlano === 0) {
      return 'Ativar Plano Gratuito';
    }
    
    return userPlanStatus === 'other' ? 'Mudar para este Plano' : 'Assinar Plano';
  };

  const getButtonVariant = () => {
    if (userPlanStatus === 'current') return "outline";
    return precoPlano === 0 ? "eduGreen" : "eduBlue";
  };

  return (
    <>
      <Button 
        onClick={handleCheckout} 
        disabled={loading || userPlanStatus === 'current'}
        className="w-full"
        variant={getButtonVariant() as any}
      >
        {getButtonText()}
      </Button>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirmar mudança de plano</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              <p className="mb-3">
                Você já possui o plano <span className="font-semibold text-primary">{planoCurrent?.nome || 'atual'}</span> ativo.
              </p>
              <p>
                Ao assinar o plano <span className="font-semibold text-primary">{nomePlano}</span>, seu plano atual 
                será cancelado e os novos limites serão aplicados imediatamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              className="mt-2 sm:mt-0"
              onClick={() => {
                setShowConfirmDialog(false);
                setLoading(false);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90"
              onClick={async () => {
                setShowConfirmDialog(false);
                try {
                  if (!user) {
                    await refreshUser();
                  }
                  await handleCheckout();
                } catch (error) {
                  console.error('Erro ao processar checkout:', error);
                  toast({
                    variant: 'destructive',
                    title: 'Erro no checkout',
                    description: 'Não foi possível processar o checkout. Tente novamente mais tarde.',
                  });
                }
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 