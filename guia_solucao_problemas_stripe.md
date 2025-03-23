# Guia de Solução de Problemas - Integração Stripe e Supabase

Este guia contém instruções detalhadas para solucionar problemas comuns na integração entre Stripe e Supabase Edge Functions no EduPais.

## Problemas Identificados e Soluções

### 1. Problemas com CORS nas Edge Functions

O problema de CORS é um dos mais comuns ao utilizar Supabase Edge Functions, especialmente com cabeçalhos personalizados.

**Sintomas:**
- Erros no console: "Request blocked by CORS policy"
- Falha na execução de requisições OPTIONS (preflight)
- Cabeçalhos personalizados sendo rejeitados

**Solução:**
1. Atualize o arquivo `supabase/functions/_shared/cors.ts` para incluir todos os cabeçalhos necessários:
   ```typescript
   export const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, Content-Type, x-application-name',
     'Access-Control-Max-Age': '86400',
   };
   ```

2. Reimplante todas as funções que utilizam este arquivo compartilhado:
   ```bash
   cd supabase/functions
   npx supabase functions deploy get-stripe-key
   npx supabase functions deploy stripe-create-checkout
   npx supabase functions deploy stripe-webhook
   # ... outras funções ...
   ```

### 2. Problemas de Autenticação (401 Unauthorized)

**Sintomas:**
- Resposta 401 Unauthorized da Edge Function
- Mensagens como "Não autorizado" ou "Token inválido"

**Solução:**
1. Certifique-se de que o token está sendo atualizado antes da requisição:
   ```typescript
   const getAccessToken = async () => {
     try {
       // Refreshar o token antes de usá-lo
       await supabase.auth.refreshSession();
       const { data } = await supabase.auth.getSession();
       
       if (!data?.session?.access_token) {
         throw new Error('Sessão expirada ou inválida');
       }
       
       return data.session.access_token;
     } catch (err) {
       console.error('Erro ao obter token:', err);
       throw err;
     }
   };
   ```

2. Verifique se o cabeçalho de autorização está sendo enviado corretamente:
   ```typescript
   const response = await fetch(url, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${accessToken}`,
       'x-application-name': 'EduPais'
     },
     body: JSON.stringify(data)
   });
   ```

3. Na função Edge, verifique se a autenticação está sendo tratada adequadamente:
   ```typescript
   const authHeader = req.headers.get('Authorization') || '';
   const supabaseClient = createClient(
     Deno.env.get('SUPABASE_URL') || '',
     Deno.env.get('SUPABASE_ANON_KEY') || '',
     {
       global: {
         headers: { Authorization: authHeader }
       }
     }
   );
   
   const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
   
   if (authError || !user) {
     return new Response(
       JSON.stringify({ error: 'Não autorizado' }),
       { status: 401, headers: corsHeaders }
     );
   }
   ```

### 3. Problemas com Variáveis de Ambiente

**Sintomas:**
- Erro "Key not found" no Stripe
- API Key inválida ou inexistente

**Solução:**
1. Verifique se as variáveis de ambiente necessárias estão configuradas:
   ```bash
   npx supabase secrets list stripe-create-checkout
   ```

2. Configure as variáveis necessárias:
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Configure a variável BASE_URL para redirecionamentos corretos:
   ```bash
   npx supabase secrets set BASE_URL=http://localhost:5173
   ```

### 4. Produtos/Preços não encontrados no Stripe

**Sintomas:**
- Erro "No such price" ou "No such product"
- IDs de produtos/preços não correspondem aos existentes no Stripe

**Solução:**
1. Verifique se os produtos existem no Stripe:
   ```javascript
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   
   async function listProducts() {
     const products = await stripe.products.list();
     console.log(products.data);
   }
   
   listProducts();
   ```

2. Atualize o banco de dados com os IDs corretos:
   ```sql
   UPDATE planos 
   SET stripe_price_id = 'price_XXX', stripe_product_id = 'prod_XXX' 
   WHERE id = '1';
   ```

## Script de Diagnóstico

Utilize o script `test_cors_issue.js` para diagnosticar problemas com CORS e autenticação:

```bash
# Instale as dependências se necessário
npm install node-fetch @supabase/supabase-js

# Execute com suas credenciais
VITE_SUPABASE_ANON_KEY=eyJhbGciO... node test_cors_issue.js
```

## Verificação da Implementação da Função Edge

A função `stripe-create-checkout` deve:

1. Verificar o método HTTP e responder adequadamente ao preflight CORS
2. Autenticar o usuário
3. Obter o plano solicitado
4. Verificar se o plano tem um ID de preço Stripe válido
5. Criar ou recuperar o customer ID do usuário
6. Criar uma sessão de checkout
7. Registrar a assinatura como pendente
8. Retornar a URL de checkout

## Depuração de Problemas no Frontend

1. Abra o console do navegador (F12)
2. Observe a aba Network para verificar as requisições
3. Verifique se o status da resposta está correto
4. Analise os cabeçalhos de requisição e resposta
5. Verifique o corpo da resposta para mensagens de erro detalhadas

## Estratégia de Fallback

Se o problema persistir, implemente uma estratégia de fallback no componente StripeCheckout:

```typescript
// Tente o método direto primeiro
try {
  // Método principal...
} catch (directError) {
  console.error('Método principal falhou, tentando alternativa:', directError);
  
  // Método alternativo...
}
```

## Recursos Adicionais

- [Documentação do Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação do Stripe API](https://stripe.com/docs/api)
- [Guia de CORS para desenvolvedores](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) 