# Guia de Correção para Problemas de Integração com Stripe

## Diagnóstico do Problema

Identificamos que o erro "Erro ao processar checkout: Failed to send a request to the Edge Function" ocorria devido a uma combinação de fatores:

1. **Produtos inexistentes no Stripe**: Os IDs de produtos referenciados no banco de dados não existiam na conta Stripe.
2. **Problemas na implementação das funções Edge**: As funções não utilizavam a implementação correta da API Stripe e tinham tratamento de erros insuficiente.
3. **Problemas de CORS**: Os cabeçalhos CORS não estavam configurados corretamente em todas as respostas.
4. **Problemas na execução do curl no Windows**: Os scripts de teste usavam sintaxe incompatível com o Windows.

## Solução Implementada

Implementamos uma solução completa que inclui:

1. **Criação de novos produtos no Stripe**: Criamos novos produtos e preços na conta Stripe usando o script `stripe_fix_products.js`.
2. **Atualização dos IDs no banco de dados**: Criamos um script para atualizar os IDs dos produtos no banco de dados (`scripts/update-stripe-products.jsx`).
3. **Correção das funções Edge**: Atualizamos as funções com melhor tratamento de erros e configuração CORS adequada.
4. **Melhoria no frontend**: Adicionamos melhor tratamento de erros no componente `StripeCheckout`.

## Passo a passo para correção

### 1. Verifique a configuração do ambiente

Certifique-se de que as variáveis de ambiente estão corretamente configuradas:

```bash
# No arquivo .env.local ou como variáveis de ambiente do sistema
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
STRIPE_PUBLISHABLE_KEY=sua_chave_publica_do_stripe
BASE_URL=http://localhost:5173  # URL para redirecionamentos
```

Para as funções Edge do Supabase, configure as variáveis de ambiente:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
npx supabase secrets set STRIPE_PUBLISHABLE_KEY=sua_chave_publica_do_stripe
npx supabase secrets set BASE_URL=sua_url_base
npx supabase secrets set SUPABASE_URL=sua_url_do_supabase
npx supabase secrets set SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

### 2. Recrie ou verifique os produtos no Stripe

Execute o script para criar produtos no Stripe:

```bash
node stripe_fix_products.js
```

Isso criará os produtos necessários e gerará os IDs para atualização do banco de dados.

### 3. Atualize o banco de dados

Use o script `update-stripe-products.jsx` para atualizar os IDs no banco de dados:

```bash
# Configure as variáveis de ambiente necessárias
export NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
export SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

# Execute o script
node scripts/update-stripe-products.jsx
```

### 4. Implante as funções Edge corrigidas

Implante cada uma das funções Edge atualizadas para o Supabase:

```bash
npx supabase functions deploy get-stripe-key
npx supabase functions deploy check-stripe-product
npx supabase functions deploy create-stripe-product
npx supabase functions deploy stripe-create-checkout
```

### 5. Teste o fluxo de checkout

Após implementar todas as correções:

1. Faça login no sistema
2. Navegue até a página de planos
3. Clique em "Assinar Plano" para um dos planos disponíveis
4. Verifique se você é redirecionado corretamente para a página de checkout do Stripe

## Solução de problemas comuns

### 1. Erro "Failed to send a request to the Edge Function"

Este erro geralmente indica:

- As funções Edge não estão implantadas corretamente
- Existe um problema de CORS
- As variáveis de ambiente não estão configuradas

Verificações:
- Execute `npx supabase functions list` para confirmar que as funções estão implantadas
- Verifique os logs da função com `npx supabase functions logs stripe-create-checkout`
- Certifique-se de que os cabeçalhos CORS estão corretos em todas as respostas

### 2. Erro "Produto não encontrado" no Stripe

Isso indica que o ID do produto no banco de dados não corresponde a um produto existente na conta Stripe.

Verificações:
- Execute `node stripe_fix_products.js` e escolha a opção 1 para verificar os produtos existentes
- Compare os IDs com os armazenados na tabela `planos` do banco de dados
- Atualize os IDs no banco de dados se necessário

### 3. O checkout é criado, mas o usuário não é redirecionado

Verificações:
- Verifique se a resposta da função Edge contém a URL de redirecionamento
- Verifique se há erros no console do navegador
- Teste o redirecionamento manual usando a URL retornada pela função

## Monitoramento Contínuo

Após a correção, implemente um monitoramento contínuo:

1. **Logs das funções Edge**: Monitore os logs para detectar erros
2. **Webhooks do Stripe**: Configure webhooks para receber notificações em tempo real
3. **Testes periódicos**: Realize testes periódicos do fluxo de checkout

### Comandos úteis para monitoramento

```bash
# Verificar logs das funções
npx supabase functions logs stripe-create-checkout

# Verificar status das funções
npx supabase functions list
```

## Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Documentação do Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Guia de integração Stripe + Supabase](https://supabase.com/partners/integrations/stripe)

# Guia de Solução para o Problema de Checkout do Stripe

Este guia contém os passos para resolver o erro "A função Edge não conseguiu inicializar" que ocorre ao tentar processar um checkout no Stripe.

## Problema Identificado

A função Edge `stripe-create-checkout` está falhando com o erro BOOT_ERROR (503 Service Unavailable), indicando que não consegue inicializar. Isso ocorre porque algumas variáveis de ambiente necessárias não estão configuradas corretamente no Supabase.

