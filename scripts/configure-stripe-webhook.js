/**
 * Script para auxiliar na configuração do webhook do Stripe para desenvolvimento local
 * 
 * Este script fornece instruções sobre como configurar e testar webhooks do Stripe
 * em ambiente local usando o CLI do Stripe.
 * 
 * Uso:
 * node scripts/configure-stripe-webhook.js
 */

console.log(`
=======================================================
  CONFIGURAÇÃO DO WEBHOOK DO STRIPE PARA TESTES LOCAIS
=======================================================

Para configurar e testar webhooks do Stripe localmente, siga estes passos:

1. Instale o CLI do Stripe (se ainda não tiver):
   $ npm install -g @stripe/stripe-cli
   
   ou via homebrew (macOS):
   $ brew install stripe/stripe-cli/stripe

2. Faça login na sua conta do Stripe:
   $ stripe login

3. Inicie o listener do webhook (em um terminal separado):
   $ stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

   Isso vai gerar um webhook secret que você deve copiar e adicionar ao seu .env:
   STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

4. Para testar eventos específicos, você pode usar o comando trigger:
   $ stripe trigger payment_intent.succeeded
   $ stripe trigger checkout.session.completed
   $ stripe trigger customer.subscription.updated

5. Eventos importantes para testar:
   - checkout.session.completed
   - invoice.paid
   - customer.subscription.updated
   - customer.subscription.deleted

6. Para testes de checkout, você pode criar uma sessão e usar os cartões de teste:
   - Cartão com sucesso: 4242 4242 4242 4242
   - Cartão que falha: 4000 0000 0000 0002
   
   Outros dados para testes:
   - Data de expiração: qualquer data futura (ex: 12/30)
   - CVC: qualquer 3 dígitos (ex: 123)
   - Nome e endereço: quaisquer valores

=======================================================
  DEPLOYMENT DO WEBHOOK PARA PRODUÇÃO
=======================================================

Quando estiver pronto para produção:

1. Configure o endpoint de webhook no dashboard do Stripe:
   https://dashboard.stripe.com/webhooks

2. Adicione seu endpoint (ex: https://seudominio.com/api/webhooks/stripe)

3. Selecione os eventos que deseja receber

4. Copie o "Signing Secret" gerado e atualize seu .env de produção

=======================================================
`); 