# Guia de Correção para Problemas de CORS com Funções Edge do Supabase

Este guia fornece uma solução passo a passo para resolver problemas de CORS (Cross-Origin Resource Sharing) ao utilizar as funções Edge do Supabase, especialmente no contexto da integração com o Stripe.

## Diagnóstico do Problema

O erro observado foi:

```
Access to fetch at 'https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1/stripe-create-checkout' from origin 'http://localhost:5173' has been blocked by CORS policy: Request header field x-application-name is not allowed by Access-Control-Allow-Headers in preflight response.
```

Este erro indica que a solicitação preflight CORS está sendo rejeitada porque o cabeçalho `x-application-name` não está incluído na lista de cabeçalhos permitidos pelas funções Edge.

## Solução Passo a Passo

### 1. Atualizar os Cabeçalhos CORS nas Funções Edge

1. Edite o arquivo `supabase/functions/_shared/cors.ts` para incluir todos os cabeçalhos necessários:

```typescript
// Configurações de CORS para as funções Edge do Supabase
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-length, accept, x-application-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}
```

2. Reimplante todas as funções Edge que utilizam este módulo compartilhado:

```bash
npx supabase functions deploy get-stripe-key
npx supabase functions deploy check-stripe-product
npx supabase functions deploy create-stripe-product
npx supabase functions deploy stripe-create-checkout
npx supabase functions deploy stripe-cancel-subscription
npx supabase functions deploy stripe-webhook
```

### 2. Atualizar o Componente StripeCheckout

Adapte o componente StripeCheckout para lidar com possíveis problemas de CORS:

```typescript
// Adicionar uma URL fixa para o endpoint de funções do Supabase
const FUNCTIONS_URL = 'https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1';

// Implementar uma fallback strategy para contornar problemas de CORS
if (error.message?.includes('Failed to send a request') || 
    error.message?.includes('blocked by CORS policy')) {
  // Tentar abordagem alternativa com fetch diretamente
  console.log('Tentando abordagem alternativa com fetch direto...');
  
  const directResponse = await fetch(`${FUNCTIONS_URL}/stripe-create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}` 
    },
    body: JSON.stringify({ planoId })
  });
  
  if (directResponse.ok) {
    const directData = await directResponse.json();
    if (directData.url) {
      // Processar resposta bem-sucedida
      window.location.href = directData.url;
      return;
    }
  }
}
```

### 3. Verificar as Variáveis de Ambiente

Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas para as funções Edge:

```bash
# Verifique a configuração existente
npx supabase secrets list stripe-create-checkout

# Configure as variáveis necessárias
npx supabase secrets set STRIPE_SECRET_KEY=sua_chave_secreta
npx supabase secrets set STRIPE_PUBLISHABLE_KEY=sua_chave_publica
npx supabase secrets set BASE_URL=https://seu-site.com
npx supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=sua_chave_anon
```

### 4. Monitorar os Logs de Erro

Implemente logs detalhados tanto no frontend quanto nas funções Edge para facilitar o diagnóstico:

```typescript
// No frontend
console.log('Iniciando checkout para plano:', planoId);
console.log('Resposta da função Edge:', response);

// Na função Edge
console.log(`Processando checkout para plano: ${plano.nome}, price_id: ${plano.stripe_price_id}`);
console.log(`Sessão de checkout criada: ${session.id}, URL: ${session.url}`);
```

Para visualizar os logs das funções Edge:

```bash
npx supabase functions logs stripe-create-checkout
```

## Problemas Comuns e Soluções

### 1. Erro "Request header field is not allowed"

**Problema**: Cabeçalhos específicos não estão permitidos na configuração CORS.

**Solução**: Adicione os cabeçalhos necessários à lista em `corsHeaders`.

### 2. Erro "Failed to send a request to the Edge Function"

**Problema**: Múltiplas causas possíveis, incluindo problemas de CORS ou funções não implantadas corretamente.

**Solução**: 
- Verifique se as funções foram implantadas com `npx supabase functions list`
- Confirme as variáveis de ambiente com `npx supabase secrets list function-name`
- Implemente uma estratégia de fallback no frontend

### 3. Funções Edge não respondem corretamente

**Problema**: Configuração incorreta ou erros internos nas funções.

**Solução**:
- Verifique os logs com `npx supabase functions logs function-name`
- Teste a função localmente com `npx supabase functions serve --no-verify-jwt`
- Atualize para a versão mais recente do CLI do Supabase com `npm install -g supabase`

## Recursos Adicionais

- [Documentação CORS do Supabase](https://supabase.com/docs/guides/functions/cors)
- [Guia de Funções Edge do Supabase](https://supabase.com/docs/guides/functions)
- [Documentação de Integração Stripe](https://stripe.com/docs/stripe-js/elements/quickstart)

Este guia deve ajudar a resolver a maioria dos problemas relacionados a CORS ao trabalhar com funções Edge do Supabase e integração com o Stripe. 