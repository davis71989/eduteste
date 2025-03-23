# Integrando Provedores de IA no EduPais

Este documento fornece instruções detalhadas para integrar diferentes provedores de IA (ChatGPT, Claude, Deepseek) no aplicativo EduPais.

## Visão Geral

O EduPais usa IA para fornecer ajuda personalizada com tarefas escolares. A arquitetura de IA consiste em:

1. Frontend React que envia consultas para a API do Supabase
2. Edge Functions do Supabase que processam consultas e se comunicam com os provedores de IA
3. Armazenamento de histórico e controle de uso no banco de dados Supabase

## Requisitos

- Conta do Supabase com Edge Functions habilitadas
- Chave de API de pelo menos um dos seguintes provedores:
  - OpenAI (ChatGPT)
  - Anthropic (Claude)
  - Deepseek

## 1. Obter Chaves de API

### OpenAI (ChatGPT)

1. Acesse [https://platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Navegue até "API Keys" no painel
4. Clique em "Create new secret key"
5. Copie a chave gerada (ela só será mostrada uma vez)

**Modelos Recomendados:**
- `gpt-3.5-turbo` (mais barato, bom para a maioria dos casos)
- `gpt-4` (mais avançado, maior custo)

### Anthropic (Claude)

1. Acesse [https://console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta ou faça login
3. Navegue até "API Keys" no console
4. Clique em "Create API Key"
5. Copie a chave gerada (formato `sk-ant-xxxxx`)

**Modelos Recomendados:**
- `claude-3-haiku` (mais rápido e econômico)
- `claude-3-sonnet` (bom equilíbrio entre performance e custo)
- `claude-3-opus` (mais avançado, maior custo)

### Deepseek

1. Acesse [https://platform.deepseek.com](https://platform.deepseek.com)
2. Crie uma conta ou faça login
3. Navegue até "API Keys" no dashboard
4. Gere uma nova chave de API
5. Copie a chave gerada

**Modelos Recomendados:**
- `deepseek-coder` (especializado em programação)
- `deepseek-chat` (chat geral)

## 2. Configurar Variáveis de Ambiente no Supabase

Use o CLI do Supabase ou o painel de administração para configurar as variáveis de ambiente:

```bash
# Substitua os valores pelos suas chaves reais
supabase secrets set OPENAI_API_KEY=sk-xxx...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx...
supabase secrets set DEEPSEEK_API_KEY=xxx...
```

Alternativamente, você pode configurar as variáveis no dashboard do Supabase:
1. Acesse seu projeto Supabase
2. Navegue até "Settings > API"
3. Em "Project API keys", copie a "anon" key e a URL
4. Navegue até "Edge Functions"
5. Selecione a função "process-ai-query"
6. Adicione as variáveis de ambiente na seção "Environment Variables"

## 3. Implantar a Edge Function

A função `process-ai-query` já está preparada para comunicação com esses provedores. Depois de configurar as variáveis de ambiente, implante-a:

```bash
supabase functions deploy process-ai-query
```

## 4. Atualizar o Código da Edge Function

Quando tiver suas chaves de API, atualize o arquivo `supabase/functions/process-ai-query/index.ts` para descomentar e implementar o provedor que você escolheu:

### Para OpenAI (ChatGPT):

```typescript
// Adicione após as importações existentes
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

// Na função serve, substitua o bloco comentado por:
const apiKey = Deno.env.get('OPENAI_API_KEY')
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'OpenAI API key não configurada' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}

const configuration = new Configuration({ apiKey })
const openai = new OpenAIApi(configuration)

// Configurar temperatura com base na dificuldade
let temperature = 0.7
if (params.difficulty === 'easy') temperature = 0.5
if (params.difficulty === 'hard') temperature = 0.9

const response = await openai.createChatCompletion({
  model: params.model || 'gpt-3.5-turbo',
  messages: [
    { 
      role: "system", 
      content: "Você é um assistente educacional para pais que estão ajudando seus filhos com tarefas escolares. Forneça explicações claras, passo a passo, e exemplos adicionais para reforçar o aprendizado. Suas respostas devem ser formatadas em HTML simples com tags h3, p, ol, li, e classes do Tailwind CSS para estilização básica."
    },
    { 
      role: "user", 
      content: params.prompt
    }
  ],
  temperature: temperature,
  max_tokens: 1000
})

const aiResponse = {
  response: response.data.choices[0].message.content,
  tokens: response.data.usage.total_tokens
}

return new Response(
  JSON.stringify(aiResponse),
  { headers: { 'Content-Type': 'application/json' } }
)
```

### Para Anthropic (Claude):

```typescript
// Não usamos biblioteca oficial aqui, apenas fetch
const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'Anthropic API key não configurada' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}

// Configurar temperatura com base na dificuldade
let temperature = 0.7
if (params.difficulty === 'easy') temperature = 0.5
if (params.difficulty === 'hard') temperature = 0.9

const systemPrompt = "Você é um assistente educacional para pais que estão ajudando seus filhos com tarefas escolares. Forneça explicações claras, passo a passo, e exemplos adicionais para reforçar o aprendizado. Suas respostas devem ser formatadas em HTML simples com tags h3, p, ol, li, e classes do Tailwind CSS para estilização básica."

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: params.model || 'claude-3-haiku',
    system: systemPrompt,
    messages: [
      { role: 'user', content: params.prompt }
    ],
    temperature: temperature,
    max_tokens: 1000
  })
})

const responseData = await response.json()

const aiResponse = {
  response: responseData.content[0].text,
  tokens: 500 // Claude não retorna tokens usados na API, então estimamos
}

return new Response(
  JSON.stringify(aiResponse),
  { headers: { 'Content-Type': 'application/json' } }
)
```

## 5. Testar a Integração

Após a implementação, teste a integração:

1. Execute a aplicação EduPais
2. Navegue até a página "Ajuda com Tarefas"
3. Insira uma pergunta de teste (ex: "Como resolver uma equação de segundo grau?")
4. Verifique se a resposta está sendo formatada corretamente e se os tokens estão sendo contabilizados

## 6. Monitoramento e Custos

- Configure limites de uso no código para evitar gastos excessivos
- Monitore o uso de tokens no banco de dados
- Defina alertas para quando o uso atingir certos patamares (ex: 80% do limite)

## Recursos Adicionais

- [Documentação OpenAI](https://platform.openai.com/docs/api-reference)
- [Documentação Anthropic](https://docs.anthropic.com/claude/reference)
- [Documentação Deepseek](https://platform.deepseek.com/docs)
- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Troubleshooting

### Problemas Comuns

1. **Erro de autenticação**: Verifique se a chave de API está configurada corretamente nas variáveis de ambiente do Supabase.

2. **Erro de cota excedida**: Verifique o dashboard do provedor para confirmar seu plano e limites.

3. **Respostas muito longas**: Ajuste o parâmetro `max_tokens` para controlar o tamanho das respostas.

4. **Erros da Edge Function**: Verifique os logs da função no dashboard do Supabase. 