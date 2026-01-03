import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase-generated';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

export const MembersService = {
    async getAll() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Member[];
    },

    async getById(id: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Member;
    },

    async create(member: MemberInsert) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('members')
            .insert(member as any)
            .select()
            .single();

        if (error) throw error;
        return data as Member;
    },

    async update(id: string, updates: MemberUpdate) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('members')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Member;
    },

    async delete(id: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
