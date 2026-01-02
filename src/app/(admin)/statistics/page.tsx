/* =================================================================
   CAIROOM - Financial Statistics Page
   صفحة الإحصائيات المالية - بيانات حقيقية مع فلاتر
   ================================================================= */

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatArabicNumber } from '@/lib/utils';
import {
    BarChart3, TrendingUp, TrendingDown, Users, Table2, ShoppingBag,
    Gamepad2, Trophy, Wallet, Download, Clock, DollarSign, UserPlus,
} from 'lucide-react';

// =====================================================================
// بيانات تجريبية متوافقة مع باقي الصفحات
// =====================================================================

// الأعضاء (من /members)
const mockMembers = [
    { id: '1', full_name: 'أحمد محمد السعيدي', game_stats: { wins: 12, attended: 25 }, created_at: '2024-01-15T10:30:00Z' },
    { id: '2', full_name: 'محمد علي', game_stats: { wins: 5, attended: 15 }, created_at: '2024-02-20T15:45:00Z' },
    { id: '3', full_name: 'سارة أحمد', game_stats: { wins: 8, attended: 12 }, created_at: '2024-03-10T09:00:00Z' },
    { id: '4', full_name: 'عمر حسن', game_stats: { wins: 20, attended: 30 }, created_at: '2024-12-01T12:00:00Z' },
    { id: '5', full_name: 'ياسمين خالد', game_stats: { wins: 3, attended: 8 }, created_at: '2024-12-25T08:00:00Z' },
];

// سجل الزيارات (من /members)
const mockVisitHistory = [
    { id: 'v1', memberId: '1', date: '2024-12-28', startTime: '14:00', endTime: '17:30', totalCost: 163 },
    { id: 'v2', memberId: '1', date: '2024-12-25', startTime: '10:00', endTime: '12:00', totalCost: 100 },
    { id: 'v3', memberId: '1', date: '2024-12-20', startTime: '16:00', endTime: '19:00', totalCost: 350 },
    { id: 'v4', memberId: '2', date: '2024-12-27', startTime: '11:00', endTime: '14:00', totalCost: 120 },
    { id: 'v5', memberId: '3', date: '2024-12-25', startTime: '15:00', endTime: '18:00', totalCost: 150 },
    { id: 'v6', memberId: '4', date: '2024-12-28', startTime: '09:00', endTime: '12:00', totalCost: 200 },
    { id: 'v7', memberId: '5', date: '2024-12-28', startTime: '18:00', endTime: '21:00', totalCost: 180 },
    { id: 'v8', memberId: '2', date: '2024-12-01', startTime: '10:00', endTime: '13:00', totalCost: 90 },
    { id: 'v9', memberId: '3', date: '2024-12-15', startTime: '14:00', endTime: '17:00', totalCost: 130 },
    { id: 'v10', memberId: '4', date: '2024-12-10', startTime: '11:00', endTime: '15:00', totalCost: 250 },
];

// الجلسات (لحساب إجمالي الطاولات والمنتجات)
const mockSessions = [
    { id: 's1', date: '2024-12-28', timeCost: 88, ordersCost: 75, grandTotal: 163 },
    { id: 's2', date: '2024-12-28', timeCost: 700, ordersCost: 30, grandTotal: 730 },
    { id: 's3', date: '2024-12-27', timeCost: 60, ordersCost: 60, grandTotal: 120 },
    { id: 's4', date: '2024-12-26', timeCost: 800, ordersCost: 0, grandTotal: 800 },
    { id: 's5', date: '2024-12-25', timeCost: 50, ordersCost: 25, grandTotal: 75 },
    { id: 's6', date: '2024-12-24', timeCost: 120, ordersCost: 45, grandTotal: 165 },
    { id: 's7', date: '2024-12-23', timeCost: 200, ordersCost: 80, grandTotal: 280 },
    { id: 's8', date: '2024-12-22', timeCost: 150, ordersCost: 35, grandTotal: 185 },
    { id: 's9', date: '2024-12-21', timeCost: 300, ordersCost: 100, grandTotal: 400 },
    { id: 's10', date: '2024-12-20', timeCost: 250, ordersCost: 90, grandTotal: 340 },
];

