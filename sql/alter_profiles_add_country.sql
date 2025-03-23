-- Adicionar campo "pais" à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pais TEXT;

-- Comentário para documentação
COMMENT ON COLUMN profiles.pais IS 'País de residência do usuário'; 