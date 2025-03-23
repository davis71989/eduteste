# Guia de Resolução de Problemas do Stripe

Este documento fornece instruções detalhadas para resolver os problemas de conexão com o Stripe no sistema de pagamentos.

## Problema Identificado

Após análise, identificamos os seguintes problemas:

1. **Incompatibilidade na importação da biblioteca Stripe**: A forma como o Stripe era importado nas funções Edge do Supabase não era compatível com a versão mais recente.

2. **Tratamento de erros inadequado**: As funções não estavam tratando adequadamente os erros retornados pela API do Stripe.

3. **Falta de suporte a CORS**: As respostas das funções Edge não incluíam os cabeçalhos CORS necessários para todas as respostas.

4. **Produtos referenciados não existem**: Os IDs de produtos e preços no banco de dados fazem referência a produtos que não existem na conta Stripe atual.

## Soluções Implementadas

### 1. Nova Implementação das Funções Edge

Criamos um novo arquivo `_shared/stripe-fix.ts` que implementa corretamente:

- Importação do Stripe para o ambiente Deno/Edge Functions
- Funções auxiliares para verificar produtos e preços
- Melhor tratamento de erros

### 2. Correção das Funções Edge Existentes

Atualizamos as seguintes funções Edge:

- `get-stripe-key`: Retorna a chave publicável do Stripe
- `check-stripe-product`: Verifica se um produto e preço existem no Stripe
- `create-stripe-product`: Cria novos produtos e preços no Stripe

Todas as funções agora incluem:
- Suporte adequado a CORS
- Respostas com status HTTP apropriados
- Mensagens de erro descritivas

### 3. Ferramentas de Diagnóstico

Criamos duas ferramentas para diagnóstico e correção:

1. **HTML Runner** (`stripe_html_runner.html`):
   - Interface web para diagnosticar problemas do Stripe
   - Permite verificar produtos existentes
   - Recriar produtos quando necessário
   - Gerar SQL para atualizar o banco de dados

2. **Node Runner** (`stripe_node_runner.js`):
   - Ferramenta CLI para administradores
   - Funcionalidades semelhantes à versão HTML
   - Útil em ambientes sem interface gráfica

3. **Script de Diagnóstico** (`stripe_connection_test.js`):
   - Ferramenta para diagnóstico de conectividade com o Stripe
   - Verifica validade das chaves API
   - Testa DNS e conectividade HTTPS

## Como Usar as Ferramentas

### Para Verificar Produtos e Recriar

1. **Usando o HTML Runner**:
   - Abra o arquivo `stripe_html_runner.html` em um navegador
   - Insira sua chave secreta do Stripe
   - Clique em "Verificar Produtos"
   - Se produtos estiverem faltando, clique em "Recriar Produtos"
   - Copie o SQL gerado e execute-o no banco de dados

2. **Usando o Node Runner**:
   ```bash
   node stripe_node_runner.js
   ```
   - Siga as instruções na interface de linha de comando
   - O script gerará SQL para atualização do banco de dados

### Para Diagnosticar Problemas de Conexão

Execute o script de diagnóstico:
```bash
node stripe_connection_test.js
```

- Escolha a opção "1" para verificar a conexão básica
- Escolha a opção "2" para verificar as chaves API
- Escolha a opção "5" para verificar DNS e conectividade

## Como Implantar as Correções

1. **Atualizar as Funções Edge**:
   ```bash
   supabase functions deploy get-stripe-key
   supabase functions deploy check-stripe-product
   supabase functions deploy create-stripe-product
   ```

2. **Atualizar o Banco de Dados**:
   - Execute o SQL gerado pelas ferramentas para atualizar os IDs dos produtos

## Recomendações Adicionais

1. **Monitorar Logs**:
   - Implemente um sistema de monitoramento para as funções Edge
   - Configure alertas para erros relacionados ao Stripe

2. **Testes Automatizados**:
   - Desenvolva testes que verifiquem a conexão com o Stripe
   - Execute esses testes regularmente

3. **Backup das Chaves**:
   - Mantenha um backup seguro das chaves do Stripe
   - Considere o uso de um sistema de gerenciamento de segredos

4. **Documentação**:
   - Mantenha documentação atualizada sobre a integração com o Stripe
   - Inclua procedimentos para troubleshooting

## Contato para Suporte

Se problemas persistirem após implementar estas soluções, entre em contato com o suporte técnico ou consulte a documentação oficial do Stripe em https://docs.stripe.com/ 