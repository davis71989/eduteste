import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assinatura, setAssinatura] = useState<any>(null);

  useEffect(() => {
    const verificarAssinatura = async () => {
      try {
        // Verificar se o usuário está logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Erro",
            description: "Você precisa estar logado para acessar esta página",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }

        // Buscar a última assinatura ativa do usuário
        const { data, error } = await supabase
          .from('assinaturas')
          .select(`
            id,
            status,
            plano_id,
            data_inicio,
            data_fim,
            planos (
              nome,
              descricao,
              preco,
              intervalo
            )
          `)
          .eq('usuario_id', user.id)
          .eq('status', 'ativo')
          .order('data_inicio', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Erro ao buscar assinatura:', error);
          return;
        }

        setAssinatura(data);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    verificarAssinatura();
  }, [navigate]);

  const irParaDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="border-green-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">Pagamento Confirmado!</CardTitle>
          <CardDescription>
            Sua assinatura foi ativada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assinatura ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Plano:</span>
                <span>{assinatura.planos?.nome || 'Plano'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Descrição:</span>
                <span>{assinatura.planos?.descricao || 'Assinatura ativa'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Valor:</span>
                <span>
                  {assinatura.planos?.preco
                    ? `R$ ${Number(assinatura.planos.preco).toFixed(2)}`
                    : '-'}/{assinatura.planos?.intervalo === 'mensal' ? 'mês' : 'ano'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Início:</span>
                <span>
                  {assinatura.data_inicio 
                    ? new Date(assinatura.data_inicio).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Próxima renovação:</span>
                <span>
                  {assinatura.data_fim
                    ? new Date(assinatura.data_fim).toLocaleDateString('pt-BR')
                    : '-'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Informações da assinatura não disponíveis.
              <br />
              Você pode verificar os detalhes no seu painel.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={irParaDashboard} className="w-full" variant="eduBlue">
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 