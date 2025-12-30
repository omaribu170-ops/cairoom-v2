/* =================================================================
   CAIROOM - Admin Dashboard (Main Page) - V2
   الصفحة الرئيسية للوحة التحكم - محسنة
   ================================================================= */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cn } from '@/lib/utils';
import {
    Table2, Users, Wallet, Clock, ShoppingBag, Plus, Play, Search, Square,
    ArrowUpLeft, ArrowDownRight, X, UserPlus, Coffee, Minus, Calendar,
    CreditCard, Banknote, Smartphone, Building2, ArrowLeftRight,
} from 'lucide-react';
import { SessionTimer } from '@/components/admin/SessionTimer';
import { toast } from 'sonner';

// أنواع الفترات الزمنية
type TimePeriod = 'day' | 'week' | 'month' | 'halfyear' | 'year' | 'custom';

const periodLabels: Record<TimePeriod, string> = {
    day: 'يومي', week: 'أسبوعي', month: 'شهري', halfyear: 'نصف سنوي', year: 'سنوي', custom: 'تاريخ محدد'
};

// بيانات تجريبية للقاعات
const mockHalls = [
    { id: 'h1', name: 'القاعة الرئيسية', tables: ['1', '2', '3'], price_per_hour: 200 },
    { id: 'h2', name: 'قاعة VIP', tables: ['4', '5'], price_per_hour: 350 },
    { id: 'h3', name: 'الحديقة', tables: ['6'], price_per_hour: 150 },
];

// بيانات تجريبية للطاولات
const mockTables = [
    { id: '1', name: 'طاولة ١', hallId: 'h1', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, status: 'available' },
    { id: '2', name: 'طاولة ٢', hallId: 'h1', capacity_min: 2, capacity_max: 6, price_per_hour_per_person: 25, status: 'busy' },
    { id: '3', name: 'طاولة ٣', hallId: 'h1', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 20, status: 'available' },
    { id: '4', name: 'غرفة VIP ١', hallId: 'h2', capacity_min: 6, capacity_max: 12, price_per_hour_per_person: 50, status: 'available' },
    { id: '5', name: 'غرفة VIP ٢', hallId: 'h2', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 50, status: 'available' },
    { id: '6', name: 'طاولة الحديقة', hallId: 'h3', capacity_min: 4, capacity_max: 10, price_per_hour_per_person: 30, status: 'available' },
];

