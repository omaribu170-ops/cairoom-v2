/* =================================================================
   CAIROOM - Supabase Client (Browser)
   العميل الأساسي للمتصفح
   ================================================================= */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Fallback values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// إنشاء عميل Supabase للمتصفح
export function createClient() {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// عميل مبسط للاستخدام المباشر (lazy initialization)
let _supabaseClient: ReturnType<typeof createClient> | null = null;
export const getSupabase = () => {
    if (!_supabaseClient) {
        _supabaseClient = createClient();
    }
    return _supabaseClient;
};

