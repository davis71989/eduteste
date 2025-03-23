import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { XCircle } from 'lucide-react';

export default function PagamentoCancelado() {
  const navigate = useNavigate();

  const voltarParaPlanos = () => {
    navigate('/planos');
  };

  return (
    <div className="container max-w-md mx-auto py-16">
      <Card className="border-red-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-700">Pagamento Cancelado</CardTitle>
          <CardDescription>
            O processo de pagamento foi interrompido ou não foi concluído
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Seu cartão não foi cobrado e nenhuma assinatura foi ativada.
          </p>
          <p className="text-sm text-muted-foreground">
            Se encontrou algum problema durante o processo de pagamento ou
            precisar de ajuda, entre em contato com nosso suporte.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={voltarParaPlanos} className="w-full" variant="eduBlue">
            Voltar para Planos
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 