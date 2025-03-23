# Guia de Integração e Teste do Stripe em Modo Teste

Este guia descreve os passos necessários para configurar e testar a integração com o Stripe em modo de teste (testmode) no projeto EduPais.

## Pré-requisitos

- Conta no Stripe (https://dashboard.stripe.com/)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) instalado (opcional para testes locais de webhook)
- Node.js 14+ instalado

## 1. Verificação da Configuração Atual

Você já possui configurações básicas do Stripe no seu arquivo `.env`:

```
VITE_STRIPE_PUBLIC_KEY=pk_test_51R5UY2RvXVt1661QUcLHMrje4FL2BNIaCt06NJsoQvvggGC4Ql11ADs5it8YAzDsWZMHrC8rQXwagNKP7Z3v7BCr00INmv8hye
STRIPE_SECRET_KEY=sk_test_51R5UY2RvXVt1661QzpxXnlJXxblpubjzhRMeNWg45Ck4tOty7ilc1HnMJc0hXJLQVXGRNhNxvN2OVUHXF1jV0U6300OmqbHePv
STRIPE_WEBHOOK_SECRET=whsec_UQlnrEcZpix5XibbMaM7NKysURRQdDCF
```

Estas são chaves de teste do Stripe, reconhecíveis pelo prefixo `pk_test_` e `sk_test_`.

## 2. Sincronizar Planos com o Stripe

Os planos já existem no Supabase, mas precisam ser sincronizados com o Stripe para que possam ser usados para cobranças reais. Execute o script de configuração dos planos:

```bash
node scripts/stripe-setup.js
```

Este script:
1. Busca os planos no Supabase
2. Cria os produtos e preços correspondentes no Stripe 
3. Atualiza os planos no Supabase com os IDs do Stripe

## 3. Configuração do Webhook

Para testes locais, você precisará do Stripe CLI para receber eventos do Stripe:

1. Instale o Stripe CLI seguindo as instruções em https://stripe.com/docs/stripe-cli
2. Faça login no Stripe:
```bash
stripe login
```
3. Inicie o forwarding do webhook (em um terminal separado):
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```
4. Copie o webhook signing secret e atualize o STRIPE_WEBHOOK_SECRET no .env se necessário

## 4. Testar o Checkout do Stripe

### Testando o Checkout em Desenvolvimento

O sistema já está configurado para detectar o ambiente de desenvolvimento e simular o checkout:

```typescript
if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
  console.log('Ambiente de desenvolvimento detectado, usando simulação de checkout');
  // Simulação do checkout em ambiente de desenvolvimento
  // ...
}
```

Para testar o checkout real do Stripe em desenvolvimento:

1. Modifique temporariamente a detecção de ambiente em `src/components/Planos/StripeCheckout.tsx`
2. Ou crie uma flag específica para usar o Stripe real em testes:

```typescript
// Exemplo de modificação para forçar o uso do Stripe em desenvolvimento
const useStripeInDevMode = true; // Defina como true para testar o Stripe real em dev

if ((import.meta.env.MODE === 'development' || import.meta.env.DEV) && !useStripeInDevMode) {
  // Simulação...
} else {
  // Stripe real...
}
```

### Testando o Checkout em Produção/Teste

Quando não estiver em modo de desenvolvimento, o sistema usará a Edge Function do Supabase para criar a sessão de checkout:

```typescript
const response = await supabase.functions.invoke('stripe-create-checkout', {
  body: {
    planId: planoId,
    // ...
  }
});
```

## 5. Testar Webhooks do Stripe

Para testar eventos específicos do webhook usando o Stripe CLI:

```bash
# Para testar um checkout.session.completed
stripe trigger checkout.session.completed

# Para testar uma assinatura atualizada
stripe trigger customer.subscription.updated

# Para testar uma assinatura cancelada
stripe trigger customer.subscription.deleted

# Para testar um pagamento bem-sucedido
stripe trigger invoice.paid
```

## 6. Cartões de Teste do Stripe

Use estes cartões de teste para simular diferentes cenários:

- **Pagamento com sucesso**: 4242 4242 4242 4242
- **Pagamento negado**: 4000 0000 0000 0002
- **Requer autenticação**: 4000 0025 0000 3155

Para todos os cartões, use:
- **Data de validade**: Qualquer data futura (ex: 12/30)
- **CVC**: Qualquer número de 3 dígitos (ex: 123)
- **CEP**: Qualquer CEP válido (ex: 12345)

## 7. Dashboard do Stripe para Testes

Acesse seu [Dashboard do Stripe](https://dashboard.stripe.com/test/dashboard) no modo de teste para:

- Visualizar pagamentos simulados
- Gerenciar assinaturas
- Ver logs de webhooks
- Verificar clientes criados

## 8. Dicas para Depuração

1. Verifique os logs do servidor para erros relacionados ao Stripe
2. Use `console.log` temporariamente para depurar fluxos específicos
3. Verifique os eventos de webhook no Dashboard do Stripe (Dashboard > Desenvolvedores > Webhooks > Eventos recentes)
4. Confirme que o Supabase está recebendo e processando corretamente os eventos do webhook

## 9. Implementações Futuras

- Implementar tratamento de falhas de pagamento
- Adicionar suporte para alterações de plano
- Implementar cancelamentos com datas específicas
- Adicionar suporte para reembolsos

## 10. Suporte a Métodos de Pagamento Brasileiros

No modo de produção, você pode querer habilitar métodos de pagamento específicos para o Brasil:

- PIX
- Boleto Bancário
- Cartões de débito locais

Isso requer configurações adicionais no Stripe que podem ser implementadas posteriormente.

## Conclusão

Seguindo os passos acima, você poderá testar completamente a integração com o Stripe em modo de teste antes de ir para produção. Lembre-se de que nenhuma cobrança real será feita enquanto estiver usando as chaves de teste do Stripe. 