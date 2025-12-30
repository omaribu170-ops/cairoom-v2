/* =================================================================
   CAIROOM - Sessions Management Page
   صفحة إدارة الجلسات - النشطة والسابقة
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import {
    Play, Square, UserPlus, UserMinus, Search, Clock, Eye,
    CreditCard, Wallet, Smartphone, Banknote, ArrowLeftRight,
} from 'lucide-react';
import { SessionTimer } from '@/components/admin/SessionTimer';

// بيانات الطاولات المتاحة
const mockTables = [
    { id: '1', name: 'طاولة ١', price_per_hour_per_person: 25, status: 'available' },
    { id: '2', name: 'طاولة ٢', price_per_hour_per_person: 25, status: 'busy' },
    { id: '3', name: 'طاولة ٣', price_per_hour_per_person: 20, status: 'available' },
    { id: '4', name: 'غرفة الاجتماعات', price_per_hour_per_person: 30, status: 'busy' },
    { id: '5', name: 'طاولة ٥', price_per_hour_per_person: 25, status: 'available' },
    { id: '6', name: 'طاولة ٦', price_per_hour_per_person: 20, status: 'available' },
];

// أنواع البيانات
interface TableHistoryEntry {
    tableId: string;
    tableName: string;
    pricePerHour: number;
    startTime: string;
    endTime?: string;
}

interface SessionMember {
    id: string;
    name: string;
    phone: string;
    joinedAt: string;
    leftAt: string | null;
    orders: { product: string; quantity: number; price: number }[];
}

interface ActiveSession {
    id: string;
    type: 'table' | 'hall'; // نوع الجلسة
    hallName?: string; // اسم القاعة (لو نوعها hall)
    tableId: string;
    tableName: string;
    pricePerHour: number;
    startTime: string;
    members: SessionMember[];
    tableHistory: TableHistoryEntry[];
}

interface HistorySession {
    id: string;
    type: 'table' | 'hall'; // نوع الجلسة: طاولة أو قاعة
    hallName?: string; // اسم القاعة (لو نوعها hall)
    tablesUsed: string[]; // قائمة الطاولات المستخدمة
    date: string;
    startTime: string;
    endTime: string;
    members: SessionMember[];
    totalTimeCost: number;
    totalOrdersCost: number;
    grandTotal: number;
}

// بيانات تجريبية للأعضاء
const mockAllMembers = [
    { id: 'm1', full_name: 'أحمد محمد', phone: '01012345678' },
    { id: 'm2', full_name: 'سارة أحمد', phone: '01123456789' },
    { id: 'm3', full_name: 'محمد علي', phone: '01234567890' },
    { id: 'm4', full_name: 'عمر حسن', phone: '01098765432' },
    { id: 'm5', full_name: 'ياسمين خالد', phone: '01156789012' },
];

// بيانات تجريبية للجلسات النشطة
const initialActiveSessions: ActiveSession[] = [
    {
        id: 'session-1', type: 'table', tableId: '2', tableName: 'طاولة ٢', pricePerHour: 25,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        members: [
            { id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), leftAt: null, orders: [{ product: 'قهوة تركي', quantity: 2, price: 25 }] },
            { id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), leftAt: null, orders: [{ product: 'عصير برتقال', quantity: 1, price: 30 }] },
        ],
        tableHistory: [{ tableId: '2', tableName: 'طاولة ٢', pricePerHour: 25, startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }]
    },
    {
        id: 'session-2', type: 'hall', hallName: 'قاعة VIP', tableId: 'h2', tableName: 'غرفة VIP ١ + غرفة VIP ٢', pricePerHour: 350,
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        members: [
            { id: 'm3', name: 'محمد علي', phone: '01234567890', joinedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), leftAt: null, orders: [{ product: 'ساندويتش', quantity: 2, price: 40 }] },
            { id: 'm4', name: 'عمر حسن', phone: '01098765432', joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), leftAt: null, orders: [] },
        ],
        tableHistory: [{ tableId: 'h2', tableName: 'قاعة VIP', pricePerHour: 350, startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString() }]
    },
    {
        id: 'session-3', type: 'table', tableId: '5', tableName: 'طاولة ٥', pricePerHour: 25,
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        members: [
            { id: 'm5', name: 'ياسمين خالد', phone: '01156789012', joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), leftAt: null, orders: [] },
        ],
        tableHistory: [{ tableId: '5', tableName: 'طاولة ٥', pricePerHour: 25, startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString() }]
    },
];

// بيانات تجريبية لسجل الجلسات مع الطاولات المستخدمة
const mockHistorySessions: HistorySession[] = [
    {
        id: 'hist-001', type: 'table',
        tablesUsed: ['طاولة ١', 'طاولة ٣'],
        date: '2024-12-28', startTime: '14:00', endTime: '17:30',
        members: [{ id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: '', leftAt: '', orders: [{ product: 'قهوة', quantity: 3, price: 25 }] }],
        totalTimeCost: 88, totalOrdersCost: 75, grandTotal: 163
    },
    {
        id: 'hist-002', type: 'hall', hallName: 'قاعة VIP',
        tablesUsed: ['غرفة VIP ١', 'غرفة VIP ٢'],
        date: '2024-12-28', startTime: '10:00', endTime: '12:00',
        members: [
            { id: 'm3', name: 'محمد علي', phone: '01234567890', joinedAt: '', leftAt: '', orders: [] },
            { id: 'm5', name: 'ياسمين خالد', phone: '01156789012', joinedAt: '', leftAt: '', orders: [{ product: 'شاي', quantity: 2, price: 15 }] },
        ],
        totalTimeCost: 700, totalOrdersCost: 30, grandTotal: 730
    },
    {
        id: 'hist-003', type: 'table',
        tablesUsed: ['طاولة ٣', 'طاولة ٥', 'طاولة ٦'],
        date: '2024-12-27', startTime: '16:00', endTime: '19:00',
        members: [{ id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: '', leftAt: '', orders: [{ product: 'عصير', quantity: 2, price: 30 }] }],
        totalTimeCost: 60, totalOrdersCost: 60, grandTotal: 120
    },
    {
        id: 'hist-004', type: 'hall', hallName: 'القاعة الرئيسية',
        tablesUsed: ['طاولة ١', 'طاولة ٢', 'طاولة ٣'],
        date: '2024-12-26', startTime: '18:00', endTime: '22:00',
        members: [
            { id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: '', leftAt: '', orders: [] },
            { id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: '', leftAt: '', orders: [] },
        ],
        totalTimeCost: 800, totalOrdersCost: 0, grandTotal: 800
    },
    {
        id: 'hist-005', type: 'table',
        tablesUsed: ['طاولة ٢'],
        date: '2024-12-25', startTime: '14:00', endTime: '16:00',
        members: [{ id: 'm4', name: 'عمر حسن', phone: '01098765432', joinedAt: '', leftAt: '', orders: [{ product: 'قهوة', quantity: 1, price: 25 }] }],
        totalTimeCost: 50, totalOrdersCost: 25, grandTotal: 75
    },
];

// حساب المدة بالدقائق
const calculateDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    return Math.floor((end - start) / (1000 * 60));
};

const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
};

const calculateTimeCost = (minutes: number, pricePerHour: number) => {
    return Math.ceil((minutes / 60) * pricePerHour);
};

export default function SessionsPage() {
    const [activeTab, setActiveTab] = useState('active');
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions);
    const [historySessions] = useState<HistorySession[]>(mockHistorySessions);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // نوافذ منبثقة
    const [endSessionModal, setEndSessionModal] = useState<ActiveSession | null>(null);
    const [endMemberModal, setEndMemberModal] = useState<{ session: ActiveSession; member: SessionMember } | null>(null);
    const [addMemberModal, setAddMemberModal] = useState<ActiveSession | null>(null);
    const [receiptModal, setReceiptModal] = useState<HistorySession | null>(null);
    const [switchTableModal, setSwitchTableModal] = useState<ActiveSession | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');

    // بحث الأعضاء
    const [memberSearch, setMemberSearch] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [showAddNew, setShowAddNew] = useState(false);

    // تبويبات سجل الجلسات
    const [historySubTab, setHistorySubTab] = useState<'all' | 'tables' | 'halls'>('all');

    // تبويبات الجلسات النشطة
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'tables' | 'halls'>('all');

    const filteredMembers = mockAllMembers.filter(m =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch)
    );

    // تصفية الجلسات النشطة حسب النوع
    const filteredActiveSessions = activeSessions.filter(s =>
        activeSubTab === 'all' ||
        (activeSubTab === 'tables' && s.type === 'table') ||
        (activeSubTab === 'halls' && s.type === 'hall')
    );

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

    const availableTables = mockTables.filter(t => t.status === 'available');

    // إنهاء الجلسة
    const handleEndSession = () => {
        if (!endSessionModal) return;
        setActiveSessions(activeSessions.filter(s => s.id !== endSessionModal.id));
        toast.success('تم إنهاء الجلسة وحفظها في السجل');
        setEndSessionModal(null);
    };

    // إنهاء جلسة لعضو
    const handleEndMemberSession = () => {
        if (!endMemberModal) return;
        const { session, member } = endMemberModal;
        setActiveSessions(activeSessions.map(s => {
            if (s.id !== session.id) return s;
            return { ...s, members: s.members.map(m => m.id === member.id ? { ...m, leftAt: new Date().toISOString() } : m) };
        }));
        toast.success(`تم إنهاء جلسة ${member.name}`);
        setEndMemberModal(null);
    };

    // التحقق إذا العضو موجود في جلسة نشطة
    const isMemberInActiveSession = (memberId: string, excludeSessionId?: string) => {
        return activeSessions.some(session =>
            session.id !== excludeSessionId &&
            session.members.some(m => m.id === memberId && !m.leftAt)
        );
    };

    // الحصول على اسم الجلسة النشطة للعضو
    const getMemberActiveSessionName = (memberId: string, excludeSessionId?: string) => {
        const session = activeSessions.find(s =>
            s.id !== excludeSessionId &&
            s.members.some(m => m.id === memberId && !m.leftAt)
        );
        return session ? (session.hallName || session.tableName) : null;
    };

    // إضافة عضو
    const handleAddMemberToSession = (member: typeof mockAllMembers[0]) => {
        if (!addMemberModal) return;

        // التحقق إذا العضو موجود بالفعل في الجلسة الحالية
        if (addMemberModal.members.find(m => m.id === member.id && !m.leftAt)) {
            setMemberSearch('');
            return;
        }

        // التحقق إذا العضو موجود في جلسة نشطة أخرى
        if (isMemberInActiveSession(member.id, addMemberModal.id)) {
            const sessionName = getMemberActiveSessionName(member.id, addMemberModal.id);
            toast.error(`${member.full_name} موجود بالفعل في جلسة نشطة (${sessionName})`);
            return;
        }

        const newMember: SessionMember = {
            id: member.id, name: member.full_name, phone: member.phone,
            joinedAt: new Date().toISOString(), leftAt: null, orders: []
        };
        setActiveSessions(activeSessions.map(s => {
            if (s.id !== addMemberModal.id) return s;
            return { ...s, members: [...s.members, newMember] };
        }));
        toast.success(`تم إضافة ${member.full_name}`);
        setMemberSearch('');
    };

    // إضافة عضو جديد
    const handleAddNewMember = () => {
        if (!addMemberModal || !newMemberName.trim() || !newMemberPhone.trim()) return;
        const newMember: SessionMember = {
            id: `new-${Date.now()}`, name: newMemberName, phone: newMemberPhone,
            joinedAt: new Date().toISOString(), leftAt: null, orders: []
        };
        setActiveSessions(activeSessions.map(s => s.id === addMemberModal.id ? { ...s, members: [...s.members, newMember] } : s));
        toast.success(`تم إضافة ${newMemberName}`);
        setNewMemberName('');
        setNewMemberPhone('');
        setShowAddNew(false);
    };

    // تبديل الطاولة
    const handleSwitchTable = (newTableId: string) => {
        if (!switchTableModal) return;
        const newTable = mockTables.find(t => t.id === newTableId);
        if (!newTable) return;

        const now = new Date().toISOString();

        setActiveSessions(activeSessions.map(s => {
            if (s.id !== switchTableModal.id) return s;
            const updatedHistory = s.tableHistory.map((th, i) =>
                i === s.tableHistory.length - 1 ? { ...th, endTime: now } : th
            );
            updatedHistory.push({
                tableId: newTableId,
                tableName: newTable.name,
                pricePerHour: newTable.price_per_hour_per_person,
                startTime: now,
            });
            return {
                ...s,
                tableId: newTableId,
                tableName: newTable.name,
                pricePerHour: newTable.price_per_hour_per_person,
                tableHistory: updatedHistory,
            };
        }));

        toast.success(`تم النقل إلى ${newTable.name}`);
        setSwitchTableModal(null);
    };

    // حساب فاتورة العضو
    const getMemberBill = (member: SessionMember, pricePerHour: number) => {
        const duration = calculateDuration(member.joinedAt, member.leftAt || undefined);
        const timeCost = calculateTimeCost(duration, pricePerHour);
        const ordersCost = member.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
        return { duration, timeCost, ordersCost, total: timeCost + ordersCost };
    };

    // حساب إجمالي الجلسة مع tableHistory
    const getSessionTotal = (session: ActiveSession) => {
        let timeCost = 0;
        const now = Date.now();
        const activeMembers = session.members.filter(m => !m.leftAt).length;

        session.tableHistory.forEach(th => {
            const start = new Date(th.startTime).getTime();
            const end = th.endTime ? new Date(th.endTime).getTime() : now;
            const hours = (end - start) / (1000 * 60 * 60);
            timeCost += Math.ceil(hours * th.pricePerHour * activeMembers);
        });

        const ordersCost = session.members.reduce((sum, m) => sum + m.orders.reduce((s, o) => s + (o.price * o.quantity), 0), 0);
        return { timeCost, ordersCost, total: timeCost + ordersCost };
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold gradient-text">إدارة الجلسات</h1>
                <p className="text-muted-foreground mt-1">الجلسات النشطة وسجل الجلسات السابقة</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass-card">
                    <TabsTrigger value="active" className="gap-2"><Play className="h-4 w-4" />الجلسات النشطة ({activeSessions.length})</TabsTrigger>
                    <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" />سجل الجلسات</TabsTrigger>
                </TabsList>

                {/* الجلسات النشطة */}
                <TabsContent value="active" className="space-y-4 mt-6">
                    {/* التبويبات الفرعية */}
                    <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="ghost" className={cn('glass-button', activeSubTab === 'all' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                            onClick={() => setActiveSubTab('all')}>
                            الكل ({activeSessions.length})
                        </Button>
                        <Button size="sm" variant="ghost" className={cn('glass-button', activeSubTab === 'tables' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                            onClick={() => setActiveSubTab('tables')}>
                            الطاولات ({activeSessions.filter(s => s.type === 'table').length})
                        </Button>
                        <Button size="sm" variant="ghost" className={cn('glass-button', activeSubTab === 'halls' && 'bg-[#F18A21]/20 border-[#F18A21]')}
                            onClick={() => setActiveSubTab('halls')}>
                            القاعات ({activeSessions.filter(s => s.type === 'hall').length})
                        </Button>
                    </div>

                    {filteredActiveSessions.length === 0 ? (
                        <Card className="glass-card p-12 text-center"><Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">لا توجد جلسات نشطة</p></Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredActiveSessions.map((session) => {
                                const totals = getSessionTotal(session);
                                return (
                                    <Card key={session.id} className="glass-card overflow-hidden">
                                        <CardHeader className="border-b border-white/10 pb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="text-lg">{session.tableName}</CardTitle>
                                                        <Badge variant="outline" className={cn('text-xs', session.type === 'hall' ? 'border-[#F18A21] text-[#F18A21]' : 'border-emerald-500 text-emerald-400')}>
                                                            {session.type === 'hall' ? (session.hallName || 'قاعة') : 'طاولة'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{session.members.filter(m => !m.leftAt).length} أعضاء نشطين</p>
                                                    {session.tableHistory.length > 1 && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            الطاولات: {session.tableHistory.map(th => th.tableName).join(' → ')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <SessionTimer startTime={session.startTime} className="text-xl font-bold" />
                                                    <p className="text-xs text-muted-foreground">{formatCurrency(totals.total)}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                {session.members.filter(m => !m.leftAt).map((member) => {
                                                    const bill = getMemberBill(member, session.pricePerHour);
                                                    return (
                                                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xs">{member.name.charAt(0)}</AvatarFallback></Avatar>
                                                                <div>
                                                                    <p className="font-medium text-sm">{member.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{formatDuration(bill.duration)} • {formatCurrency(bill.total)}</p>
                                                                </div>
                                                            </div>
                                                            <Button size="sm" variant="ghost" className="text-red-400 h-8" onClick={() => setEndMemberModal({ session, member })}><UserMinus className="h-4 w-4" /></Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" className="flex-1 gradient-button" onClick={() => setEndSessionModal(session)}><Square className="h-4 w-4 ml-1" />إنهاء</Button>
                                                <Button size="sm" variant="ghost" className="glass-button" onClick={() => setSwitchTableModal(session)}><ArrowLeftRight className="h-4 w-4 ml-1" />تبديل</Button>
                                                <Button size="sm" variant="ghost" className="glass-button" onClick={() => setAddMemberModal(session)}><UserPlus className="h-4 w-4 ml-1" />إضافة</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* سجل الجلسات */}
                <TabsContent value="history" className="space-y-4 mt-6">
                    {/* التبويبات الفرعية */}
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
                                {endSessionModal.tableHistory.length > 1 && (
                                    <div className="glass-card p-3">
                                        <p className="text-xs text-muted-foreground mb-2">الطاولات المستخدمة:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {endSessionModal.tableHistory.map((th, i) => <Badge key={i} variant="outline" className="text-xs">{th.tableName}</Badge>)}
                                        </div>
                                    </div>
                                )}
                                <div className="glass-card p-4 space-y-3">
                                    {endSessionModal.members.filter(m => !m.leftAt).map(member => {
                                        const bill = getMemberBill(member, endSessionModal.pricePerHour);
                                        return (
                                            <div key={member.id} className="flex items-center justify-between text-sm">
                                                <span>{member.name}</span><span>{formatCurrency(bill.total)}</span>
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
                                        {[{ id: 'cash', label: 'كاش', icon: Banknote }, { id: 'visa', label: 'فيزا', icon: CreditCard },
                                        { id: 'wallet', label: 'موبايل', icon: Smartphone }, { id: 'cairoom', label: 'CAIROOM', icon: Wallet }].map(method => (
                                            <Button key={method.id} variant="ghost" className={cn('glass-button h-12', paymentMethod === method.id && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                onClick={() => setPaymentMethod(method.id)}><method.icon className="h-4 w-4 ml-2" />{method.label}</Button>
                                        ))}
                                    </div>
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

            {/* نافذة إنهاء جلسة عضو */}
            <Dialog open={!!endMemberModal} onOpenChange={() => setEndMemberModal(null)}>
                <DialogContent className="glass-modal sm:max-w-sm">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">إنهاء جلسة العضو</DialogTitle></DialogHeader>
                    {endMemberModal && (() => {
                        const bill = getMemberBill(endMemberModal.member, endMemberModal.session.pricePerHour);
                        return (
                            <div className="space-y-4 py-4">
                                <div className="text-center">
                                    <Avatar className="h-16 w-16 mx-auto mb-2"><AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xl">{endMemberModal.member.name.charAt(0)}</AvatarFallback></Avatar>
                                    <h3 className="font-bold">{endMemberModal.member.name}</h3>
                                </div>
                                <div className="glass-card p-4 space-y-2 text-sm">
                                    <div className="flex justify-between"><span>الوقت</span><span>{formatDuration(bill.duration)}</span></div>
                                    <div className="flex justify-between"><span>تكلفة الوقت</span><span>{formatCurrency(bill.timeCost)}</span></div>
                                    <div className="flex justify-between"><span>الطلبات</span><span>{formatCurrency(bill.ordersCost)}</span></div>
                                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold"><span>الإجمالي</span><span className="gradient-text">{formatCurrency(bill.total)}</span></div>
                                </div>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                                    <SelectContent className="glass-modal">
                                        <SelectItem value="cash">كاش</SelectItem>
                                        <SelectItem value="visa">فيزا</SelectItem>
                                        <SelectItem value="wallet">موبايل والت</SelectItem>
                                        <SelectItem value="cairoom">CAIROOM Wallet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    })()}
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setEndMemberModal(null)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleEndMemberSession}>إنهاء وحفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إضافة عضو */}
            <Dialog open={!!addMemberModal} onOpenChange={() => { setAddMemberModal(null); setShowAddNew(false); setMemberSearch(''); }}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">إضافة عضو للجلسة</DialogTitle>
                        <DialogDescription>{addMemberModal?.tableName}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="ابحث عن عضو..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="glass-input pr-10" />
                            </div>
                            <Button variant="ghost" className="glass-button" onClick={() => setShowAddNew(true)}><UserPlus className="h-4 w-4" /></Button>
                        </div>
                        {memberSearch && (
                            <div className="glass-card p-2 space-y-1 max-h-40 overflow-y-auto">
                                {filteredMembers.map(member => (
                                    <button key={member.id} onClick={() => handleAddMemberToSession(member)} className="w-full p-3 text-right rounded-lg hover:bg-white/10">
                                        <p className="font-medium">{member.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{member.phone}</p>
                                    </button>
                                ))}
                                {filteredMembers.length === 0 && <p className="text-sm text-muted-foreground p-2">لا يوجد نتائج</p>}
                            </div>
                        )}
                        {showAddNew && (
                            <div className="glass-card p-4 space-y-3">
                                <p className="text-sm font-medium">عضو جديد</p>
                                <Input placeholder="الاسم" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="glass-input" />
                                <Input placeholder="رقم الهاتف" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} className="glass-input" dir="ltr" />
                                <Button size="sm" className="w-full gradient-button" onClick={handleAddNewMember} disabled={!newMemberName.trim() || !newMemberPhone.trim()}>إضافة</Button>
                            </div>
                        )}
                    </div>
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
                                        السابقة: {switchTableModal.tableHistory.slice(0, -1).map(th => th.tableName).join(' → ')}
                                    </p>
                                )}
                            </div>
                        )}
                        <p className="text-sm font-medium">الطاولات المتاحة:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            {availableTables.filter(t => t.id !== switchTableModal?.tableId).map(table => (
                                <button key={table.id} onClick={() => handleSwitchTable(table.id)} className="glass-card p-3 text-right hover:bg-white/10 transition-colors">
                                    <p className="font-medium">{table.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(table.price_per_hour_per_person)}/س/فرد</p>
                                </button>
                            ))}
                        </div>
                        {availableTables.filter(t => t.id !== switchTableModal?.tableId).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center p-4">لا توجد طاولات متاحة</p>
                        )}
                    </div>
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setSwitchTableModal(null)}>إلغاء</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة الفاتورة */}
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
                            {/* الطاولات المستخدمة */}
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
                                                {member.orders.map((o, j) => <span key={j}>{o.product} × {o.quantity}</span>)}
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
        </div>
    );
}
