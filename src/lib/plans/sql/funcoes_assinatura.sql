-- Funções para gerenciar assinaturas e contadores de recursos

-- Função para decrementar tokens de um usuário
CREATE OR REPLACE FUNCTION decrementar_tokens(
  usuario_id_param UUID,
  quantidade_param INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar tokens_restantes da assinatura ativa do usuário
  UPDATE assinaturas
  SET tokens_restantes = GREATEST(0, tokens_restantes - quantidade_param)
  WHERE usuario_id = usuario_id_param
  AND status IN ('ativo', 'trial')
  AND id = (
    SELECT id FROM assinaturas 
    WHERE usuario_id = usuario_id_param 
    AND status IN ('ativo', 'trial')
    ORDER BY data_inicio DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar mensagens de um usuário
CREATE OR REPLACE FUNCTION decrementar_mensagens(
  usuario_id_param UUID,
  quantidade_param INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar messages_restantes da assinatura ativa do usuário
  UPDATE assinaturas
  SET messages_restantes = GREATEST(0, messages_restantes - quantidade_param)
  WHERE usuario_id = usuario_id_param
  AND status IN ('ativo', 'trial')
  AND id = (
    SELECT id FROM assinaturas 
    WHERE usuario_id = usuario_id_param 
    AND status IN ('ativo', 'trial')
    ORDER BY data_inicio DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se o usuário tem uma assinatura ativa
CREATE OR REPLACE FUNCTION verificar_assinatura_ativa(
  usuario_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  assinatura_ativa BOOLEAN;
BEGIN
  -- Verificar se o usuário tem uma assinatura ativa
  SELECT EXISTS(
    SELECT 1
    FROM assinaturas
    WHERE usuario_id = usuario_id_param
    AND status IN ('ativo', 'trial')
  ) INTO assinatura_ativa;
  
  RETURN assinatura_ativa;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se o usuário tem tokens suficientes
CREATE OR REPLACE FUNCTION verificar_tokens_suficientes(
  usuario_id_param UUID,
  quantidade_necessaria INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  tokens_disponiveis INTEGER;
BEGIN
  -- Obter quantidade de tokens disponíveis
  SELECT tokens_restantes
  FROM assinaturas
  WHERE usuario_id = usuario_id_param
  AND status IN ('ativo', 'trial')
  ORDER BY data_inicio DESC
  LIMIT 1
  INTO tokens_disponiveis;
  
  -- Se não encontrou assinatura ativa, retorna false
  IF tokens_disponiveis IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN tokens_disponiveis >= quantidade_necessaria;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se o usuário tem mensagens suficientes
CREATE OR REPLACE FUNCTION verificar_mensagens_suficientes(
  usuario_id_param UUID,
  quantidade_necessaria INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  mensagens_disponiveis INTEGER;
BEGIN
  -- Obter quantidade de mensagens disponíveis
  SELECT messages_restantes
  FROM assinaturas
  WHERE usuario_id = usuario_id_param
  AND status IN ('ativo', 'trial')
  ORDER BY data_inicio DESC
  LIMIT 1
  INTO mensagens_disponiveis;
  
  -- Se não encontrou assinatura ativa, retorna false
  IF mensagens_disponiveis IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN mensagens_disponiveis >= quantidade_necessaria;
END;
$$ LANGUAGE plpgsql; 