// البطولات (من /entertainment)
const mockTournaments = [
    { id: 't1', name: 'بطولة ليلة الجمعة', date: '2024-12-27', entry_fee: 50, prize_pool: 400, participants: 12, winner_id: '4', total_prizes: 400 }, // Added total_prizes
    { id: 't2', name: 'بطولة الشطرنج', date: '2024-12-20', entry_fee: 30, prize_pool: 200, participants: 8, winner_id: '1', total_prizes: 200 },
    { id: 't3', name: 'مسابقة الورق', date: '2024-12-15', entry_fee: 25, prize_pool: 150, participants: 10, winner_id: '4', total_prizes: 150 },
    { id: 't4', name: 'ليلة UNO', date: '2024-12-10', entry_fee: 20, prize_pool: 100, participants: 6, winner_id: '3', total_prizes: 100 },
];

// طلبات الموظفين المقبولة (من /operations)
const mockStaffRequests = [
    { id: 'r1', date: '2024-12-28', amount: 150, status: 'fulfilled' },
    { id: 'r2', date: '2024-12-25', amount: 200, status: 'fulfilled' },
    { id: 'r3', date: '2024-12-20', amount: 50, status: 'fulfilled' },
];

// طلبات السحب المقبولة (من /marketing)
const mockWithdrawals = [
    { id: 'w1', date: '2024-12-28', amount: 75 },
    { id: 'w2', date: '2024-12-15', amount: 100 },
];

// تكلفة المنتجات المباعة (سعر التكلفة)
const productCostPercentage = 0.4; // 40% من سعر البيع هو تكلفة

// رواتب الموظفين (placeholder)
const mockSalaries = { monthly: 5000 };

// =====================================================================

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'semiannual' | 'annual';

// دالة لحساب نطاق التاريخ حسب الفلتر
const getDateRange = (filter: TimeFilter): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (filter) {
        case 'daily':
            start.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            start.setDate(start.getDate() - 7);
            break;
        case 'monthly':
            start.setMonth(start.getMonth() - 1);
            break;
        case 'semiannual':
            start.setMonth(start.getMonth() - 6);
            break;
        case 'annual':
            start.setFullYear(start.getFullYear() - 1);
            break;
    }
    return { start, end };
};

// دالة لحساب الساعات من الوقت
const getHoursFromTime = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
};

export default function StatisticsPage() {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');

    // حسابات الفلترة
    const filteredData = useMemo(() => {
        const { start, end } = getDateRange(timeFilter);
        const isInRange = (dateStr: string) => {
            const date = new Date(dateStr);
            return date >= start && date <= end;
        };

        // الجلسات المفلترة
        const sessions = mockSessions.filter(s => isInRange(s.date));
        const tablesRevenue = sessions.reduce((sum, s) => sum + s.timeCost, 0);
        const productsRevenue = sessions.reduce((sum, s) => sum + s.ordersCost, 0);
        const totalRevenue = tablesRevenue + productsRevenue;

        // التكاليف
        const productsCost = productsRevenue * productCostPercentage;
        const staffRequestsCost = mockStaffRequests.filter(r => isInRange(r.date) && r.status === 'fulfilled').reduce((sum, r) => sum + r.amount, 0);
        const withdrawalsCost = mockWithdrawals.filter(w => isInRange(w.date)).reduce((sum, w) => sum + w.amount, 0);

        const tournamentPrizes = mockTournaments.filter(t => isInRange(t.date)).reduce((sum, t) => sum + t.total_prizes, 0); // Use total_prizes

        // الرواتب حسب الفلتر
        let salariesCost = 0;
        if (timeFilter === 'monthly') salariesCost = mockSalaries.monthly;
        else if (timeFilter === 'semiannual') salariesCost = mockSalaries.monthly * 6;
        else if (timeFilter === 'annual') salariesCost = mockSalaries.monthly * 12;
        else if (timeFilter === 'weekly') salariesCost = Math.round(mockSalaries.monthly / 4);
        else salariesCost = Math.round(mockSalaries.monthly / 30);

        const totalExpenses = productsCost + staffRequestsCost + withdrawalsCost + tournamentPrizes + salariesCost;
        const netProfit = totalRevenue - totalExpenses;

        // الأعضاء الجدد
        const newMembers = mockMembers.filter(m => isInRange(m.created_at)).length;
        const totalMembers = mockMembers.length;

        // متوسط الجلسات
        const avgSessions = sessions.length > 0 ? sessions.length : 0;

        // ليالي الألعاب
        const tournaments = mockTournaments.filter(t => isInRange(t.date));
        const gameNightsCount = tournaments.length;
        const gameNightsRevenue = tournaments.reduce((sum, t) => sum + (t.entry_fee * t.participants), 0);
        const gameNightsPrizes = tournaments.reduce((sum, t) => sum + t.total_prizes, 0); // Use total_prizes
        const gameNightsProfit = gameNightsRevenue - gameNightsPrizes;

        return {
            totalRevenue, tablesRevenue, productsRevenue, netProfit,
            totalMembers, newMembers, avgSessions,
            gameNightsCount, gameNightsRevenue, gameNightsPrizes, gameNightsProfit,
            staffRequestsCost, withdrawalsCost, salariesCost, totalExpenses,
        };
    }, [timeFilter]);

    // أكثر الأعضاء
    const topMembers = useMemo(() => {
        // أكثر إنفاقاً
        const spendingMap: Record<string, number> = {};
        mockVisitHistory.forEach(v => {
            spendingMap[v.memberId] = (spendingMap[v.memberId] || 0) + v.totalCost;
        });
        const bySpending = Object.entries(spendingMap)
            .map(([id, value]) => ({ id, name: mockMembers.find(m => m.id === id)?.full_name || 'غير معروف', value }))
            .sort((a, b) => b.value - a.value).slice(0, 3);

        // أكثر ساعات
        const hoursMap: Record<string, number> = {};
        mockVisitHistory.forEach(v => {
            hoursMap[v.memberId] = (hoursMap[v.memberId] || 0) + getHoursFromTime(v.startTime, v.endTime);
        });
        const byHours = Object.entries(hoursMap)
            .map(([id, value]) => ({ id, name: mockMembers.find(m => m.id === id)?.full_name || 'غير معروف', value: Math.round(value * 10) / 10 }))
            .sort((a, b) => b.value - a.value).slice(0, 3);

        // أكثر انتصارات
        const byWins = [...mockMembers]
            .sort((a, b) => b.game_stats.wins - a.game_stats.wins)
            .slice(0, 3)
            .map(m => ({ name: m.full_name, value: m.game_stats.wins }));

        // أكثر مشاركة في البطولات
        const byParticipation = [...mockMembers]
            .sort((a, b) => b.game_stats.attended - a.game_stats.attended)
            .slice(0, 3)
            .map(m => ({ name: m.full_name, value: m.game_stats.attended }));

        return { bySpending, byHours, byWins, byParticipation };
    }, []);

    // بيانات الرسم البياني للإيرادات اليومية
    const dailyRevenueData = useMemo(() => {
        const days: Record<string, number> = {};
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        mockSessions.forEach(s => {
            const date = new Date(s.date);
            const dayName = dayNames[date.getDay()];
            days[dayName] = (days[dayName] || 0) + s.grandTotal;
        });

        return dayNames.map(day => ({ day, amount: days[day] || 0 }));
    }, []);

    const handleExportFinancialReport = () => {
        // Exporting summary data is tricky as flat CSV. We'll export the breakdown.
        // Let's export the daily revenue breakdown for the selected period if possible,
        // OR just export the summary values as a single row.
        // Let's export the summary values.
        const data = [{
            'الفترة': filterLabels[timeFilter],
            'إجمالي الإيرادات': filteredData.totalRevenue,
            'إيرادات الطاولات': filteredData.tablesRevenue,
            'إيرادات المنتجات': filteredData.productsRevenue,
            'صافي الربح': filteredData.netProfit,
            'المصروفات': filteredData.totalExpenses,
            'الأعضاء الجدد': filteredData.newMembers,
            'عدد الجلسات': filteredData.avgSessions
        }];
        import('@/lib/export-utils').then(({ exportToCSV }) => {
            exportToCSV(data, `financial_report_${timeFilter}_${new Date().toISOString().split('T')[0]}`);
            toast.success('تم تصدير التقرير المالي');
        });
    };

    const handleExportTopMembers = (title: string, data: { name: string, value: number | string }[]) => {
        const exportData = data.map((item, index) => ({
            'الترتيب': index + 1,
            'الاسم': item.name,
            'القيمة': item.value
        }));
        import('@/lib/export-utils').then(({ exportToCSV }) => {
            exportToCSV(exportData, `top_${title}_${new Date().toISOString().split('T')[0]}`);
            toast.success(`تم تصدير قائمة ${title}`);
        });
    };

    const filterLabels: Record<TimeFilter, string> = {
        daily: 'اليوم', weekly: 'هذا الأسبوع', monthly: 'هذا الشهر', semiannual: 'نصف سنة', annual: 'هذه السنة'
    };

    return (
        <div className="space-y-6">
            {/* العنوان والفلاتر */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">الإحصائيات المالية</h1>
                    <p className="text-muted-foreground mt-1">تحليل شامل للإيرادات والمصروفات - {filterLabels[timeFilter]}</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                        <TabsList className="glass-card">
                            <TabsTrigger value="daily">يومي</TabsTrigger>
                            <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
                            <TabsTrigger value="monthly">شهري</TabsTrigger>
                            <TabsTrigger value="semiannual">نصف سنوي</TabsTrigger>
                            <TabsTrigger value="annual">سنوي</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button variant="ghost" className="glass-button" onClick={handleExportFinancialReport}>
                        <Download className="h-4 w-4 ml-2" />
                        تصدير CSV
                    </Button>
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
                                <h3 className="text-2xl font-bold mt-1">{formatCurrency(filteredData.totalRevenue)}</h3>
                                <p className="text-sm text-muted-foreground mt-2">طاولات + منتجات</p>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#E63E32] to-[#F18A21]"><DollarSign className="h-6 w-6 text-white" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">صافي الربح</p>
                                <h3 className={`text-2xl font-bold mt-1 ${filteredData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(filteredData.netProfit)}</h3>
                                <p className="text-sm text-muted-foreground mt-2">{filteredData.totalRevenue > 0 ? ((filteredData.netProfit / filteredData.totalRevenue) * 100).toFixed(1) : 0}% من الإيرادات</p>
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
                                <h3 className="text-2xl font-bold mt-1">{formatArabicNumber(filteredData.totalMembers)}</h3>
                                <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1"><UserPlus className="h-3 w-3" />+{filteredData.newMembers} جديد</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/20"><Users className="h-6 w-6 text-blue-400" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card-hover">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">عدد الجلسات</p>
                                <h3 className="text-2xl font-bold mt-1">{filteredData.avgSessions}</h3>
                                <p className="text-sm text-muted-foreground mt-2">جلسة</p>
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
                                <div className="flex justify-between mb-2"><span className="flex items-center gap-2"><Table2 className="h-4 w-4" />إيرادات الطاولات</span><span className="font-bold">{formatCurrency(filteredData.tablesRevenue)}</span></div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#E63E32] to-[#F18A21] rounded-full" style={{ width: `${filteredData.totalRevenue > 0 ? (filteredData.tablesRevenue / filteredData.totalRevenue) * 100 : 0}%` }} /></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2"><span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" />إيرادات المنتجات</span><span className="font-bold">{formatCurrency(filteredData.productsRevenue)}</span></div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#F18A21] to-[#F8C033] rounded-full" style={{ width: `${filteredData.totalRevenue > 0 ? (filteredData.productsRevenue / filteredData.totalRevenue) * 100 : 0}%` }} /></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Gamepad2 className="h-5 w-5 text-purple-400" />ليالي الألعاب</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5"><p className="text-sm text-muted-foreground">عدد البطولات</p><p className="text-2xl font-bold">{filteredData.gameNightsCount}</p></div>
                            <div className="p-4 rounded-xl bg-white/5"><p className="text-sm text-muted-foreground">إيرادات الاشتراكات</p><p className="text-2xl font-bold text-emerald-400">{formatCurrency(filteredData.gameNightsRevenue)}</p></div>
                            <div className="p-4 rounded-xl bg-white/5"><p className="text-sm text-muted-foreground">الجوائز المدفوعة</p><p className="text-2xl font-bold text-red-400">{formatCurrency(filteredData.gameNightsPrizes)}</p></div>
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-sm text-muted-foreground">صافي الربح</p><p className="text-2xl font-bold text-emerald-400">{formatCurrency(filteredData.gameNightsProfit)}</p></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* الرسم البياني للإيرادات اليومية */}
            <Card className="glass-card">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-[#F18A21]" />الإيرادات اليومية</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between gap-2 h-48">
                        {dailyRevenueData.map((day, index) => {
                            const maxAmount = Math.max(...dailyRevenueData.map((d) => d.amount), 1);
                            const height = (day.amount / maxAmount) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{formatCurrency(day.amount)}</span>
                                    <div className="w-full rounded-t-lg bg-gradient-to-t from-[#E63E32] to-[#F8C033]" style={{ height: `${height}%`, minHeight: '4px' }} />
                                    <span className="text-xs">{day.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Top Members - 4 cards now */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-400" />أكثر إنفاقاً</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleExportTopMembers('spending', topMembers.bySpending)}><Download className="h-3 w-3" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.bySpending.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#E63E32] to-[#F8C033] flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm truncate max-w-[100px]">{m.name}</span></div>
                                    <span className="text-sm font-medium text-emerald-400">{formatCurrency(m.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-400" />أكثر ساعات</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleExportTopMembers('hours', topMembers.byHours)}><Download className="h-3 w-3" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.byHours.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm truncate max-w-[100px]">{m.name}</span></div>
                                    <span className="text-sm font-medium text-blue-400">{m.value} ساعة</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-400" />أكثر انتصارات</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleExportTopMembers('wins', topMembers.byWins)}><Download className="h-3 w-3" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.byWins.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-yellow-500/30 flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm truncate max-w-[100px]">{m.name}</span></div>
                                    <span className="text-sm font-medium text-yellow-400">{m.value} فوز</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-purple-400" />أكثر مشاركة</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleExportTopMembers('participation', topMembers.byParticipation)}><Download className="h-3 w-3" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topMembers.byParticipation.map((m, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm truncate max-w-[100px]">{m.name}</span></div>
                                    <span className="text-sm font-medium text-purple-400">{m.value} بطولة</span>
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"><p className="text-sm text-muted-foreground">تكلفة المنتجات</p><p className="text-2xl font-bold text-red-400">{formatCurrency(filteredData.productsRevenue * productCostPercentage)}</p></div>
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"><p className="text-sm text-muted-foreground">طلبات الموظفين</p><p className="text-2xl font-bold text-yellow-400">{formatCurrency(filteredData.staffRequestsCost)}</p></div>
                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"><p className="text-sm text-muted-foreground">جوائز البطولات</p><p className="text-2xl font-bold text-purple-400">{formatCurrency(filteredData.gameNightsPrizes)}</p></div>
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"><p className="text-sm text-muted-foreground">طلبات السحب</p><p className="text-2xl font-bold text-orange-400">{formatCurrency(filteredData.withdrawalsCost)}</p></div>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20"><p className="text-sm text-muted-foreground">الرواتب</p><p className="text-2xl font-bold text-blue-400">{formatCurrency(filteredData.salariesCost)}</p></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
