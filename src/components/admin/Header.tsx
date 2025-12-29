/* =================================================================
   CAIROOM - Admin Header Component
   شريط الرأس للوحة التحكم
   ================================================================= */

'use client';

import { Bell, Search, User, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AdminHeader() {
    const [isOnline, setIsOnline] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // متابعة حالة الإنترنت
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // تحديث الوقت
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(date);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    return (
        <header className="h-16 glass-card rounded-none border-t-0 border-x-0 sticky top-0 z-30">
            <div className="h-full px-6 flex items-center justify-between">
                {/* حالة الإنترنت + الوقت */}
                <div className="flex items-center gap-4">
                    {/* حالة الاتصال */}
                    {!isOnline && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm animate-pulse">
                            <WifiOff className="h-4 w-4" />
                            <span>النت هرب يا بوي</span>
                        </div>
                    )}

                    {/* التاريخ والوقت */}
                    <div className="hidden md:block text-sm text-muted-foreground">
                        <span className="font-medium">{formatDate(currentTime)}</span>
                        <span className="mx-2">|</span>
                        <span className="font-mono timer-pulse">{formatTime(currentTime)}</span>
                    </div>
                </div>

                {/* البحث */}
                <div className="flex-1 max-w-md mx-4 hidden lg:block">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ابحث عن أي حاجة..."
                            className="glass-input pr-10"
                        />
                    </div>
                </div>

                {/* الإجراءات */}
                <div className="flex items-center gap-3">
                    {/* حالة الاتصال (للديسكتوب) */}
                    <div className="hidden md:flex items-center gap-1 text-xs">
                        {isOnline ? (
                            <>
                                <Wifi className="h-4 w-4 text-emerald-400" />
                                <span className="text-emerald-400">متصل</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-4 w-4 text-red-400" />
                                <span className="text-red-400">غير متصل</span>
                            </>
                        )}
                    </div>

                    {/* الإشعارات */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="glass-button relative">
                                <Bell className="h-5 w-5" />
                                <Badge className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                                    3
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-modal w-80">
                            <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                                <span className="font-medium">طلب سحب جديد</span>
                                <span className="text-xs text-muted-foreground">أحمد محمد طلب سحب ١٠٠ ج.م</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                                <span className="font-medium">جلسة جديدة</span>
                                <span className="text-xs text-muted-foreground">طاولة ٣ بدأت من ٥ دقايق</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                                <span className="font-medium">مخزون منخفض</span>
                                <span className="text-xs text-muted-foreground">القهوة خلصت تقريباً</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* الملف الشخصي */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="glass-button gap-2 px-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-gradient-to-r from-[#E63E32] to-[#F8C033] text-white">
                                        أ
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium">أحمد الأدمن</p>
                                    <p className="text-xs text-muted-foreground">مدير النظام</p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-modal">
                            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="ml-2 h-4 w-4" />
                                الملف الشخصي
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Bell className="ml-2 h-4 w-4" />
                                الإشعارات
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-400">
                                تسجيل الخروج
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
