# Resumo do Problema e Solução do Stripe

## Problema Identificado

Após investigação, identificamos os seguintes problemas na integração com o Stripe:

1. **Produtos inexistentes**: Os IDs de produtos e preços na tabela `planos` no banco de dados faziam referência a produtos que não existiam na conta Stripe atual. Isso causava os erros "produto não encontrado" quando tentávamos utilizar esses IDs.

2. **Problemas na execução do curl no Windows**: O script inicial usava uma sintaxe de barras invertidas (`\`) para continuação de linha, que não funciona corretamente no Windows, causando erros ao tentar criar produtos de teste.

3. **Tratamento inadequado de erros**: As funções Edge não estavam tratando adequadamente os erros retornados pela API do Stripe.

4. **Falta de suporte a CORS**: As funções Edge não incluíam corretamente os cabeçalhos CORS em todas as respostas.

## Testes Realizados

1. **Verificação de conectividade**: Confirmamos que a conexão com a API do Stripe está funcionando corretamente. O teste de obtenção do saldo (`/v1/balance`) retornou sucesso.

2. **Verificação da validade das chaves**: Confirmamos que a chave secreta do Stripe está ativa e funcionando corretamente.

3. **Criação de produto de teste**: Criamos com sucesso um produto de teste, o que confirma que as permissões da conta estão corretas.

4. **Verificação dos produtos existentes**: Confirmamos que os produtos referenciados no banco de dados não existiam na conta Stripe.

## Soluções Implementadas

1. **Correção das funções Edge**:
   - Criamos um novo arquivo `_shared/stripe-fix.ts` com melhor implementação da API Stripe
   - Atualizamos as funções `get-stripe-key`, `check-stripe-product` e `create-stripe-product`
   - Adicionamos suporte adequado a CORS e melhor tratamento de erros

2. **Recriação dos produtos**:
   - Criamos um script `stripe_fix_products.js` que recriou todos os produtos necessários no Stripe
   - Os novos produtos foram criados com sucesso e seus IDs foram salvos

3. **Atualização do banco de dados**:
   - Criamos um script `scripts/update-stripe-products.jsx` para atualizar os IDs dos produtos no banco de dados
   - O script utiliza a API do Supabase e requer a chave de serviço

## Novos IDs de Produtos

| Plano        | ID Plano                              | Novo Product ID      | Novo Price ID                    |
|--------------|---------------------------------------|----------------------|----------------------------------|
| Básico       | 0b8a742e-228f-4c76-92e4-32f6cb737de1 | prod_RzadbDZjP4fWbh  | price_1R5bSQRrfuwybnpzFKmWDejc   |
| Intermediário| e147dc1f-9a63-46c5-b4cb-3bad639c8162 | prod_RzadVKYOEVxPRR  | price_1R5bSRRrfuwybnpz39OJF00O   |
| Avançado     | 8c8d495a-a9b8-40a6-a0da-57b1977ebc45 | prod_RzadJUZYO1FJk0  | price_1R5bSSRrfuwybnpzsI8S4Al7   |
| Premium      | 85e05cbc-de9f-46e9-b563-678e20b5cc5a | prod_RzadDfw8KbRCSD  | price_1R5bSTRrfuwybnpzxZDV6bVi   |

## Instruções para Aplicar as Correções

1. **Atualizar o banco de dados**:
   ```bash
   # Configurar as variáveis de ambiente
   export NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   export SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
   
   # Executar o script de atualização
   node scripts/update-stripe-products.jsx
   ```

2. **Atualizar as funções Edge**:
   ```bash
   # Implantar funções corrigidas
   npx supabase functions deploy get-stripe-key
   npx supabase functions deploy check-stripe-product
   npx supabase functions deploy create-stripe-product
   ```

## Verificação Pós-Correção

Após aplicar todas as correções:

1. O checkout deve funcionar normalmente
2. A verificação de produtos deve retornar sucesso
3. As assinaturas criadas devem ser vinculadas corretamente aos planos

## Monitoramento

Recomendamos o monitoramento contínuo para detectar quaisquer outros problemas. Isso pode ser feito por:

1. Verificação de logs das funções Edge
2. Testes periódicos de criação de assinaturas
3. Configuração de webhooks do Stripe para notificações em tempo real 