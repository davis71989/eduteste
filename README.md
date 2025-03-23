# EduPais - Integração com Stripe

## Configuração da Integração com Stripe

Para integrar o sistema de pagamentos com o Stripe, siga os passos abaixo:

### 1. Configuração de Ambiente

1. Certifique-se de que o arquivo `.env` contém as seguintes variáveis:

```
# Chaves do Stripe
VITE_STRIPE_PUBLIC_KEY=sua_chave_publica_do_stripe
STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
STRIPE_WEBHOOK_SECRET=seu_webhook_secret_do_stripe

# Configurações do Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase

VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 2. Configurar as Edge Functions do Supabase

As Edge Functions são responsáveis pela comunicação segura com a API do Stripe.

#### 2.1 Configurar Secrets no Supabase

Execute os seguintes comandos para configurar os segredos no Supabase:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
npx supabase secrets set STRIPE_WEBHOOK_SECRET=seu_webhook_secret_do_stripe
npx supabase secrets set BASE_URL=http://localhost:5173
```

#### 2.2 Implante as Edge Functions

```bash
npx supabase functions deploy stripe-create-checkout
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-cancel-subscription
```

### 3. Configurar Webhook do Stripe

1. No painel do Stripe, vá para a seção Developers > Webhooks
2. Adicione um endpoint: `https://sua-url-do-supabase.functions.supabase.co/stripe-webhook`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

### 4. Configurar Produtos e Preços

Para inicializar os produtos e preços no Stripe:

```bash
node scripts/stripe-setup.js
```

Este script:
1. Lê os planos do banco de dados Supabase
2. Cria produtos correspondentes no Stripe
3. Cria preços para cada produto
4. Atualiza os registros no Supabase com os IDs do Stripe

### 5. Fluxo de Pagamento

O fluxo de pagamento funciona da seguinte forma:

1. Usuário seleciona um plano e clica em "Assinar"
2. O sistema verifica se o ambiente é de desenvolvimento:
   - Em desenvolvimento: usa a simulação de checkout
   - Em produção: redireciona para o checkout do Stripe
3. Após o pagamento:
   - O Stripe envia um webhook para a Edge Function
   - A assinatura é atualizada no banco de dados
   - Os limites de uso são configurados para o usuário

### 6. Testes em Desenvolvimento

Em ambiente de desenvolvimento, use o simulador de checkout:
- Todo o fluxo de pagamento é simulado localmente
- As assinaturas são criadas diretamente no banco
- Use os status válidos: `ativa`, `cancelada`, `pendente` ou `trial`

#### 6.1 Ferramentas de Debug

Para facilitar o desenvolvimento e teste da integração com o Stripe, foram criadas as seguintes ferramentas:

1. **Página de Debug** - Acesse `http://localhost:5187/pagamento/debug` para:
   - Testar a criação de sessões de checkout
   - Visualizar informações do cliente e planos
   - Simular eventos de webhook

2. **Script de Configuração**:
   ```bash
   node scripts/setup-stripe-test.js
   ```
   Este script verifica e configura o ambiente de teste, incluindo:
   - Verificação do Stripe CLI
   - Validação das variáveis de ambiente
   - Configuração dos produtos e preços de teste

3. **Escutar Webhooks Localmente**:
   ```bash
   npm run stripe:webhook
   ```
   Este comando inicia o Stripe CLI no modo de escuta, encaminhando eventos do Stripe para seu ambiente local.

4. **Testar Eventos Específicos**:
   ```bash
   npm run stripe:test:checkout
   ```
   Executa o comando `stripe trigger checkout.session.completed` para simular um evento de checkout concluído.

#### 6.2 Modo de Desenvolvimento vs Produção

No componente `src/components/Planos/StripeCheckout.tsx`, existe uma variável `useStripeInDevMode`:
- Quando `false`: usa a simulação local em desenvolvimento
- Quando `true`: força o uso do Stripe mesmo em ambiente de desenvolvimento

### 7. Resolução de Problemas

