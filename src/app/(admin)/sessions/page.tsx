/* =================================================================
   CAIROOM - Sessions Management Page
   صفحة إدارة الجلسات - النشطة والسابقة
   ================================================================= */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import {
    Play, Clock, Eye, Building2, Plus, X, Search, Minus
} from 'lucide-react';
import { ActiveSessionsList } from '@/components/admin/ActiveSessionsList';
import { getHallsWithTables } from '@/actions/halls';
import { getProducts } from '@/actions/products';
import { getActiveSessions, createSession } from '@/actions/sessions';
import { searchMembers, createMember } from '@/actions/members';
import { Hall, Table as DbTable, Product, User, ActiveSession, HistorySession, SessionMember } from '@/types/database';
import { formatDuration, getSessionTotal } from '@/lib/sessionUtils';

export default function SessionsPage() {
    const [activeTab, setActiveTab] = useState('active');

    // State for Live Data
    const [halls, setHalls] = useState<Hall[]>([]);
    const [tables, setTables] = useState<DbTable[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);

    const [dateFilter, setDateFilter] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [memberSearch, setMemberSearch] = useState('');

    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (memberSearch.length > 2) {
                const results = await searchMembers(memberSearch);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [memberSearch]);

    // Modals
    const MOCK_HALLS: Hall[] = [
        { id: 'h1', name: 'القاعة الرئيسية', capacity_min: 10, capacity_max: 50, price_per_hour: 200, price_first_hour: 250, created_at: '', updated_at: '' },
        { id: 'h2', name: 'قاعة VIP', capacity_min: 6, capacity_max: 20, price_per_hour: 350, price_first_hour: 400, created_at: '', updated_at: '' },
    ];

    const MOCK_TABLES: DbTable[] = [
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

    const [receiptModal, setReceiptModal] = useState<HistorySession | null>(null);

    // Start Session Modal State
    const [startSessionOpen, setStartSessionOpen] = useState(false);
    const [sessionType, setSessionType] = useState<'table' | 'hall'>('table');
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [selectedHall, setSelectedHall] = useState<string>('');
    const [hallTableMode, setHallTableMode] = useState<'hall' | 'any'>('hall');
    const [selectedHallTables, setSelectedHallTables] = useState<string[]>([]);
    const [sessionMembers, setSessionMembers] = useState<{ id: string; name: string; orders: { productId: string; productName: string; quantity: number; price: number }[] }[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberGender, setNewMemberGender] = useState<'male' | 'female'>('male');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');

    // History Tabs
    const [historySubTab, setHistorySubTab] = useState<'all' | 'tables' | 'halls'>('all');

    const allAvailableTables = tables.filter(t => t.status === 'available');
    const hallTables = selectedHall ? tables.filter(t => t.hall_id === selectedHall && t.status === 'available' && !activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id))) : [];

    // Data Fetching
    const refreshData = useCallback(async () => {
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
                tableHistory: [],
                hallTableIds: s.table_ids || []
            })) : MOCK_SESSIONS;

            // Distribute orders
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
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const filteredHistory = historySessions.filter(s => {
        const matchesSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.members.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery)) ||
            s.tablesUsed.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.hallName && s.hallName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDate = !dateFilter || s.date === dateFilter;
        const matchesType = historySubTab === 'all' ||
            (historySubTab === 'tables' && s.type === 'table') ||
            (historySubTab === 'halls' && s.type === 'hall');
        return matchesSearch && matchesDate && matchesType;
    });

    // ============ Start Session Helper Functions ============
    const isMemberInActiveSession = (memberId: string) => {
        return activeSessions.some(session =>
            session.members.some(m => m.id === memberId && !m.leftAt)
        );
    };

    const getMemberActiveSessionName = (memberId: string) => {
        const session = activeSessions.find(s =>
            s.members.some(m => m.id === memberId && !m.leftAt)
        );
        return session ? (session.hallName || session.tableName) : null;
    };

    const handleAddExistingMember = (member: User) => {
        if (sessionMembers.find(m => m.id === member.id)) {
            setMemberSearch('');
            return;
        }
        if (isMemberInActiveSession(member.id)) {
            const sessionName = getMemberActiveSessionName(member.id);
            toast.error(`${member.full_name} موجود بالفعل في جلسة نشطة (${sessionName})`);
            return;
        }
        setSessionMembers([...sessionMembers, { id: member.id, name: member.full_name, orders: [] }]);
        setMemberSearch('');
    };

    const handleAddNewMemberToSession = () => {
        if (!newMemberName.trim() || !newMemberPhone.trim()) return;
        if (searchResults.some(m => m.phone === newMemberPhone)) {
            toast.error('رقم الهاتف موجود بالفعل لمستخدم آخر');
            return;
        }
        const newId = `new-${Date.now()}`;
        setSessionMembers([...sessionMembers, { id: newId, name: newMemberName, orders: [] }]);
        toast.success(`تم إضافة ${newMemberName} للقائمة`);
        setNewMemberName('');
        setNewMemberPhone('');
        setShowAddMember(false);
    };

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

    const toggleHallTable = (tableId: string) => {
        setSelectedHallTables(prev => prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]);
    };

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
            toast.error(e.message || 'فشل بدء الجلسة');
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
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">إدارة الجلسات</h1>
                    <p className="text-muted-foreground mt-1">الجلسات النشطة وسجل الجلسات السابقة</p>
                </div>
                <Button className="gradient-button" onClick={() => setStartSessionOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />بدء جلسة جديدة
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass-card">
                    <TabsTrigger value="active" className="gap-2"><Play className="h-4 w-4" />الجلسات النشطة ({activeSessions.length})</TabsTrigger>
                    <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" />سجل الجلسات</TabsTrigger>
                </TabsList>

                {/* الجلسات النشطة - Replaced by Component */}
                <TabsContent value="active" className="space-y-4 mt-6">
                    <ActiveSessionsList
                        activeSessions={activeSessions}
                        setActiveSessions={setActiveSessions}
                        halls={halls}
                        tables={tables}
                        products={products}
                        refreshData={refreshData}
                        searchResults={searchResults}
                        onMemberSearch={setMemberSearch}
                        memberSearchValue={memberSearch}
                    />
                </TabsContent>

                {/* سجل الجلسات */}
                <TabsContent value="history" className="space-y-4 mt-6">
                    <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="ghost" className={cn('glass-button', historySubTab === 'all' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                            onClick={() => setHistorySubTab('all')}>
                            الكل ({historySessions.length})
                        </Button>
                        <Button size="sm" variant="ghost" className={cn('glass-button', historySubTab === 'tables' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                            onClick={() => setHistorySubTab('tables')}>
                            جلسات الطاولات ({historySessions.filter(s => s.type === 'table').length})
                        </Button>
                        <Button size="sm" variant="ghost" className={cn('glass-button', historySubTab === 'halls' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                            onClick={() => setHistorySubTab('halls')}>
                            جلسات القاعات ({historySessions.filter(s => s.type === 'hall').length})
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-input pr-10" />
                        </div>
                        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="glass-input w-auto" />
                    </div>

                    <Card className="glass-card overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-right">رقم الجلسة</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">الطاولات</TableHead>
                                    <TableHead className="text-right">الأعضاء</TableHead>
                                    <TableHead className="text-right">التاريخ</TableHead>
                                    <TableHead className="text-right">الوقت</TableHead>
                                    <TableHead className="text-right">الإجمالي</TableHead>
                                    <TableHead className="text-right w-[80px]">عرض</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.map((session) => (
                                    <TableRow key={session.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="font-mono text-xs">{session.id}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn('text-xs', session.type === 'hall' ? 'border-[#F18A21] text-[#F18A21]' : 'border-emerald-500 text-emerald-400')}>
                                                {session.type === 'hall' ? (session.hallName || 'قاعة') : 'طاولة'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {session.tablesUsed.map((t, i) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex -space-x-2 space-x-reverse">
                                                {session.members.slice(0, 3).map((m, i) => (
                                                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                                        <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-[10px]">{m.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {session.members.length > 3 && <span className="text-xs text-muted-foreground mr-2">+{session.members.length - 3}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{session.date}</TableCell>
                                        <TableCell>{session.startTime} - {session.endTime}</TableCell>
                                        <TableCell className="font-bold">{formatCurrency(session.grandTotal)}</TableCell>
                                        <TableCell><Button size="sm" variant="ghost" className="glass-button" onClick={() => setReceiptModal(session)}><Eye className="h-4 w-4" /></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredHistory.length === 0 && <div className="p-12 text-center text-muted-foreground">لا توجد نتائج</div>}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* نافذة الفاتورة - History Receipt */}
            <Dialog open={!!receiptModal} onOpenChange={() => setReceiptModal(null)}>
                <DialogContent className="glass-modal sm:max-w-lg">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">فاتورة الجلسة</DialogTitle></DialogHeader>
                    {receiptModal && (
                        <div className="space-y-4 py-4">
                            <div className="glass-card p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">رقم الجلسة</span><span className="font-mono">{receiptModal.id}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">التاريخ</span><span>{receiptModal.date}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">الوقت</span><span>{receiptModal.startTime} - {receiptModal.endTime}</span></div>
                            </div>
                            <div className="glass-card p-4">
                                <p className="text-sm font-medium mb-2">الطاولات المستخدمة</p>
                                <div className="flex flex-wrap gap-2">
                                    {receiptModal.tablesUsed.map((t, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="font-medium">الأعضاء</p>
                                {receiptModal.members.map((member, i) => (
                                    <div key={i} className="glass-card p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xs">{member.name.charAt(0)}</AvatarFallback></Avatar>
                                            <span className="font-medium">{member.name}</span>
                                        </div>
                                        {member.orders.length > 0 && (
                                            <div className="text-xs text-muted-foreground mr-10">
                                                {member.orders.map((o, j) => <span key={j}>{o.name} × {o.quantity}</span>)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="glass-card p-4 space-y-2">
                                <div className="flex justify-between text-sm"><span>تكلفة الوقت</span><span>{formatCurrency(receiptModal.totalTimeCost)}</span></div>
                                <div className="flex justify-between text-sm"><span>تكلفة الطلبات</span><span>{formatCurrency(receiptModal.totalOrdersCost)}</span></div>
                                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                                    <span>الإجمالي</span><span className="gradient-text text-lg">{formatCurrency(receiptModal.grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setReceiptModal(null)}>إغلاق</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة بدء جلسة جديدة */}
            <Dialog open={startSessionOpen} onOpenChange={resetSessionModal}>
                <DialogContent className="glass-modal sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">بدء جلسة جديدة</DialogTitle>
                    </DialogHeader>
                    <Tabs value={sessionType} onValueChange={(v) => { setSessionType(v as 'table' | 'hall'); setSelectedTable(''); setSelectedHall(''); setSelectedHallTables([]); }}>
                        <TabsList className="glass-card w-full">
                            <TabsTrigger value="table" className="flex-1 gap-2"><Building2 className="h-4 w-4" />طاولة</TabsTrigger>
                            <TabsTrigger value="hall" className="flex-1 gap-2"><Building2 className="h-4 w-4" />قاعة</TabsTrigger>
                        </TabsList>

                        <TabsContent value="table" className="space-y-4 mt-4">
                            <div>
                                <Label>اختر الطاولة</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                                    {allAvailableTables.map(t => (
                                        <button key={t.id} onClick={() => setSelectedTable(t.id)}
                                            className={cn('glass-card p-3 text-right transition-colors', selectedTable === t.id && 'bg-[#F18A21]/20 border-[#F18A21]')}>
                                            <p className="font-medium">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(t.price_per_hour_per_person)}/س/فرد</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

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
                                </>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-3 border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center justify-between">
                            <Label>الأعضاء ({sessionMembers.length})</Label>
                            <Button size="sm" variant="ghost" className="glass-button" onClick={() => setShowAddMember(true)}><Plus className="h-4 w-4 ml-1" />إضافة عضو</Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="ابحث عن عضو..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="glass-input pr-10" />
                        </div>
                        {memberSearch && (
                            <div className="glass-card p-2 space-y-1 max-h-32 overflow-y-auto">
                                {searchResults.map(m => (
                                    <button key={m.id} onClick={() => handleAddExistingMember(m)} className="w-full p-2 text-right rounded-lg hover:bg-white/10 text-sm">
                                        <span className="font-medium">{m.full_name}</span>
                                        <span className="text-muted-foreground mr-2">({m.phone})</span>
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
                                <Button size="sm" className="gradient-button w-full" onClick={handleAddNewMemberToSession}>إضافة</Button>
                            </div>
                        )}
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
