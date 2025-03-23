-- Tabela para histórico de consultas de IA
CREATE TABLE public.ai_query_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  subject VARCHAR(50),
  tokens INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para controle de uso da IA
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used INT NOT NULL DEFAULT 0,
  tokens_limit INT NOT NULL DEFAULT 10000,
  reset_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuração RLS (Row Level Security)
ALTER TABLE public.ai_query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_query_history
CREATE POLICY "Usuários podem visualizar apenas seu próprio histórico de consultas"
  ON public.ai_query_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seu próprio histórico de consultas"
  ON public.ai_query_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para ai_usage
CREATE POLICY "Usuários podem visualizar apenas seu próprio uso de tokens"
  ON public.ai_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seu próprio uso de tokens"
  ON public.ai_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio uso de tokens"
  ON public.ai_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices para melhorar a performance das consultas
CREATE INDEX ai_query_history_user_id_idx ON public.ai_query_history(user_id);
CREATE INDEX ai_query_history_child_id_idx ON public.ai_query_history(child_id);
CREATE INDEX ai_usage_user_id_idx ON public.ai_usage(user_id);

-- Gatilho para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ai_query_history_updated_at
BEFORE UPDATE ON public.ai_query_history
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ai_usage_updated_at
BEFORE UPDATE ON public.ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Comentários para documentação das tabelas
COMMENT ON TABLE public.ai_query_history IS 'Histórico de consultas feitas à IA';
COMMENT ON TABLE public.ai_usage IS 'Controle de uso de tokens da IA por usuário'; 