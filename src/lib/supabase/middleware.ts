/* =================================================================
   CAIROOM - Middleware for Auth
   الوسيط للمصادقة
   ================================================================= */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Check if Supabase credentials are configured
const isSupabaseConfigured = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
};

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    // If Supabase is not configured, skip auth and allow demo mode
    if (!isSupabaseConfigured()) {
        console.log('[CAIROOM] Supabase not configured - running in demo mode');
        return supabaseResponse;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // إحضار المستخدم الحالي
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // المسارات العامة التي لا تحتاج مصادقة
    const publicPaths = ['/login', '/register', '/'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path);

    // المسارات المحمية للإدارة
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

    // إذا لم يكن هناك مستخدم وكان المسار محمي
    if (!user && isAdminPath) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // التحقق من صلاحيات الأدمن
    if (user && isAdminPath) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData && !['super_admin', 'moderator'].includes(userData.role)) {
            const url = request.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

