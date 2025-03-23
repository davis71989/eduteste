import { useState } from 'react'
import {
  Save,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Users,
  Link,
  Globe,
  Database,
  Mail,
  Cloud,
  UploadCloud,
  Info,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
  CheckCircle,
  RotateCcw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'EduPais',
    siteDescription: 'Plataforma educacional para pais e escolas',
    contactEmail: 'contato@edupais.com',
    logoUrl: '/logo.svg',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newUserNotifications: true,
    newContentNotifications: true,
    systemUpdates: true,
    marketingEmails: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordPolicy: 'medium',
    sessionTimeout: '30',
    allowMultipleSessions: true,
    enforceSSL: true,
    ipRestriction: false
  })

  const [permissionSettings, setPermissionSettings] = useState({
    defaultUserRole: 'user',
    allowRegistration: true,
    manualApproval: false,
    allowUserDeletion: false,
    maxChildren: '5'
  })

  const [apiSettings, setApiSettings] = useState({
    apiEnabled: true,
    apiKey: 'sk_edp_7a8b9c0d1e2f3g4h5i6j7k8l9m0n',
    rateLimit: '100',
    webhookUrl: 'https://api.edupais.com.br/webhook',
    logApiCalls: true
  })

  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const [llmSettings, setLlmSettings] = useState({
    defaultModel: 'gpt-4',
    openaiApiKey: '',
    anthropicApiKey: '',
    deepseekApiKey: '',
    
    enableAIChat: true,
    maxMessagesPerDay: 50,
    responseTimeout: 30,
    streamResponses: true,
    
    temperature: 0.7,
    maxTokens: 1000,
    
    enableParentChat: true,
    enableTeacherAssistant: true,
    enableContentGeneration: true,
    enableHomeworkHelp: true,
    
    contentFiltering: 'medium',
    storagePolicy: 'temporary',
    saveConversations: true,
    userDataAccessLevel: 'minimal'
  })

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSecurityChange = (key: string, value: string | boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePermissionChange = (key: string, value: string | boolean) => {
    setPermissionSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleApiChange = (key: string, value: string | boolean) => {
    setApiSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const generateApiKey = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'sk_edp_'
    for (let i = 0; i < 32; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    
    setApiSettings(prev => ({
      ...prev,
      apiKey: result
    }))
    
    setApiKeyVisible(true)
  }

  const handleLlmSettingsChange = (field: string, value: any) => {
    setLlmSettings({
      ...llmSettings,
      [field]: value
    })
  }

  const handleSaveSettings = () => {
    console.log('Configurações salvas:', {
      generalSettings,
      notificationSettings,
      securitySettings,
      permissionSettings,
      apiSettings,
      llmSettings
    })
    
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 3000)
  }

  const systemInfo = {
    version: '1.5.2',
    phpVersion: '8.2.7',
    dbVersion: 'MySQL 8.0.30',
    environment: 'Produção',
    serverOS: 'Linux Ubuntu 22.04 LTS',
    lastUpdated: '15/03/2023',
    uptime: '45 dias, 12 horas',
    memoryUsage: '2.4 GB / 8 GB',
    diskUsage: '58.3 GB / 250 GB'
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Configurações do Sistema</h1>
          <p className="text-gray-500">Gerencie as configurações da plataforma EduPais</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          Salvar Alterações
        </Button>
      </div>

      {showSuccessMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5" />
          Configurações salvas com sucesso!
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="ai">Inteligência Artificial</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={generalSettings.siteName}
                    onChange={handleGeneralChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma Principal</Label>
                  <Select 
                    value={generalSettings.language} 
                    onValueChange={(value: string) => setGeneralSettings({...generalSettings, language: value})}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (United States)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                      <SelectItem value="fr-FR">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descrição do Site</Label>
                <Textarea
                  id="siteDescription"
                  name="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={handleGeneralChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contato</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={handleGeneralChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL do Logo</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    value={generalSettings.logoUrl}
                    onChange={handleGeneralChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    value={generalSettings.primaryColor}
                    onChange={handleGeneralChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <Input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    value={generalSettings.secondaryColor}
                    onChange={handleGeneralChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select 
                    value={generalSettings.timezone} 
                    onValueChange={(value: string) => setGeneralSettings({...generalSettings, timezone: value})}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Selecione um fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">América/São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">América/Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Europa/Londres (GMT+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Europa/Paris (GMT+1)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Ásia/Tóquio (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Gerencie como as notificações são enviadas e recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-sm font-medium">Notificações por Email</h3>
                    <p className="text-sm text-gray-500">Enviar notificações por email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-sm font-medium">Notificações Push</h3>
                    <p className="text-sm text-gray-500">Enviar notificações push para dispositivos</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('pushNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-sm font-medium">Novos Usuários</h3>
                    <p className="text-sm text-gray-500">Receber notificação quando novos usuários se registrarem</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newUserNotifications}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('newUserNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-sm font-medium">Novo Conteúdo</h3>
                    <p className="text-sm text-gray-500">Receber notificação quando novo conteúdo for publicado</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newContentNotifications}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('newContentNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-sm font-medium">Atualizações do Sistema</h3>
                    <p className="text-sm text-gray-500">Receber notificação sobre atualizações do sistema</p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemUpdates}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('systemUpdates', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Emails de Marketing</h3>
                    <p className="text-sm text-gray-500">Receber emails de marketing e promoções</p>
                  </div>
                  <Switch
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked: boolean) => handleNotificationChange('marketingEmails', checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-gray-500">
                As configurações de notificação afetam apenas o painel administrativo. Os usuários podem configurar suas próprias preferências de notificação em seus perfis.
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure os parâmetros de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">Autenticação de Dois Fatores</h3>
                  <p className="text-sm text-gray-500">Exigir 2FA para todos os administradores</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked: boolean) => handleSecurityChange('twoFactorAuth', checked)}
                />
              </div>
              
              <div className="space-y-2 border-b pb-4">
                <Label htmlFor="passwordPolicy">Política de Senha</Label>
                <Select 
                  value={securitySettings.passwordPolicy} 
                  onValueChange={(value: string) => handleSecurityChange('passwordPolicy', value)}
                >
                  <SelectTrigger id="passwordPolicy">
                    <SelectValue placeholder="Selecione a política de senha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (mínimo 6 caracteres)</SelectItem>
                    <SelectItem value="medium">Média (mín. 8 caracteres, incluindo números)</SelectItem>
                    <SelectItem value="high">Alta (mín. 10 caracteres, números e símbolos)</SelectItem>
                    <SelectItem value="very-high">Muito Alta (mín. 12 caracteres, maiúsculas, minúsculas, números e símbolos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 border-b pb-4">
                <Label htmlFor="sessionTimeout">Tempo Limite da Sessão (minutos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                  min="5"
                  max="1440"
                />
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">Permitir Sessões Múltiplas</h3>
                  <p className="text-sm text-gray-500">Permitir que usuários façam login em vários dispositivos simultaneamente</p>
                </div>
                <Switch
                  checked={securitySettings.allowMultipleSessions}
                  onCheckedChange={(checked: boolean) => handleSecurityChange('allowMultipleSessions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">Forçar SSL</h3>
                  <p className="text-sm text-gray-500">Requer conexão segura (HTTPS) para acessar o sistema</p>
                </div>
                <Switch
                  checked={securitySettings.enforceSSL}
                  onCheckedChange={(checked: boolean) => handleSecurityChange('enforceSSL', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Restrição de IP</h3>
                  <p className="text-sm text-gray-500">Limitar o acesso administrativo a IPs específicos</p>
                </div>
                <Switch
                  checked={securitySettings.ipRestriction}
                  onCheckedChange={(checked: boolean) => handleSecurityChange('ipRestriction', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Permissões</CardTitle>
              <CardDescription>
                Configure as permissões e papéis de usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 border-b pb-4">
                <Label htmlFor="defaultUserRole">Papel de Usuário Padrão</Label>
                <Select 
                  value={permissionSettings.defaultUserRole} 
                  onValueChange={(value: string) => handlePermissionChange('defaultUserRole', value)}
                >
                  <SelectTrigger id="defaultUserRole">
                    <SelectValue placeholder="Selecione o papel padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="premium">Usuário Premium</SelectItem>
                    <SelectItem value="contributor">Contribuidor</SelectItem>
                    <SelectItem value="moderator">Moderador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">Permitir Registro</h3>
                  <p className="text-sm text-gray-500">Permitir que novos usuários se registrem na plataforma</p>
                </div>
                <Switch
                  checked={permissionSettings.allowRegistration}
                  onCheckedChange={(checked: boolean) => handlePermissionChange('allowRegistration', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">Aprovação Manual de Usuários</h3>
                  <p className="text-sm text-gray-500">Exigir aprovação de administrador para novos registros</p>
                </div>
                <Switch
                  checked={permissionSettings.manualApproval}
                  onCheckedChange={(checked: boolean) => handlePermissionChange('manualApproval', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">Permitir Exclusão de Conta</h3>
                  <p className="text-sm text-gray-500">Permitir que usuários excluam suas próprias contas</p>
                </div>
                <Switch
                  checked={permissionSettings.allowUserDeletion}
                  onCheckedChange={(checked: boolean) => handlePermissionChange('allowUserDeletion', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxChildren">Número Máximo de Filhos por Conta</Label>
                <Input
                  id="maxChildren"
                  type="number"
                  value={permissionSettings.maxChildren}
                  onChange={(e) => handlePermissionChange('maxChildren', e.target.value)}
                  min="1"
                  max="20"
                />
                <p className="text-sm text-gray-500">Defina como 0 para não ter limite</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API e Integrações</CardTitle>
              <CardDescription>
                Configure API, webhooks e integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-sm font-medium">API Ativada</h3>
                  <p className="text-sm text-gray-500">Permitir acesso à API da plataforma</p>
                </div>
                <Switch
                  checked={apiSettings.apiEnabled}
                  onCheckedChange={(checked: boolean) => handleApiChange('apiEnabled', checked)}
                />
              </div>
              
              <div className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiKey">Chave da API</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateApiKey}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw size={14} />
                    Gerar Nova
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={apiKeyVisible ? "text" : "password"}
                    value={apiSettings.apiKey}
                    readOnly
                  />
                  <button 
                    type="button"
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {apiKeyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-amber-600">Nunca compartilhe sua chave API e regenere-a caso suspeite de comprometimento.</p>
              </div>
              
              <div className="space-y-2 border-b pb-4">
                <Label htmlFor="rateLimit">Limite de Requisições (por minuto)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={apiSettings.rateLimit}
                  onChange={(e) => handleApiChange('rateLimit', e.target.value)}
                  min="10"
                  max="1000"
                />
              </div>
              
              <div className="space-y-2 border-b pb-4">
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={apiSettings.webhookUrl}
                  onChange={(e) => handleApiChange('webhookUrl', e.target.value)}
                  placeholder="https://exemplo.com/webhook"
                />
                <p className="text-sm text-gray-500">URL para receber notificações de eventos da plataforma</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Registrar Chamadas de API</h3>
                  <p className="text-sm text-gray-500">Manter registros de todas as chamadas de API</p>
                </div>
                <Switch
                  checked={apiSettings.logApiCalls}
                  onCheckedChange={(checked: boolean) => handleApiChange('logApiCalls', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>Integrações com Modelos de IA</CardTitle>
              <CardDescription>
                Configure as integrações com modelos de linguagem para chat, geração de conteúdo e assistência educacional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações Gerais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultModel">Modelo Padrão</Label>
                    <Select 
                      value={llmSettings.defaultModel}
                      onValueChange={(value) => handleLlmSettingsChange('defaultModel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>OpenAI</SelectLabel>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Anthropic</SelectLabel>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Deepseek</SelectLabel>
                          <SelectItem value="deepseek-coder">Deepseek Coder</SelectItem>
                          <SelectItem value="deepseek-chat">Deepseek Chat</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contentFiltering">Filtragem de Conteúdo</Label>
                    <Select 
                      value={llmSettings.contentFiltering}
                      onValueChange={(value) => handleLlmSettingsChange('contentFiltering', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nível de filtragem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Chaves de API</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                    <div className="flex">
                      <Input 
                        id="openaiApiKey"
                        type="password" 
                        value={llmSettings.openaiApiKey} 
                        onChange={(e) => handleLlmSettingsChange('openaiApiKey', e.target.value)}
                        placeholder="sk-..." 
                        className="flex-1"
                      />
                      <Button variant="outline" className="ml-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Obtenha sua chave em https://platform.openai.com/api-keys</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anthropicApiKey">Anthropic API Key</Label>
                    <div className="flex">
                      <Input 
                        id="anthropicApiKey"
                        type="password" 
                        value={llmSettings.anthropicApiKey} 
                        onChange={(e) => handleLlmSettingsChange('anthropicApiKey', e.target.value)}
                        placeholder="sk-ant-..." 
                        className="flex-1"
                      />
                      <Button variant="outline" className="ml-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Obtenha sua chave em https://console.anthropic.com/keys</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deepseekApiKey">Deepseek API Key</Label>
                    <div className="flex">
                      <Input 
                        id="deepseekApiKey"
                        type="password" 
                        value={llmSettings.deepseekApiKey} 
                        onChange={(e) => handleLlmSettingsChange('deepseekApiKey', e.target.value)}
                        placeholder="..." 
                        className="flex-1"
                      />
                      <Button variant="outline" className="ml-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Obtenha sua chave no site do Deepseek</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Casos de Uso</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableParentChat" className="font-medium">Chat para Pais</Label>
                      <p className="text-sm text-gray-500">Permite que pais conversem com a IA para esclarecer dúvidas educacionais</p>
                    </div>
                    <Switch 
                      id="enableParentChat"
                      checked={llmSettings.enableParentChat}
                      onCheckedChange={(checked) => handleLlmSettingsChange('enableParentChat', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableTeacherAssistant" className="font-medium">Assistente para Professores</Label>
                      <p className="text-sm text-gray-500">Permite que professores utilizem a IA para planejar aulas e atividades</p>
                    </div>
                    <Switch 
                      id="enableTeacherAssistant"
                      checked={llmSettings.enableTeacherAssistant}
                      onCheckedChange={(checked) => handleLlmSettingsChange('enableTeacherAssistant', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableContentGeneration" className="font-medium">Geração de Conteúdo</Label>
                      <p className="text-sm text-gray-500">Utiliza a IA para gerar conteúdo educacional personalizado</p>
                    </div>
                    <Switch 
                      id="enableContentGeneration"
                      checked={llmSettings.enableContentGeneration}
                      onCheckedChange={(checked) => handleLlmSettingsChange('enableContentGeneration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableHomeworkHelp" className="font-medium">Ajuda com Deveres de Casa</Label>
                      <p className="text-sm text-gray-500">Permite que alunos obtenham ajuda com trabalhos escolares</p>
                    </div>
                    <Switch 
                      id="enableHomeworkHelp"
                      checked={llmSettings.enableHomeworkHelp}
                      onCheckedChange={(checked) => handleLlmSettingsChange('enableHomeworkHelp', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações Avançadas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperatura</Label>
                    <div className="flex items-center space-x-2">
                      <Slider 
                        id="temperature"
                        value={[llmSettings.temperature * 100]} 
                        min={0} 
                        max={100} 
                        step={1}
                        onValueChange={(values: number[]) => handleLlmSettingsChange('temperature', values[0] / 100)}
                      />
                      <span className="text-sm text-gray-700">{llmSettings.temperature.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Controla a aleatoriedade das respostas. Valores baixos = respostas mais previsíveis.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Tokens Máximos</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        id="maxTokens"
                        type="number" 
                        value={llmSettings.maxTokens} 
                        onChange={(e) => handleLlmSettingsChange('maxTokens', parseInt(e.target.value))}
                        min={100}
                        max={4000}
                        className="w-24"
                      />
                      <Slider 
                        value={[llmSettings.maxTokens]} 
                        min={100} 
                        max={4000} 
                        step={100}
                        onValueChange={(values: number[]) => handleLlmSettingsChange('maxTokens', values[0])}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Limite de tokens para cada resposta da IA.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxMessagesPerDay">Mensagens Diárias por Usuário</Label>
                    <Input 
                      id="maxMessagesPerDay"
                      type="number" 
                      value={llmSettings.maxMessagesPerDay} 
                      onChange={(e) => handleLlmSettingsChange('maxMessagesPerDay', parseInt(e.target.value))}
                      min={1}
                    />
                    <p className="text-xs text-gray-500">Limite de mensagens por dia para cada usuário.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responseTimeout">Timeout de Resposta (segundos)</Label>
                    <Input 
                      id="responseTimeout"
                      type="number" 
                      value={llmSettings.responseTimeout} 
                      onChange={(e) => handleLlmSettingsChange('responseTimeout', parseInt(e.target.value))}
                      min={5}
                    />
                    <p className="text-xs text-gray-500">Tempo máximo de espera para respostas da IA.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label htmlFor="streamResponses" className="font-medium">Streaming de Respostas</Label>
                    <p className="text-sm text-gray-500">Exibe as respostas gradualmente enquanto são geradas</p>
                  </div>
                  <Switch 
                    id="streamResponses"
                    checked={llmSettings.streamResponses}
                    onCheckedChange={(checked) => handleLlmSettingsChange('streamResponses', checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Privacidade e Segurança</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="saveConversations" className="font-medium">Salvar Conversas</Label>
                      <p className="text-sm text-gray-500">Armazenar histórico de conversas com a IA para análise e melhoria</p>
                    </div>
                    <Switch 
                      id="saveConversations"
                      checked={llmSettings.saveConversations}
                      onCheckedChange={(checked) => handleLlmSettingsChange('saveConversations', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storagePolicy">Política de Armazenamento</Label>
                    <Select 
                      value={llmSettings.storagePolicy}
                      onValueChange={(value) => handleLlmSettingsChange('storagePolicy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a política" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporário (30 dias)</SelectItem>
                        <SelectItem value="medium">Médio Prazo (90 dias)</SelectItem>
                        <SelectItem value="permanent">Permanente</SelectItem>
                        <SelectItem value="none">Não Armazenar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userDataAccessLevel">Nível de Acesso aos Dados</Label>
                    <Select 
                      value={llmSettings.userDataAccessLevel}
                      onValueChange={(value) => handleLlmSettingsChange('userDataAccessLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Mínimo (apenas resumos)</SelectItem>
                        <SelectItem value="moderate">Moderado (dados relevantes)</SelectItem>
                        <SelectItem value="full">Completo (todo o histórico)</SelectItem>
                        <SelectItem value="none">Nenhum</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Define o nível de acesso que a IA tem aos dados do usuário para contextualização.</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <Button variant="secondary" className="mr-2">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar Padrões
                </Button>
                <Button variant="default">
                  <Check className="h-4 w-4 mr-2" />
                  Testar Conexões
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>
                Visão geral das informações técnicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Versão do EduPais</h3>
                    <p className="font-medium">{systemInfo.version}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Ambiente</h3>
                    <p className="font-medium">{systemInfo.environment}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">PHP</h3>
                    <p className="font-medium">{systemInfo.phpVersion}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Banco de Dados</h3>
                    <p className="font-medium">{systemInfo.dbVersion}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Sistema Operacional</h3>
                    <p className="font-medium">{systemInfo.serverOS}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Última Atualização</h3>
                    <p className="font-medium">{systemInfo.lastUpdated}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tempo de Atividade</h3>
                    <p className="font-medium">{systemInfo.uptime}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Uso de Memória</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: '30%' }}
                      ></div>
                    </div>
                    <p className="font-medium">{systemInfo.memoryUsage}</p>
                  </div>
                  
                  <div className="rounded-lg border p-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Uso de Disco</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: '23%' }}
                      ></div>
                    </div>
                    <p className="font-medium">{systemInfo.diskUsage}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="flex items-center gap-2">
                <UploadCloud size={16} />
                Verificar atualizações
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Database size={16} />
                Fazer backup
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" className="mr-2">Cancelar</Button>
        <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
      </div>
    </div>
  )
}

export default Settings 