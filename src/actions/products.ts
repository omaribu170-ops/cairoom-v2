'use server';

import { createClient } from '@/lib/supabase/server';
import { Product } from '@/types/database';

export async function getProducts() {
    const supabase = createClient();
    const { data, error } = await (await supabase)
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data as Product[];
}
