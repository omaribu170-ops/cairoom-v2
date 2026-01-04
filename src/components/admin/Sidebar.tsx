/* =================================================================
   CAIROOM - Admin Sidebar Component
   الشريط الجانبي للوحة التحكم
   ================================================================= */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    Table2,
    Package,
    UserCog,
    BarChart3,
    ClipboardCheck,
    Gamepad2,
    Megaphone,
    Settings,
    Radio,
    LogOut,
    ChevronRight,
    Menu,
    X,
    Play,
    TicketPercent,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// قائمة الروابط
const menuItems = [
    {
        title: 'لوحة التحكم',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'الطاولات والقاعات',
        href: '/tables',
        icon: Table2,
    },
    {
        title: 'Bookings',
        href: '/bookings',
        icon: Calendar,
    },
    {
        title: 'الجلسات',
        href: '/sessions',
        icon: Play,
    },
    {
        title: 'الأعضاء',
        href: '/members',
        icon: Users,
    },
    {
        title: 'المخزن',
        href: '/inventory',
        icon: Package,
    },
    {
        title: 'الموظفين والمهام',
        href: '/staff',
        icon: UserCog,
    },
    {
        title: 'الإحصائيات المالية',
        href: '/statistics',
        icon: BarChart3,
    },
    {
        title: 'العمليات',
        href: '/operations',
        icon: ClipboardCheck,
    },
    {
        title: 'الترفيه',
        href: '/entertainment',
        icon: Gamepad2,
    },
    {
        title: 'التسويق',
        href: '/marketing',
        icon: Megaphone,
    },
    {
        title: 'أكواد الخصم',
        href: '/promocodes',
        icon: TicketPercent,
    },
    {
        title: 'الإعدادات',
        href: '/settings',
        icon: Settings,
    },
    {
        title: 'الراديو الداخلي',
        href: '/radio',
        icon: Radio,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* زر القائمة للموبايل */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 right-4 z-50 lg:hidden glass-button"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* خلفية سوداء للموبايل */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* الشريط الجانبي */}
            <aside
                className={cn(
                    'fixed top-0 right-0 h-screen z-50 transition-all duration-300',
                    'sidebar-glass flex flex-col',
                    isCollapsed ? 'w-20' : 'w-72',
                    isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
                )}
            >
                {/* الشعار */}
                <div className="p-6 border-b border-white/10">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
                            <span className="text-xl font-bold">C</span>
                        </div>
                        {!isCollapsed && (
                            <div>
                                <h1 className="text-xl font-bold gradient-text">CAIROOM</h1>
                                <p className="text-xs text-muted-foreground">لوحة التحكم</p>
                            </div>
                        )}
                    </Link>
                </div>

                {/* القائمة */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    'sidebar-item',
                                    isActive && 'active'
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!isCollapsed && (
                                    <>
                                        <span className="flex-1">{item.title}</span>
                                        {isActive && <ChevronRight className="h-4 w-4" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* زر التصغير (للديسكتوب فقط) */}
                <div className="p-4 border-t border-white/10 hidden lg:block">
                    <Button
                        variant="ghost"
                        className="w-full glass-button justify-center"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <ChevronRight
                            className={cn(
                                'h-5 w-5 transition-transform',
                                isCollapsed ? 'rotate-180' : ''
                            )}
                        />
                        {!isCollapsed && <span className="mr-2">تصغير</span>}
                    </Button>
                </div>

                {/* تسجيل الخروج */}
                <div className="p-4 border-t border-white/10">
                    <Button
                        variant="ghost"
                        className={cn(
                            'w-full glass-button text-red-400 hover:text-red-300 hover:bg-red-500/10',
                            isCollapsed ? 'justify-center' : 'justify-start'
                        )}
                    >
                        <LogOut className="h-5 w-5" />
                        {!isCollapsed && <span className="mr-2">تسجيل الخروج</span>}
                    </Button>
                </div>
            </aside>
        </>
    );
}
