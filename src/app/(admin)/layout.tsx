/* =================================================================
   CAIROOM - Admin Layout
   تخطيط لوحة التحكم
   ================================================================= */

'use client';

import { AdminSidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/Header';
import { Toaster } from '@/components/ui/sonner';
import { InventoryProvider } from '@/contexts/InventoryContext';
import { PromocodeProvider } from '@/contexts/PromocodeContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <InventoryProvider>
            <PromocodeProvider>
                <div className="min-h-screen" dir="rtl">
                    {/* الشريط الجانبي */}
                    <AdminSidebar />

                    {/* المحتوى الرئيسي */}
                    <div className="lg:mr-72 transition-all duration-300">
                        {/* شريط الرأس */}
                        <AdminHeader />

                        {/* المحتوى */}
                        <main className="p-6">
                            {children}
                        </main>
                    </div>

                    {/* Toaster للإشعارات */}
                    <Toaster position="bottom-left" richColors />
                </div>
            </PromocodeProvider>
        </InventoryProvider>
    );
}
