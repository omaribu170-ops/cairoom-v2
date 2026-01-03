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
            members: {
                Row: {
                    id: string
                    full_name: string
                    phone: string
                    nickname: string | null
                    full_id_card: string | null
                    address: string | null
                    membership_tier: 'basic' | 'vip' | 'elite'
                    wallet_balance: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    phone: string
                    nickname?: string | null
                    full_id_card?: string | null
                    address?: string | null
                    membership_tier?: 'basic' | 'vip' | 'elite'
                    wallet_balance?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    phone?: string
                    nickname?: string | null
                    full_id_card?: string | null
                    address?: string | null
                    membership_tier?: 'basic' | 'vip' | 'elite'
                    wallet_balance?: number
                    created_at?: string
                }
            }
            staff: {
                Row: {
                    id: string
                    name: string
                    role: 'admin' | 'manager' | 'waiter'
                    phone: string | null
                    base_salary: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    role: 'admin' | 'manager' | 'waiter'
                    phone?: string | null
                    base_salary?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    role?: 'admin' | 'manager' | 'waiter'
                    phone?: string | null
                    base_salary?: number
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    category: string
                    price: number
                    cost: number
                    stock: number
                    min_stock: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category: string
                    price: number
                    cost?: number
                    stock?: number
                    min_stock?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string
                    price?: number
                    cost?: number
                    stock?: number
                    min_stock?: number
                    is_active?: boolean
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
