'use server';

import { createClient } from '@/lib/supabase/server';
import { User } from '@/types/database';

export async function searchMembers(query: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10); // Limit results for performance

    if (error) {
        console.error('Error searching members:', error);
        return [];
    }
    return data as User[];
}

export async function createMember(memberData: { name: string; phone: string; gender?: 'male' | 'female' }) {
    const supabase = await createClient();

    // Check for existing phone
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', memberData.phone)
        .single();

    if (existing) {
        throw new Error('رقم الهاتف موجود بالفعل');
    }

    const { data, error } = await supabase
        .from('users')
        .insert({
            full_name: memberData.name,
            phone: memberData.phone,
            role: 'user',
        } as any)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data as User;
}
