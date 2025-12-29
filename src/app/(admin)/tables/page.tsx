/* =================================================================
   CAIROOM - Tables & Sessions Management Page
   صفحة إدارة الطاولات والجلسات
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCard } from '@/components/admin/TableCard';
import { TableModal } from '@/components/admin/TableModal';
import { StartSessionModal } from '@/components/admin/StartSessionModal';
import { PaymentModal } from '@/components/admin/PaymentModal';
import { Table, Session, Order, SessionAttendee } from '@/types/database';
import { toast } from 'sonner';
import {
    Plus,
    Search,
    Grid3X3,
    List,
    Table2,
    Clock,
    Filter,
} from 'lucide-react';

// بيانات تجريبية للطاولات
const mockTables: Table[] = [
    {
        id: '1',
        name: 'طاولة ١',
        image_url: null,
        capacity_min: 1,
        capacity_max: 4,
        price_per_hour_per_person: 25,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'طاولة ٢',
        image_url: null,
        capacity_min: 1,
        capacity_max: 4,
        price_per_hour_per_person: 25,
        status: 'busy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '3',
        name: 'طاولة ٣',
        image_url: null,
        capacity_min: 2,
        capacity_max: 6,
        price_per_hour_per_person: 20,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '4',
        name: 'غرفة الاجتماعات',
        image_url: null,
        capacity_min: 4,
        capacity_max: 12,
        price_per_hour_per_person: 50,
        status: 'busy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '5',
        name: 'ركن القهوة',
        image_url: null,
        capacity_min: 1,
        capacity_max: 2,
        price_per_hour_per_person: 15,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '6',
        name: 'طاولة ٤',
        image_url: null,
        capacity_min: 2,
        capacity_max: 6,
        price_per_hour_per_person: 20,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// جلسات تجريبية
const mockSessions: Record<string, Session> = {
    '2': {
        id: 'session-1',
        table_id: '2',
        start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // ٢ ساعة
        end_time: null,
        status: 'active',
        total_amount: 0,
        paid_amount: 0,
        payment_method: null,
        attendees: [
            { user_id: null, name: 'أحمد', phone: '01012345678' },
            { user_id: null, name: 'محمد' },
            { user_id: null, name: 'علي' },
        ],
        guest_count: 3,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    '4': {
        id: 'session-2',
        table_id: '4',
        start_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // ٤٥ دقيقة
        end_time: null,
        status: 'active',
        total_amount: 0,
        paid_amount: 0,
        payment_method: null,
        attendees: [
            { user_id: null, name: 'شركة ABC' },
        ],
        guest_count: 8,
        notes: 'اجتماع عمل',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
};

// طلبات تجريبية
const mockOrders: Order[] = [
    {
        id: 'order-1',
        session_id: 'session-1',
        product_id: 'p1',
        quantity: 3,
        price_at_time: 15,
        status: 'delivered',
        created_at: new Date().toISOString(),
        product: { id: 'p1', name: 'قهوة تركي', type: 'drink', price: 15, cost_price: 5, stock_quantity: 100, image_url: null, is_active: true, created_at: '', updated_at: '' },
    },
    {
        id: 'order-2',
        session_id: 'session-1',
        product_id: 'p2',
        quantity: 2,
        price_at_time: 25,
        status: 'delivered',
        created_at: new Date().toISOString(),
        product: { id: 'p2', name: 'ساندويتش جبنة', type: 'food', price: 25, cost_price: 12, stock_quantity: 30, image_url: null, is_active: true, created_at: '', updated_at: '' },
    },
];

export default function TablesPage() {
    const [tables, setTables] = useState<Table[]>(mockTables);
    const [sessions, setSessions] = useState<Record<string, Session>>(mockSessions);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy'>('all');

    // نوافذ منبثقة
    const [tableModalOpen, setTableModalOpen] = useState(false);
    const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
    const [startSessionModalOpen, setStartSessionModalOpen] = useState(false);
    const [selectedTableForSession, setSelectedTableForSession] = useState<Table | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedSessionForPayment, setSelectedSessionForPayment] = useState<Session | null>(null);
    const [selectedTableForPayment, setSelectedTableForPayment] = useState<Table | null>(null);

    // تصفية الطاولات
    const filteredTables = tables.filter((table) => {
        const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // إحصائيات سريعة
    const stats = {
        total: tables.length,
        available: tables.filter((t) => t.status === 'available').length,
        busy: tables.filter((t) => t.status === 'busy').length,
        activeSessions: Object.keys(sessions).length,
    };

    // معالجات الأحداث
    const handleAddTable = () => {
        setSelectedTableForEdit(null);
        setTableModalOpen(true);
    };

    const handleEditTable = (tableId: string) => {
        const table = tables.find((t) => t.id === tableId);
        if (table) {
            setSelectedTableForEdit(table);
            setTableModalOpen(true);
        }
    };

    const handleSaveTable = (data: {
        name: string;
        capacity_min: number;
        capacity_max: number;
        price_per_hour_per_person: number;
        image_url?: string;
    }) => {
        if (selectedTableForEdit) {
            // تعديل
            setTables((prev) =>
                prev.map((t) =>
                    t.id === selectedTableForEdit.id
                        ? { ...t, ...data, updated_at: new Date().toISOString() }
                        : t
                )
            );
            toast.success('تم تعديل الطاولة بنجاح');
        } else {
            // إضافة جديدة
            const newTable: Table = {
                id: `table-${Date.now()}`,
                ...data,
                image_url: data.image_url || null,
                status: 'available',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setTables((prev) => [...prev, newTable]);
            toast.success('تم إضافة الطاولة بنجاح');
        }
        setTableModalOpen(false);
    };

    const handleStartSession = (tableId: string) => {
        const table = tables.find((t) => t.id === tableId);
        if (table) {
            setSelectedTableForSession(table);
            setStartSessionModalOpen(true);
        }
    };

    const handleConfirmStartSession = (data: {
        guestCount: number;
        attendees: Array<{ name: string; phone?: string }>;
        notes?: string;
    }) => {
        if (!selectedTableForSession) return;

        const newSession: Session = {
            id: `session-${Date.now()}`,
            table_id: selectedTableForSession.id,
            start_time: new Date().toISOString(),
            end_time: null,
            status: 'active',
            total_amount: 0,
            paid_amount: 0,
            payment_method: null,
            attendees: data.attendees.map((a) => ({ user_id: null, ...a })),
            guest_count: data.guestCount,
            notes: data.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setSessions((prev) => ({ ...prev, [selectedTableForSession.id]: newSession }));
        setTables((prev) =>
            prev.map((t) =>
                t.id === selectedTableForSession.id ? { ...t, status: 'busy' as const } : t
            )
        );

        toast.success(`تم بدء الجلسة في ${selectedTableForSession.name}`);
        setStartSessionModalOpen(false);
        setSelectedTableForSession(null);
    };

    const handleEndSession = (sessionId: string) => {
        // البحث عن الجلسة والطاولة
        const tableId = Object.keys(sessions).find((key) => sessions[key].id === sessionId);
        if (!tableId) return;

        const session = sessions[tableId];
        const table = tables.find((t) => t.id === tableId);
        if (!table) return;

        setSelectedSessionForPayment(session);
        setSelectedTableForPayment(table);
        setPaymentModalOpen(true);
    };

    const handleConfirmPayment = (data: {
        paymentMethod: string;
        paidAmount: number;
    }) => {
        if (!selectedSessionForPayment || !selectedTableForPayment) return;

        // حذف الجلسة وتحديث الطاولة
        setSessions((prev) => {
            const updated = { ...prev };
            delete updated[selectedTableForPayment.id];
            return updated;
        });

        setTables((prev) =>
            prev.map((t) =>
                t.id === selectedTableForPayment.id ? { ...t, status: 'available' as const } : t
            )
        );

        toast.success('تم إنهاء الجلسة وتسجيل الدفع بنجاح');
        setPaymentModalOpen(false);
        setSelectedSessionForPayment(null);
        setSelectedTableForPayment(null);
    };

    return (
        <div className="space-y-6">
            {/* العنوان والإحصائيات */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">الطاولات والجلسات</h1>
                    <p className="text-muted-foreground mt-1">إدارة طاولات المكان والجلسات النشطة</p>
                </div>

                {/* إحصائيات سريعة */}
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <Table2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{stats.total} طاولة</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-sm">{stats.available} فاضية</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
                        <Clock className="h-4 w-4 text-[#F18A21]" />
                        <span className="text-sm">{stats.activeSessions} جلسة نشطة</span>
                    </div>
                </div>
            </div>

            {/* شريط الأدوات */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* البحث */}
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث عن طاولة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="glass-input pr-10"
                    />
                </div>

                {/* الفلاتر */}
                <div className="flex gap-2">
                    <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                        <TabsList className="glass-card">
                            <TabsTrigger value="all">الكل</TabsTrigger>
                            <TabsTrigger value="available">فاضية</TabsTrigger>
                            <TabsTrigger value="busy">مشغولة</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* وضع العرض */}
                    <div className="flex gap-1 p-1 rounded-lg glass-card">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={viewMode === 'grid' ? 'bg-white/10' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={viewMode === 'list' ? 'bg-white/10' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* زر الإضافة */}
                    <Button className="gradient-button" onClick={handleAddTable}>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة طاولة
                    </Button>
                </div>
            </div>

            {/* شبكة الطاولات */}
            <div className={
                viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
            }>
                {filteredTables.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        session={sessions[table.id] || null}
                        onStartSession={handleStartSession}
                        onEndSession={handleEndSession}
                        onManage={handleEditTable}
                    />
                ))}
            </div>

            {/* رسالة فارغة */}
            {filteredTables.length === 0 && (
                <Card className="glass-card">
                    <CardContent className="py-12 text-center">
                        <Table2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">مفيش طاولات هنا</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? 'جرب تبحث بكلمة تانية' : 'اضغط على "إضافة طاولة" عشان تضيف أول طاولة'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* النوافذ المنبثقة */}
            <TableModal
                open={tableModalOpen}
                onOpenChange={setTableModalOpen}
                table={selectedTableForEdit}
                onSave={handleSaveTable}
            />

            <StartSessionModal
                open={startSessionModalOpen}
                onOpenChange={setStartSessionModalOpen}
                table={selectedTableForSession}
                onConfirm={handleConfirmStartSession}
            />

            <PaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                session={selectedSessionForPayment}
                table={selectedTableForPayment}
                orders={selectedSessionForPayment ? mockOrders.filter((o) => o.session_id === selectedSessionForPayment.id) : []}
                userWalletBalance={150} // مثال: رصيد المحفظة
                onConfirmPayment={handleConfirmPayment}
            />
        </div>
    );
}