## Solução Passo a Passo

### 1. Configurar Variáveis de Ambiente no Supabase

O Supabase não permite definir variáveis de ambiente com o prefixo `SUPABASE_`, por isso precisamos usar nomes alternativos:

```bash
# Execute estes comandos no terminal
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_51R5UY2RvXVt1661QzpxXnlJXxblpubjzhRMeNWg45Ck4tOty7ilc1HnMJc0hXJLQVXGRNhNxvN2OVUHXF1jV0U6300OmqbHePv"
npx supabase secrets set MY_SUPABASE_URL="https://vkcwgfrihmfdbouxigef.supabase.co"
npx supabase secrets set MY_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY3dnZnJpaG1mZGJvdXhpZ2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjE1OTkxNSwiZXhwIjoyMDU3NzM1OTE1fQ.HiGgRm_ndKdzy2p7QwVE36UxL57AA8dCi-mYoSZ7jtk"
npx supabase secrets set SERVER_URL="http://localhost:5173"
npx supabase secrets set ENVIRONMENT="development"
npx supabase secrets set VITE_STRIPE_PUBLIC_KEY="pk_test_51R5UY2RvXVt1661QUcLHMrje4FL2BNIaCt06NJsoQvvggGC4Ql11ADs5it8YAzDsWZMHrC8rQXwagNKP7Z3v7BCr00INmv8hye"
```

### 2. Atualizar Arquivos de Configuração da Função Edge

#### 2.1. Arquivo `config.ts`

Atualize o arquivo `supabase/functions/_shared/config.ts` para usar os novos nomes de variáveis:

```typescript
// Configurações compartilhadas entre funções Edge

// URL base para redirecionamentos após checkout
export const SERVER_URL = Deno.env.get('SERVER_URL') || 'http://localhost:5173';

// URL do Supabase para conexão com o banco de dados
export const SUPABASE_URL = Deno.env.get('MY_SUPABASE_URL') || '';

// Chave de service role do Supabase para operações privilegiadas
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('MY_SERVICE_ROLE_KEY') || '';

// Ambiente (development, staging, production)
export const ENVIRONMENT = Deno.env.get('ENVIRONMENT') || 'development';

// Configurações de debug
export const DEBUG = ENVIRONMENT === 'development';

// Função para log condicional no ambiente de desenvolvimento
export function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}
```

#### 2.2. Arquivo `stripe.ts`

Atualize o arquivo `supabase/functions/_shared/stripe.ts` para usar a variável de ambiente correta e adicionar mais logs:

```typescript
// Importar a biblioteca do Stripe para Deno
import Stripe from 'https://esm.sh/stripe@12.1.1?deno-std=0.177.0';
import { debugLog } from './config.ts';

// Obter a chave secreta do Stripe das variáveis de ambiente
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Verificar se a chave existe
if (!STRIPE_SECRET_KEY) {
  console.error('ERRO: Variável de ambiente STRIPE_SECRET_KEY não encontrada!');
} else {
  console.log('STRIPE_SECRET_KEY encontrada (primeiros 5 caracteres):', STRIPE_SECRET_KEY.substring(0, 5) + '...');
}

// Inicializar cliente do Stripe
export const stripe = new Stripe(STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

console.log('Cliente Stripe inicializado');
```

#### 2.3. Arquivo `cors.ts`

Atualize o arquivo `supabase/functions/_shared/cors.ts` para configurar corretamente os cabeçalhos CORS:

```typescript
// Headers para CORS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-application-name',
  'Access-Control-Max-Age': '86400',
};

// Função para lidar com requisições preflight CORS OPTIONS
export function handleCorsOptions(req: Request) {
  console.log('Tratando requisição OPTIONS para CORS preflight');
  
  // Se o método da requisição for OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('Enviando resposta para preflight CORS');
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders,
    });
  }
  
  return null; // Continuar com o processamento normal
}
```

### 3. Reimplantar as Funções Edge

Após fazer as alterações nos arquivos, reimplante as funções Edge:

```bash
npx supabase functions deploy stripe-create-checkout --no-verify-jwt
npx supabase functions deploy get-stripe-key --no-verify-jwt
```

### 4. Verificar os Logs e Testar

Consulte os logs das funções para verificar se elas estão funcionando corretamente:

```bash
curl -s https://vkcwgfrihmfdbouxigef.supabase.co/functions/v1/get-stripe-key
```

A resposta deve ser algo como:
```json
{"key":"pk_test_51R5UY2RvXVt1661QUcLHMrje4FL2BNIaCt06NJsoQvvggGC4Ql11ADs5it8YAzDsWZMHrC8rQXwagNKP7Z3v7BCr00INmv8hye","success":true}
```

## Problemas Comuns e Soluções

1. **Erro CORS**: Configure os cabeçalhos CORS corretamente.
2. **Erro de autenticação**: Verifique se está utilizando os tokens JWT corretos.
3. **Erro de variáveis de ambiente**: O Supabase não permite variáveis com prefixo `SUPABASE_`.
4. **Erro de inicialização da função**: Verifique os logs para identificar problemas de importação ou sintaxe.

## Verificação Final

Após implementar todas essas alterações, o checkout do Stripe deve funcionar corretamente, permitindo que os usuários assinem planos sem problemas. 