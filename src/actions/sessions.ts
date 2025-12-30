'use server';

import { createClient } from '@/lib/supabase/server';
import { Session, SessionStatus, Order } from '@/types/database';

export async function getActiveSessions() {
    const supabase: any = createClient();

    // Complex fetch: Sessions + Attendees (users) + Orders (products) + Tables + Halls
    // Supabase JS joined query syntax
    const { data, error } = await (await supabase)
        .from('sessions')
        .select(`
      *,
      table:tables!table_id(*),
      hall:halls!hall_id(*),
      orders:orders(*, product:products(*))
    `)
        .eq('status', 'active')
        .order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching active sessions:', error);
        return [];
    }
    return data;
}

export type CreateSessionInput = {
    type: 'table' | 'hall';
    tableId?: string; // For table session
    hallId?: string; // For hall session
    hallTableIds?: string[]; // Tables reserved in the hall
    members: { id: string; name: string }[];
};

export async function createSession(input: CreateSessionInput) {
    const supabaseClient: any = await createClient(); // Await the client creation

    // 1. Create Session Record
    const { data: session, error: sessionError } = await supabaseClient
        .from('sessions')
        .insert({
            table_id: input.type === 'table' ? input.tableId : null,
            hall_id: input.type === 'hall' ? input.hallId : null,
            table_ids: input.hallTableIds || [],
            status: 'active',
            start_time: new Date().toISOString(),
            attendees: input.members.map(m => ({
                user_id: m.id,
                name: m.name,
                joined_at: new Date().toISOString(),
                left_at: null
            })),
            guest_count: input.members.length
        })
        .select()
        .single();

    if (sessionError) throw new Error(sessionError.message);

    // 2. Mark Tables as Busy
    // If Table Session:
    if (input.type === 'table' && input.tableId) {
        await supabaseClient.from('tables').update({ status: 'busy' }).eq('id', input.tableId);
    }
    // If Hall Session:
    if (input.type === 'hall' && input.hallTableIds?.length) {
        await supabaseClient.from('tables').update({ status: 'busy' }).in('id', input.hallTableIds);
    }

    return session;
}

export async function endSession(sessionId: string, sessionData: Session) {
    const supabaseClient: any = await createClient();

    // 1. Calculate totals (logic likely mirrored from frontend, but valid here too)
    // For now, we trust the frontend will likely pass final amounts or we rely on triggers/client to update `total_amount` before calling this.
    // However, simplest is to just mark completed and let the DB trigger free the tables.

    const { error } = await supabaseClient
        .from('sessions')
        .update({
            status: 'completed',
            end_time: new Date().toISOString()
        })
        .eq('id', sessionId);

    if (error) throw new Error(error.message);

    // 2. Free tables logic is handled by DB Trigger `update_table_status`, 
    // BUT we need to support the custom `hallTableIds` which the trigger might not know about if it only looks at `table_id`.
    // Let's manually free them to be safe.
    if (sessionData.hall_id && sessionData.table_ids && Array.isArray(sessionData.table_ids)) {
        await supabaseClient.from('tables').update({ status: 'available' }).in('id', sessionData.table_ids);
    }
}

export async function addSessionOrder(sessionId: string, productId: string, quantity: number, price: number) {
    const supabaseClient: any = await createClient();

    const { data, error } = await supabaseClient
        .from('orders')
        .insert({
            session_id: sessionId,
            product_id: productId,
            quantity,
            price_at_time: price,
            status: 'delivered' // Immediate delivery for now
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function updateSessionMember(sessionId: string, memberId: string, updates: any) {
    const supabaseClient: any = await createClient();

    // 1. Get current session to read attendees
    const { data: session, error: fetchError } = await supabaseClient
        .from('sessions')
        .select('attendees')
        .eq('id', sessionId)
        .single();

    if (fetchError || !session) throw new Error('Session not found');

    // 2. Update specific member in attendees array
    const currentAttendees = session.attendees as any[] || [];
    const updatedAttendees = currentAttendees.map(m => {
        if (m.user_id === memberId) {
            return { ...m, ...updates };
        }
        return m;
    });

    // 3. Save back to DB
    const { error: updateError } = await supabaseClient
        .from('sessions')
        .update({ attendees: updatedAttendees })
        .eq('id', sessionId);

    if (updateError) throw new Error(updateError.message);
}

export async function switchSessionTable(sessionId: string, oldTableId: string, newTableId: string) {
    const supabaseClient: any = await createClient();

    // 1. Mark old table available
    if (oldTableId) {
        await supabaseClient.from('tables').update({ status: 'available' }).eq('id', oldTableId);
    }

    // 2. Mark new table busy
    const { error: tableError } = await supabaseClient.from('tables').update({ status: 'busy' }).eq('id', newTableId);
    if (tableError) throw new Error(tableError.message);

    // 3. Update session
    const { error: sessionError } = await supabaseClient
        .from('sessions')
        .update({ table_id: newTableId })
        .eq('id', sessionId);

    if (sessionError) throw new Error(sessionError.message);
}
