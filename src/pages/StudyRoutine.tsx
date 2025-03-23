import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit2 as Edit, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/AuthContext'
import { 
  getChildStudyRoutine, 
  addRoutineItem, 
  updateRoutineItem, 
  removeRoutineItem, 
  toggleRoutineItemCompletion,
  getUserChildren,
  StudyRoutineItem
} from '@/lib/supabase'

type Child = {
  id: string
  name: string
  age: string
  grade: string
  school: string
}

const daysOfWeek = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
]

const subjects = [
  { value: 'matematica', label: 'Matemática', color: 'bg-blue-100 text-blue-800' },
  { value: 'portugues', label: 'Português', color: 'bg-red-100 text-red-800' },
  { value: 'ciencias', label: 'Ciências', color: 'bg-green-100 text-green-800' },
  { value: 'historia', label: 'História', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'geografia', label: 'Geografia', color: 'bg-purple-100 text-purple-800' },
  { value: 'ingles', label: 'Inglês', color: 'bg-pink-100 text-pink-800' },
  { value: 'artes', label: 'Artes', color: 'bg-orange-100 text-orange-800' },
  { value: 'educacaofisica', label: 'Educação Física', color: 'bg-teal-100 text-teal-800' },
]

const StudyRoutine = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [routineItems, setRoutineItems] = useState<StudyRoutineItem[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  const [newItem, setNewItem] = useState<Omit<StudyRoutineItem, 'id' | 'child_id' | 'user_id' | 'created_at' | 'updated_at' | 'completed'>>({
    title: '',
    description: '',
    day: 'Segunda-feira',
    time: '',
    duration: '',
    subject: 'matematica'
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  
  // Carregar filhos e selecionar o primeiro por padrão
  useEffect(() => {
    const loadChildren = async () => {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const userChildren = await getUserChildren(user.id)
        
        if (userChildren.length === 0) {
          setIsLoading(false)
          toast({
            title: 'Sem filhos cadastrados',
            description: 'Adicione filhos no seu perfil para criar rotinas de estudo',
            variant: 'destructive'
          })
          return
        }
        
        setChildren(userChildren)
        setSelectedChildId(userChildren[0].id)
      } catch (error) {
        console.error('Erro ao carregar filhos:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus filhos. Tente novamente.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadChildren()
  }, [user, toast])
  
  // Carregar rotina de estudos quando o filho selecionado mudar
  useEffect(() => {
    const loadRoutine = async () => {
      if (!selectedChildId) return
      
      try {
        setIsLoading(true)
        const routineData = await getChildStudyRoutine(selectedChildId)
        setRoutineItems(routineData)
      } catch (error) {
        console.error('Erro ao carregar rotina de estudos:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a rotina de estudos. Tente novamente.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (selectedChildId) {
      loadRoutine()
    }
  }, [selectedChildId, toast])

  const handleAddItem = async () => {
    if (!user?.id || !selectedChildId || !newItem.title || !newItem.time) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      
      if (editingItemId) {
        // Editar item existente
        await updateRoutineItem(editingItemId, newItem)
        toast({
          title: 'Sucesso',
          description: 'Atividade atualizada com sucesso!',
        })
      } else {
        // Adicionar novo item
        await addRoutineItem(user.id, selectedChildId, {
          ...newItem,
          completed: false
        })
        toast({
          title: 'Sucesso',
          description: 'Atividade adicionada com sucesso!',
        })
      }
      
      // Recarregar a rotina
      const updatedRoutine = await getChildStudyRoutine(selectedChildId)
      setRoutineItems(updatedRoutine)
      
      // Resetar formulário
      setNewItem({
        title: '',
        description: '',
        day: 'Segunda-feira',
        time: '',
        duration: '',
        subject: 'matematica'
      })
      
      setEditingItemId(null)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar/atualizar item:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a atividade. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditItem = (id: string) => {
    const item = routineItems.find(item => item.id === id)
    if (!item) return

    setNewItem({
      title: item.title,
      description: item.description,
      day: item.day,
      time: item.time,
      duration: item.duration,
      subject: item.subject
    })
    
    setEditingItemId(id)
    setIsDialogOpen(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!selectedChildId) return
    
    try {
      setIsLoading(true)
      await removeRoutineItem(id)
      
      // Atualizar localmente para feedback imediato
      setRoutineItems(prev => prev.filter(item => item.id !== id))
      
      toast({
        title: 'Sucesso',
        description: 'Atividade removida com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a atividade. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async (id: string) => {
    const item = routineItems.find(item => item.id === id)
    if (!item) return
    
    try {
      setIsLoading(true)
      
      // Atualizar localmente para feedback imediato
      setRoutineItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, completed: !item.completed } 
            : item
        )
      )
      
      // Atualizar no servidor
      await toggleRoutineItemCompletion(id, !item.completed)
    } catch (error) {
      console.error('Erro ao atualizar status do item:', error)
      
      // Reverter alteração local em caso de erro
      setRoutineItems(prev => 
        prev.map(i => 
          i.id === id 
            ? { ...i, completed: item.completed } 
            : i
        )
      )
      
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status da atividade. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId)
  }

  const getSubjectColor = (subjectValue: string) => {
    return subjects.find(s => s.value === subjectValue)?.color || 'bg-gray-100 text-gray-800'
  }

  const getSubjectLabel = (subjectValue: string) => {
    return subjects.find(s => s.value === subjectValue)?.label || 'Outro'
  }
  
  // Tela de carregamento
  if (isLoading && children.length === 0) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }
  
  // Tela para usuários sem filhos cadastrados
  if (children.length === 0 && !isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Rotina de Estudos</h1>
            <p className="text-muted-foreground mb-8">
              Para criar uma rotina de estudos, você precisa cadastrar pelo menos um filho.
            </p>
            <Button variant="eduBlue" onClick={() => window.location.href = '/profile'}>
              Ir para o Perfil
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rotina de Estudos</h1>
            <p className="text-muted-foreground">
              Organize e acompanhe a rotina de estudos do seu filho
            </p>
          </div>
          
          {/* Seletor de filho */}
          {children.length > 0 && (
            <div className="flex items-center gap-4">
              <label htmlFor="child-select" className="font-medium">
                Filho:
              </label>
              <select
                id="child-select"
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedChildId}
                onChange={(e) => handleChildChange(e.target.value)}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="eduBlue" className="flex items-center gap-2 whitespace-nowrap">
                <Plus className="h-4 w-4" />
                Adicionar Atividade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItemId ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da atividade de estudo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Ex: Revisão de Matemática"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Ex: Resolver exercícios de equações do 2º grau"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="day">Dia da Semana</Label>
                    <select
                      id="day"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newItem.day}
                      onChange={(e) => setNewItem({ ...newItem, day: e.target.value })}
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Matéria</Label>
                    <select
                      id="subject"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newItem.subject}
                      onChange={(e) => setNewItem({ ...newItem, subject: e.target.value })}
                    >
                      {subjects.map((subject) => (
                        <option key={subject.value} value={subject.value}>
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="5"
                      value={newItem.duration}
                      onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                      placeholder="Ex: 30"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false)
                  setEditingItemId(null)
                  setNewItem({
                    title: '',
                    description: '',
                    day: 'Segunda-feira',
                    time: '',
                    duration: '',
                    subject: 'matematica'
                  })
                }}>
                  Cancelar
                </Button>
                <Button variant="eduBlue" onClick={handleAddItem}>
                  {editingItemId ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {selectedChildId && routineItems.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2">Nenhuma atividade de estudo cadastrada</h2>
            <p className="text-muted-foreground mb-8">
              Adicione atividades para criar uma rotina de estudos para {children.find(c => c.id === selectedChildId)?.name || 'seu filho'}
            </p>
            <Button variant="eduBlue" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Atividade
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agrupar por dia da semana */}
            {daysOfWeek.map((day) => {
              const dayItems = routineItems.filter((item) => item.day === day)
              if (dayItems.length === 0) return null
              
              return (
                <Card key={day} className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      {day}
                    </CardTitle>
                    <CardDescription>
                      {dayItems.length} {dayItems.length === 1 ? 'atividade' : 'atividades'} programada{dayItems.length === 1 ? '' : 's'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dayItems
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-lg border ${
                              item.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.title}
                                  </h3>
                                  <span className={`text-xs px-2 py-1 rounded-full ${getSubjectColor(item.subject)}`}>
                                    {getSubjectLabel(item.subject)}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className={`mt-1 text-sm ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {item.time}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.duration} min
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggleComplete(item.id)}
                                >
                                  <CheckCircle className={`h-5 w-5 ${item.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditItem(item.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyRoutine 