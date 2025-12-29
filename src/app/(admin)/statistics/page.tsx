/* =================================================================
   CAIROOM - Financial Statistics Page
   صفحة الإحصائيات المالية
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatArabicNumber } from '@/lib/utils';
import {
    BarChart3, TrendingUp, TrendingDown, Users, Table2, ShoppingBag,
    Gamepad2, Trophy, Wallet, Download, Clock, DollarSign,
} from 'lucide-react';

const mockStats = {
    totalRevenue: 45780, revenueChange: 12.5, tablesRevenue: 32450,
    productsRevenue: 13330, totalMembers: 124, newMembersThisMonth: 18,
    avgSessionsPerDay: 8.5, gameNightsCount: 8, gameNightsRevenue: 2400,
    gameNightsPrizes: 1800, gameNightsProfit: 600, totalExpenses: 8500,
    staffRequestsCost: 1200, netProfit: 36080,
};

const topMembers = {
    bySpending: [{ name: 'أحمد محمد', value: 3250 }, { name: 'سارة أحمد', value: 2890 }, { name: 'محمد علي', value: 2450 }],
    byHours: [{ name: 'عمر حسن', value: 68 }, { name: 'أحمد محمد', value: 52 }, { name: 'ياسمين خالد', value: 45 }],
    byWins: [{ name: 'عمر حسن', value: 20 }, { name: 'أحمد محمد', value: 12 }, { name: 'محمد علي', value: 8 }],
};

const dailyRevenueData = [
    { day: 'السبت', amount: 1850 }, { day: 'الأحد', amount: 2200 },
    { day: 'الاثنين', amount: 1650 }, { day: 'الثلاثاء', amount: 1900 },
    { day: 'الأربعاء', amount: 2450 }, { day: 'الخميس', amount: 3200 },
    { day: 'الجمعة', amount: 3800 },
];

type TimeFilter = 'daily' | 'monthly' | 'semiannual' | 'annual';

export default function StatisticsPage() {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');

    return (
        <div className="space-y-6">
            {/* العنوان والفلاتر */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">الإحصائيات المالية</h1>
                    <p className="text-muted-foreground mt-1">تحليل شامل للإيرادات والمصروفات</p>
                </div>
                <div className="flex gap-3">
                    <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                        <TabsList className="glass-card">
                            <TabsTrigger value="daily">يومي</TabsTrigger>
                            <TabsTrigger value="monthly">شهري</TabsTrigger>
                            <TabsTrigger value="semiannual">نصف سنوي</TabsTrigger>
                            <TabsTrigger value="annual">سنوي</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button className="gradient-button"><Download className="h-4 w-4 ml-2" />تصدير PDF</Button>
                </div>
            </div>

            {/* البطاقات الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                                <h3 className="text-2xl font-bold mt-1">{formatCurrency(mockStats.totalRevenue)}</h3>
                                <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400">
                                    <TrendingUp className="h-4 w-4" /><span>+{mockStats.revenueChange}%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#E63E32] to-[#F18A21]">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">صافي الربح</p>
                                <h3 className="text-2xl font-bold mt-1 text-emerald-400">{formatCurrency(mockStats.netProfit)}</h3>
                                <p className="text-sm text-muted-foreground mt-2">{((mockStats.netProfit / mockStats.totalRevenue) * 100).toFixed(1)}% من الإيرادات</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/20"><TrendingUp className="h-6 w-6 text-emerald-400" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي الأعضاء</p>
                                <h3 className="text-2xl font-bold mt-1">{formatArabicNumber(mockStats.totalMembers)}</h3>
                                <p className="text-sm text-emerald-400 mt-2">+{mockStats.newMembersThisMonth} هذا الشهر</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/20"><Users className="h-6 w-6 text-blue-400" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">متوسط الجلسات/يوم</p>
                                <h3 className="text-2xl font-bold mt-1">{mockStats.avgSessionsPerDay}</h3>
                                <p className="text-sm text-muted-foreground mt-2">جلسة يومياً</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/20"><Clock className="h-6 w-6 text-purple-400" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* توزيع الإيرادات + ليالي الألعاب */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-[#F18A21]" />توزيع الإيرادات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2"><span className="flex items-center gap-2"><Table2 className="h-4 w-4" />إيرادات الطاولات</span><span className="font-bold">{formatCurrency(mockStats.tablesRevenue)}</span></div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#E63E32] to-[#F18A21] rounded-full" style={{ width: `${(mockStats.tablesRevenue / mockStats.totalRevenue) * 100}%` }} /></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2"><span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" />إيرادات المنتجات</span><span className="font-bold">{formatCurrency(mockStats.productsRevenue)}</span></div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#F18A21] to-[#F8C033] rounded-full" style={{ width: `${(mockStats.productsRevenue / mockStats.totalRevenue) * 100}%` }} /></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Gamepad2 className="h-5 w-5 text-purple-400" />ليالي الألعاب</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5"><p className="text-sm text-muted-foreground">عدد البطولات</p><p className="text-2xl font-bold">{mockStats.gameNightsCount}</p></div>
                            <div className="p-4 rounded-xl bg-white/5"><p className="text-sm text-muted-foreground">إيرادات الاشتراكات</p><p className="text-2xl font-bold text-emerald-400">{formatCurrency(mockStats.gameNightsRevenue)}</p></div>
                            <div className="p-4 rounded-xl bg-white/5"><p className="text-sm text-muted-foreground">الجوائز المدفوعة</p><p className="text-2xl font-bold text-red-400">{formatCurrency(mockStats.gameNightsPrizes)}</p></div>
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-sm text-muted-foreground">صافي الربح</p><p className="text-2xl font-bold text-emerald-400">{formatCurrency(mockStats.gameNightsProfit)}</p></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* الرسم البياني */}
            <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-[#F18A21]" />الإيرادات اليومية</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between gap-2 h-48">
                        {dailyRevenueData.map((day, index) => {
                            const maxAmount = Math.max(...dailyRevenueData.map((d) => d.amount));
                            const height = (day.amount / maxAmount) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{formatCurrency(day.amount)}</span>
                                    <div className="w-full rounded-t-lg bg-gradient-to-t from-[#E63E32] to-[#F8C033]" style={{ height: `${height}%` }} />
                                    <span className="text-xs">{day.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Top Members */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-400" />أكثر إنفاقاً</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.bySpending.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E63E32] to-[#F8C033] flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm">{m.name}</span></div>
                                    <span className="text-sm font-medium text-emerald-400">{formatCurrency(m.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-400" />أكثر ساعات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.byHours.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm">{m.name}</span></div>
                                    <span className="text-sm font-medium text-blue-400">{m.value} ساعة</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-400" />أكثر انتصارات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.byWins.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm">{m.name}</span></div>
                                    <span className="text-sm font-medium text-yellow-400">{m.value} فوز</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* المصروفات */}
            <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingDown className="h-5 w-5 text-red-400" />ملخص المصروفات</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-sm text-muted-foreground">المصروفات التشغيلية</p><p className="text-2xl font-bold text-red-400">{formatCurrency(mockStats.totalExpenses)}</p></div>
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"><p className="text-sm text-muted-foreground">طلبات الموظفين</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(mockStats.staffRequestsCost)}</p></div>
                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"><p className="text-sm text-muted-foreground">جوائز البطولات</p><p className="text-2xl font-bold text-purple-400">{formatCurrency(mockStats.gameNightsPrizes)}</p></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
