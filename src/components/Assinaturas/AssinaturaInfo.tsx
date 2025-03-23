import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from '../ui/use-toast';
import { AssinaturaInfo, cancelarAssinatura, obterInfoAssinatura } from '../../lib/stripe/verificaAssinatura';
import { supabase } from '../../lib/supabase';

interface AssinaturaInfoProps {
  userId: string;
  onAssinaturaChange?: () => void;
}

export default function AssinaturaInfoCard({ userId, onAssinaturaChange }: AssinaturaInfoProps) {
  const [assinatura, setAssinatura] = useState<AssinaturaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    const carregarAssinatura = async () => {
      setLoading(true);
      try {
        const infoAssinatura = await obterInfoAssinatura(userId);
        setAssinatura(infoAssinatura);
      } catch (error) {
        console.error('Erro ao carregar informações da assinatura:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as informações da sua assinatura',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    carregarAssinatura();
  }, [userId]);

  const handleCancelarAssinatura = async () => {
    if (!assinatura?.stripe_subscription_id) return;
    
    setCancelando(true);
    try {
      const resultado = await cancelarAssinatura(assinatura.stripe_subscription_id);
      
      if (resultado.success) {
        toast({
          title: 'Sucesso',
          description: resultado.message,
        });
        
        // Recarregar informações da assinatura
        const infoAssinatura = await obterInfoAssinatura(userId);
        setAssinatura(infoAssinatura);
        
        if (onAssinaturaChange) {
          onAssinaturaChange();
        }
      } else {
        toast({
          title: 'Erro',
          description: resultado.error || 'Ocorreu um erro ao cancelar sua assinatura',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação',
        variant: 'destructive',
      });
    } finally {
      setCancelando(false);
    }
  };

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'N/A';
    
    try {
      return format(new Date(dataStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const obterCorBadgeStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500';
      case 'trial':
        return 'bg-blue-500';
      case 'cancel_pending':
        return 'bg-yellow-500';
      case 'cancelado':
        return 'bg-red-500';
      case 'inadimplente':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const obterTextoStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'trial':
        return 'Período de teste';
      case 'cancel_pending':
        return 'Cancelamento pendente';
      case 'cancelado':
        return 'Cancelado';
      case 'inadimplente':
        return 'Inadimplente';
      case 'não pago':
        return 'Não pago';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Informações da Assinatura</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!assinatura) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Informações da Assinatura</CardTitle>
          <CardDescription>Você ainda não possui uma assinatura ativa.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => window.location.href = '/planos'}>
            Ver planos disponíveis
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Sua Assinatura</CardTitle>
            <CardDescription>{assinatura.nome_plano}</CardDescription>
          </div>
          <Badge className={obterCorBadgeStatus(assinatura.status)}>
            {obterTextoStatus(assinatura.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Tokens restantes</span>
            <span>{assinatura.tokens_restantes}</span>
          </div>
          <Progress value={(assinatura.tokens_restantes / 100) * 100} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Mensagens restantes</span>
            <span>{assinatura.messages_restantes}</span>
          </div>
          <Progress value={(assinatura.messages_restantes / 100) * 100} className="h-2" />
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Data de início:</div>
            <div>{formatarData(assinatura.data_inicio)}</div>
            
            {assinatura.periodo_atual_inicio && (
              <>
                <div className="text-gray-500">Período atual:</div>
                <div>
                  {formatarData(assinatura.periodo_atual_inicio)} - {formatarData(assinatura.periodo_atual_fim)}
                </div>
              </>
            )}
            
            {assinatura.status === 'cancel_pending' && assinatura.periodo_atual_fim && (
              <>
                <div className="text-gray-500">Acesso até:</div>
                <div>{formatarData(assinatura.periodo_atual_fim)}</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.href = '/planos'}>
          Alterar plano
        </Button>
        
        {(assinatura.status === 'ativo' || assinatura.status === 'trial') && assinatura.stripe_subscription_id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={cancelando}>
                {cancelando ? 'Processando...' : 'Cancelar assinatura'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso aos recursos até o final do período atual.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelarAssinatura}>
                  Confirmar cancelamento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
} 