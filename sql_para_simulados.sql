-- Tabela para armazenar os simulados gerados
CREATE TABLE IF NOT EXISTS simulados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    materia TEXT NOT NULL,
    ano_escolar TEXT NOT NULL,
    qtd_questoes INTEGER NOT NULL CHECK (qtd_questoes BETWEEN 1 AND 10),
    link_compartilhavel TEXT,
    foi_gerado_por_ia BOOLEAN DEFAULT TRUE,
    completo BOOLEAN DEFAULT FALSE,
    score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as questões de cada simulado
CREATE TABLE IF NOT EXISTS questoes_simulado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulado_id UUID NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    pergunta TEXT NOT NULL,
    opcao_a TEXT NOT NULL,
    opcao_b TEXT NOT NULL,
    opcao_c TEXT NOT NULL,
    opcao_d TEXT NOT NULL,
    resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A', 'B', 'C', 'D')),
    explicacao TEXT,
    resposta_aluno CHAR(1) CHECK (resposta_aluno IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_simulados_user_id ON simulados(user_id);
CREATE INDEX IF NOT EXISTS idx_simulados_child_id ON simulados(child_id);
CREATE INDEX IF NOT EXISTS idx_questoes_simulado_simulado_id ON questoes_simulado(simulado_id);

-- Tabela para armazenar o histórico de envio de simulados
CREATE TABLE IF NOT EXISTS compartilhamento_simulados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulado_id UUID NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
    metodo TEXT NOT NULL CHECK (metodo IN ('email', 'whatsapp', 'impressao')),
    destinatario TEXT,
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar automaticamente o campo updated_at
CREATE TRIGGER update_simulados_updated_at
BEFORE UPDATE ON simulados
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questoes_simulado_updated_at
BEFORE UPDATE ON questoes_simulado
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar a pontuação do simulado quando uma resposta é adicionada
CREATE OR REPLACE FUNCTION update_simulado_score()
RETURNS TRIGGER AS $$
DECLARE
    total_questoes INTEGER;
    respostas_corretas INTEGER;
BEGIN
    -- Conta o total de questões
    SELECT COUNT(*) INTO total_questoes
    FROM questoes_simulado
    WHERE simulado_id = NEW.simulado_id;
    
    -- Conta as respostas corretas
    SELECT COUNT(*) INTO respostas_corretas
    FROM questoes_simulado
    WHERE simulado_id = NEW.simulado_id
    AND resposta_aluno = resposta_correta
    AND resposta_aluno IS NOT NULL;
    
    -- Calcula e atualiza o score (percentual de acerto)
    IF total_questoes > 0 THEN
        UPDATE simulados
        SET score = (respostas_corretas::FLOAT / total_questoes::FLOAT) * 100,
            completo = (SELECT COUNT(*) = total_questoes FROM questoes_simulado WHERE simulado_id = NEW.simulado_id AND resposta_aluno IS NOT NULL)
        WHERE id = NEW.simulado_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar a pontuação do simulado
CREATE TRIGGER update_simulado_score_trigger
AFTER UPDATE OF resposta_aluno ON questoes_simulado
FOR EACH ROW
EXECUTE FUNCTION update_simulado_score(); 