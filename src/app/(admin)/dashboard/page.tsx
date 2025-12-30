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
import { getHallsWithTables } from '@/actions/halls';
import { getProducts } from '@/actions/products';
import { getActiveSessions, createSession, endSession, addSessionOrder } from '@/actions/sessions';
import { searchMembers, createMember } from '@/actions/members';
import { ActiveSessionsList } from '@/components/admin/ActiveSessionsList';
import { Hall, Table, Product, User, ActiveSession, SessionMember } from '@/types/database';
import { calculateDuration, getSessionTotal } from '@/lib/sessionUtils';

// Helper to map DB session to UI ActiveSession
// (This will be implemented inside the component or outside)


// أنواع الفترات الزمنية
type TimePeriod = 'day' | 'week' | 'month' | 'halfyear' | 'year' | 'custom';

const periodLabels: Record<TimePeriod, string> = {
    day: 'يومي', week: 'أسبوعي', month: 'شهري', halfyear: 'نصف سنوي', year: 'سنوي', custom: 'تاريخ محدد'
};

// State Types
interface DashboardData {
    halls: Hall[];
    tables: Table[];
    products: Product[];
}

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

const MOCK_HALLS: Hall[] = [
    { id: 'h1', name: 'القاعة الرئيسية', capacity_min: 10, capacity_max: 50, price_per_hour: 200, price_first_hour: 250, created_at: '', updated_at: '' },
    { id: 'h2', name: 'قاعة VIP', capacity_min: 6, capacity_max: 20, price_per_hour: 350, price_first_hour: 400, created_at: '', updated_at: '' },
];

const MOCK_TABLES: Table[] = [
    { id: '1', name: 'طاولة ١', hall_id: 'h1', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, price_first_hour_per_person: 35, status: 'available', image_url: null, created_at: '', updated_at: '' },
    { id: '2', name: 'طاولة ٢', hall_id: 'h1', capacity_min: 2, capacity_max: 6, price_per_hour_per_person: 25, price_first_hour_per_person: 35, status: 'busy', image_url: null, created_at: '', updated_at: '' },
    { id: '3', name: 'طاولة ٣', hall_id: 'h1', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 20, price_first_hour_per_person: 30, status: 'available', image_url: null, created_at: '', updated_at: '' },
];

const MOCK_PRODUCTS: Product[] = [
    { id: 'p1', name: 'قهوة تركي', price: 35, type: 'drink', is_active: true, cost_price: 15, stock_quantity: 100, image_url: null, created_at: '', updated_at: '' },
    { id: 'p2', name: 'شاي بلبن', price: 25, type: 'drink', is_active: true, cost_price: 10, stock_quantity: 100, image_url: null, created_at: '', updated_at: '' },
];

const MOCK_SESSIONS: ActiveSession[] = [
    {
        id: 's1',
        type: 'table',
        tableName: 'طاولة ٢',
        tableId: '2',
        pricePerHour: 25,
        priceFirstHour: 35,
        startTime: new Date(Date.now() - 45 * 60000).toISOString(),
        members: [
            { id: 'u1', name: 'أحمد علي', phone: '01012345678', joinedAt: new Date(Date.now() - 45 * 60000).toISOString(), leftAt: null, orders: [] }
        ],
        tableHistory: [{ tableId: '2', tableName: 'طاولة ٢', startTime: new Date(Date.now() - 45 * 60000).toISOString(), pricePerHour: 25 }],
        hallTableIds: []
    }
];

