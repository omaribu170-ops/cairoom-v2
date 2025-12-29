/* =================================================================
   CAIROOM - Admin Dashboard (Main Page)
   الصفحة الرئيسية للوحة التحكم
   ================================================================= */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table2,
    Users,
    Wallet,
    TrendingUp,
    Clock,
    ShoppingBag,
    Gamepad2,
    ArrowUpLeft,
    ArrowDownRight,
} from 'lucide-react';

// بيانات تجريبية للإحصائيات
const stats = [
    {
        title: 'الجلسات النشطة',
        value: '٤',
        change: '+٢',
        trend: 'up',
        icon: Table2,
        color: 'from-emerald-500 to-emerald-600',
    },
    {
        title: 'إجمالي الأعضاء',
        value: '١٢٤',
        change: '+٨ هذا الأسبوع',
        trend: 'up',
        icon: Users,
        color: 'from-blue-500 to-blue-600',
    },
    {
        title: 'إيرادات اليوم',
        value: '٢,٤٥٠ ج.م',
        change: '+١٥٪',
        trend: 'up',
        icon: Wallet,
        color: 'from-[#E63E32] to-[#F18A21]',
    },
    {
        title: 'متوسط الجلسة',
        value: '٣.٥ ساعة',
        change: '-٠.٢',
        trend: 'down',
        icon: Clock,
        color: 'from-purple-500 to-purple-600',
    },
];

// الجلسات النشطة التجريبية
const activeSessions = [
    { table: 'طاولة ١', guests: 3, startTime: '14:30', duration: '2:15' },
    { table: 'طاولة ٣', guests: 5, startTime: '15:45', duration: '1:00' },
    { table: 'غرفة الاجتماعات', guests: 8, startTime: '16:00', duration: '0:45' },
    { table: 'ركن القهوة', guests: 2, startTime: '16:30', duration: '0:15' },
];

// آخر الطلبات
const recentOrders = [
    { id: 1, item: 'قهوة تركي × ٢', table: 'طاولة ١', status: 'pending' },
    { id: 2, item: 'عصير برتقال × ٣', table: 'طاولة ٣', status: 'delivered' },
    { id: 3, item: 'ساندويتش جبنة × ٢', table: 'غرفة الاجتماعات', status: 'pending' },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            {/* الترحيب */}
            <div className="glass-card p-6">
                <h1 className="text-2xl font-bold gradient-text">يا مرحب يا معلم! 👋</h1>
                <p className="text-muted-foreground mt-1">
                    دي لوحة التحكم بتاعتك. كل حاجة تحت إيدك.
                </p>
            </div>

            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="glass-card-hover overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                        <div className={`flex items-center gap-1 mt-2 text-sm ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            {stat.trend === 'up' ? (
                                                <ArrowUpLeft className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4" />
                                            )}
                                            <span>{stat.change}</span>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* صفين: الجلسات النشطة + آخر الطلبات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* الجلسات النشطة */}
                <Card className="glass-card">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="flex items-center gap-2">
                            <Table2 className="h-5 w-5 text-[#F18A21]" />
                            الجلسات النشطة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {activeSessions.map((session, index) => (
                                <div key={index} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div>
                                        <h4 className="font-medium">{session.table}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {session.guests} ضيوف • بدأت {session.startTime}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-mono font-bold gradient-text timer-pulse">
                                            {session.duration}
                                        </div>
                                        <p className="text-xs text-muted-foreground">ساعة:دقيقة</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* آخر الطلبات */}
                <Card className="glass-card">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-[#F18A21]" />
                            آخر الطلبات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div>
                                        <h4 className="font-medium">{order.item}</h4>
                                        <p className="text-sm text-muted-foreground">{order.table}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'pending'
                                            ? 'status-pending'
                                            : 'status-available'
                                        }`}>
                                        {order.status === 'pending' ? 'جاري التحضير' : 'تم التوصيل'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#F18A21]/20">
                            <TrendingUp className="h-6 w-6 text-[#F18A21]" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">إيرادات الشهر</p>
                            <h3 className="text-xl font-bold">٤٥,٧٨٠ ج.م</h3>
                        </div>
                    </div>
                </Card>

                <Card className="glass-card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                            <Gamepad2 className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">ليالي الألعاب</p>
                            <h3 className="text-xl font-bold">٨ بطولات</h3>
                        </div>
                    </div>
                </Card>

                <Card className="glass-card p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                            <Users className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">أعضاء نشطين</p>
                            <h3 className="text-xl font-bold">٨٧ عضو</h3>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
