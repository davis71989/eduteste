# Edge Function para Processamento de IA

Esta Edge Function é responsável por processar consultas de IA para a funcionalidade de ajuda com tarefas no aplicativo EduPais.

## Pré-requisitos

1. CLI do Supabase instalado
2. Projeto do Supabase configurado
3. Variáveis de ambiente configuradas

## Configuração

Antes de implantar esta função, você precisará configurar as chaves de API dos provedores de IA que deseja utilizar. Você pode usar um ou mais dos seguintes serviços:

- OpenAI (ChatGPT)
- Anthropic (Claude)
- Deepseek

### Configurar Variáveis de Ambiente

Utilize o CLI do Supabase para configurar as chaves:

```bash
# Para OpenAI
supabase secrets set OPENAI_API_KEY=sk-xxx...

# Para Anthropic
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx...

# Para Deepseek
supabase secrets set DEEPSEEK_API_KEY=xxx...
```

## Implantação

Para implantar a função, execute no terminal:

```bash
supabase functions deploy process-ai-query
```

## Testando

Você pode testar a função usando curl:

```bash
curl -X POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/process-ai-query \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Como resolver equação de segundo grau?", "model": "gpt-3.5-turbo", "difficulty": "medium"}'
```

## Implementações Futuras

Quando esta função for completamente implementada, ela precisará:

1. Selecionar o provedor de IA com base no parâmetro `model`
2. Formatar o prompt corretamente para o provedor escolhido
3. Ajustar parâmetros como temperatura com base no `difficulty`
4. Monitorar e registrar o uso de tokens
5. Lidar com erros específicos de cada provedor

## Diagrama de Sequência

```
┌──────────┐                      ┌───────────┐                   ┌───────────┐
│           │                      │            │                   │            │
│  Cliente  │                      │  Supabase  │                   │ Provedor  │
│           │                      │  Function  │                   │    IA     │
└─────┬─────┘                      └─────┬─────┘                   └─────┬─────┘
      │                                  │                               │
      │ POST /process-ai-query           │                               │
      │ ──────────────────────────────► │                               │
      │                                  │                               │
      │                                  │ Requisição à API do provedor  │
      │                                  │ ─────────────────────────────►│
      │                                  │                               │
      │                                  │ Resposta com texto gerado     │
      │                                  │ ◄─────────────────────────────│
      │                                  │                               │
      │ Resposta formatada HTML          │                               │
      │ ◄────────────────────────────── │                               │
      │                                  │                               │
``` 