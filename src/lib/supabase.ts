import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl) {
  console.error('[SUPABASE] Erro crítico: VITE_SUPABASE_URL não está definido')
}

if (!supabaseAnonKey) {
  console.error('[SUPABASE] Erro crítico: VITE_SUPABASE_ANON_KEY não está definido')
}

console.log('[SUPABASE] Inicializando cliente com URL:', supabaseUrl?.substring(0, 15) + '...')

// Configurando o cliente Supabase com opções adicionais para Functions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    // Definir cabeçalhos para todas as requisições
    headers: {
      'x-application-name': 'EduPais',
    },
  },
})

// Log de inicialização bem-sucedida
console.log('[SUPABASE] Cliente inicializado com sucesso')

export default supabase

// Funções de autenticação
export const signUp = async (email: string, password: string, name: string) => {
  try {
    // Tenta criar o usuário com confirmação de email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
    
    if (error) {
      // Verifique se o erro é porque o usuário já existe
      if (error.message.includes('already registered') || 
          error.message.includes('already exists') ||
          error.message.includes('already taken')) {
        throw new Error('Este email já está registrado. Por favor, faça login.');
      }
      throw error;
    }
    
    // Se tivermos um usuário criado, crie seu perfil
    if (data.user) {
      try {
        await createUserProfile(data.user.id, name, email);
      } catch (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Não lançamos o erro aqui para não impedir o cadastro se o perfil falhar
      }
    }
    
    // Verifica se precisa de confirmação de email
    const needsEmailConfirmation = !data.session && data.user;
    
    return {
      ...data,
      needsEmailConfirmation
    };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    throw error;
  }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })
  
  if (error) throw error
}

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Erro ao obter usuário atual:', error)
    return null
  }
  
  return data.user
}

// Criar/atualizar perfil do usuário
export const createUserProfile = async (userId: string, fullName: string, email: string) => {
  // Primeiro verifica se já existe um perfil
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    // Se já existe um perfil mas não tem nome, atualize-o
    if (!existingProfile.name && fullName) {
      return updateUserProfile(userId, { name: fullName });
    }
    return; // Perfil já existe e tem nome, não precisa fazer nada
  }

  // Detectar país do usuário (através do navegador ou API de geolocalização)
  let paisDetectado = 'Brasil'; // Valor padrão

  try {
    // Verificar se o navegador tem a propriedade de idioma que pode indicar o país
    if (navigator && navigator.language) {
      const idioma = navigator.language;
      
      // Mapeamento básico de idiomas para países
      const mapaPaises: Record<string, string> = {
        'pt-BR': 'Brasil',
        'pt-PT': 'Portugal',
        'es': 'Espanha',
        'es-MX': 'México',
        'es-AR': 'Argentina',
        'en-US': 'Estados Unidos',
        'en-GB': 'Reino Unido',
        'fr': 'França',
        'de': 'Alemanha',
        'it': 'Itália',
        'ja': 'Japão',
        'zh': 'China'
      };
      
      // Encontrar o país baseado no idioma
      if (idioma in mapaPaises) {
        paisDetectado = mapaPaises[idioma];
      } else if (idioma.split('-')[0] in mapaPaises) {
        // Tentar com apenas o código de idioma principal (ex: 'pt' de 'pt-BR')
        paisDetectado = mapaPaises[idioma.split('-')[0]];
      }
    }
    
    console.log('País detectado automaticamente:', paisDetectado);
  } catch (error) {
    console.error('Erro ao detectar país:', error);
    // Continuar com o valor padrão se houver erro
  }

  // Criar novo perfil
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: fullName,
      pais: paisDetectado,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Erro ao criar perfil de usuário:', error)
    throw error
  }
}

// Atualizar perfil do usuário
export const updateUserProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  if (error) {
    console.error('Erro ao atualizar perfil:', error)
    throw error
  }
}

// Obter perfil do usuário
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Erro ao obter perfil:', error)
    return null
  }
  
  return data
}

