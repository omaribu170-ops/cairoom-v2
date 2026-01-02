/* =================================================================
   CAIROOM - Sessions Management Page
   صفحة إدارة الجلسات - النشطة والسابقة
   ================================================================= */

'use client';

import { useState, useRef } from 'react';
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
    Plus, Coffee, Minus, X, Building2, ShoppingBag, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { SessionTimer } from '@/components/admin/SessionTimer';
import { useInventory } from '@/contexts/InventoryContext';
import { InvoiceTemplate } from '@/components/admin/InvoiceTemplate';
import { generatePDFFromElement } from '@/lib/generatePDF';

// بيانات الطاولات المتاحة
const mockTables = [
    { id: '1', name: 'طاولة ١', hallId: 'h1', price_per_hour_per_person: 25, status: 'available' },
    { id: '2', name: 'طاولة ٢', hallId: 'h1', price_per_hour_per_person: 25, status: 'busy' },
    { id: '3', name: 'طاولة ٣', hallId: 'h1', price_per_hour_per_person: 20, status: 'available' },
    { id: '4', name: 'غرفة VIP ١', hallId: 'h2', price_per_hour_per_person: 50, status: 'available' },
    { id: '5', name: 'غرفة VIP ٢', hallId: 'h2', price_per_hour_per_person: 50, status: 'available' },
    { id: '6', name: 'طاولة الحديقة', hallId: 'h3', price_per_hour_per_person: 30, status: 'available' },
];

// بيانات القاعات
const mockHalls = [
    { id: 'h1', name: 'القاعة الرئيسية', capacity_min: 10, capacity_max: 50, price_per_hour: 200 },
    { id: 'h2', name: 'قاعة VIP', capacity_min: 5, capacity_max: 20, price_per_hour: 350 },
    { id: 'h3', name: 'قاعة الحديقة', capacity_min: 20, capacity_max: 100, price_per_hour: 500 },
];

