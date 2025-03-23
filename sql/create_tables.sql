-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Criar índice para busca por ID de usuário
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- Criar tabela de filhos/crianças
CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age TEXT,
  grade TEXT,
  school TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para busca por ID de usuário
CREATE INDEX IF NOT EXISTS children_user_id_idx ON children(user_id);

-- Criar tabela de matérias
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  color TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para busca por ID da criança
CREATE INDEX IF NOT EXISTS subjects_child_id_idx ON subjects(child_id);

-- Criar tabela de atividades
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('quiz', 'task', 'study', 'help')),
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK (status IN ('completed', 'pending', 'in-progress')),
  subject TEXT,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para busca por ID da criança
CREATE INDEX IF NOT EXISTS activities_child_id_idx ON activities(child_id);

-- Criar políticas de segurança RLS (Row Level Security)
-- Isso garante que os usuários só possam ver e editar seus próprios dados

-- Políticas para a tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar apenas seu próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir apenas seu próprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para a tabela children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar apenas seus próprios filhos"
  ON children FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios filhos"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios filhos"
  ON children FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios filhos"
  ON children FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para a tabela subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar matérias apenas de seus próprios filhos"
  ON subjects FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir matérias apenas para seus próprios filhos"
  ON subjects FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar matérias apenas de seus próprios filhos"
  ON subjects FOR UPDATE
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem excluir matérias apenas de seus próprios filhos"
  ON subjects FOR DELETE
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

-- Políticas para a tabela activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar atividades apenas de seus próprios filhos"
  ON activities FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir atividades apenas para seus próprios filhos"
  ON activities FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar atividades apenas de seus próprios filhos"
  ON activities FOR UPDATE
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem excluir atividades apenas de seus próprios filhos"
  ON activities FOR DELETE
  USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  ); 