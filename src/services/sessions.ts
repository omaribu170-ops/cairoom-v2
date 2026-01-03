import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase-generated';

type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionOrderInsert = Database['public']['Tables']['session_orders']['Insert'];

export const SessionsService = {
    async endSession(sessionData: SessionInsert, orders: Omit<SessionOrderInsert, 'session_id'>[]) {
        const supabase = createClient();

        // 1. Create Session
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert(sessionData)
            .select()
            .single();

        if (sessionError) throw sessionError;
        if (!session) throw new Error('Failed to create session');

        // 2. Create Orders
        if (orders.length > 0) {
            const ordersWithSessionId = orders.map(o => ({ ...o, session_id: session.id }));
            const { error: ordersError } = await supabase
                .from('session_orders')
                .insert(ordersWithSessionId);

            if (ordersError) throw ordersError;
        }

        return session;
    },

    async getHistory() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                session_orders (*)
            `)
            .order('end_time', { ascending: false });

        if (error) throw error;
        return data;
    }
};
