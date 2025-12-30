'use server';

import { createClient } from '@/lib/supabase/server';
import { Hall, Table } from '@/types/database';

export async function getHallsWithTables() {
    const supabase = createClient();

    // Fetch Halls
    const { data: halls, error: hallsError } = await (await supabase)
        .from('halls')
        .select('*')
        .order('name');

    if (hallsError) throw new Error(hallsError.message);

    // Fetch Tables linked to Halls or Independent
    // For simplicity in the dashboard, we might want ALL tables, 
    // identifying which belong to a hall and which don't.
    const { data: tables, error: tablesError } = await (await supabase)
        .from('tables')
        .select('*')
        .order('name');

    if (tablesError) throw new Error(tablesError.message);

    // Attach tables to their respective halls logic can be done frontend side 
    // or we can return a structured object here. 
    // For now, returning both raw lists is flexible.
    return { halls: halls as Hall[], tables: tables as Table[] };
}