Se encontrar problemas na integração:

1. Verifique os logs das Edge Functions:
```bash
npx supabase functions logs stripe-webhook --no-verify
```

2. Verifique os eventos no painel do Stripe > Developers > Events

3. Confirme que as chaves e segredos estão configurados corretamente

4. Verifique se os valores de status de assinatura estão de acordo com a constraint do banco de dados (ativa, cancelada, pendente, trial)

# Configuração do Stripe com Supabase Edge Functions

Este guia explica como configurar corretamente a integração entre Stripe e Supabase Edge Functions para processamento de pagamentos.

## Pré-requisitos

- Conta no [Stripe](https://stripe.com)
- Projeto no [Supabase](https://supabase.com)
- CLI do Supabase instalada: `npm install -g supabase`

## Configuração das Variáveis de Ambiente

### Importante: Evite o prefixo SUPABASE_

O Supabase não permite definir variáveis de ambiente com o prefixo `SUPABASE_`. Utilize nomes alternativos como `MY_SUPABASE_URL` em vez de `SUPABASE_URL`.

### Configurar Variáveis no Supabase

```bash
# Configurar chave do Stripe
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_sua_chave_aqui"
npx supabase secrets set VITE_STRIPE_PUBLIC_KEY="pk_test_sua_chave_publica_aqui"

# Configurar URL e chaves do Supabase (com prefixo alternativo)
npx supabase secrets set MY_SUPABASE_URL="https://seu-projeto.supabase.co"
npx supabase secrets set MY_SERVICE_ROLE_KEY="sua_service_role_key"

# Outras configurações
npx supabase secrets set SERVER_URL="http://localhost:5173"  # Em dev
npx supabase secrets set ENVIRONMENT="development"  # ou "production"
```

### Configurar Variáveis no .env Local

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
VITE_STRIPE_PUBLIC_KEY=pk_test_sua_chave_publica_aqui
```

## Implantação das Funções Edge

```bash
# Implantar função de checkout
npx supabase functions deploy stripe-create-checkout --no-verify-jwt

# Implantar função para obter chave pública
npx supabase functions deploy get-stripe-key --no-verify-jwt
```

## Logs e Depuração

Você pode verificar os logs das funções executando:

```bash
npx supabase functions logs stripe-create-checkout
```

## Estrutura do Projeto

```
├── supabase/
│   ├── functions/
│   │   ├── _shared/           # Código compartilhado entre funções
│   │   │   ├── config.ts      # Configurações e variáveis de ambiente
│   │   │   ├── cors.ts        # Tratamento de CORS
│   │   │   ├── stripe.ts      # Cliente do Stripe
│   │   │   └── supabase.types.ts  # Tipos do Supabase
│   │   ├── stripe-create-checkout/
│   │   │   └── index.ts       # Função para criar sessão de checkout
│   │   └── get-stripe-key/
│   │       └── index.ts       # Função para obter chave pública
├── src/
│   ├── components/
│   │   └── Checkout/
│   │       └── StripeCheckout.tsx  # Componente de checkout
│   └── lib/
│       ├── stripe/
│       │   └── config.ts      # Configuração do Stripe no frontend
│       └── supabase.ts        # Cliente do Supabase no frontend
```

## Solução de Problemas Comuns

1. **BOOT_ERROR (503 Service Unavailable)**: Verifique se todas as variáveis de ambiente estão configuradas corretamente.

2. **Erro de CORS**: Certifique-se de que os cabeçalhos CORS estejam configurados corretamente.

3. **Erro de Autenticação**: Confirme que o token JWT está sendo passado corretamente.

4. **Erro de Inicialização**: Verifique os logs para identificar problemas de importação ou sintaxe.

5. **Erro de Variáveis**: O Supabase não permite variáveis com prefixo `SUPABASE_`.

## Testando as Funções

```bash
# Testar get-stripe-key
curl -s https://seu-projeto.supabase.co/functions/v1/get-stripe-key
```

A resposta deve incluir a chave pública do Stripe. 