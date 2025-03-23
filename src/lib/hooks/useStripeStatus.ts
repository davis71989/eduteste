import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Definição do enum movida para o componente que o utiliza
enum STRIPE_STATUS {
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

interface StripeStatusHook {
  status: STRIPE_STATUS;
  error: string | null;
  stripeKey: string | null;
}

export function useStripeStatus(): StripeStatusHook {
  const [status, setStatus] = useState<STRIPE_STATUS>(STRIPE_STATUS.INITIALIZING);
  const [error, setError] = useState<string | null>(null);
  const [stripeKey, setStripeKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeStripe() {
      if (!isMounted) return;
      
      try {
        setStatus(STRIPE_STATUS.CONNECTING);
        
        // Obter a chave pública do Stripe via função Edge
        const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
          ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1`
          : 'https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1';
        
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-application-name': 'EduPais'
        };
        
        // Adicionar token de autenticação se disponível
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${FUNCTIONS_URL}/get-stripe-key`, {
          method: 'GET',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao obter chave do Stripe: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.key) {
          throw new Error('Chave do Stripe não encontrada na resposta');
        }
        
        if (isMounted) {
          setStripeKey(data.key);
          setStatus(STRIPE_STATUS.CONNECTED);
          setError(null);
          console.log('Conexão com Stripe inicializada com sucesso');
        }
      } catch (err: any) {
        console.error('Erro ao inicializar Stripe:', err);
        if (isMounted) {
          setStatus(STRIPE_STATUS.ERROR);
          setError(err.message || 'Erro ao conectar com o Stripe');
        }
      }
    }

    initializeStripe();

    return () => {
      isMounted = false;
    };
  }, []);

  return { status, error, stripeKey };
} 