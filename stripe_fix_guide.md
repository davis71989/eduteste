# Guia de Solução para Problemas de Autenticação e CORS com Stripe e Supabase Edge Functions

Este guia documenta as etapas para resolver os problemas de autenticação e CORS nas integrações com o Stripe usando Supabase Edge Functions.

## Problemas Identificados

1. **Múltiplas instâncias do GoTrueClient** - Causando conflitos na gestão da sessão de autenticação
2. **Erros 401 Unauthorized** - A função Edge não conseguia autenticar o usuário corretamente
3. **Problemas de CORS** - Cabeçalhos incorretos na comunicação entre frontend e backend
4. **Desconexão de sessão** - Usuário era deslogado ao tentar fazer checkout

## Soluções Implementadas

### 1. Correção do Componente StripeCheckout

O componente foi atualizado para:
- Usar o contexto de autenticação global
- Melhorar o tratamento de erros
- Implementar uma estratégia mais robusta para obtenção do token
- Evitar o logout automático em caso de erros

```tsx
// Código corrigido do StripeCheckout.tsx:
// - Usa o useAuth hook para acessar o usuário autenticado
// - Implementa tratamento robusto para obtenção de tokens
// - Melhora a recuperação de erros sem deslogar o usuário
// - Implementa logs detalhados para facilitar o diagnóstico
```

### 2. Correção da Função Edge `stripe-create-checkout`

A função foi reescrita para:
- Implementar logs detalhados em cada etapa
- Melhorar o tratamento de autenticação
- Utilizar respostas padrão para erros e sucessos
- Verificar mais rigorosamente os tokens de autenticação

```ts
// Implementação melhorada da função Edge:
// - Validação robusta do token de autenticação
// - Uso de Service Role Key para verificação de usuário
// - Melhor estrutura de resposta para erros e sucesso
// - Logs detalhados para diagnóstico
```

### 3. Eliminação de Múltiplas Instâncias de GoTrueClient

Componentes que criavam suas próprias instâncias do cliente Supabase foram atualizados para reutilizar a instância global:

```typescript
// Antes:
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Depois:
import { supabase } from '../../lib/supabase';
```

### 4. Atualização dos Cabeçalhos CORS

O arquivo `supabase/functions/_shared/cors.ts` foi atualizado para incluir o cabeçalho `x-application-name`:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Max-Age': '86400',
};
```

## Como Verificar que as Correções Funcionam

1. **Teste de Checkout**: Tente assinar um plano e verifique que o redirecionamento para o Stripe ocorre sem erros
2. **Permanência da Sessão**: Confirme que o usuário permanece logado durante todo o processo
3. **Logs de Console**: Verifique que não aparecem mais os erros de GoTrueClient

## Próximos Passos para Implementação Completa

1. **Verificar Variáveis de Ambiente**: Certifique-se que todas as funções Edge possuem as variáveis necessárias:
   ```bash
   npx supabase secrets list
   npx supabase secrets set SERVER_URL=https://edupais-zeta.vercel.app
   ```

2. **Re-implantar Funções Edge**: Após qualquer alteração, reimplante as funções:
   ```bash
   npx supabase functions deploy --legacy-bundle stripe-create-checkout get-stripe-key check-stripe-product --no-verify-jwt
   ```

3. **Monitorar Logs**: Verifique os logs das funções para diagnosticar eventuais problemas:
   ```bash
   npx supabase functions logs
   ```

## Verificação de Produtos no Stripe

Se estiver enfrentando problemas com produtos no Stripe, execute o script de verificação:

```bash
node scripts/stripe_test_simple.js
```

## Dicas para Depuração

- Use o console do navegador para verificar erros de rede e autenticação
- Verifique os logs das funções Edge para entender o fluxo de autenticação
- Teste com diferentes navegadores para descartar problemas de cache
- Limpe o localStorage e cookies caso persistam problemas de autenticação

---

*Documento atualizado em: [DATA ATUAL]* 