// Obter configurações do usuário (inclui nível de dificuldade)
export const getUserSettings = async (userId: string) => {
  try {
    // Buscar perfil que contém as configurações
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      console.error('Perfil não encontrado ao obter configurações');
      return {
        difficultyLevel: 'medium', // valor padrão
        notificationsEnabled: true,
        emailNotifications: true,
        darkMode: false,
        language: 'pt-BR'
      };
    }
    
    // Extrair configurações do perfil
    // Log para debug
    console.log('Configurações carregadas do banco:', profile);
    
    return {
      difficultyLevel: profile.difficulty_level || 'medium',
      notificationsEnabled: profile.notifications_enabled !== false,
      emailNotifications: profile.email_notifications !== false,
      darkMode: profile.dark_mode || false,
      language: profile.language || 'pt-BR'
    };
  } catch (error) {
    console.error('Erro ao obter configurações do usuário:', error);
    // Retornar valores padrão em caso de erro
    return {
      difficultyLevel: 'medium',
      notificationsEnabled: true,
      emailNotifications: true,
      darkMode: false,
      language: 'pt-BR'
    };
  }
}

// Salvar configurações do usuário
export const saveUserSettings = async (userId: string, settings: {
  difficultyLevel?: string;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  darkMode?: boolean;
  language?: string;
}) => {
  try {
    // Primeiro verificar quais colunas existem na tabela
    console.log('Verificando quais colunas existem na tabela profiles');
    
    // Verificar o perfil atual para entender a estrutura
    const perfil = await getUserProfile(userId);
    console.log('Estrutura do perfil:', perfil);
    
    // Criar um objeto com apenas os campos que existem na tabela
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    // Adicionar apenas os campos que existem na tabela
    if (settings.difficultyLevel !== undefined) {
      updates.difficulty_level = settings.difficultyLevel;
    }
    
    if (settings.notificationsEnabled !== undefined && 'notifications_enabled' in (perfil || {})) {
      updates.notifications_enabled = settings.notificationsEnabled;
    }
    
    if (settings.emailNotifications !== undefined && 'email_notifications' in (perfil || {})) {
      updates.email_notifications = settings.emailNotifications;
    }
    
    if (settings.darkMode !== undefined && 'dark_mode' in (perfil || {})) {
      updates.dark_mode = settings.darkMode;
    }
    
    if (settings.language !== undefined && 'language' in (perfil || {})) {
      updates.language = settings.language;
    }
    
    console.log('Atualizações que serão aplicadas:', updates);
    
    // Usar a função existente de atualização de perfil
    await updateUserProfile(userId, updates);
    
    console.log('Configurações do usuário salvas com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao salvar configurações do usuário:', error);
    throw error;
  }
}

// Funções administrativas

// Remover um usuário do Supabase (apenas para administradores)
export const removeUser = async (userId: string) => {
  try {
    // Primeiro remove o perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Erro ao remover perfil:', profileError);
      throw profileError;
    }
    
    // Agora remove o usuário da autenticação (requer função admin no Supabase)
    const { error: authError } = await supabase.auth.admin
      .deleteUser(userId);
    
    if (authError) {
      console.error('Erro ao remover usuário:', authError);
      throw authError;
    }
    
    return { success: true, message: 'Usuário removido com sucesso' };
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    throw error;
  }
}

// Script para executar no console do navegador para limpar um usuário específico
/*
// Cole isto no console do navegador
async function limparUsuario(email) {
  try {
    // Obter configuração do Supabase do ambiente
    const supabaseUrl = 'https://vkcwgfrihmfdbouxigef.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY3dnZnJpaG1mZGJvdXhpZ2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTk5MTUsImV4cCI6MjA1NzczNTkxNX0.8HEfBNTovkvV7omOhcUK1cHz0JX7OM4Wt_21U6dHOog';
    
    // Criar cliente Supabase
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar o usuário pelo email
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (profileError) {
      throw profileError;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('Usuário não encontrado');
      return;
    }
    
    // Remover o perfil
    const userId = profiles[0].id;
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log('Usuário removido com sucesso');
    return { success: true, userId };
  } catch (error) {
    console.error('Erro ao limpar usuário:', error);
    return { success: false, error };
  }
}

// Exemplo de uso:
// limparUsuario('email@exemplo.com').then(console.log);
*/

// Obter filhos do usuário
export const getUserChildren = async (userId: string) => {
  console.log('Obtendo filhos do usuário com ID:', userId);
  
  try {
    if (!userId) {
      console.error('ID do usuário não fornecido para obter filhos');
      throw new Error('ID do usuário é necessário');
    }
    
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao obter filhos:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log(`Encontrados ${data.length} filho(s) para o usuário ${userId}`);
    console.log('Dados dos filhos:', JSON.stringify(data, null, 2));
    
    return data || [];
  } catch (err) {
    console.error('Exceção ao obter filhos:', err);
    throw err;
  }
}