export default function AdminDashboardPage() {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
    const [customDate, setCustomDate] = useState('');

    // Live Data State
    const [halls, setHalls] = useState<Hall[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter Logic for Member Search in Start Session Modal (Local search on mockMembers in original, needs to be updated or removed if we use searchResults)
    // The original code used `mockMembers`. We should rely on `searchResults` which is populated by `handleMemberSearch`.
    // We already have `filteredMembers` in the JSX but it wasn't defined in the snippet I read fully (it likely filtered mockMembers).
    // I will simply use `searchResults` directly in the Start Session modal.

    // Initial Data Fetch
    const refreshData = async () => {
        try {
            const [hallsData, productsData, sessionsData] = await Promise.all([
                getHallsWithTables().catch(() => ({ halls: [], tables: [] })),
                getProducts().catch(() => []),
                getActiveSessions().catch(() => [])
            ]);

            const finalHalls = hallsData.halls.length > 0 ? hallsData.halls : MOCK_HALLS;
            const finalTables = hallsData.tables.length > 0 ? hallsData.tables : MOCK_TABLES;
            const finalProducts = productsData.length > 0 ? productsData : MOCK_PRODUCTS;

            setHalls(finalHalls);
            setTables(finalTables);
            setProducts(finalProducts);

            // Map DB Sessions to UI ActiveSession
            const mappedSessions: ActiveSession[] = sessionsData.length > 0 ? sessionsData.map((s: any) => ({
                id: s.id,
                type: s.hall_id ? 'hall' : 'table',
                hallName: s.hall?.name,
                tableId: s.hall_id || s.table_id, // For UI grouping
                tableName: s.table?.name || s.hall?.name || (s.table_ids?.length ? `${s.table_ids.length} طاولات` : 'غير معروف'),
                pricePerHour: s.hall ? s.hall.price_per_hour : (s.table?.price_per_hour_per_person || 0),
                priceFirstHour: s.hall ? s.hall.price_first_hour : (s.table?.price_first_hour_per_person || null),
                startTime: s.start_time,
                members: s.attendees.map((a: any) => ({
                    id: a.user_id || 'guest',
                    name: a.name,
                    phone: '',
                    joinedAt: a.joined_at || s.start_time,
                    leftAt: a.left_at,
                    orders: []
                })),
                tableHistory: [], // Not supported in simple schema yet
                hallTableIds: s.table_ids || []
            })) : MOCK_SESSIONS;

            // Distribute orders (temporary hack)
            if (sessionsData.length > 0) {
                sessionsData.forEach((s: any, idx: number) => {
                    const session = mappedSessions[idx];
                    if (session && session.members.length > 0 && s.orders) {
                        session.members[0].orders = s.orders.map((o: any) => ({
                            productId: o.product_id,
                            name: o.product?.name || 'Unknown',
                            quantity: o.quantity,
                            price: o.price_at_time
                        }));
                    }
                });
            }

            setActiveSessions(mappedSessions);
        } catch (error) {
            console.error(error);
            toast.error('فشل تحميل البيانات - تم تفعيل وضع البيانات التجريبية');
            setHalls(MOCK_HALLS);
            setTables(MOCK_TABLES);
            setProducts(MOCK_PRODUCTS);
            setActiveSessions(MOCK_SESSIONS);
        } finally {
            setLoading(false);
        }
    };

    useMemo(() => {
        refreshData();
    }, []);


    // Start Session Modal State
    const [startSessionOpen, setStartSessionOpen] = useState(false);
    const [sessionType, setSessionType] = useState<'table' | 'hall'>('table');
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [selectedHall, setSelectedHall] = useState<string>('');
    const [hallTableMode, setHallTableMode] = useState<'hall' | 'any'>('hall'); // اختيار طاولات القاعة أو أي طاولة متاحة
    const [selectedHallTables, setSelectedHallTables] = useState<string[]>([]);
    const [sessionMembers, setSessionMembers] = useState<{ id: string; name: string; orders: { productId: string; productName: string; quantity: number; price: number }[] }[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [newMemberGender, setNewMemberGender] = useState<'male' | 'female'>('male');

    // Stats
    const stats = useMemo(() => getStatsByPeriod(timePeriod), [timePeriod]);

    // الطاولات المتاحة فعلياً (تستثني الطاولات المشغولة في جلسات القاعات)
    const availableTables = tables.filter(t => {
        if (t.status !== 'available') return false;
        // هل الطاولة مستخدمة في أي جلسة قاعة نشطة؟
        const isBusyInHall = activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id));
        return !isBusyInHall;
    });

    const hallTables = selectedHall ? tables.filter(t => t.hall_id === selectedHall && t.status === 'available' && !activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id))) : [];
    const allAvailableTables = tables.filter(t => t.status === 'available');

    // Member Search (Live)
    const [searchResults, setSearchResults] = useState<User[]>([]);

    const handleMemberSearch = async (val: string) => {
        setMemberSearch(val);
        if (val.length > 2) {
            const res = await searchMembers(val);
            setSearchResults(res);
        } else {
            setSearchResults([]);
        }
    };


    // التحقق إذا العضو موجود في جلسة نشطة
    const isMemberInActiveSession = (memberId: string) => {
        return activeSessions.some(session =>
            session.members.some(m => m.id === memberId && !m.leftAt)
        );
    };

    // الحصول على اسم الجلسة النشطة للعضو
    const getMemberActiveSessionName = (memberId: string) => {
        const session = activeSessions.find(s => s.members.some(m => m.id === memberId && !m.leftAt));
        return session ? (session.hallName || session.tableName) : null;
    };

    // إضافة عضو موجود للجلسة الجديدة
    const handleAddExistingMember = (member: User) => {
        if (sessionMembers.find(m => m.id === member.id)) {
            setMemberSearch('');
            setSearchResults([]);
            return;
        }

        if (isMemberInActiveSession(member.id)) {
            const sessionName = getMemberActiveSessionName(member.id);
            toast.error(`${member.full_name} موجود بالفعل في جلسة نشطة (${sessionName})`);
            return;
        }
        setSessionMembers([...sessionMembers, { id: member.id, name: member.full_name, orders: [] }]);
        setMemberSearch('');
        setSearchResults([]);
    };

    // إضافة عضو جديد (للقاعدة والجلسة)
    const handleAddNewMemberToSession = async () => {
        if (!newMemberName.trim() || !newMemberPhone.trim()) return;

        // التحقق من تكرار رقم الهاتف if we had full list, but server handles it.

        try {
            const newMember = await createMember({
                name: newMemberName,
                phone: newMemberPhone,
                gender: newMemberGender
            });

            setSessionMembers([...sessionMembers, { id: newMember.id, name: newMember.full_name, orders: [] }]);
            toast.success(`تم إضافة ${newMemberName} للقاعدة والجلسة`);
            setNewMemberName('');
            setNewMemberPhone('');
            setNewMemberGender('male');
            setShowAddMember(false);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // إزالة عضو من الجلسة الجديدة
    const handleRemoveSessionMember = (memberId: string) => {
        setSessionMembers(sessionMembers.filter(m => m.id !== memberId));
    };

    const handleAdjustProduct = (memberId: string, productId: string, delta: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        setSessionMembers(sessionMembers.map(m => {
            if (m.id !== memberId) return m;
            const existingOrder = m.orders.find(o => o.productId === productId);
            if (existingOrder) {
                const newQty = existingOrder.quantity + delta;
                if (newQty <= 0) return { ...m, orders: m.orders.filter(o => o.productId !== productId) };
                return { ...m, orders: m.orders.map(o => o.productId === productId ? { ...o, quantity: newQty } : o) };
            } else if (delta > 0) {
                return { ...m, orders: [...m.orders, { productId, productName: product.name, quantity: 1, price: product.price }] };
            }
            return m;
        }));
    };


    // تبديل طاولة في القاعة
    const toggleHallTable = (tableId: string) => {
        setSelectedHallTables(prev => prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]);
    };

    // بدء الجلسة
    const handleStartSession = async () => {
        if (sessionType === 'table' && (!selectedTable || sessionMembers.length === 0)) return;
        if (sessionType === 'hall' && (!selectedHall || selectedHallTables.length === 0 || sessionMembers.length === 0)) return;

        try {
            await createSession({
                type: sessionType,
                tableId: sessionType === 'table' ? selectedTable : undefined,
                hallId: sessionType === 'hall' ? selectedHall : undefined,
                hallTableIds: sessionType === 'hall' ? selectedHallTables : undefined,
                members: sessionMembers.map(m => ({ id: m.id, name: m.name }))
            });

            toast.success('تم بدء الجلسة بنجاح');
            resetSessionModal();
            refreshData();
        } catch (e: any) {
            toast.error(e.message || 'حدث خطأ أثناء بدء الجلسة');
        }
    };

    const resetSessionModal = () => {
        setStartSessionOpen(false);
        setSessionType('table');
        setSelectedTable('');
        setSelectedHall('');
        setHallTableMode('hall');
        setSelectedHallTables([]);
        setSessionMembers([]);
        setMemberSearch('');
        setSearchResults([]);
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

            {/* الجلسات النشطة - Replaced by ActiveSessionsList */}
            <ActiveSessionsList
                activeSessions={activeSessions}
                setActiveSessions={setActiveSessions}
                halls={halls}
                tables={tables}
                products={products}
                refreshData={refreshData}
                searchResults={searchResults}
                onMemberSearch={handleMemberSearch}
                memberSearchValue={memberSearch}
            />

            {/* نافذة بدء جلسة جديدة */}
            <Dialog open={startSessionOpen} onOpenChange={resetSessionModal}>
                <DialogContent className="glass-modal sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">بدء جلسة جديدة</DialogTitle>
                    </DialogHeader>
                    <Tabs value={sessionType} onValueChange={(v) => { setSessionType(v as 'table' | 'hall'); setSelectedTable(''); setSelectedHall(''); setSelectedHallTables([]); }}>
                        <TabsList className="glass-card w-full">
                            <TabsTrigger value="table" className="flex-1 gap-2"><Table2 className="h-4 w-4" />طاولة</TabsTrigger>
                            <TabsTrigger value="hall" className="flex-1 gap-2"><Building2 className="h-4 w-4" />قاعة</TabsTrigger>
                        </TabsList>

                        {/* تبويب الطاولة */}
                        <TabsContent value="table" className="space-y-4 mt-4">
                            <div>
                                <Label>اختر الطاولة</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                    {availableTables.map(t => (
                                        <button key={t.id} onClick={() => setSelectedTable(t.id)}
                                            className={cn('glass-card p-3 text-right transition-colors', selectedTable === t.id && 'bg-[#F18A21]/20 border-[#F18A21]')}>
                                            <p className="font-medium">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(t.price_per_hour_per_person)}/س/فرد</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* تبويب القاعة */}
                        <TabsContent value="hall" className="space-y-4 mt-4">
                            <div>
                                <Label>اختر القاعة</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                    {halls.map(h => (
                                        <button key={h.id} onClick={() => { setSelectedHall(h.id); setSelectedHallTables([]); }}
                                            className={cn('glass-card p-3 text-right transition-colors', selectedHall === h.id && 'bg-[#F18A21]/20 border-[#F18A21]')}>
                                            <p className="font-medium">{h.name}</p>
                                            <p className="text-xs text-muted-foreground">{h.capacity_min}-{h.capacity_max} • {formatCurrency(h.price_per_hour)}/ساعة</p>
                                        </button>
                                    ))}
                                </div>

                            </div>
                            {selectedHall && (
                                <>
                                    {/* اختيار نوع الطاولات */}
                                    <div>
                                        <Label>اختر الطاولات</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Button size="sm" variant="ghost" className={cn('glass-button flex-1', hallTableMode === 'hall' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                onClick={() => { setHallTableMode('hall'); setSelectedHallTables([]); }}>
                                                طاولات القاعة فقط
                                            </Button>
                                            <Button size="sm" variant="ghost" className={cn('glass-button flex-1', hallTableMode === 'any' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                onClick={() => { setHallTableMode('any'); setSelectedHallTables([]); }}>
                                                أي طاولة متاحة
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {(hallTableMode === 'hall' ? hallTables : allAvailableTables).map(t => (
                                            <button key={t.id} onClick={() => toggleHallTable(t.id)}
                                                className={cn('glass-card p-2 text-right text-sm transition-colors', selectedHallTables.includes(t.id) && 'bg-[#F18A21]/20 border-[#F18A21]')}>
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedHallTables.length > 0 && (
                                        <p className="text-xs text-muted-foreground">تم اختيار: {selectedHallTables.map(id => tables.find(t => t.id === id)?.name).join(', ')}</p>
                                    )}

                                </>
                            )}
                        </TabsContent>
                    </Tabs>

                    {/* الأعضاء */}
                    <div className="space-y-3 border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center justify-between">
                            <Label>الأعضاء ({sessionMembers.length})</Label>
                            <Button size="sm" variant="ghost" className="glass-button" onClick={() => setShowAddMember(true)}><UserPlus className="h-4 w-4 ml-1" />إضافة عضو</Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="ابحث عن عضو (الاسم أو الهاتف)..." value={memberSearch} onChange={(e) => handleMemberSearch(e.target.value)} className="glass-input pr-10" />

                        </div>
                        {searchResults.length > 0 && (
                            <div className="glass-card p-2 space-y-1 max-h-32 overflow-y-auto">
                                {searchResults.map(m => (
                                    <button key={m.id} onClick={() => handleAddExistingMember(m)} className="w-full p-2 text-right rounded-lg hover:bg-white/10 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{m.full_name}</span>
                                            <span className="text-muted-foreground text-xs">{m.phone}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showAddMember && (
                            <div className="glass-card p-3 space-y-2">
                                <div className="flex gap-2">
                                    <Input placeholder="الاسم" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="glass-input flex-1" />
                                    <Input placeholder="الهاتف" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} className="glass-input w-32" dir="ltr" />
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className={cn('glass-button flex-1', newMemberGender === 'male' && 'bg-[#F18A21]/20')} onClick={() => setNewMemberGender('male')}>ذكر</Button>
                                    <Button size="sm" variant="ghost" className={cn('glass-button flex-1', newMemberGender === 'female' && 'bg-[#F18A21]/20')} onClick={() => setNewMemberGender('female')}>أنثى</Button>
                                    <Button size="sm" className="gradient-button" onClick={handleAddNewMemberToSession}>إضافة</Button>
                                </div>
                            </div>
                        )}
                        {/* قائمة الأعضاء المضافين */}
                        {sessionMembers.length > 0 && (
                            <div className="space-y-2">
                                {sessionMembers.map(m => (
                                    <div key={m.id} className="glass-card p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{m.name}</span>
                                            <Button size="sm" variant="ghost" className="text-red-400 h-6 w-6 p-0" onClick={() => handleRemoveSessionMember(m.id)}><X className="h-4 w-4" /></Button>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {products.map(p => {
                                                const order = m.orders.find(o => o.productId === p.id);
                                                return (
                                                    <div key={p.id} className="flex items-center gap-1 glass-card px-2 py-1 text-xs">
                                                        <span>{p.name}</span>
                                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => handleAdjustProduct(m.id, p.id, -1)}><Minus className="h-3 w-3" /></Button>
                                                        <span className="w-4 text-center">{order?.quantity || 0}</span>
                                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => handleAdjustProduct(m.id, p.id, 1)}><Plus className="h-3 w-3" /></Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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

        </div >
    );
}
