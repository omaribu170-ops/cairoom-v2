/* =================================================================
   CAIROOM - Table Card Component
   بطاقة الطاولة
   ================================================================= */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SessionTimer } from './SessionTimer';
import { Table, Session } from '@/types/database';
import { cn, formatCurrency, statusTexts } from '@/lib/utils';
import { Users, Play, Square, Settings, Clock } from 'lucide-react';

interface TableCardProps {
    table: Table;
    session?: Session | null;
    onStartSession: (tableId: string) => void;
    onEndSession: (sessionId: string) => void;
    onManage: (tableId: string) => void;
}

export function TableCard({
    table,
    session,
    onStartSession,
    onEndSession,
    onManage,
}: TableCardProps) {
    const isActive = table.status === 'busy' && session;

    return (
        <Card className={cn(
            'glass-card-hover overflow-hidden relative',
            isActive && 'ring-2 ring-[#F18A21]/50'
        )}>
            {/* حالة الطاولة */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-1',
                isActive ? 'bg-gradient-to-r from-[#E63E32] to-[#F8C033]' : 'bg-emerald-500'
            )} />

            <CardContent className="p-5">
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold">{table.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Users className="h-4 w-4" />
                            <span>{table.capacity_min}-{table.capacity_max} أشخاص</span>
                        </div>
                    </div>
                    <Badge className={cn(
                        'px-3 py-1',
                        isActive ? 'status-busy' : 'status-available'
                    )}>
                        {isActive ? statusTexts.busy : statusTexts.available}
                    </Badge>
                </div>

                {/* السعر */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">السعر/ساعة/فرد</span>
                        <span className="font-medium">{formatCurrency(table.price_per_hour_per_person)}</span>
                    </div>
                </div>

                {/* محتوى الجلسة النشطة */}
                {isActive && session && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-[#E63E32]/10 to-[#F8C033]/10 border border-white/10">
                        {/* المؤقت */}
                        <SessionTimer startTime={session.start_time} />

                        {/* تفاصيل الجلسة */}
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">عدد الضيوف</span>
                                <span className="font-medium">{session.guest_count} ضيف</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الحاضرين</span>
                                <span className="font-medium">
                                    {session.attendees?.length > 0
                                        ? session.attendees.slice(0, 2).map(a => a.name).join('، ')
                                        : 'غير محدد'}
                                    {session.attendees?.length > 2 && ` +${session.attendees.length - 2}`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* الأزرار */}
                <div className="flex gap-2">
                    {isActive ? (
                        <>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => onEndSession(session!.id)}
                            >
                                <Square className="h-4 w-4 ml-2" />
                                إنهاء الجلسة
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="glass-button"
                                onClick={() => onManage(table.id)}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                className="flex-1 gradient-button"
                                onClick={() => onStartSession(table.id)}
                            >
                                <Play className="h-4 w-4 ml-2" />
                                بدء جلسة
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="glass-button"
                                onClick={() => onManage(table.id)}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
