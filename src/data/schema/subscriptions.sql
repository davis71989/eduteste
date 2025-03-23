-- Tabela subscriptions (assinaturas)
-- Esta tabela armazena as informações de assinatura do usuário no Stripe

-- Tipo enum para status de assinatura
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

-- Tipo enum para intervalos de assinatura
CREATE TYPE subscription_interval AS ENUM (
  'day',
  'week',
  'month',
  'year'
);

-- Tabela principal de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status subscription_status NOT NULL DEFAULT 'incomplete',
  interval subscription_interval,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o updated_at automaticamente
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)

-- Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Política para permitir que administradores vejam todas as assinaturas
CREATE POLICY "Administradores podem ver todas as assinaturas"
ON subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = TRUE
  )
);

-- Adicionar coluna de subscription_status na tabela de perfis
-- para facilitar o controle de acesso baseado no status da assinatura
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Comentários para documentação
COMMENT ON TABLE subscriptions IS 'Tabela que armazena as assinaturas dos usuários no Stripe';
COMMENT ON COLUMN subscriptions.user_id IS 'Referência ao usuário no sistema';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'ID da assinatura no Stripe';
COMMENT ON COLUMN subscriptions.stripe_price_id IS 'ID do preço no Stripe';
COMMENT ON COLUMN subscriptions.status IS 'Status atual da assinatura';
COMMENT ON COLUMN subscriptions.interval IS 'Intervalo de cobrança (mês, ano, etc)';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Data de início do período atual';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Data de término do período atual';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Se a assinatura será cancelada ao final do período';
COMMENT ON COLUMN profiles.subscription_status IS 'Status da assinatura do usuário para controle de acesso';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'ID do cliente no Stripe para referência rápida'; 