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
                    email: string | null
                    gender: string | null
                    nickname: string | null
                    full_id_card: string | null
                    address: string | null
                    membership_tier: 'basic' | 'vip' | 'elite'
                    wallet_balance: number
                    role: string | null
                    referral_code: string | null
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    phone: string
                    email?: string | null
                    gender?: string | null
                    nickname?: string | null
                    full_id_card?: string | null
                    address?: string | null
                    membership_tier?: 'basic' | 'vip' | 'elite'
                    wallet_balance?: number
                    role?: string | null
                    referral_code?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    phone?: string
                    email?: string | null
                    gender?: string | null
                    nickname?: string | null
                    full_id_card?: string | null
                    address?: string | null
                    membership_tier?: 'basic' | 'vip' | 'elite'
                    wallet_balance?: number
                    role?: string | null
                    referral_code?: string | null
                    avatar_url?: string | null
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
            sessions: {
                Row: {
                    id: string
                    table_id: number | null
                    customer_name: string | null
                    member_id: string | null
                    start_time: string
                    end_time: string | null
                    duration_minutes: number
                    session_cost: number
                    orders_cost: number
                    total_amount: number
                    discount_amount: number
                    promocode_code: string | null
                    final_total: number
                    status: string
                    payment_method: string | null
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    table_id?: number | null
                    customer_name?: string | null
                    member_id?: string | null
                    start_time?: string
                    end_time?: string | null
                    duration_minutes?: number
                    session_cost?: number
                    orders_cost?: number
                    total_amount?: number
                    discount_amount?: number
                    promocode_code?: string | null
                    final_total?: number
                    status?: string
                    payment_method?: string | null
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    table_id?: number | null
                    customer_name?: string | null
                    member_id?: string | null
                    start_time?: string
                    end_time?: string | null
                    duration_minutes?: number
                    session_cost?: number
                    orders_cost?: number
                    total_amount?: number
                    discount_amount?: number
                    promocode_code?: string | null
                    final_total?: number
                    status?: string
                    payment_method?: string | null
                    created_by?: string | null
                }
            }
            session_orders: {
                Row: {
                    id: string
                    session_id: string
                    product_id: string
                    quantity: number
                    price_at_time: number
                    total_price: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    product_id: string
                    quantity: number
                    price_at_time: number
                    total_price?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    product_id?: string
                    quantity?: number
                    price_at_time?: number
                    total_price?: number
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
