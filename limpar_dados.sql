-- Script SQL para limpar todos os dados do banco de dados Supabase, preservando os usuários
-- Este script deve ser executado diretamente no painel SQL do Supabase

-- Limpar dados da tabela de histórico de consultas de IA
TRUNCATE TABLE public.ai_query_history CASCADE;

-- Limpar dados da tabela de uso da IA
TRUNCATE TABLE public.ai_usage CASCADE;

-- Limpar dados da tabela de atividades
TRUNCATE TABLE public.activities CASCADE;

-- Limpar dados da tabela de rotinas de estudo
TRUNCATE TABLE public.study_routines CASCADE;

-- Limpar dados da tabela de matérias
TRUNCATE TABLE public.subjects CASCADE;

-- Limpar dados da tabela de filhos/crianças
TRUNCATE TABLE public.children CASCADE;

-- Limpar dados da tabela de perfis (mantendo a associação com os usuários)
-- Se quiser manter mais dados do perfil, não execute este comando
TRUNCATE TABLE public.profiles CASCADE;

-- Se houver outras tabelas personalizadas, adicione-as aqui:
-- TRUNCATE TABLE public.nome_da_tabela CASCADE;

-- Para confirmar que os dados foram limpos, você pode executar:
-- SELECT 'ai_query_history', COUNT(*) FROM public.ai_query_history UNION ALL
-- SELECT 'ai_usage', COUNT(*) FROM public.ai_usage UNION ALL
-- SELECT 'activities', COUNT(*) FROM public.activities UNION ALL
-- SELECT 'study_routines', COUNT(*) FROM public.study_routines UNION ALL
-- SELECT 'subjects', COUNT(*) FROM public.subjects UNION ALL
-- SELECT 'children', COUNT(*) FROM public.children UNION ALL
-- SELECT 'profiles', COUNT(*) FROM public.profiles;

-- IMPORTANTE: Este script NÃO exclui os usuários do sistema de autenticação
-- Os usuários na tabela auth.users permanecem intactos
-- Apenas os dados associados são removidos 