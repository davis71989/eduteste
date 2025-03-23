import { useState, useEffect, useCallback } from 'react'
import { User, Settings, Bell, LogOut, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/AuthContext'
import { getUserProfile, updateUserProfile, getUserChildren, addChild, updateChild, removeChild, createUserProfile, checkTablePermissions, runDatabaseSetup, addChildAlternative, getUserSettings, saveUserSettings } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/lib/ThemeContext'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// Tipo para os dados do filho
type Child = {
  id: string;
  name: string;
  age: string;
  grade: string;
  school: string;
  isNew?: boolean;
  isSaving?: boolean;
  hasErrors?: {
    [key: string]: string | undefined;
  };
}

const Profile = () => {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()
  
  // Determinar a aba ativa a partir dos parâmetros da URL
  const searchParams = new URLSearchParams(location.search)
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam === 'settings' ? 'settings' : 'profile')
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    pais: 'Brasil'
  })

  const [children, setChildren] = useState<Child[]>([])

  const [settings, setSettings] = useState({
    difficultyLevel: 'medium',
    notificationsEnabled: true,
    emailNotifications: true,
    darkMode: false,
    language: 'pt-BR'
  })

  // Sincronizar o modo escuro com o ThemeContext
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: isDarkMode
    }))
  }, [isDarkMode])

  // Buscar dados do perfil e filhos ao carregar a página
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        
        // Garantir que o userId está como string
        const userId = String(user.id);
        console.log('Buscando dados do perfil para usuário:', userId);
        
        // Verificar banco de dados e inicializar se necessário
        try {
          console.log('Verificando configuração do banco de dados...');
          await runDatabaseSetup(userId);
        } catch (dbSetupError) {
          console.error('Erro ao configurar banco de dados:', dbSetupError);
          // Continuar mesmo com erro na configuração
        }
        
        // Verificar permissões para diagnóstico
        try {
          console.log('Verificando permissões das tabelas...');
          const permissions = await checkTablePermissions();
          console.log('Resultado da verificação de permissões:', permissions);
          
          if (!permissions.children) {
            console.error('IMPORTANTE: O usuário não tem permissão para acessar a tabela children.');
            console.error('Possíveis causas:');
            console.error('1. Políticas RLS não configuradas corretamente');
            console.error('2. Tabela não existe ou não está acessível');
            console.error('3. O token de autenticação do usuário expirou');
          }
        } catch (permissionError) {
          console.error('Erro ao verificar permissões:', permissionError);
        }
        
        // Obter o nome do display_name ou user_metadata do usuário
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || '';
        console.log('Nome de usuário dos metadados:', userName);
        
        try {
          // Buscar perfil do usuário
          let userProfile = await getUserProfile(userId);
          
          // Se o perfil não existe ainda, vamos criar um
          if (!userProfile) {
            console.log('Perfil não encontrado, criando novo perfil...');
            try {
              await createUserProfile(userId, userName, user.email || '')
              userProfile = await getUserProfile(userId)
            } catch (profileError) {
              console.error('Erro ao criar perfil:', profileError)
            }
          } else if (!userProfile.name && userName) {
            // Se o perfil existe mas não tem nome, atualizar com o nome dos metadados
            console.log('Perfil encontrado sem nome, atualizando...');
            try {
              await updateUserProfile(userId, { name: userName })
              userProfile = await getUserProfile(userId)
            } catch (profileError) {
              console.error('Erro ao atualizar nome do perfil:', profileError)
            }
          }
          
          if (userProfile) {
            console.log('Perfil carregado com sucesso:', userProfile);
            setProfileData({
              name: userProfile.name || userName || '',
              email: user.email || '',
              phone: userProfile.phone || '',
              pais: userProfile.pais || 'Brasil'
            })
            
            // Carregar configurações do usuário
            try {
              console.log('Carregando configurações do usuário...');
              const userSettings = await getUserSettings(userId);
              console.log('Configurações carregadas:', userSettings);
              
              setSettings(userSettings);
            } catch (settingsError) {
              console.error('Erro ao carregar configurações:', settingsError);
              // Continuar com as configurações padrão
            }
          } else {
            // Se ainda não existe perfil, usar dados básicos
            console.log('Usando dados básicos do usuário para o perfil');
            setProfileData({
              name: userName || '',
              email: user.email || '',
              phone: '',
              pais: 'Brasil'
            })
          }
        } catch (profileError) {
          console.error('Erro ao buscar/atualizar perfil:', profileError);
          // Usar dados básicos mesmo com erro
          setProfileData({
            name: userName || '',
            email: user.email || '',
            phone: '',
            pais: 'Brasil'
          });
          
          toast({
            title: 'Aviso',
            description: 'Não foi possível carregar todos os dados do perfil.',
            variant: 'default'
          });
        }
        
        try {
          // Buscar filhos do usuário separadamente
          console.log('Buscando filhos do usuário...');
          const userChildren = await getUserChildren(userId);
          console.log(`Encontrados ${userChildren.length} filhos`);
          
          setChildren(userChildren.map(child => ({
            id: child.id,
            name: child.name || '',
            age: child.age || '',
            grade: child.grade || '',
            school: child.school || ''
          })));
        } catch (childrenError) {
          console.error('Erro ao buscar filhos:', childrenError);
          // Definir como array vazio em caso de erro
          setChildren([]);
          
          toast({
            title: 'Aviso',
            description: 'Não foi possível carregar os dados dos filhos.',
            variant: 'default'
          });
        }
      } catch (error) {
        console.error('Erro geral ao buscar dados:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus dados. Tente novamente.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfileData()
  }, [user, toast])

  // Atualizar a aba ativa quando mudar o parâmetro da URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam === 'settings') {
      setActiveTab('settings')
    } else if (tabParam === 'profile') {
      setActiveTab('profile')
    }
  }, [location.search])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleChildChange = (id: string, field: keyof Child, value: string) => {
    setChildren(prev => 
      prev.map(child => {
        if (child.id === id) {
          const updatedChild = { ...child, [field]: value };
          if (!updatedChild.hasErrors) {
            updatedChild.hasErrors = {};
          }
          updatedChild.hasErrors[field] = value.trim() === '' ? 'Este campo é obrigatório' : undefined;
          return updatedChild;
        }
        return child;
      })
    );
  }

  const handleAddChild = () => {
    try {
      console.log('Adicionando novo filho temporário');
      const newId = `temp_${Date.now()}`
      console.log('ID temporário gerado:', newId);
      
      // Criar um novo filho com valores padrão
      const newChild: Child = { 
        id: newId, 
        name: '', 
        age: '', 
        grade: '', 
        school: '',
        isNew: true,
        hasErrors: {}
      };
      
      console.log('Objeto do novo filho:', newChild);
      
      // Atualizar o estado com o novo filho
      setChildren(prev => [...prev, newChild]);
      
      // Rolar para o elemento recém-adicionado
      setTimeout(() => {
        const element = document.getElementById(`child-${newId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Mostrar toast de feedback
      toast({
        title: 'Filho adicionado',
        description: 'Preencha os dados e clique em Salvar Alterações para confirmar.',
      });
    } catch (error) {
      console.error('Erro ao adicionar filho à interface:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar filho. Tente novamente.',
        variant: 'destructive'
      });
    }
  }

  const handleRemoveChild = async (id: string) => {
    try {
      console.log('Tentando remover filho com ID:', id);
      
      // Se o ID é temporário (começa com 'temp_'), apenas remova do estado
      if (id.startsWith('temp_')) {
        console.log('Removendo filho temporário do estado local');
        setChildren(prev => prev.filter(child => child.id !== id));
        
        toast({
          title: 'Filho removido',
          description: 'O filho foi removido do formulário.',
        });
        return;
      }
      
      // É um filho persistido no banco, precisa remover do backend
      try {
        console.log('Removendo filho do banco de dados...');
        await removeChild(id);
        console.log('Filho removido com sucesso do banco');
        
        // Remove do estado local após sucesso na API
        setChildren(prev => prev.filter(child => child.id !== id));
        
        toast({
          title: 'Sucesso',
          description: 'Filho removido com sucesso',
        });
      } catch (dbError: any) {
        console.error('Erro ao remover filho do banco:', dbError);
        
        if (dbError.code === 'PGRST301' || 
            (dbError.message && dbError.message.includes('permission'))) {
          toast({
            title: 'Erro de permissão',
            description: 'Você não tem permissão para remover este filho. Contate o suporte.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Erro',
            description: 'Não foi possível remover o filho do banco. Tente novamente.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao remover filho:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
        variant: 'destructive'
      });
    }
  }

  const handleSettingsChange = (name: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Se o modo escuro for alterado, sincronizar com o ThemeContext
    if (name === 'darkMode' && value !== isDarkMode) {
      toggleTheme()
    }
  }

  const validateChild = (child: Child): boolean => {
    const errors: Record<string, string> = {}
    
    if (!child.name.trim()) {
      errors.name = 'Nome é obrigatório'
    }
    
    // Atualizar os erros no estado
    setChildren(prev => prev.map(c => 
      c.id === child.id 
        ? { ...c, hasErrors: errors } 
        : c
    ))
    
    return Object.keys(errors).length === 0
  }

  const handleQuickSaveChild = async (child: Child) => {
    if (!user?.id) {
      console.error('Erro: usuário não autenticado');
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive'
      });
      return;
    }
    
    // Garantir que o userId está como string
    const userId = String(user.id);
    
    // Logs detalhados para debug
    console.log('--- Iniciando salvamento de filho ---');
    console.log('Dados do filho a salvar:', JSON.stringify(child, null, 2));
    console.log('User ID:', userId);
    
    // Validar o filho
    if (!validateChild(child)) {
      console.error('Validação falhou para o filho:', JSON.stringify(child, null, 2));
      console.error('Campos obrigatórios faltando.');
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }
    
    try {
      // Atualizar estado para mostrar carregamento
      setChildren(prev => prev.map(c => 
        c.id === child.id 
          ? { ...c, isSaving: true } 
          : c
      ))
      
      if (child.id.startsWith('temp_')) {
        console.log('Adicionando novo filho...');
        // Novo filho - adicionar
        const childData = {
          name: child.name,
          age: child.age,
          grade: child.grade,
          school: child.school
        };
        console.log('Dados para salvar no Supabase:', JSON.stringify(childData, null, 2));
        
        try {
          console.log('Chamando método alternativo de adicionar filho...');
          // Usar método alternativo diretamente
          const result = await addChildAlternative(userId, childData);
          console.log('Resultado da adição:', JSON.stringify(result, null, 2));
          
          // Recarregar filhos
          console.log('Recarregando lista de filhos...');
          const userChildren = await getUserChildren(userId);
          console.log('Filhos obtidos após adição:', JSON.stringify(userChildren, null, 2));
          
          const newChildren = userChildren.map(child => ({
            id: child.id,
            name: child.name || '',
            age: child.age || '',
            grade: child.grade || '',
            school: child.school || ''
          }));
          
          console.log('Atualizando estado com novos filhos:', JSON.stringify(newChildren, null, 2));
          setChildren(newChildren);
          
          toast({
            title: 'Sucesso',
            description: 'Filho adicionado com sucesso!',
          });
        } catch (addError: any) {
          console.error('Erro detalhado ao adicionar filho:');
          console.error('Erro bruto:', addError);
          console.error('Mensagem de erro:', addError.message);
          console.error('Código de status:', addError.status);
          
          if (addError.code) {
            console.error('Código do erro:', addError.code);
          }
          
          if (addError.details) {
            console.error('Detalhes do erro:', addError.details);
          }
          
          if (addError.hint) {
            console.error('Dica do erro:', addError.hint);
          }
          
          console.error('Erro convertido para string:', JSON.stringify(addError, null, 2));
          
          toast({
            title: 'Erro ao adicionar filho',
            description: `${addError.message || 'Ocorreu um erro ao adicionar filho. Tente novamente.'}`,
            variant: 'destructive'
          });
          
          // Atualizar estado para remover carregamento
          setChildren(prev => prev.map(c => 
            c.id === child.id 
              ? { ...c, isSaving: false } 
              : c
          ));
          
          return; // Não re-lance para permitir que o usuário continue tentando
        }
      } else {
        // Filho existente - atualizar
        console.log('Atualizando filho existente:', child.id);
        console.log('Dados para atualização:', {
          name: child.name,
          age: child.age,
          grade: child.grade,
          school: child.school
        });
        
        try {
          const updateResult = await updateChild(child.id, {
            name: child.name,
            age: child.age,
            grade: child.grade,
            school: child.school
          });
          
          console.log('Resultado da atualização:', updateResult);
          
          // Atualizar estado local
          setChildren(prev => prev.map(c => 
            c.id === child.id 
              ? { ...c, isSaving: false, isNew: false } 
              : c
          ));
          
          toast({
            title: 'Sucesso',
            description: 'Dados do filho atualizados com sucesso!',
          });
        } catch (updateError: any) {
          console.error('Erro detalhado ao atualizar filho:');
          console.error('Erro bruto:', updateError);
          
          if (updateError.code) {
            console.error('Código do erro:', updateError.code);
          }
          
          if (updateError.details) {
            console.error('Detalhes do erro:', updateError.details);
          }
          
          if (updateError.hint) {
            console.error('Dica do erro:', updateError.hint);
          }
          
          if (updateError.message) {
            console.error('Mensagem de erro:', updateError.message);
          }
          
          toast({
            title: 'Erro ao atualizar filho',
            description: `${updateError.message || 'Ocorreu um erro ao atualizar filho. Tente novamente.'}`,
            variant: 'destructive'
          });
          
          // Atualizar estado para remover carregamento
          setChildren(prev => prev.map(c => 
            c.id === child.id 
              ? { ...c, isSaving: false } 
              : c
          ));
          
          return; // Não re-lance para permitir que o usuário continue tentando
        }
      }
    } catch (error: any) {
      // Log detalhado do erro
      console.error('--- ERRO AO SALVAR FILHO ---');
      console.error('Erro bruto:', error);
      
      if (error.code) {
        console.error('Código do erro:', error.code);
      }
      
      if (error.details) {
        console.error('Detalhes do erro:', error.details);
      }
      
      if (error.hint) {
        console.error('Dica do erro:', error.hint);
      }
      
      if (error.message) {
        console.error('Mensagem de erro:', error.message);
      }
      
      console.error('Stack trace:', error.stack);
      
      toast({
        title: 'Erro',
        description: `Não foi possível salvar os dados. ${error.message || 'Tente novamente.'}`,
        variant: 'destructive'
      })
      
      // Atualizar estado para remover carregamento
      setChildren(prev => prev.map(c => 
        c.id === child.id 
          ? { ...c, isSaving: false } 
          : c
      ));
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive'
      });
      return;
    }
    
    // Garantir que o userId está como string
    const userId = String(user.id);
    console.log('Salvando perfil para userId:', userId);
    
    // Validar campos obrigatórios
    if (!profileData.name.trim()) {
      toast({
        title: 'Dados incompletos',
        description: 'O nome completo é obrigatório.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar filhos
    const invalidChildren = children.filter(child => !validateChild(child));
    if (invalidChildren.length > 0) {
      toast({
        title: 'Dados de filhos incompletos',
        description: 'Preencha todos os campos obrigatórios dos filhos.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Atualizar perfil
      console.log('Atualizando perfil com dados:', {
        name: profileData.name,
        phone: profileData.phone,
        pais: profileData.pais
      });
      
      await updateUserProfile(userId, {
        name: profileData.name,
        phone: profileData.phone,
        pais: profileData.pais
      });
      
      // Processar filhos separadamente e capturar erros individualmente
      let successCount = 0;
      let errorCount = 0;
      
      for (const child of children) {
        try {
          if (child.id.startsWith('temp_')) {
            // Novo filho - adicionar
            console.log('Adicionando novo filho:', child.name);
            await addChild(userId, {
              name: child.name,
              age: child.age,
              grade: child.grade,
              school: child.school
            });
            successCount++;
          } else {
            // Filho existente - atualizar
            console.log('Atualizando filho existente:', child.id);
            await updateChild(child.id, {
              name: child.name,
              age: child.age,
              grade: child.grade,
              school: child.school
            });
            successCount++;
          }
        } catch (childError) {
          console.error('Erro ao processar filho:', child.name, childError);
          errorCount++;
          // Continue para o próximo filho, não interrompa todo o processo
        }
      }
      
      // Feedback com base no resultado
      if (errorCount === 0) {
        toast({
          title: 'Sucesso',
          description: 'Perfil salvo com sucesso!',
        });
      } else if (successCount > 0) {
        toast({
          title: 'Parcialmente salvo',
          description: `Perfil salvo, mas ${errorCount} filho(s) não puderam ser salvos.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Perfil salvo',
          description: 'Seus dados pessoais foram salvos, mas nenhum filho foi salvo.',
          variant: 'default'
        });
      }
      
      // Recarregar dados atualizados
      try {
        const userChildren = await getUserChildren(userId);
        setChildren(userChildren.map(child => ({
          id: child.id,
          name: child.name || '',
          age: child.age || '',
          grade: child.grade || '',
          school: child.school || ''
        })));
      } catch (reloadError) {
        console.error('Erro ao recarregar dados dos filhos:', reloadError);
        // Não exibir toast aqui para evitar sobrecarga de mensagens
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      
      // Verificar se é um erro específico do Supabase
      if (error.code && error.message) {
        console.error('Código do erro:', error.code);
        console.error('Mensagem do erro:', error.message);
        
        toast({
          title: 'Erro',
          description: `Erro ${error.code}: ${error.message}`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar o perfil. Tente novamente.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  const handleLogout = () => {
    logout()
  }

  // Função para salvar as configurações do usuário
  const handleSaveSettings = async () => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Faça login novamente.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Garantir que o userId está como string
      const userId = String(user.id);
      
      console.log('Salvando configurações do usuário:', settings);
      
      // Salvar as configurações no perfil do usuário
      await saveUserSettings(userId, settings);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Limpar as mensagens de erro após 5 segundos
  useEffect(() => {
    let toastIds: string[] = [];
    
    // Se a página carregou com toast avisos de erro, limpa depois de um tempo
    const timer = setTimeout(() => {
      // Obter os elementos toast da página
      const toastElements = document.querySelectorAll('[role="status"]');
      
      // Remover cada elemento
      toastElements.forEach(element => {
        element.remove();
      });
    }, 5000);
    
    // Limpar timer ao desmontar
    return () => {
      clearTimeout(timer);
      // Não tenta usar dismiss no toast diretamente para evitar erro
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p>Carregando dados do perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/avatar-placeholder.png" alt="Foto de perfil" />
            <AvatarFallback className="bg-edu-blue-100 text-edu-blue-700 font-medium text-xl">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{profileData.name || 'Seu Perfil'}</h1>
            <p className="text-muted-foreground">
              {profileData.email}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={profileData.name} 
                      onChange={handleProfileChange} 
                      placeholder="Seu nome completo" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      value={profileData.email}
                      disabled 
                      type="email" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Para alterar seu e-mail, entre em contato com o suporte.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={profileData.phone} 
                      onChange={handleProfileChange} 
                      placeholder="Seu número de telefone" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <select
                      id="pais"
                      name="pais"
                      value={profileData.pais}
                      onChange={handleProfileChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="Brasil">Brasil</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Angola">Angola</option>
                      <option value="Moçambique">Moçambique</option>
                      <option value="Cabo Verde">Cabo Verde</option>
                      <option value="Guiné-Bissau">Guiné-Bissau</option>
                      <option value="São Tomé e Príncipe">São Tomé e Príncipe</option>
                      <option value="Timor-Leste">Timor-Leste</option>
                      <option value="Macau">Macau</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                      <option value="Reino Unido">Reino Unido</option>
                      <option value="Canada">Canadá</option>
                      <option value="Espanha">Espanha</option>
                      <option value="França">França</option>
                      <option value="Alemanha">Alemanha</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Isso ajuda a adaptar o conteúdo ao sistema educacional do seu país.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Informações dos Filhos</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddChild}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Filho
                    </Button>
                  </div>
                  
                  {children.length === 0 && (
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-muted-foreground">Você ainda não adicionou nenhum filho.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddChild}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Filho
                      </Button>
                    </div>
                  )}
                  
                  {children.map((child) => (
                    <div key={child.id} className="mb-6 p-4 border rounded-lg" id={`child-${child.id}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">
                          {child.name ? child.name : 'Novo Filho'}
                        </h4>
                        <div className="flex items-center gap-2">
                          {child.isSaving ? (
                            <div className="text-xs text-muted-foreground">Salvando...</div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleQuickSaveChild(child)}
                              disabled={isSaving}
                              className="text-edu-blue-500 hover:text-edu-blue-700 hover:bg-edu-blue-50"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveChild(child.id)}
                            disabled={isSaving || child.isSaving}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`childName-${child.id}`}>Nome</Label>
                          <Input
                            id={`childName-${child.id}`}
                            value={child.name}
                            onChange={(e) => handleChildChange(child.id, 'name', e.target.value)}
                            className={child.hasErrors?.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            disabled={isSaving || child.isSaving}
                          />
                          {child.hasErrors?.name && (
                            <p className="text-xs text-red-500">{child.hasErrors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`childAge-${child.id}`}>Idade</Label>
                          <Input
                            id={`childAge-${child.id}`}
                            value={child.age}
                            onChange={(e) => handleChildChange(child.id, 'age', e.target.value)}
                            disabled={isSaving || child.isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`childGrade-${child.id}`}>Série/Ano</Label>
                          <Input
                            id={`childGrade-${child.id}`}
                            value={child.grade}
                            onChange={(e) => handleChildChange(child.id, 'grade', e.target.value)}
                            disabled={isSaving || child.isSaving}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`childSchool-${child.id}`}>Escola</Label>
                          <Input
                            id={`childSchool-${child.id}`}
                            value={child.school}
                            onChange={(e) => handleChildChange(child.id, 'school', e.target.value)}
                            disabled={isSaving || child.isSaving}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="eduBlue" 
                  onClick={handleSaveProfile} 
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Personalize sua experiência no EduPais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preferências de Conteúdo</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="difficultyLevel" className="text-base">Nível de Dificuldade das Explicações</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define o nível de detalhamento das explicações fornecidas pelo assistente.
                    </p>
                    
                    <RadioGroup
                      value={settings.difficultyLevel}
                      onValueChange={(value) => handleSettingsChange('difficultyLevel', value)}
                      className="space-y-4"
                    >
                      <div className="flex items-start space-x-2 border p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                        <RadioGroupItem value="easy" id="easy" className="mt-1" />
                        <div className="space-y-2 w-full">
                          <div className="flex items-center">
                            <Label htmlFor="easy" className="font-medium text-base cursor-pointer flex items-center">
                              <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                              Simplificado
                            </Label>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Explicações simples e diretas, ideais para crianças mais novas ou conteúdos iniciais. 
                            Usa linguagem básica e exemplos concretos.
                          </p>
                          <div className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 p-2 rounded-md">
                            Indicado para: Educação Infantil e Anos Iniciais (1º ao 3º ano)
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2 border p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                        <RadioGroupItem value="medium" id="medium" className="mt-1" />
                        <div className="space-y-2 w-full">
                          <div className="flex items-center">
                            <Label htmlFor="medium" className="font-medium text-base cursor-pointer flex items-center">
                              <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
                              Intermediário
                            </Label>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Nível equilibrado de detalhes, adequado para a maioria dos alunos. 
                            Combina explicações claras com profundidade suficiente para entender os conceitos.
                          </p>
                          <div className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 p-2 rounded-md">
                            Indicado para: Anos Intermediários (4º ao 6º ano)
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2 border p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                        <RadioGroupItem value="hard" id="hard" className="mt-1" />
                        <div className="space-y-2 w-full">
                          <div className="flex items-center">
                            <Label htmlFor="hard" className="font-medium text-base cursor-pointer flex items-center">
                              <span className="h-3 w-3 rounded-full bg-purple-500 mr-2"></span>
                              Avançado
                            </Label>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Explicações detalhadas que estimulam o pensamento crítico. 
                            Ideal para alunos mais velhos ou para aprofundar conhecimentos em tópicos complexos.
                          </p>
                          <div className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 p-2 rounded-md">
                            Indicado para: Anos Finais (7º ao 9º ano) e Ensino Médio
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificações
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notificationsEnabled" className="font-medium">Notificações no Aplicativo</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes sobre atividades e tarefas
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.notificationsEnabled}
                        data-state={settings.notificationsEnabled ? "checked" : "unchecked"}
                        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${settings.notificationsEnabled ? 'bg-edu-blue-500' : 'bg-input'}`}
                        onClick={() => handleSettingsChange('notificationsEnabled', !settings.notificationsEnabled)}
                      >
                        <span
                          data-state={settings.notificationsEnabled ? "checked" : "unchecked"}
                          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNotifications" className="font-medium">Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba resumos semanais do progresso
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.emailNotifications}
                        data-state={settings.emailNotifications ? "checked" : "unchecked"}
                        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${settings.emailNotifications ? 'bg-edu-blue-500' : 'bg-input'}`}
                        onClick={() => handleSettingsChange('emailNotifications', !settings.emailNotifications)}
                      >
                        <span
                          data-state={settings.emailNotifications ? "checked" : "unchecked"}
                          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Idioma e Aparência</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <select
                      id="language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={settings.language}
                      onChange={(e) => handleSettingsChange('language', e.target.value)}
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="darkMode" className="font-medium">Modo Escuro</Label>
                      <p className="text-sm text-muted-foreground">
                        Alterar para tema escuro
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.darkMode}
                        data-state={settings.darkMode ? "checked" : "unchecked"}
                        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${settings.darkMode ? 'bg-edu-blue-500' : 'bg-input'}`}
                        onClick={() => handleSettingsChange('darkMode', !settings.darkMode)}
                      >
                        <span
                          data-state={settings.darkMode ? "checked" : "unchecked"}
                          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${settings.darkMode ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
                <Button 
                  variant="eduBlue" 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Profile 