// بيانات تجريبية للأعضاء
const mockMembers = [
    { id: 'm1', full_name: 'أحمد محمد', phone: '01012345678', gender: 'male' },
    { id: 'm2', full_name: 'سارة أحمد', phone: '01123456789', gender: 'female' },
    { id: 'm3', full_name: 'محمد علي', phone: '01234567890', gender: 'male' },
    { id: 'm4', full_name: 'عمر حسن', phone: '01098765432', gender: 'male' },
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
interface SessionMember {
    id: string;
    name: string;
    orders: { productId: string; productName: string; quantity: number; price: number }[];
}

interface ActiveSession {
    id: string;
    type: 'table' | 'hall';
    tableIds: string[];
    tableName: string;
    hallId?: string;
    hallName?: string;
    pricePerHour: number;
    startTime: string;
    members: SessionMember[];
    // سجل الطاولات (الأصلية + المنقول إليها)
    tableHistory: { tableId: string; tableName: string; pricePerHour: number; startTime: string; endTime?: string }[];
}

const initialActiveSessions: ActiveSession[] = [
    {
        id: 's1', type: 'table', tableIds: ['2'], tableName: 'طاولة ٢', pricePerHour: 25,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        members: [
            { id: 'm1', name: 'أحمد محمد', orders: [{ productId: 'p1', productName: 'قهوة تركي', quantity: 2, price: 25 }] },
            { id: 'm2', name: 'سارة أحمد', orders: [{ productId: 'p3', productName: 'عصير برتقال', quantity: 1, price: 30 }] },
        ],
        tableHistory: [{ tableId: '2', tableName: 'طاولة ٢', pricePerHour: 25, startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }]
    },
    {
        id: 's2', type: 'hall', tableIds: ['4', '5'], tableName: 'غرفة VIP ١ + غرفة VIP ٢', hallId: 'h2', hallName: 'قاعة VIP', pricePerHour: 350,
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        members: [
            { id: 'm3', name: 'محمد علي', orders: [{ productId: 'p4', productName: 'ساندويتش جبنة', quantity: 2, price: 40 }] },
            { id: 'm4', name: 'عمر حسن', orders: [] },
        ],
        tableHistory: [{ tableId: 'h2', tableName: 'قاعة VIP', pricePerHour: 350, startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString() }]
    },
];

// إحصائيات حسب الفترة
const getStatsByPeriod = (period: TimePeriod) => {
    const data: Record<TimePeriod, { members: number; revenue: number; avgHours: number; ordersRevenue: number; timeRevenue: number }> = {
        day: { members: 12, revenue: 2450, avgHours: 3.5, ordersRevenue: 850, timeRevenue: 1600 },
        week: { members: 68, revenue: 15800, avgHours: 3.2, ordersRevenue: 5200, timeRevenue: 10600 },
        month: { members: 245, revenue: 45780, avgHours: 3.4, ordersRevenue: 15800, timeRevenue: 29980 },
        halfyear: { members: 890, revenue: 198500, avgHours: 3.3, ordersRevenue: 68000, timeRevenue: 130500 },
        year: { members: 1456, revenue: 385000, avgHours: 3.5, ordersRevenue: 132000, timeRevenue: 253000 },
        custom: { members: 45, revenue: 8500, avgHours: 3.1, ordersRevenue: 2800, timeRevenue: 5700 },
    };
    return data[period];
};

export default function AdminDashboardPage() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
    const [customDate, setCustomDate] = useState('');
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions);

    // Start Session Modal State
    const [startSessionOpen, setStartSessionOpen] = useState(false);
    const [sessionType, setSessionType] = useState<'table' | 'hall'>('table');
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [selectedHall, setSelectedHall] = useState<string>('');
    const [hallTableMode, setHallTableMode] = useState<'hall' | 'any'>('hall'); // اختيار طاولات القاعة أو أي طاولة متاحة
    const [selectedHallTables, setSelectedHallTables] = useState<string[]>([]);
    const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [newMemberGender, setNewMemberGender] = useState<'male' | 'female'>('male');

    // End Session Modal
    const [endSessionModal, setEndSessionModal] = useState<ActiveSession | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // Switch Table Modal
    const [switchTableModal, setSwitchTableModal] = useState<ActiveSession | null>(null);

    const stats = useMemo(() => getStatsByPeriod(timePeriod), [timePeriod]);
    const availableTables = mockTables.filter(t => t.status === 'available');
    const hallTables = selectedHall ? mockTables.filter(t => t.hallId === selectedHall && t.status === 'available') : [];
    const allAvailableTables = mockTables.filter(t => t.status === 'available');
    const filteredMembers = mockMembers.filter(m =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch)
    );

    // التحقق إذا العضو موجود في جلسة نشطة
    const isMemberInActiveSession = (memberId: string) => {
        return activeSessions.some(session =>
            session.members.some(m => m.id === memberId)
        );
    };

    // الحصول على اسم الجلسة النشطة للعضو
    const getMemberActiveSessionName = (memberId: string) => {
        const session = activeSessions.find(s => s.members.some(m => m.id === memberId));
        return session ? (session.hallName || session.tableName) : null;
    };

    // إضافة عضو موجود للجلسة
    const handleAddExistingMember = (member: typeof mockMembers[0]) => {
        // التحقق إذا العضو موجود بالفعل في الجلسة الحالية
        if (sessionMembers.find(m => m.id === member.id)) {
            setMemberSearch('');
            return;
        }
        // التحقق إذا العضو موجود في جلسة نشطة أخرى
        if (isMemberInActiveSession(member.id)) {
            const sessionName = getMemberActiveSessionName(member.id);
            toast.error(`${member.full_name} موجود بالفعل في جلسة نشطة (${sessionName})`);
            return;
        }
        setSessionMembers([...sessionMembers, { id: member.id, name: member.full_name, orders: [] }]);
        setMemberSearch('');
    };

    // إضافة عضو جديد
    const handleAddNewMember = () => {
        if (!newMemberName.trim() || !newMemberPhone.trim()) return;
        const newId = `new-${Date.now()}`;
        setSessionMembers([...sessionMembers, { id: newId, name: newMemberName, orders: [] }]);
        toast.success(`تم إضافة ${newMemberName} للقاعدة والجلسة`);
        setNewMemberName('');
        setNewMemberPhone('');
        setNewMemberGender('male');
        setShowAddMember(false);
    };

    // إزالة عضو
    const handleRemoveMember = (memberId: string) => {
        setSessionMembers(sessionMembers.filter(m => m.id !== memberId));
    };

    // إضافة/تقليل منتج لعضو
    const handleAdjustProduct = (memberId: string, productId: string, delta: number) => {
        const product = mockProducts.find(p => p.id === productId);
        if (!product) return;

        setSessionMembers(sessionMembers.map(m => {
            if (m.id !== memberId) return m;
            const existingOrder = m.orders.find(o => o.productId === productId);
            if (existingOrder) {
                const newQty = existingOrder.quantity + delta;
                if (newQty <= 0) {
                    return { ...m, orders: m.orders.filter(o => o.productId !== productId) };
                }
                return { ...m, orders: m.orders.map(o => o.productId === productId ? { ...o, quantity: newQty } : o) };
            } else if (delta > 0) {
                return { ...m, orders: [...m.orders, { productId, productName: product.name, quantity: 1, price: product.price }] };
            }
            return m;
        }));
    };

    // تبديل طاولة في القاعة
    const toggleHallTable = (tableId: string) => {
        setSelectedHallTables(prev =>
            prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
        );
    };

    // بدء الجلسة
    const handleStartSession = () => {
        if (sessionType === 'table' && (!selectedTable || sessionMembers.length === 0)) return;
        if (sessionType === 'hall' && (!selectedHall || selectedHallTables.length === 0 || sessionMembers.length === 0)) return;

        const table = mockTables.find(t => t.id === selectedTable);
        const hall = mockHalls.find(h => h.id === selectedHall);
        const tableNames = selectedHallTables.map(id => mockTables.find(t => t.id === id)?.name).join(' + ');
        const now = new Date().toISOString();
        const pricePerHour = sessionType === 'table' ? (table?.price_per_hour_per_person || 25) : (hall?.price_per_hour || 200);

        const newSession: ActiveSession = {
            id: `session-${Date.now()}`,
            type: sessionType,
            tableIds: sessionType === 'table' ? [selectedTable] : selectedHallTables,
            tableName: sessionType === 'table' ? (table?.name || '') : tableNames,
            hallId: sessionType === 'hall' ? selectedHall : undefined,
            hallName: sessionType === 'hall' ? hall?.name : undefined,
            pricePerHour,
            startTime: now,
            members: sessionMembers,
            tableHistory: [{
                tableId: sessionType === 'table' ? selectedTable : selectedHall,
                tableName: sessionType === 'table' ? (table?.name || '') : (hall?.name || ''),
                pricePerHour,
                startTime: now,
            }],
        };

        setActiveSessions([...activeSessions, newSession]);
        toast.success('تم بدء الجلسة بنجاح');
        resetSessionModal();
    };

    const resetSessionModal = () => {
        setStartSessionOpen(false);
        setSessionType('table');
        setSelectedTable('');
        setSelectedHall('');
        setSelectedHallTables([]);
        setSessionMembers([]);
    };

    // حساب إجمالي الجلسة باستخدام سجل الطاولات
    const getSessionTotal = (session: ActiveSession) => {
        let timeCost = 0;
        const now = Date.now();

        // حساب تكلفة كل طاولة في السجل
        session.tableHistory.forEach(th => {
            const start = new Date(th.startTime).getTime();
            const end = th.endTime ? new Date(th.endTime).getTime() : now;
            const hours = (end - start) / (1000 * 60 * 60);
            if (session.type === 'hall') {
                timeCost += Math.ceil(hours * th.pricePerHour);
            } else {
                timeCost += Math.ceil(hours * th.pricePerHour * session.members.length);
            }
        });

        const ordersCost = session.members.reduce((sum, m) => sum + m.orders.reduce((s, o) => s + (o.price * o.quantity), 0), 0);
        return { timeCost, ordersCost, total: timeCost + ordersCost, tableHistory: session.tableHistory };
    };

    // إنهاء الجلسة
    const handleEndSession = () => {
        if (!endSessionModal) return;
        setActiveSessions(activeSessions.filter(s => s.id !== endSessionModal.id));
        toast.success('تم إنهاء الجلسة وحفظها في السجل');
        setEndSessionModal(null);
    };

    // تبديل الطاولة
    const handleSwitchTable = (newTableId: string) => {
        if (!switchTableModal) return;
        const newTable = mockTables.find(t => t.id === newTableId);
        if (!newTable) return;

        const now = new Date().toISOString();

        setActiveSessions(activeSessions.map(s => {
            if (s.id !== switchTableModal.id) return s;
            // إغلاق الطاولة الحالية
            const updatedHistory = s.tableHistory.map((th, i) =>
                i === s.tableHistory.length - 1 ? { ...th, endTime: now } : th
            );
            // إضافة الطاولة الجديدة
            updatedHistory.push({
                tableId: newTableId,
                tableName: newTable.name,
                pricePerHour: newTable.price_per_hour_per_person,
                startTime: now,
            });
            return {
                ...s,
                tableIds: [newTableId],
                tableName: newTable.name,
                pricePerHour: newTable.price_per_hour_per_person,
                tableHistory: updatedHistory,
            };
        }));

        toast.success(`تم النقل إلى ${newTable.name}`);
        setSwitchTableModal(null);
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
                    <Play className="h-4 w-4 ml-2" />بدء جلسة جديدة
                </Button>
            </div>

            {/* فلتر الفترة الزمنية + Date Picker */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <span className="text-sm text-muted-foreground">الفترة:</span>
                <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
                    <TabsList className="glass-card flex-wrap">
                        {Object.entries(periodLabels).map(([key, label]) => (
                            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                {timePeriod === 'custom' && (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="glass-input w-auto" />
                    </div>
                )}
            </div>

            {/* بطاقات الإحصائيات - 6 كروت */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* الجلسات النشطة */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">الجلسات النشطة</p>
                                <h3 className="text-2xl font-bold mt-1">{activeSessions.length}</h3>
                                <span className="text-xs text-emerald-400 animate-pulse">● جاري الآن</span>
                            </div>
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                                <Table2 className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* الأعضاء */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">الأعضاء ({periodLabels[timePeriod]})</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.members}</h3>
                                <span className="text-xs text-emerald-400"><ArrowUpLeft className="h-3 w-3 inline" /> +{Math.round(stats.members * 0.12)}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* إجمالي الإيرادات */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.revenue)}</h3>
                                <span className="text-xs text-emerald-400"><ArrowUpLeft className="h-3 w-3 inline" /> +15%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-gradient-to-br from-[#E63E32] to-[#F18A21]">
                                <Wallet className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* إيرادات الطلبات */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">إيرادات الطلبات</p>
                                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.ordersRevenue)}</h3>
                                <span className="text-xs text-emerald-400"><ArrowUpLeft className="h-3 w-3 inline" /> +18%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
                                <ShoppingBag className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* إيرادات الوقت */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">إيرادات الوقت</p>
                                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.timeRevenue)}</h3>
                                <span className="text-xs text-emerald-400"><ArrowUpLeft className="h-3 w-3 inline" /> +12%</span>
                            </div>
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* متوسط الجلسة */}
                <Card className="glass-card-hover overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">متوسط الجلسة</p>
                                <h3 className="text-2xl font-bold mt-1">{stats.avgHours} س</h3>
                                <span className="text-xs text-red-400"><ArrowDownRight className="h-3 w-3 inline" /> -0.2</span>
                            </div>
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* الجلسات النشطة - مفصلة مع الطلبات */}
            <Card className="glass-card">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="flex items-center gap-2">
                        <Table2 className="h-5 w-5 text-[#F18A21]" />الجلسات النشطة
                        <Badge className="status-available mr-auto">{activeSessions.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {activeSessions.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">لا توجد جلسات نشطة</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {activeSessions.map((session) => {
                                const totals = getSessionTotal(session);
                                return (
                                    <div key={session.id} className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{session.tableName}</h4>
                                                    {session.hallName && <Badge variant="outline" className="text-xs">{session.hallName}</Badge>}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {session.members.map(m => (
                                                        <Badge key={m.id} variant="outline" className="text-xs">{m.name}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-left flex items-center gap-3">
                                                <div>
                                                    <SessionTimer startTime={session.startTime} className="text-lg font-bold" />
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(totals.total)}</p>
                                                </div>
                                                <Button size="sm" className="gradient-button" onClick={() => setEndSessionModal(session)}>
                                                    <Square className="h-4 w-4 ml-1" />إنهاء
                                                </Button>
                                                {session.type === 'table' && (
                                                    <Button size="sm" variant="ghost" className="glass-button" onClick={() => setSwitchTableModal(session)}>
                                                        <ArrowLeftRight className="h-4 w-4 ml-1" />تبديل
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {/* عرض الطلبات لكل عضو */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                            {session.members.filter(m => m.orders.length > 0).map(m => (
                                                <div key={m.id} className="bg-white/5 rounded-lg p-2 text-xs">
                                                    <span className="font-medium">{m.name}:</span>
                                                    <span className="text-muted-foreground mr-2">
                                                        {m.orders.map(o => `${o.productName}×${o.quantity}`).join('، ')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* نافذة بدء جلسة جديدة - Table / Hall */}
            <Dialog open={startSessionOpen} onOpenChange={(open) => { if (!open) resetSessionModal(); else setStartSessionOpen(true); }}>
                <DialogContent className="glass-modal sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">بدء جلسة جديدة</DialogTitle>
                    </DialogHeader>

                    {/* تبويبات طاولة / قاعة */}
                    <Tabs value={sessionType} onValueChange={(v) => setSessionType(v as 'table' | 'hall')}>
                        <TabsList className="w-full glass-card">
                            <TabsTrigger value="table" className="flex-1 gap-2"><Table2 className="h-4 w-4" />طاولة</TabsTrigger>
                            <TabsTrigger value="hall" className="flex-1 gap-2"><Building2 className="h-4 w-4" />قاعة</TabsTrigger>
                        </TabsList>

                        {/* تبويب الطاولة */}
                        <TabsContent value="table" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>اختر الطاولة *</Label>
                                <Select value={selectedTable} onValueChange={setSelectedTable}>
                                    <SelectTrigger className="glass-input"><SelectValue placeholder="اختر طاولة" /></SelectTrigger>
                                    <SelectContent className="glass-modal">
                                        {availableTables.map(table => (
                                            <SelectItem key={table.id} value={table.id}>
                                                {table.name} ({table.capacity_min}-{table.capacity_max}) - {formatCurrency(table.price_per_hour_per_person)}/س/فرد
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        {/* تبويب القاعة */}
                        <TabsContent value="hall" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>اختر القاعة *</Label>
                                <Select value={selectedHall} onValueChange={(v) => { setSelectedHall(v); setSelectedHallTables([]); }}>
                                    <SelectTrigger className="glass-input"><SelectValue placeholder="اختر قاعة" /></SelectTrigger>
                                    <SelectContent className="glass-modal">
                                        {mockHalls.map(hall => (
                                            <SelectItem key={hall.id} value={hall.id}>{hall.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedHall && (
                                <div className="space-y-3">
                                    {/* اختيار نوع الطاولات */}
                                    <Label>اختر الطاولات *</Label>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" className={cn('glass-button flex-1', hallTableMode === 'hall' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                            onClick={() => { setHallTableMode('hall'); setSelectedHallTables([]); }}>
                                            طاولات القاعة فقط
                                        </Button>
                                        <Button size="sm" variant="ghost" className={cn('glass-button flex-1', hallTableMode === 'any' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                            onClick={() => { setHallTableMode('any'); setSelectedHallTables([]); }}>
                                            أي طاولة متاحة
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(hallTableMode === 'hall' ? hallTables : allAvailableTables).map(table => (
                                            <div key={table.id} className={cn('glass-card p-3 cursor-pointer transition-all', selectedHallTables.includes(table.id) && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                onClick={() => toggleHallTable(table.id)}>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox checked={selectedHallTables.includes(table.id)} />
                                                    <span>{table.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {(hallTableMode === 'hall' ? hallTables : allAvailableTables).length === 0 && <p className="text-sm text-muted-foreground">لا توجد طاولات متاحة</p>}
                                    {selectedHallTables.length > 0 && (
                                        <p className="text-xs text-muted-foreground">تم اختيار: {selectedHallTables.map(id => mockTables.find(t => t.id === id)?.name).join(', ')}</p>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* إضافة الأعضاء - مشترك */}
                    <div className="space-y-4 mt-4 border-t border-white/10 pt-4">
                        <Label>الأعضاء *</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="ابحث عن عضو..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="glass-input pr-10" />
                            </div>
                            <Button variant="ghost" className="glass-button" onClick={() => setShowAddMember(true)}>
                                <UserPlus className="h-4 w-4 ml-1" />جديد
                            </Button>
                        </div>

                        {/* نتائج البحث */}
                        {memberSearch && (
                            <div className="glass-card p-2 space-y-1 max-h-32 overflow-y-auto">
                                {filteredMembers.map(member => (
                                    <button key={member.id} onClick={() => handleAddExistingMember(member)} className="w-full p-2 text-right rounded-lg hover:bg-white/10">
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
                                    <Input placeholder="الاسم *" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="glass-input" />
                                    <Input placeholder="رقم الهاتف *" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} className="glass-input" dir="ltr" />
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant={newMemberGender === 'male' ? 'default' : 'ghost'} className={newMemberGender === 'male' ? 'gradient-button' : 'glass-button'} onClick={() => setNewMemberGender('male')}>ذكر</Button>
                                    <Button size="sm" variant={newMemberGender === 'female' ? 'default' : 'ghost'} className={newMemberGender === 'female' ? 'gradient-button' : 'glass-button'} onClick={() => setNewMemberGender('female')}>أنثى</Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" className="gradient-button" onClick={handleAddNewMember}>إضافة</Button>
                                    <Button size="sm" variant="ghost" className="glass-button" onClick={() => setShowAddMember(false)}>إلغاء</Button>
                                </div>
                            </div>
                        )}

                        {/* الأعضاء المختارين مع الطلبات */}
                        <div className="space-y-3">
                            {sessionMembers.map(member => (
                                <div key={member.id} className="glass-card p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xs">{member.name.charAt(0)}</AvatarFallback></Avatar>
                                            <span className="font-medium">{member.name}</span>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => handleRemoveMember(member.id)}><X className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {mockProducts.map(product => {
                                            const order = member.orders.find(o => o.productId === product.id);
                                            return (
                                                <div key={product.id} className={cn('flex items-center gap-1 glass-card p-1 rounded-lg', order && 'bg-[#F18A21]/20')}>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAdjustProduct(member.id, product.id, -1)} disabled={!order}><Minus className="h-3 w-3" /></Button>
                                                    <span className="text-xs px-1">{product.name}{order && ` (${order.quantity})`}</span>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAdjustProduct(member.id, product.id, 1)}><Plus className="h-3 w-3" /></Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="ghost" className="glass-button" onClick={resetSessionModal}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleStartSession}
                            disabled={(sessionType === 'table' && (!selectedTable || sessionMembers.length === 0)) ||
                                (sessionType === 'hall' && (!selectedHall || selectedHallTables.length === 0 || sessionMembers.length === 0))}>
                            <Play className="h-4 w-4 ml-2" />بدء الجلسة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إنهاء الجلسة */}
            <Dialog open={!!endSessionModal} onOpenChange={() => setEndSessionModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">إنهاء الجلسة</DialogTitle>
                        <DialogDescription>{endSessionModal?.tableName}</DialogDescription>
                    </DialogHeader>
                    {endSessionModal && (() => {
                        const totals = getSessionTotal(endSessionModal);
                        return (
                            <div className="space-y-4 py-4">
                                {/* سجل الطاولات المستخدمة */}
                                {endSessionModal.tableHistory.length > 1 && (
                                    <div className="glass-card p-3">
                                        <p className="text-xs text-muted-foreground mb-2">الطاولات المستخدمة:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {endSessionModal.tableHistory.map((th, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {th.tableName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="glass-card p-4 space-y-3">
                                    {endSessionModal.members.map(member => {
                                        const ordersCost = member.orders.reduce((s, o) => s + (o.price * o.quantity), 0);
                                        return (
                                            <div key={member.id} className="flex items-center justify-between text-sm">
                                                <span>{member.name}</span>
                                                <span>{formatCurrency(ordersCost)} طلبات</span>
                                            </div>
                                        );
                                    })}
                                    <div className="border-t border-white/10 pt-2 space-y-1 text-sm">
                                        <div className="flex justify-between"><span>تكلفة الوقت</span><span>{formatCurrency(totals.timeCost)}</span></div>
                                        <div className="flex justify-between"><span>تكلفة الطلبات</span><span>{formatCurrency(totals.ordersCost)}</span></div>
                                    </div>
                                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                                        <span>الإجمالي</span><span className="gradient-text text-lg">{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>طريقة الدفع</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[{ id: 'cash', label: 'كاش', icon: Banknote }, { id: 'visa', label: 'كارت', icon: CreditCard },
                                        { id: 'wallet', label: 'محفظة موبيل', icon: Smartphone }, { id: 'cairoom', label: 'محفظة CAIROOM', icon: Wallet }].map(method => (
                                            <Button key={method.id} variant="ghost" className={cn('glass-button h-12 justify-start', paymentMethod === method.id && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                onClick={() => setPaymentMethod(method.id)}>
                                                <method.icon className="h-4 w-4 ml-2" />{method.label}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* تفاصيل اضافية للدفع - محاكاة فقط للواجهة */}
                                    {paymentMethod === 'visa' && (
                                        <div className="mt-2 animate-in fade-in">
                                            <Label>اسم صاحب الكارت</Label>
                                            <Input className="glass-input mt-1" placeholder="الاسم كما في البطاقة" />
                                        </div>
                                    )}
                                    {paymentMethod === 'wallet' && (
                                        <div className="mt-2 animate-in fade-in space-y-2">
                                            <Input className="glass-input" placeholder="اسم صاحب المحفظة" />
                                            <Input className="glass-input" placeholder="رقم المحفظة" />
                                        </div>
                                    )}
                                    {paymentMethod === 'cairoom' && (
                                        <div className="mt-2 animate-in fade-in">
                                            <Label>العضو الدافع</Label>
                                            <Select>
                                                <SelectTrigger className="glass-input"><SelectValue placeholder="اختر العضو" /></SelectTrigger>
                                                <SelectContent className="glass-modal">
                                                    {endSessionModal.members.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setEndSessionModal(null)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleEndSession}>إنهاء وحفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تبديل الطاولة */}
            <Dialog open={!!switchTableModal} onOpenChange={() => setSwitchTableModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">تبديل الطاولة</DialogTitle>
                        <DialogDescription>اختر طاولة متاحة للانتقال إليها</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {switchTableModal && (
                            <div className="glass-card p-3 mb-4">
                                <p className="text-sm text-muted-foreground">الطاولة الحالية</p>
                                <p className="font-bold">{switchTableModal.tableName}</p>
                                {switchTableModal.tableHistory.length > 1 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        الطاولات السابقة: {switchTableModal.tableHistory.slice(0, -1).map(th => th.tableName).join(' → ')}
                                    </p>
                                )}
                            </div>
                        )}
                        <p className="text-sm font-medium">الطاولات المتاحة:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {availableTables
                                .filter(t => !switchTableModal?.tableIds.includes(t.id))
                                .map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => handleSwitchTable(table.id)}
                                        className="glass-card p-3 text-right hover:bg-white/10 transition-colors"
                                    >
                                        <p className="font-medium">{table.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {table.capacity_min}-{table.capacity_max} • {formatCurrency(table.price_per_hour_per_person)}/س/فرد
                                        </p>
                                    </button>
                                ))}
                        </div>
                        {availableTables.filter(t => !switchTableModal?.tableIds.includes(t.id)).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center p-4">لا توجد طاولات متاحة</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="glass-button" onClick={() => setSwitchTableModal(null)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
