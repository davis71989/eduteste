-- Script para limpar as tabelas relacionadas a planos
-- Executar este script antes de update_planos.sql para evitar duplicação de dados

-- Desabilitar temporariamente RLS (Row Level Security) para operações de limpeza
ALTER TABLE planos DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos na recriação
DROP POLICY IF EXISTS "Planos visíveis para todos" ON planos;
DROP POLICY IF EXISTS "Apenas administradores podem gerenciar planos" ON planos;

-- Limpar a tabela de planos
DELETE FROM planos;

-- Redefine a sequência (se estiver usando sequences para IDs)
-- Se você estiver usando UUID ou outro método para gerar IDs, esta parte pode ser ignorada
-- ALTER SEQUENCE planos_id_seq RESTART WITH 1;

-- Remover restrições que podem causar conflitos
ALTER TABLE planos DROP CONSTRAINT IF EXISTS planos_nome_unique;

-- Remover índices que podem causar conflitos
DROP INDEX IF EXISTS idx_planos_stripe_price_id;

-- Remover funções e triggers que podem causar conflitos
DROP TRIGGER IF EXISTS atualiza_timestamp_planos ON planos;
DROP FUNCTION IF EXISTS update_atualizado_em() CASCADE;

-- Re-habilitar RLS
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação
SELECT 'Tabelas de planos limpas com sucesso' AS status; 