export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assinaturas: {
        Row: {
          id: string
          usuario_id: string
          plano_id: string
          status: string
          data_inicio: string | null
          data_fim: string | null
          renovacao_automatica: boolean | null
          metodo_pagamento: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_checkout_session_id: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          plano_id: string
          status: string
          data_inicio?: string | null
          data_fim?: string | null
          renovacao_automatica?: boolean | null
          metodo_pagamento?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_checkout_session_id?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          plano_id?: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
          renovacao_automatica?: boolean | null
          metodo_pagamento?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_checkout_session_id?: string | null
        }
      }
      planos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          preco: number
          recorrente: boolean
          periodo_recorrencia: string | null
          recursos: Json | null
          nivel: number | null
          ativo: boolean
          stripe_product_id: string | null
          stripe_price_id: string | null
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          preco: number
          recorrente?: boolean
          periodo_recorrencia?: string | null
          recursos?: Json | null
          nivel?: number | null
          ativo?: boolean
          stripe_product_id?: string | null
          stripe_price_id?: string | null
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          preco?: number
          recorrente?: boolean
          periodo_recorrencia?: string | null
          recursos?: Json | null
          nivel?: number | null
          ativo?: boolean
          stripe_product_id?: string | null
          stripe_price_id?: string | null
        }
      }
      users: {
        Row: {
          id: string
          nome_completo: string | null
          email: string | null
          telefone: string | null
          status_conta: string | null
          avatar_url: string | null
          endereco: Json | null
          data_cadastro: string | null
          ultimo_login: string | null
          plano_atual: string | null
        }
        Insert: {
          id: string
          nome_completo?: string | null
          email?: string | null
          telefone?: string | null
          status_conta?: string | null
          avatar_url?: string | null
          endereco?: Json | null
          data_cadastro?: string | null
          ultimo_login?: string | null
          plano_atual?: string | null
        }
        Update: {
          id?: string
          nome_completo?: string | null
          email?: string | null
          telefone?: string | null
          status_conta?: string | null
          avatar_url?: string | null
          endereco?: Json | null
          data_cadastro?: string | null
          ultimo_login?: string | null
          plano_atual?: string | null
        }
      }
    }
  }
} 