/* =================================================================
   CAIROOM - Admin Dashboard (Main Page)
   الصفحة الرئيسية للوحة التحكم - محسنة
   ================================================================= */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, cn } from '@/lib/utils';
import {
    Table2, Users, Wallet, Clock, ShoppingBag, Plus, Play, Search,
    ArrowUpLeft, ArrowDownRight, X, UserPlus, Coffee,
} from 'lucide-react';
import { SessionTimer } from '@/components/admin/SessionTimer';

// أنواع الفترات الزمنية
type TimePeriod = 'day' | 'week' | 'month' | 'halfyear' | 'year';

const periodLabels: Record<TimePeriod, string> = {
    day: 'يومي', week: 'أسبوعي', month: 'شهري', halfyear: 'نصف سنوي', year: 'سنوي'
};

// بيانات تجريبية للطاولات
const mockTables = [
    { id: '1', name: 'طاولة ١', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, status: 'available' },
    { id: '2', name: 'طاولة ٢', capacity_min: 2, capacity_max: 6, price_per_hour_per_person: 25, status: 'busy' },
    { id: '3', name: 'طاولة ٣', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 20, status: 'available' },
    { id: '4', name: 'غرفة الاجتماعات', capacity_min: 6, capacity_max: 12, price_per_hour_per_person: 30, status: 'available' },
];

// بيانات تجريبية للأعضاء
const mockMembers = [
    { id: 'm1', full_name: 'أحمد محمد', phone: '01012345678' },
    { id: 'm2', full_name: 'سارة أحمد', phone: '01123456789' },
    { id: 'm3', full_name: 'محمد علي', phone: '01234567890' },
    { id: 'm4', full_name: 'عمر حسن', phone: '01098765432' },
];

// بيانات تجريبية للمنتجات
const mockProducts = [
    { id: 'p1', name: 'قهوة تركي', price: 25, type: 'drinks' },
    { id: 'p2', name: 'شاي', price: 15, type: 'drinks' },
    { id: 'p3', name: 'عصير برتقال', price: 30, type: 'drinks' },
    { id: 'p4', name: 'ساندويتش جبنة', price: 40, type: 'food' },
    { id: 'p5', name: 'كرواسون', price: 25, type: 'food' },
];

// بيانات تجريبية للجلسات النشطة
const mockActiveSessions = [
    {
        id: 's1', table_id: '2', table_name: 'طاولة ٢', start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        members: [{ id: 'm1', name: 'أحمد محمد' }, { id: 'm2', name: 'سارة أحمد' }]
    },
    {
        id: 's2', table_id: '4', table_name: 'غرفة الاجتماعات', start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        members: [{ id: 'm3', name: 'محمد علي' }, { id: 'm4', name: 'عمر حسن' }, { id: 'm5', name: 'ياسمين خالد' }]
    },
];

// بيانات تجريبية للطلبات
const mockOrders = [
    { id: 'o1', product: 'قهوة تركي', quantity: 2, table: 'طاولة ٢', member: 'أحمد محمد', date: new Date().toISOString() },
    { id: 'o2', product: 'عصير برتقال', quantity: 1, table: 'طاولة ٢', member: 'سارة أحمد', date: new Date().toISOString() },
    { id: 'o3', product: 'ساندويتش جبنة', quantity: 2, table: 'غرفة الاجتماعات', member: 'محمد علي', date: new Date().toISOString() },
];

// إحصائيات حسب الفترة
const getStatsByPeriod = (period: TimePeriod) => {
    const data: Record<TimePeriod, { members: number; revenue: number; avgHours: number }> = {
        day: { members: 12, revenue: 2450, avgHours: 3.5 },
        week: { members: 68, revenue: 15800, avgHours: 3.2 },
        month: { members: 245, revenue: 45780, avgHours: 3.4 },
        halfyear: { members: 890, revenue: 198500, avgHours: 3.3 },
        year: { members: 1456, revenue: 385000, avgHours: 3.5 },
    };
    return data[period];
};

