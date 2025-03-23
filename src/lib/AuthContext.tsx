import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { getCurrentUser, signOut, getUserProfile, createUserProfile, updateUserProfile } from './supabase'

type AuthContextType = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      
      if (currentUser) {
        console.log('Usuário logado:', currentUser)
        console.log('Metadados do usuário:', currentUser.user_metadata)
        
        // Verifica se o usuário tem um perfil e se o nome está atualizado
        try {
          const userProfile = await getUserProfile(currentUser.id)
          const userName = currentUser.user_metadata?.name || 
                          currentUser.user_metadata?.full_name || 
                          '';
                          
          if (!userProfile) {
            // Se não tiver perfil, cria um
            await createUserProfile(currentUser.id, userName, currentUser.email || '')
          } else if (!userProfile.name && userName) {
            // Se o perfil existe mas não tem nome, atualiza com o nome dos metadados
            await updateUserProfile(currentUser.id, { name: userName })
          }
        } catch (profileError) {
          console.error('Erro ao verificar/atualizar perfil:', profileError)
        }
        
        setUser(currentUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      await refreshUser()
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    refreshUser,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 