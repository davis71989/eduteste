-- Criação da tabela de rotinas de estudo (executar no console SQL do Supabase)
CREATE TABLE IF NOT EXISTS study_routines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  duration TEXT,
  subject TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS study_routines_user_id_idx ON study_routines(user_id);
CREATE INDEX IF NOT EXISTS study_routines_child_id_idx ON study_routines(child_id);

-- Habilitar Row Level Security
ALTER TABLE study_routines ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "view_own_routines" ON study_routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_routines" ON study_routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_routines" ON study_routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own_routines" ON study_routines FOR DELETE USING (auth.uid() = user_id); 