export default function AdminDashboardPage() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
    const [startSessionOpen, setStartSessionOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [sessionMembers, setSessionMembers] = useState<{ id: string; name: string; orders: { productId: string; quantity: number }[] }[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);

    const stats = useMemo(() => getStatsByPeriod(timePeriod), [timePeriod]);
    const availableTables = mockTables.filter(t => t.status === 'available');
    const filteredMembers = mockMembers.filter(m =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch)
    );

    // إضافة عضو موجود للجلسة
    const handleAddExistingMember = (member: typeof mockMembers[0]) => {
        if (!sessionMembers.find(m => m.id === member.id)) {
            setSessionMembers([...sessionMembers, { id: member.id, name: member.full_name, orders: [] }]);
        }
        setMemberSearch('');
    };

    // إضافة عضو جديد
    const handleAddNewMember = () => {
        if (!newMemberName.trim() || !newMemberPhone.trim()) return;
        const newId = `new-${Date.now()}`;
        setSessionMembers([...sessionMembers, { id: newId, name: newMemberName, orders: [] }]);
        setNewMemberName('');
        setNewMemberPhone('');
        setShowAddMember(false);
    };

    // إزالة عضو من الجلسة
    const handleRemoveMember = (memberId: string) => {
        setSessionMembers(sessionMembers.filter(m => m.id !== memberId));
    };

    // إضافة منتج لعضو
    const handleAddProductToMember = (memberId: string, productId: string) => {
        setSessionMembers(sessionMembers.map(m => {
            if (m.id !== memberId) return m;
            const existingOrder = m.orders.find(o => o.productId === productId);
            if (existingOrder) {
                return { ...m, orders: m.orders.map(o => o.productId === productId ? { ...o, quantity: o.quantity + 1 } : o) };
            }
            return { ...m, orders: [...m.orders, { productId, quantity: 1 }] };
        }));
    };

    // بدء الجلسة
    const handleStartSession = () => {
        if (!selectedTable || sessionMembers.length === 0) return;
        // هنا سيتم إضافة الجلسة للداتابيز
        console.log('Starting session:', { table: selectedTable, members: sessionMembers });
        setStartSessionOpen(false);
        setSelectedTable('');
        setSessionMembers([]);
    };

    return (
        <div className="space-y-6">
            {/* الترحيب + زر بدء جلسة */}
            <div className="glass-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">يا مرحب يا معلم! 👋</h1>
                    <p className="text-muted-foreground mt-1">دي لوحة التحكم بتاعتك. كل حاجة تحت إيدك.</p>
                </div>
                <Button className="gradient-button" onClick={() => setStartSessionOpen(true)}>
                    <Play className="h-4 w-4 ml-2" />
                    بدء جلسة جديدة
                </Button>
            </div>

            {/* فلتر الفترة الزمنية */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">الفترة:</span>
                <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
                    <TabsList className="glass-card">
                        {Object.entries(periodLabels).map(([key, label]) => (
                            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* الجلسات النشطة - Real-time */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">الجلسات النشطة</p>
                                <h3 className="text-2xl font-bold mt-1">{mockActiveSessions.length}</h3>
                                <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400">
                                    <span className="animate-pulse">● جاري الآن</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                                <Table2 className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* إجمالي الأعضاء - حسب الفترة */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">الأعضاء ({periodLabels[timePeriod]})</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.members}</h3>
                                <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400">
                                    <ArrowUpLeft className="h-4 w-4" /><span>+{Math.round(stats.members * 0.12)}</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* الإيرادات - حسب الفترة */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">الإيرادات ({periodLabels[timePeriod]})</p>
                                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.revenue)}</h3>
                                <div className="flex items-center gap-1 mt-2 text-sm text-emerald-400">
                                    <ArrowUpLeft className="h-4 w-4" /><span>+15%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#E63E32] to-[#F18A21]">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* متوسط الجلسة - حسب الفترة */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">متوسط الجلسة ({periodLabels[timePeriod]})</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.avgHours} ساعة</h3>
                                <div className="flex items-center gap-1 mt-2 text-sm text-red-400">
                                    <ArrowDownRight className="h-4 w-4" /><span>-0.2</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* صفين: الجلسات النشطة + آخر الطلبات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* الجلسات النشطة - مفصلة */}
                <Card className="glass-card">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="flex items-center gap-2">
                            <Table2 className="h-5 w-5 text-[#F18A21]" />
                            الجلسات النشطة
                            <Badge className="status-available mr-auto">{mockActiveSessions.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {mockActiveSessions.map((session) => (
                                <div key={session.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium">{session.table_name}</h4>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {session.members.map(m => (
                                                    <Badge key={m.id} variant="outline" className="text-xs">{m.name}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <SessionTimer startTime={session.start_time} className="text-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {mockActiveSessions.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">لا توجد جلسات نشطة</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* آخر الطلبات - مفصلة */}
                <Card className="glass-card">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-[#F18A21]" />
                            طلبات اليوم
                            <Badge className="status-pending mr-auto">{mockOrders.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {mockOrders.map((order) => (
                                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-[#F18A21]/20">
                                            <Coffee className="h-4 w-4 text-[#F18A21]" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">{order.product} × {order.quantity}</h4>
                                            <p className="text-sm text-muted-foreground">{order.table} • {order.member}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* نافذة بدء جلسة جديدة */}
            <Dialog open={startSessionOpen} onOpenChange={setStartSessionOpen}>
                <DialogContent className="glass-modal sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">بدء جلسة جديدة</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* اختيار الطاولة */}
                        <div className="space-y-2">
                            <Label>اختر الطاولة *</Label>
                            <Select value={selectedTable} onValueChange={setSelectedTable}>
                                <SelectTrigger className="glass-input"><SelectValue placeholder="اختر طاولة" /></SelectTrigger>
                                <SelectContent className="glass-modal">
                                    {availableTables.map(table => (
                                        <SelectItem key={table.id} value={table.id}>
                                            {table.name} ({table.capacity_min}-{table.capacity_max} أشخاص) - {formatCurrency(table.price_per_hour_per_person)}/ساعة/فرد
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* إضافة الأعضاء */}
                        <div className="space-y-2">
                            <Label>الأعضاء *</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="ابحث عن عضو..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="glass-input pr-10" />
                                </div>
                                <Button variant="ghost" className="glass-button" onClick={() => setShowAddMember(true)}>
                                    <UserPlus className="h-4 w-4 ml-1" />عضو جديد
                                </Button>
                            </div>
                            {/* نتائج البحث */}
                            {memberSearch && (
                                <div className="glass-card p-2 space-y-1 max-h-32 overflow-y-auto">
                                    {filteredMembers.map(member => (
                                        <button key={member.id} onClick={() => handleAddExistingMember(member)} className="w-full p-2 text-right rounded-lg hover:bg-white/10 transition-colors">
                                            {member.full_name} - {member.phone}
                                        </button>
                                    ))}
                                    {filteredMembers.length === 0 && <p className="text-sm text-muted-foreground p-2">لا يوجد نتائج</p>}
                                </div>
                            )}
                            {/* إضافة عضو جديد */}
                            {showAddMember && (
                                <div className="glass-card p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input placeholder="الاسم" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="glass-input" />
                                        <Input placeholder="رقم الهاتف" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} className="glass-input" dir="ltr" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" className="gradient-button" onClick={handleAddNewMember}>إضافة</Button>
                                        <Button size="sm" variant="ghost" className="glass-button" onClick={() => setShowAddMember(false)}>إلغاء</Button>
                                    </div>
                                </div>
                            )}
                            {/* الأعضاء المختارين */}
                            <div className="space-y-3 mt-4">
                                {sessionMembers.map(member => (
                                    <div key={member.id} className="glass-card p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xs">{member.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.name}</span>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => handleRemoveMember(member.id)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {/* منتجات العضو */}
                                        <div className="flex flex-wrap gap-2">
                                            {mockProducts.map(product => {
                                                const order = member.orders.find(o => o.productId === product.id);
                                                return (
                                                    <Button key={product.id} size="sm" variant="ghost" className={cn('glass-button text-xs', order && 'bg-[#F18A21]/20 border-[#F18A21]')} onClick={() => handleAddProductToMember(member.id, product.id)}>
                                                        {product.name} {order && `(${order.quantity})`}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setStartSessionOpen(false)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleStartSession} disabled={!selectedTable || sessionMembers.length === 0}>
                            <Play className="h-4 w-4 ml-2" />بدء الجلسة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