// Função alternativa para adicionar filho usando função RPC (Edge Function)
export const addChildAlternative = async (userId: string, childData: {
  name: string,
  age: string,
  grade: string,
  school: string
}) => {
  console.log('Usando método alternativo para adicionar filho...');
  console.log('UserId:', userId);
  console.log('Dados do filho:', childData);
  
  try {
    // Verificar se o userId é válido
    if (!userId) {
      throw new Error('UserID não fornecido para adicionar filho');
    }
    
    // Verificar dados obrigatórios
    if (!childData.name) {
      throw new Error('Nome do filho é obrigatório');
    }
    
    // Antes de adicionar, verificar o token de autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Erro na sessão:', sessionError);
      throw new Error('Problema de autenticação. Faça login novamente.');
    }
    
    if (!session) {
      console.error('Sem sessão ativa');
      throw new Error('Sem sessão ativa. Faça login novamente.');
    }
    
    console.log('Sessão válida, token disponível');
    
    // Tentar inserção direta com parâmetros explícitos
    const { data, error } = await supabase
      .from('children')
      .insert({
        user_id: userId,
        name: childData.name.trim(),
        age: childData.age?.trim() || '',
        grade: childData.grade?.trim() || '',
        school: childData.school?.trim() || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*');
    
    if (error) {
      console.error('Erro ao adicionar filho (método alternativo):', error);
      
      // Tentar abordagem com RPC
      console.log('Tentando abordagem com chamada direta à API do Supabase...');
      
      // Fazer requisição direta para criar filho
      const response = await fetch(`${supabaseUrl}/rest/v1/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          name: childData.name.trim(),
          age: childData.age?.trim() || '',
          grade: childData.grade?.trim() || '',
          school: childData.school?.trim() || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na chamada direta à API:', errorData);
        throw new Error(`Erro ${response.status}: ${JSON.stringify(errorData)}`);
      }
      
      const resultData = await response.json();
      console.log('Filho adicionado com sucesso via API direta:', resultData);
      return { success: true, data: resultData };
    }
    
    console.log('Filho adicionado com sucesso (método padrão):', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exceção ao adicionar filho (método alternativo):', err);
    throw err;
  }
}

// Atualizar um filho
export const updateChild = async (
  childId: string,
  childData: {
    name?: string,
    age?: string,
    grade?: string,
    school?: string
  }
) => {
  console.log('Iniciando updateChild para childId:', childId);
  console.log('Dados para atualização:', childData);
  
  try {
    if (!childId) {
      throw new Error('ID do filho não fornecido para atualização');
    }
    
    const { data, error } = await supabase
      .from('children')
      .update({
        ...childData,
        updated_at: new Date().toISOString()
      })
      .eq('id', childId)
      .select();
    
    if (error) {
      console.error('Erro do Supabase ao atualizar filho:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Filho atualizado com sucesso:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exceção ao atualizar filho:', err);
    throw err;
  }
}

// Remover um filho
export const removeChild = async (childId: string) => {
  console.log('Iniciando remoção de filho com ID:', childId);
  
  try {
    if (!childId) {
      throw new Error('ID do filho não fornecido para remoção');
    }
    
    const { data, error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId)
      .select();
    
    if (error) {
      console.error('Erro do Supabase ao remover filho:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Se for erro de permissão, gerar mensagem específica
      if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('policy')) {
        console.error('Erro de permissão RLS detectado ao remover filho');
        throw new Error('Você não tem permissão para remover este filho.');
      }
      
      throw error;
    }
    
    console.log('Filho removido com sucesso:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exceção ao remover filho:', err);
    throw err;
  }
}

// Tipo para as atividades recentes
export type RecentActivity = {
  id: string
  title: string
  type: 'quiz' | 'task' | 'study' | 'help'
  date: string
  status: 'completed' | 'pending' | 'in-progress'
  subject?: string
  score?: number
  child_id: string
  created_at?: string
  updated_at?: string
}

// Tipo para as matérias
export type Subject = {
  id: string
  name: string
  progress: number
  last_activity: string
  color: string
  child_id: string
  created_at?: string
  updated_at?: string
}

// Buscar atividades recentes do filho
export const getChildActivities = async (childId: string) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('child_id', childId)
    .order('date', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Erro ao buscar atividades:', error)
    return []
  }
  
  return data || []
}

// Buscar matérias de um filho
export const getChildSubjects = async (childId: string) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('child_id', childId)
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Erro ao buscar matérias:', error)
    return []
  }
  
  return data || []
}

// Adicionar uma nova atividade
export const addActivity = async (activity: Omit<RecentActivity, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase
    .from('activities')
    .insert({
      ...activity,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('Erro ao adicionar atividade:', error)
    throw error
  }
  
  return { success: true }
}

// Atualizar o progresso de uma matéria
export const updateSubjectProgress = async (subjectId: string, progress: number) => {
  const { error } = await supabase
    .from('subjects')
    .update({
      progress,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', subjectId)
  
  if (error) {
    console.error('Erro ao atualizar progresso de matéria:', error)
    throw error
  }
  
  return { success: true }
}

// Função para verificar se o usuário tem permissão para acessar a tabela children
export const checkTablePermissions = async () => {
  console.log('Verificando permissões do usuário para as tabelas...');
  
  try {
    const { data: profilesPermissions, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    console.log('Teste de acesso à tabela profiles:', profilesError ? 'Erro' : 'Sucesso');
    
    if (profilesError) {
      console.error('Erro de permissão na tabela profiles:', profilesError);
    }
    
    const { data: childrenPermissions, error: childrenError } = await supabase
      .from('children')
      .select('id')
      .limit(1);
    
    console.log('Teste de acesso à tabela children:', childrenError ? 'Erro' : 'Sucesso');
    
    if (childrenError) {
      console.error('Erro de permissão na tabela children:', childrenError);
    }
    
    return {
      profiles: !profilesError,
      children: !childrenError,
      profilesError,
      childrenError
    };
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return {
      profiles: false,
      children: false,
      error
    };
  }
}

// Adicionar um novo filho
export const addChild = async (userId: string, childData: {
  name: string,
  age: string,
  grade: string,
  school: string
}) => {
  console.log('Iniciando addChild com userId:', userId);
  console.log('Dados do filho a adicionar:', childData);
  
  try {
    // Verificar se o userId é válido
    if (!userId) {
      throw new Error('UserID não fornecido para adicionar filho');
    }
    
    // Verificar se os dados obrigatórios estão presentes
    if (!childData.name) {
      throw new Error('Nome do filho é obrigatório');
    }
    
    // Normalizar os dados
    const normalizedData = {
      user_id: userId,
      name: childData.name.trim(),
      age: childData.age?.trim() || '', 
      grade: childData.grade?.trim() || '',
      school: childData.school?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Dados normalizados para inserção:', normalizedData);
    
    // Tentativa alternativa usando insert direto
    const { data, error } = await supabase
      .from('children')
      .insert(normalizedData)
      .select();
    
    if (error) {
      console.error('Erro do Supabase ao adicionar filho:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Se for erro de permissão, vamos tentar outra abordagem
      if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('policy')) {
        console.log('Erro de permissão detectado, tentando método alternativo...');
        return addChildAlternative(userId, childData);
      }
      
      throw error;
    }
    
    console.log('Filho adicionado com sucesso:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Exceção ao adicionar filho:', err);
    throw err;
  }
}

// Função para inicializar tabela children 
export const runDatabaseSetup = async (userId: string) => {
  console.log('Iniciando configuração do banco de dados para o usuário:', userId);
  
  try {
    // Verificar se o usuário existe
    if (!userId) {
      throw new Error('ID do usuário não fornecido para configuração do banco');
    }
    
    // Verificar se a tabela children existe através de uma consulta simples
    const { data: tableCheck, error: tableError } = await supabase
      .from('children')
      .select('id')
      .limit(1);
    
    // Se houver erro na verificação da tabela, pode ser que ela não exista
    if (tableError) {
      console.error('Erro ao verificar tabela children:', tableError);
      
      // Se o erro for porque a tabela não existe, tentar criar
      if (tableError.code === '42P01' || tableError.message.includes('relation "children" does not exist')) {
        console.log('Tabela children não existe, iniciando criação...');
        
        // SQL para criar a tabela se ela não existir
        const createTableSQL = `
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
          
          CREATE INDEX IF NOT EXISTS children_user_id_idx ON children(user_id);
          
          ALTER TABLE children ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Usuários podem visualizar apenas seus próprios filhos" ON children;
          CREATE POLICY "Usuários podem visualizar apenas seus próprios filhos"
            ON children FOR SELECT
            USING (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Usuários podem inserir apenas seus próprios filhos" ON children;
          CREATE POLICY "Usuários podem inserir apenas seus próprios filhos"
            ON children FOR INSERT
            WITH CHECK (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios filhos" ON children;
          CREATE POLICY "Usuários podem atualizar apenas seus próprios filhos"
            ON children FOR UPDATE
            USING (auth.uid() = user_id);
          
          DROP POLICY IF EXISTS "Usuários podem excluir apenas seus próprios filhos" ON children;
          CREATE POLICY "Usuários podem excluir apenas seus próprios filhos"
            ON children FOR DELETE
            USING (auth.uid() = user_id);
        `;
        
        // Infelizmente não podemos executar SQL diretamente daqui,
        // então vamos tentar um método alternativo
        console.error('Tabela não existe. É necessário executar o SQL de criação no console do Supabase.');
      }
    }
    
    // Verificar se o usuário já tem filhos cadastrados
    const { data: existingChildren, error: childrenError } = await supabase
      .from('children')
      .select('id')
      .eq('user_id', userId);
    
    if (childrenError) {
      console.error('Erro ao verificar filhos existentes:', childrenError);
    } else {
      console.log(`Usuário tem ${existingChildren?.length || 0} filho(s) cadastrado(s)`);
    }
    
    // Retornar resultado da verificação
    return {
      tableExists: !tableError,
      childrenCount: existingChildren?.length || 0,
      tableError,
      childrenError
    };
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Tipo para os itens de rotina de estudo
export type StudyRoutineItem = {
  id: string
  title: string
  description: string
  day: string
  time: string
  duration: string
  subject: string
  completed: boolean
  child_id: string
  user_id: string
  created_at?: string
  updated_at?: string
}

// Obter rotina de estudos de um filho
export const getChildStudyRoutine = async (childId: string) => {
  console.log('Obtendo rotina de estudos para o filho:', childId);
  try {
    const { data, error } = await supabase
      .from('study_routines')
      .select('*')
      .eq('child_id', childId)
      .order('day', { ascending: true })
      .order('time', { ascending: true });
    
    if (error) {
      console.error('Erro ao obter rotina de estudos:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log(`Encontrados ${data?.length || 0} itens de rotina para o filho ${childId}`);
    return data || [];
  } catch (error) {
    console.error('Exceção ao obter rotina de estudos:', error);
    throw error;
  }
}

// Adicionar um novo item à rotina de estudos
export const addRoutineItem = async (
  userId: string,
  childId: string,
  item: Omit<StudyRoutineItem, 'id' | 'child_id' | 'user_id' | 'created_at' | 'updated_at'>
) => {
  console.log('Adicionando item de rotina para o filho:', childId);
  console.log('Dados do item:', item);
  
  try {
    // Verificar se userId e childId são válidos
    if (!userId || !childId) {
      throw new Error('ID do usuário e ID do filho são obrigatórios');
    }
    
    // Verificar campos obrigatórios
    if (!item.title || !item.day || !item.time) {
      throw new Error('Título, dia e horário são obrigatórios');
    }
    
    // Normalizar os dados
    const now = new Date().toISOString();
    const normalizedItem = {
      title: item.title.trim(),
      description: item.description?.trim() || '',
      day: item.day,
      time: item.time,
      duration: item.duration || '30',
      subject: item.subject || 'outros',
      completed: item.completed || false,
      child_id: childId,
      user_id: userId,
      created_at: now,
      updated_at: now
    };
    
    // Inserir no banco de dados
    const { data, error } = await supabase
      .from('study_routines')
      .insert(normalizedItem)
      .select();
    
    if (error) {
      console.error('Erro ao adicionar item de rotina:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Item de rotina adicionado com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao adicionar item de rotina:', error);
    throw error;
  }
}

// Atualizar um item de rotina existente
export const updateRoutineItem = async (
  itemId: string,
  updates: Partial<Omit<StudyRoutineItem, 'id' | 'child_id' | 'user_id' | 'created_at' | 'updated_at'>>
) => {
  console.log('Atualizando item de rotina:', itemId);
  console.log('Atualizações:', updates);
  
  try {
    // Verificar se o itemId é válido
    if (!itemId) {
      throw new Error('ID do item é obrigatório');
    }
    
    // Normalizar os dados de atualização
    const normalizedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Se houver title, garantir que está trimmed
    if (normalizedUpdates.title) {
      normalizedUpdates.title = normalizedUpdates.title.trim();
    }
    
    // Se houver description, garantir que está trimmed
    if (normalizedUpdates.description) {
      normalizedUpdates.description = normalizedUpdates.description.trim();
    }
    
    // Atualizar no banco de dados
    const { data, error } = await supabase
      .from('study_routines')
      .update(normalizedUpdates)
      .eq('id', itemId)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar item de rotina:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Item de rotina atualizado com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao atualizar item de rotina:', error);
    throw error;
  }
}

// Remover um item de rotina
export const removeRoutineItem = async (itemId: string) => {
  console.log('Removendo item de rotina:', itemId);
  
  try {
    // Verificar se o itemId é válido
    if (!itemId) {
      throw new Error('ID do item é obrigatório');
    }
    
    // Remover do banco de dados
    const { data, error } = await supabase
      .from('study_routines')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error('Erro ao remover item de rotina:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Item de rotina removido com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Exceção ao remover item de rotina:', error);
    throw error;
  }
}

// Marcar item como completo/incompleto
export const toggleRoutineItemCompletion = async (itemId: string, completed: boolean) => {
  console.log(`Marcando item de rotina ${itemId} como ${completed ? 'completo' : 'incompleto'}`);
  
  try {
    // Verificar se o itemId é válido
    if (!itemId) {
      throw new Error('ID do item é obrigatório');
    }
    
    // Atualizar status no banco de dados
    const { data, error } = await supabase
      .from('study_routines')
      .update({
        completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select();
    
    if (error) {
      console.error('Erro ao atualizar status do item de rotina:', error);
      console.error('Detalhes:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('Status do item de rotina atualizado com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao atualizar status do item de rotina:', error);
    throw error;
  }
}

// Tipo para as tarefas
export type Task = {
  id: string
  crianca_id: string
  user_id: string
  titulo: string
  descricao: string
  disciplina_id?: string
  data_entrega?: string
  prioridade?: string
  status?: string
  notas?: string
  criado_em?: string
  atualizado_em?: string
}

// Função para salvar uma tarefa no banco de dados
export const saveTask = async (
  userId: string,
  criancaId: string, 
  taskData: {
    titulo: string,
    descricao: string,
    disciplina_id?: string,
    data_entrega?: string,
    prioridade?: string,
    status?: string,
    notas?: string
  }
) => {
  try {
    console.log(`Salvando tarefa para usuário ${userId}, crianca ${criancaId}:`, taskData);
    
    const { data, error } = await supabase
      .from('tarefas')
      .insert({
        crianca_id: criancaId,
        user_id: userId,
        titulo: taskData.titulo,
        descricao: taskData.descricao,
        disciplina_id: taskData.disciplina_id,
        data_entrega: taskData.data_entrega,
        prioridade: taskData.prioridade || 'media',
        status: taskData.status || 'pendente',
        notas: taskData.notas,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('Erro ao salvar tarefa:', error)
      throw error
    }
    
    return { success: true, task: data?.[0] }
  } catch (err) {
    console.error('Exceção ao salvar tarefa:', err)
    throw err
  }
}

// Função para obter tarefas de um filho
export const getChildTasks = async (criancaId: string) => {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('crianca_id', criancaId)
      .order('criado_em', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Exceção ao buscar tarefas:', err)
    return []
  }
}

// Função para obter tarefas de um usuário (todas as tarefas de todos os filhos)
export const getUserTasks = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar tarefas do usuário:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Exceção ao buscar tarefas do usuário:', err)
    return []
  }
}

// Função para atualizar uma tarefa
export const updateTask = async (
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'crianca_id' | 'user_id' | 'criado_em' | 'atualizado_em'>>
) => {
  try {
    const { error } = await supabase
      .from('tarefas')
      .update({
        ...updates,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', taskId)
    
    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw error
    }
    
    return { success: true }
  } catch (err) {
    console.error('Exceção ao atualizar tarefa:', err)
    throw err
  }
}

// Função para excluir uma tarefa
export const deleteTask = async (taskId: string) => {
  try {
    console.log(`Iniciando exclusão da tarefa ${taskId} no banco de dados`);
    
    const { data, error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', taskId)
      .select();
    
    if (error) {
      console.error('Erro ao excluir tarefa:', error);
      throw error;
    }
    
    console.log(`Tarefa ${taskId} excluída com sucesso:`, data);
    return { success: true, data };
  } catch (err) {
    console.error('Exceção ao excluir tarefa:', err);
    throw err;
  }
} 