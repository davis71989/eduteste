import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2 } from 'lucide-react';
import { Toaster } from '../../components/ui/toaster';
import { createClient } from '@supabase/supabase-js';

// Cliente do Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

export default function SimuladoCheckout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [simulado, setSimulado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarSimulado() {
      if (!id) {
        setErro('ID do simulado não fornecido');
        setCarregando(false);
        return;
      }

      try {
        // Buscar dados do simulado
        const { data, error } = await supabase
          .from('simulados')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Simulado não encontrado');

        setSimulado(data);
      } catch (error: any) {
        console.error('Erro ao carregar simulado:', error);
        setErro(error.message || 'Erro ao carregar simulado');
      } finally {
        setCarregando(false);
      }
    }

    carregarSimulado();
  }, [id]);

  const handlePagamento = async () => {
    if (!simulado) return;
    
    setCarregando(true);

    try {
      // Implementar checkout para o simulado
      // Redirecionar para checkout do Stripe
      // Este é apenas um exemplo, a implementação real depende da estrutura do seu backend
      
      // Após integração com Stripe, descomentar esta linha:
      // window.location.href = checkoutUrl;
      
      // Por enquanto, apenas redirecionar para sucesso após 2 segundos
      setTimeout(() => {
        navigate('/pagamento/sucesso');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      setErro(error.message || 'Erro ao processar pagamento');
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="container mx-auto p-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{erro}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/simulado')}>Voltar para Simulados</Button>
          </CardFooter>
        </Card>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Checkout do Simulado</CardTitle>
          <CardDescription>Finalize a compra do seu simulado</CardDescription>
        </CardHeader>
        <CardContent>
          {simulado && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium">{simulado.titulo}</h3>
                <p className="text-sm text-muted-foreground">{simulado.descricao}</p>
              </div>
              <div className="flex justify-between">
                <span>Preço:</span>
                <span className="font-bold">R$ {(simulado.preco / 100).toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/simulado')}>
            Cancelar
          </Button>
          <Button onClick={handlePagamento} disabled={carregando}>
            {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalizar Compra
          </Button>
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  );
} 