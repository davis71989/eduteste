-- Adicionando colunas para limites e integração com Stripe à tabela planos
ALTER TABLE planos 
ADD COLUMN IF NOT EXISTS tokens_limit INTEGER,
ADD COLUMN IF NOT EXISTS messages_limit INTEGER,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Adicionando restrição UNIQUE à coluna nome
ALTER TABLE planos ADD CONSTRAINT planos_nome_unique UNIQUE (nome);

-- Criando índice para busca rápida por IDs do Stripe
CREATE INDEX IF NOT EXISTS idx_planos_stripe_price_id ON planos(stripe_price_id);

-- Adicionando políticas de segurança (RLS)
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso:
-- 1. Todos podem visualizar planos ativos
CREATE POLICY "Planos visíveis para todos" 
ON planos FOR SELECT
USING (ativo = true);

-- 2. Apenas administradores podem gerenciar planos
-- Importante: usamos diretamente a coluna tipo_usuario para evitar recursão
CREATE POLICY "Apenas administradores podem gerenciar planos" 
ON planos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    JOIN perfis_usuarios ON perfis_usuarios.id = auth.users.id
    WHERE auth.users.id = auth.uid() AND perfis_usuarios.tipo_usuario = 'admin'
  )
);

-- Criando função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criando trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS atualiza_timestamp_planos ON planos;
CREATE TRIGGER atualiza_timestamp_planos
BEFORE UPDATE ON planos
FOR EACH ROW
EXECUTE FUNCTION update_atualizado_em();

-- Adicionando os planos iniciais (exemplo)
INSERT INTO planos (nome, descricao, preco, intervalo, recursos, ativo, tokens_limit, messages_limit)
VALUES
  ('Básico', 'Plano básico com recursos limitados', 19.90, 'mensal', 
   '{"acesso_basico": true, "suporte_email": true}', true, 30, 50),
  ('Intermediário', 'Plano intermediário com mais recursos', 49.90, 'mensal', 
   '{"acesso_basico": true, "suporte_email": true, "materiais_avancados": true}', true, 100, 200),
  ('Avançado', 'Plano avançado com recursos estendidos', 79.90, 'mensal',
   '{"acesso_basico": true, "suporte_email": true, "materiais_avancados": true, "suporte_prioritario": true}', true, 300, 500),
  ('Premium', 'Plano premium com todos os recursos', 149.90, 'mensal',
   '{"acesso_basico": true, "suporte_email": true, "materiais_avancados": true, "suporte_prioritario": true, "conteudo_exclusivo": true}', true, 1000, 2000)
ON CONFLICT ON CONSTRAINT planos_nome_unique DO UPDATE
SET descricao = EXCLUDED.descricao,
    preco = EXCLUDED.preco,
    intervalo = EXCLUDED.intervalo,
    recursos = EXCLUDED.recursos,
    tokens_limit = EXCLUDED.tokens_limit,
    messages_limit = EXCLUDED.messages_limit; 