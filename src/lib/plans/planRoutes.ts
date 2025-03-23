import express, { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { 
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getUserActivePlan,
  checkUserLimits
} from './planService'

// Tipos estendidos para a requisição com usuário autenticado
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
  supabase?: any;
}

// Esquema de validação para criação de plano
const createPlanSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  descricao: z.string().optional(),
  preco: z.number().min(0, { message: 'Preço não pode ser negativo' }),
  intervalo: z.string().default('mensal'),
  recursos: z.record(z.boolean()).optional().default({}),
  ativo: z.boolean().default(true),
  tokens_limit: z.number().int().min(0),
  messages_limit: z.number().int().min(0),
  stripe_price_id: z.string().optional(),
  stripe_product_id: z.string().optional()
})

// Esquema de validação para atualização de plano
const updatePlanSchema = createPlanSchema.partial()

// Middleware para verificar se o usuário é administrador
const isAdminMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { user } = req
    
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    
    const { data } = await req.supabase
      .from('perfis_usuarios')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (data?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem gerenciar planos.' })
    }
    
    next()
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error)
    res.status(500).json({ error: 'Erro ao verificar permissões' })
  }
}

const router = express.Router()

/**
 * @route GET /api/plans
 * @desc Listar todos os planos ativos
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const plans = await getAllPlans()
    res.json(plans)
  } catch (error: any) {
    console.error('Erro ao listar planos:', error)
    res.status(500).json({ error: error.message || 'Erro ao listar planos' })
  }
})

/**
 * @route GET /api/plans/:id
 * @desc Obter detalhes de um plano específico
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const plan = await getPlanById(id)
    
    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' })
    }
    
    res.json(plan)
  } catch (error: any) {
    console.error('Erro ao buscar plano:', error)
    res.status(500).json({ error: error.message || 'Erro ao buscar plano' })
  }
})

/**
 * @route POST /api/plans
 * @desc Criar um novo plano
 * @access Admin
 */
router.post('/', isAdminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validationResult = createPlanSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: validationResult.error.format() 
      })
    }
    
    const planData = validationResult.data
    const newPlan = await createPlan(planData)
    
    res.status(201).json(newPlan)
  } catch (error: any) {
    console.error('Erro ao criar plano:', error)
    res.status(500).json({ error: error.message || 'Erro ao criar plano' })
  }
})

/**
 * @route PATCH /api/plans/:id
 * @desc Atualizar um plano existente
 * @access Admin
 */
router.patch('/:id', isAdminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const validationResult = updatePlanSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: validationResult.error.format() 
      })
    }
    
    // Verificar se o plano existe
    const existingPlan = await getPlanById(id)
    if (!existingPlan) {
      return res.status(404).json({ error: 'Plano não encontrado' })
    }
    
    const planData = validationResult.data
    const updatedPlan = await updatePlan(id, planData)
    
    res.json(updatedPlan)
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error)
    res.status(500).json({ error: error.message || 'Erro ao atualizar plano' })
  }
})

/**
 * @route DELETE /api/plans/:id
 * @desc Excluir (desativar) um plano
 * @access Admin
 */
router.delete('/:id', isAdminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    
    // Verificar se o plano existe
    const existingPlan = await getPlanById(id)
    if (!existingPlan) {
      return res.status(404).json({ error: 'Plano não encontrado' })
    }
    
    await deletePlan(id)
    
    res.status(204).send()
  } catch (error: any) {
    console.error('Erro ao excluir plano:', error)
    res.status(500).json({ error: error.message || 'Erro ao excluir plano' })
  }
})

/**
 * @route GET /api/plans/user/current
 * @desc Obter o plano atual do usuário logado
 * @access Private
 */
router.get('/user/current', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req
    
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    
    const plan = await getUserActivePlan(user.id)
    
    if (!plan) {
      return res.status(404).json({ message: 'Usuário não possui plano ativo' })
    }
    
    res.json(plan)
  } catch (error: any) {
    console.error('Erro ao buscar plano do usuário:', error)
    res.status(500).json({ error: error.message || 'Erro ao buscar plano do usuário' })
  }
})

/**
 * @route GET /api/plans/user/limits
 * @desc Verificar limites atuais do usuário
 * @access Private
 */
router.get('/user/limits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req
    
    if (!user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    
    const limits = await checkUserLimits(user.id)
    
    res.json(limits)
  } catch (error: any) {
    console.error('Erro ao verificar limites do usuário:', error)
    res.status(500).json({ error: error.message || 'Erro ao verificar limites do usuário' })
  }
})

export default router 