// استخدام سياق المخزون المشترك

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
    // لفواتير الأعضاء الذين غادروا مبكراً
    billDetails?: {
        duration: number;
        timeCost: number;
        ordersCost: number;
        total: number;
    };
    orders: { productId: string; name: string; quantity: number; price: number }[];
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
    hallTableIds?: string[]; // IDs of tables used in this hall session
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
            { id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), leftAt: null, orders: [{ productId: 'p1', name: 'قهوة تركي', quantity: 2, price: 25 }] },
            { id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), leftAt: null, orders: [{ productId: 'p3', name: 'عصير برتقال', quantity: 1, price: 30 }] },
        ],
        tableHistory: [{ tableId: '2', tableName: 'طاولة ٢', pricePerHour: 25, startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }]
    },
    {
        id: 'session-2', type: 'hall', hallName: 'قاعة VIP', tableId: 'h2', tableName: 'غرفة VIP ١ + غرفة VIP ٢', pricePerHour: 350,
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        members: [
            { id: 'm3', name: 'محمد علي', phone: '01234567890', joinedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), leftAt: null, orders: [{ productId: 'p4', name: 'ساندويتش', quantity: 2, price: 40 }] },
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
        members: [{ id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: '14:00', leftAt: '17:30', orders: [{ productId: 'p1', name: 'قهوة', quantity: 3, price: 25 }] }],
        totalTimeCost: 88, totalOrdersCost: 75, grandTotal: 163
    },
    {
        id: 'hist-002', type: 'hall', hallName: 'قاعة VIP',
        tablesUsed: ['غرفة VIP ١', 'غرفة VIP ٢'],
        date: '2024-12-28', startTime: '10:00', endTime: '12:00',
        members: [
            { id: 'm3', name: 'محمد علي', phone: '01234567890', joinedAt: '10:00', leftAt: '12:00', orders: [] },
            { id: 'm5', name: 'ياسمين خالد', phone: '01156789012', joinedAt: '10:00', leftAt: '12:00', orders: [{ productId: 'p2', name: 'شاي', quantity: 2, price: 15 }] },
        ],
        totalTimeCost: 700, totalOrdersCost: 30, grandTotal: 730
    },
    {
        id: 'hist-003', type: 'table',
        tablesUsed: ['طاولة ٣', 'طاولة ٥', 'طاولة ٦'],
        date: '2024-12-27', startTime: '16:00', endTime: '19:00',
        members: [{ id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: '16:00', leftAt: '19:00', orders: [{ productId: 'p3', name: 'عصير', quantity: 2, price: 30 }] }],
        totalTimeCost: 60, totalOrdersCost: 60, grandTotal: 120
    },
    {
        id: 'hist-004', type: 'hall', hallName: 'القاعة الرئيسية',
        tablesUsed: ['طاولة ١', 'طاولة ٢', 'طاولة ٣'],
        date: '2024-12-26', startTime: '18:00', endTime: '22:00',
        members: [
            { id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: '18:00', leftAt: '22:00', orders: [] },
            { id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: '18:00', leftAt: '22:00', orders: [] },
        ],
        totalTimeCost: 800, totalOrdersCost: 0, grandTotal: 800
    },
    {
        id: 'hist-005', type: 'table',
        tablesUsed: ['طاولة ٢'],
        date: '2024-12-25', startTime: '14:00', endTime: '16:00',
        members: [{ id: 'm4', name: 'عمر حسن', phone: '01098765432', joinedAt: '14:00', leftAt: '16:00', orders: [{ productId: 'p1', name: 'قهوة', quantity: 1, price: 25 }] }],
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

// تحويل الوقت للنظام العربي 12 ساعة (ص/م)
const formatArabicTime = (timeString: string) => {
    // Handle both ISO date strings and "HH:MM" time strings
    let hours: number, minutes: number;
    if (timeString.includes('T')) {
        const date = new Date(timeString);
        hours = date.getHours();
        minutes = date.getMinutes();
    } else {
        const parts = timeString.split(':');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
    }
    const period = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')}${period}`;
};

// تحويل التاريخ للعربية
const formatArabicDate = (dateString: string) => {
    const date = new Date(dateString);
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

const calculateTimeCost = (minutes: number, pricePerHour: number) => {
    return Math.ceil((minutes / 60) * pricePerHour);
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
    const [addOrderModal, setAddOrderModal] = useState<{ session: ActiveSession; member: SessionMember } | null>(null);
    const [receiptModal, setReceiptModal] = useState<HistorySession | null>(null);
    const [switchTableModal, setSwitchTableModal] = useState<ActiveSession | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [paymentDetails, setPaymentDetails] = useState({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' }); // تفاصيل الدفع
    const [cairoomWalletBalance, setCairoomWalletBalance] = useState<number | null>(null); // رصيد المحفظة الوهمي

    // استخدام سياق المخزون المشترك
    const { products: inventoryProducts, ordersRevenue, reduceStock, addOrderRevenue, getOrderableProducts } = useInventory();

    // مرجع لقالب الفاتورة
    const invoiceRef = useRef<HTMLDivElement>(null);

    // دالة تحميل الفاتورة كـ PDF مع دعم العربية
    const handleDownloadInvoicePDF = async () => {
        if (!receiptModal || !invoiceRef.current) return;

        toast.info('جاري إعداد الفاتورة...');

        try {
            await generatePDFFromElement(invoiceRef.current, `فاتورة_${receiptModal.id}`);
            toast.success('تم تحميل الفاتورة بنجاح');
        } catch {
            toast.error('حدث خطأ أثناء تحميل الفاتورة');
        }
    };

    // Start Session Modal State
    const [startSessionOpen, setStartSessionOpen] = useState(false);
    const [sessionType, setSessionType] = useState<'table' | 'hall'>('table');
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [selectedHall, setSelectedHall] = useState<string>('');
    const [hallTableMode, setHallTableMode] = useState<'hall' | 'any'>('hall'); // اختيار طاولات القاعة أو أي طاولة متاحة
    const [selectedHallTables, setSelectedHallTables] = useState<string[]>([]);
    const [sessionMembers, setSessionMembers] = useState<{ id: string; name: string; orders: { productId: string; productName: string; quantity: number; price: number }[] }[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberGender, setNewMemberGender] = useState<'male' | 'female'>('male');

    // بحث الأعضاء
    const [memberSearch, setMemberSearch] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [showAddNew, setShowAddNew] = useState(false);

    // تبويبات سجل الجلسات
    const [historySubTab, setHistorySubTab] = useState<'all' | 'tables' | 'halls'>('all');

    // تبويبات الجلسات النشطة
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'tables' | 'halls'>('all');

    // الطاولات المتاحة
    const allAvailableTables = mockTables.filter(t => t.status === 'available');

    // الطاولات المتاحة فعلياً (تستثني الطاولات المشغولة في جلسات القاعات)
    const availableTables = mockTables.filter(t => {
        if (t.status !== 'available') return false;
        // هل الطاولة مستخدمة في أي جلسة قاعة نشطة؟
        const isBusyInHall = activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id));
        return !isBusyInHall;
    });

    const hallTables = selectedHall ? mockTables.filter(t => t.hallId === selectedHall && t.status === 'available' && !activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id))) : [];

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

    // إنهاء الجلسة
    const handleEndSession = () => {
        if (!endSessionModal) return;

        // التحقق من بيانات الدفع
        if (paymentMethod === 'visa' && !paymentDetails.cardHolder) return toast.error('يرجى إدخال اسم صاحب الكارت');
        if (paymentMethod === 'wallet' && (!paymentDetails.walletNumber || !paymentDetails.walletOwner)) return toast.error('يرجى إدخال بيانات المحفظة');
        if (paymentMethod === 'cairoom' && !paymentDetails.cairoomUser) return toast.error('يرجى اختيار العضو صاحب المحفظة');
        if (paymentMethod === 'cairoom' && cairoomWalletBalance !== null && getSessionTotal(endSessionModal).total > cairoomWalletBalance) return toast.error('الرصيد غير كافي');

        const now = new Date().toISOString();
        const finalSession = {
            ...endSessionModal,
            members: endSessionModal.members.map(m => {
                if (m.leftAt) return m; // تم إنهاؤه مسبقاً
                const bill = getMemberBill(m, endSessionModal.pricePerHour);
                return { ...m, leftAt: now, billDetails: bill };
            })
        };

        setActiveSessions(activeSessions.filter(s => s.id !== endSessionModal.id));
        toast.success(`تم إنهاء الجلسة والدفع عن طريق ${getPaymentLabel(paymentMethod)}`);
        setEndSessionModal(null);
        setPaymentMethod('cash');
        setPaymentDetails({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' });
        setCairoomWalletBalance(null);
    };

    // إنهاء جلسة لعضو
    const handleEndMemberSession = () => {
        if (!endMemberModal) return;
        const { session, member } = endMemberModal;

        // التحقق من بيانات الدفع
        if (paymentMethod === 'visa' && !paymentDetails.cardHolder) return toast.error('يرجى إدخال اسم صاحب الكارت');
        if (paymentMethod === 'wallet' && (!paymentDetails.walletNumber || !paymentDetails.walletOwner)) return toast.error('يرجى إدخال بيانات المحفظة');
        if (paymentMethod === 'cairoom' && !paymentDetails.cairoomUser) return toast.error('يرجى اختيار العضو صاحب المحفظة');
        if (paymentMethod === 'cairoom' && cairoomWalletBalance !== null && getMemberBill(member, session.pricePerHour).total > cairoomWalletBalance) return toast.error('الرصيد غير كافي');


        const bill = getMemberBill(member, session.pricePerHour);

        setActiveSessions(activeSessions.map(s => {
            if (s.id !== session.id) return s;
            return {
                ...s,
                members: s.members.map(m => m.id === member.id ? {
                    ...m,
                    leftAt: new Date().toISOString(),
                    billDetails: bill // حفظ تفاصيل الفاتورة
                } : m)
            };
        }));

        toast.success(`تم إنهاء جلسة ${member.name} والدفع بـ ${getPaymentLabel(paymentMethod)}`);
        setEndMemberModal(null);
        setPaymentMethod('cash');
        setPaymentDetails({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' });
        setCairoomWalletBalance(null);
    };

    const getPaymentLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'كاش';
            case 'visa': return 'بطاقة ائتمان';
            case 'wallet': return 'محفظة موبايل';
            case 'cairoom': return 'محفظة CAIROOM';
            default: return method;
        }
    };

    const handleCheckCairoomBalance = (userId: string) => {
        // محاكاة للتحقق من الرصيد
        setCairoomWalletBalance(Math.floor(Math.random() * 500) + 100);
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

        // التحقق من تكرار رقم الهاتف
        if (mockAllMembers.some(m => m.phone === newMemberPhone)) {
            toast.error('رقم الهاتف موجود بالفعل لمستخدم آخر');
            return;
        }

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



    // إدارة طلبات الأعضاء في الجلسة النشطة
    const handleUpdateMemberOrder = (memberId: string, productId: string, delta: number) => {
        if (!addOrderModal) return;
        const product = inventoryProducts.find(p => p.id === productId);
        if (!product) return;

        // تحقق من توفر الكمية عند الإضافة
        if (delta > 0 && product.stock_quantity < delta) {
            toast.error(`الكمية غير كافية من ${product.name} (المتوفر: ${product.stock_quantity})`);
            return;
        }

        // تحديث المخزون باستخدام السياق المشترك
        if (delta > 0) {
            const success = reduceStock(productId, delta);
            if (!success) {
                toast.error('حدث خطأ في تحديث المخزون');
                return;
            }
            // تتبع الإيرادات
            addOrderRevenue(product.price * delta);
        }

        setActiveSessions(prev => prev.map(s => {
            if (s.id !== addOrderModal.session.id) return s;
            return {
                ...s,
                members: s.members.map(m => {
                    if (m.id !== memberId) return m;
                    const existingOrder = m.orders.find(o => o.productId === productId);

                    if (existingOrder) {
                        const newQty = existingOrder.quantity + delta;
                        if (newQty <= 0) return { ...m, orders: m.orders.filter(o => o.productId !== productId) };
                        return { ...m, orders: m.orders.map(o => o.productId === productId ? { ...o, quantity: newQty } : o) };
                    } else if (delta > 0) {
                        return { ...m, orders: [...m.orders, { productId, name: product.name, quantity: 1, price: product.price }] };
                    }
                    return m;
                })
            };
        }));

        // تحديث المودال أيضاً ليعكس التغييرات فوراً
        setAddOrderModal(prev => {
            if (!prev) return null;
            const updatedSession = activeSessions.find(s => s.id === prev.session.id);
            const updatedMember = updatedSession?.members.find(m => m.id === prev.member.id);
            return updatedMember ? { ...prev, member: updatedMember } : prev;
        });
    };

    // ============ Start Session Functions ============
    // إضافة عضو موجود للجلسة الجديدة
    const handleAddExistingMember = (member: typeof mockAllMembers[0]) => {
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

    // إضافة عضو جديد
    const handleAddNewMemberToSession = () => {
        if (!newMemberName.trim() || !newMemberPhone.trim()) return;

        // التحقق من تكرار رقم الهاتف
        if (mockAllMembers.some(m => m.phone === newMemberPhone)) {
            toast.error('رقم الهاتف موجود بالفعل لمستخدم آخر');
            return;
        }

        const newId = `new-${Date.now()}`;
        setSessionMembers([...sessionMembers, { id: newId, name: newMemberName, orders: [] }]);
        toast.success(`تم إضافة ${newMemberName} للقاعدة والجلسة`);
        setNewMemberName('');
        setNewMemberPhone('');
        setNewMemberGender('male');
        setShowAddMember(false);
    };

    // إزالة عضو من الجلسة الجديدة
    const handleRemoveSessionMember = (memberId: string) => {
        setSessionMembers(sessionMembers.filter(m => m.id !== memberId));
    };

    // إضافة/تقليل منتج لعضو
    const handleAdjustProduct = (memberId: string, productId: string, delta: number) => {
        const product = inventoryProducts.find(p => p.id === productId);
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
            hallName: sessionType === 'hall' ? hall?.name : undefined,
            tableId: sessionType === 'table' ? selectedTable : selectedHall,
            tableName: sessionType === 'table' ? (table?.name || '') : tableNames,
            pricePerHour,
            startTime: now,
            members: sessionMembers.map(m => ({
                id: m.id,
                name: m.name,
                phone: '',
                joinedAt: now,
                leftAt: null,
                orders: m.orders.map(o => ({ productId: o.productId, name: o.productName, quantity: o.quantity, price: o.price })),
            })),
            tableHistory: [{
                tableId: sessionType === 'table' ? selectedTable : selectedHall,
                tableName: sessionType === 'table' ? (table?.name || '') : (hall?.name || ''),
                pricePerHour,
                startTime: now,
            }],
            hallTableIds: sessionType === 'hall' ? selectedHallTables : undefined,
        };

        setActiveSessions([...activeSessions, newSession]);
        toast.success('تم بدء الجلسة بنجاح');
        resetSessionModal();
    };

    // إعادة تعيين نافذة بدء الجلسة
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
                                                                    {/* عرض تفاصيل الطلبات في الكارد */}
                                                                    {member.orders.length > 0 && (
                                                                        <div className="text-xs text-muted-foreground my-1 flex flex-wrap gap-1">
                                                                            {member.orders.map((o, idx) => (
                                                                                <span key={idx} className="bg-white/10 px-1 rounded">{o.name} ({o.quantity})</span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <p className="text-xs text-muted-foreground font-mono">{formatDuration(bill.duration)} • {formatCurrency(bill.total)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button size="sm" variant="ghost" className="text-[#F18A21] h-8 w-8 p-0" onClick={() => setAddOrderModal({ session, member })}><ShoppingBag className="h-4 w-4" /></Button>
                                                                <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={() => setEndMemberModal({ session, member })}><UserMinus className="h-4 w-4" /></Button>
                                                            </div>
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
                                    <div className="space-y-3">
                                        <Label>طريقة الدفع</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[{ id: 'cash', label: 'كاش', icon: Banknote }, { id: 'visa', label: 'كارت', icon: CreditCard },
                                            { id: 'wallet', label: 'محفظة موبيل', icon: Smartphone }, { id: 'cairoom', label: 'محفظة CAIROOM', icon: Wallet }].map(method => (
                                                <Button key={method.id} variant="ghost" className={cn('glass-button h-12 justify-start', paymentMethod === method.id && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                    onClick={() => {
                                                        setPaymentMethod(method.id);
                                                        setCairoomWalletBalance(null);
                                                        // لمن يدفع الجلسة كاملة، نفترض أول عضو هو الدافع افتراضياً أو نطلب البحث
                                                        if (method.id === 'cairoom' && endSessionModal.members.length > 0) {
                                                            const firstMember = endSessionModal.members.find(m => !m.leftAt);
                                                            if (firstMember) {
                                                                setPaymentDetails({ ...paymentDetails, cairoomUser: firstMember.id });
                                                                handleCheckCairoomBalance(firstMember.id);
                                                            }
                                                        }
                                                    }}>
                                                    <method.icon className="h-4 w-4 ml-2" />
                                                    {method.label}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* تفاصيل الفيزا */}
                                        {paymentMethod === 'visa' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <Label>اسم صاحب الكارت</Label>
                                                <Input
                                                    className="glass-input"
                                                    placeholder="الاسم المكتوب على الكارت"
                                                    value={paymentDetails.cardHolder}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolder: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {/* تفاصيل محفظة الموبايل */}
                                        {paymentMethod === 'wallet' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label>اسم صاحب المحفظة</Label>
                                                        <Input
                                                            className="glass-input"
                                                            placeholder="الاسم"
                                                            value={paymentDetails.walletOwner}
                                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, walletOwner: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>رقم المحفظة</Label>
                                                        <Input
                                                            className="glass-input"
                                                            placeholder="01xxxxxxxxx"
                                                            value={paymentDetails.walletNumber}
                                                            onChange={(e) => setPaymentDetails({ ...paymentDetails, walletNumber: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* تفاصيل محفظة كايروم */}
                                        {paymentMethod === 'cairoom' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <Label>العضو الذي سيدفع</Label>
                                                <Select
                                                    value={paymentDetails.cairoomUser}
                                                    onValueChange={(val) => {
                                                        setPaymentDetails({ ...paymentDetails, cairoomUser: val });
                                                        handleCheckCairoomBalance(val);
                                                    }}
                                                >
                                                    <SelectTrigger className="glass-input"><SelectValue placeholder="اختر العضو" /></SelectTrigger>
                                                    <SelectContent className="glass-modal">
                                                        {endSessionModal.members.filter(m => !m.leftAt).map(m => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {cairoomWalletBalance !== null && (
                                                    <div className={cn("p-2 rounded text-sm flex justify-between items-center",
                                                        cairoomWalletBalance >= totals.total ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                                                        <span>الرصيد: {formatCurrency(cairoomWalletBalance)}</span>
                                                        {cairoomWalletBalance < totals.total && <span>رصيد غير كافي</span>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                <Button size="sm" variant={paymentMethod === 'cash' ? 'default' : 'ghost'} className={cn(paymentMethod === 'cash' ? 'gradient-button' : 'glass-button', "flex-1")} onClick={() => setPaymentMethod('cash')}>كاش</Button>
                                <Button size="sm" variant={paymentMethod === 'visa' ? 'default' : 'ghost'} className={cn(paymentMethod === 'visa' ? 'gradient-button' : 'glass-button', "flex-1")} onClick={() => setPaymentMethod('visa')}>كارت</Button>
                                <Button size="sm" variant={paymentMethod === 'wallet' ? 'default' : 'ghost'} className={cn(paymentMethod === 'wallet' ? 'gradient-button' : 'glass-button', "flex-1")} onClick={() => setPaymentMethod('wallet')}>محفظة</Button>
                                <Button size="sm" variant={paymentMethod === 'cairoom' ? 'default' : 'ghost'} className={cn(paymentMethod === 'cairoom' ? 'gradient-button' : 'glass-button', "flex-1")} onClick={() => {
                                    setPaymentMethod('cairoom');
                                    setPaymentDetails({ ...paymentDetails, cairoomUser: endMemberModal.member.id });
                                    handleCheckCairoomBalance(endMemberModal.member.id);
                                }}>Cairoom</Button>
                                {/* تفاصيل طريقة الدفع للعضو */}
                                <div className="mt-4 space-y-3">
                                    {paymentMethod === 'visa' && (
                                        <Input placeholder="اسم صاحب الكارت" value={paymentDetails.cardHolder} onChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolder: e.target.value })} className="glass-input" />
                                    )}
                                    {paymentMethod === 'wallet' && (
                                        <>
                                            <Input placeholder="اسم صاحب المحفظة" value={paymentDetails.walletOwner} onChange={(e) => setPaymentDetails({ ...paymentDetails, walletOwner: e.target.value })} className="glass-input" />
                                            <Input placeholder="رقم المحفظة" value={paymentDetails.walletNumber} onChange={(e) => setPaymentDetails({ ...paymentDetails, walletNumber: e.target.value })} className="glass-input" />
                                        </>
                                    )}
                                    {paymentMethod === 'cairoom' && (
                                        <div className={cn("p-3 rounded text-center text-sm", cairoomWalletBalance !== null && cairoomWalletBalance >= bill.total ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                                            {cairoomWalletBalance !== null ? `الرصيد: ${formatCurrency(cairoomWalletBalance)}` : 'جاري التحقق...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setEndMemberModal(null)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleEndMemberSession}>إنهاء وحفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إضافة طلبات للعضو */}
            <Dialog open={!!addOrderModal} onOpenChange={() => setAddOrderModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">إضافة طلبات</DialogTitle>
                        <DialogDescription>{addOrderModal?.member.name}</DialogDescription>
                    </DialogHeader>
                    {addOrderModal && (
                        <div className="space-y-4 py-4">
                            <div className="flex flex-wrap gap-2">
                                {getOrderableProducts().map(product => {
                                    // نستخدم نسخة محدثة من العضو من الستيت
                                    const currentMember = activeSessions.find(s => s.id === addOrderModal.session.id)?.members.find(m => m.id === addOrderModal.member.id);
                                    const order = currentMember?.orders.find(o => o.productId === product.id);
                                    return (
                                        <div key={product.id} className={cn('flex items-center gap-2 glass-card p-2 rounded-lg cursor-pointer transition-all', order && 'bg-[#F18A21]/20 border-[#F18A21]')}>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10"
                                                    onClick={() => handleUpdateMemberOrder(addOrderModal.member.id, product.id, -1)} disabled={!order}>
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-4 text-center text-sm font-bold">{order?.quantity || 0}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10"
                                                    onClick={() => handleUpdateMemberOrder(addOrderModal.member.id, product.id, 1)}>
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="glass-card p-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">إجمالي الطلبات</span>
                                    <span className="font-bold text-lg">
                                        {formatCurrency(
                                            (activeSessions.find(s => s.id === addOrderModal.session.id)?.members.find(m => m.id === addOrderModal.member.id)?.orders || [])
                                                .reduce((sum, o) => sum + (o.price * o.quantity), 0)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button className="gradient-button w-full" onClick={() => setAddOrderModal(null)}>إغلاق</Button>
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
                <DialogContent className="glass-modal sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">فاتورة الجلسة</DialogTitle></DialogHeader>
                    {receiptModal && (
                        <div className="space-y-4 py-4">
                            {/* معلومات الجلسة الأساسية */}
                            <div className="glass-card p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">رقم الجلسة</span><span className="font-mono">{receiptModal.id}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">التاريخ</span><span>{formatArabicDate(receiptModal.date)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">الوقت</span><span>{formatArabicTime(receiptModal.startTime)} - {formatArabicTime(receiptModal.endTime)}</span></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">الطاولات</span>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                        {receiptModal.tablesUsed.map((t, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* بطاقات الأعضاء */}
                            <div className="space-y-2">
                                <Label className="text-sm">الأعضاء</Label>
                                <div className="flex gap-3 overflow-x-auto pb-2" style={{ direction: 'rtl' }}>
                                    {receiptModal.members.map((member, i) => (
                                        <div key={i} className="glass-card p-3 min-w-[200px] flex-shrink-0">
                                            <div className="flex justify-between items-start">
                                                <div className="text-right">
                                                    <p className="font-bold text-sm">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.phone || 'بدون رقم'}</p>
                                                    {member.orders.length > 0 && (
                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                            {member.orders.map((o, j) => (
                                                                <div key={j}>{o.name} × {o.quantity}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-left text-xs">
                                                    <p className="text-muted-foreground">{formatArabicTime(receiptModal.startTime)} - {formatArabicTime(receiptModal.endTime)}</p>
                                                    <p className="text-muted-foreground mt-1">طلبات: {formatCurrency(member.orders.reduce((sum, o) => sum + o.price * o.quantity, 0))}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* إجماليات الجلسة */}
                            <div className="glass-card p-4 space-y-2">
                                <div className="flex justify-between text-sm"><span>إجمالي الطلبات</span><span>{formatCurrency(receiptModal.totalOrdersCost)}</span></div>
                                <div className="flex justify-between text-sm"><span>إجمالي الوقت</span><span>{formatCurrency(receiptModal.totalTimeCost)}</span></div>
                                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                                    <span>الإجمالي الكلي</span><span className="gradient-text text-lg">{formatCurrency(receiptModal.grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* قالب الفاتورة المخفي للطباعة */}
                    {receiptModal && (
                        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                            <InvoiceTemplate ref={invoiceRef} data={{
                                id: receiptModal.id,
                                date: receiptModal.date,
                                startTime: receiptModal.startTime,
                                endTime: receiptModal.endTime,
                                tablesUsed: receiptModal.tablesUsed,
                                members: receiptModal.members.map(m => ({
                                    name: m.name,
                                    phone: m.phone,
                                    joinedAt: m.joinedAt,
                                    leftAt: m.leftAt,
                                    orders: m.orders,
                                })),
                                totalOrdersCost: receiptModal.totalOrdersCost,
                                totalTimeCost: receiptModal.totalTimeCost,
                                grandTotal: receiptModal.grandTotal,
                            }} />
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setReceiptModal(null)}>إغلاق</Button>
                        <Button className="gradient-button" onClick={handleDownloadInvoicePDF}>تحميل الفاتورة</Button>
                    </DialogFooter>
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
                                    {mockHalls.map(h => (
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
                                        <p className="text-xs text-muted-foreground">تم اختيار: {selectedHallTables.map(id => mockTables.find(t => t.id === id)?.name).join(', ')}</p>
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
                            <Input placeholder="ابحث عن عضو..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="glass-input pr-10" />
                        </div>
                        {memberSearch && (
                            <div className="glass-card p-2 space-y-1 max-h-32 overflow-y-auto">
                                {filteredMembers.map(m => (
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
                                            {getOrderableProducts().map(p => {
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
