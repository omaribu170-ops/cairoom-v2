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
    ArrowUpLeft, ArrowDownRight, X, UserPlus, UserMinus, Coffee, Minus, Calendar,
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
    { id: 'h1', name: 'القاعة الرئيسية', tables: ['1', '2', '3'], first_hour_cost: 200, remaining_hour_cost: 150, capacity_min: 10, capacity_max: 20 },
    { id: 'h2', name: 'قاعة VIP', tables: ['4', '5'], first_hour_cost: 350, remaining_hour_cost: 250, capacity_min: 5, capacity_max: 10 },
    { id: 'h3', name: 'الحديقة', tables: ['6'], first_hour_cost: 150, remaining_hour_cost: 100, capacity_min: 15, capacity_max: 30 },
];

// بيانات تجريبية للطاولات
const mockTables = [
    { id: '1', name: 'طاولة ١', hallId: 'h1', capacity_min: 2, capacity_max: 4, first_hour_cost: 25, remaining_hour_cost: 15, status: 'available' },
    { id: '2', name: 'طاولة ٢', hallId: 'h1', capacity_min: 2, capacity_max: 6, first_hour_cost: 25, remaining_hour_cost: 15, status: 'busy' },
    { id: '3', name: 'طاولة ٣', hallId: 'h1', capacity_min: 4, capacity_max: 8, first_hour_cost: 20, remaining_hour_cost: 12, status: 'available' },
    { id: '4', name: 'غرفة VIP ١', hallId: 'h2', capacity_min: 6, capacity_max: 12, first_hour_cost: 50, remaining_hour_cost: 35, status: 'available' },
    { id: '5', name: 'غرفة VIP ٢', hallId: 'h2', capacity_min: 4, capacity_max: 8, first_hour_cost: 50, remaining_hour_cost: 35, status: 'available' },
    { id: '6', name: 'طاولة الحديقة', hallId: 'h3', capacity_min: 4, capacity_max: 10, first_hour_cost: 30, remaining_hour_cost: 20, status: 'available' },
];

// بيانات تجريبية للأعضاء
const mockMembers = [
    { id: 'm1', full_name: 'أحمد محمد', phone: '01012345678', gender: 'male' },
    { id: 'm2', full_name: 'سارة أحمد', phone: '01123456789', gender: 'female' },
    { id: 'm3', full_name: 'محمد علي', phone: '01234567890', gender: 'male' },
    { id: 'm4', full_name: 'عمر حسن', phone: '01098765432', gender: 'male' },
];

// بيانات المنتجات (المخزون) - طعام ومشروبات فقط
const initialInventoryProducts = [
    { id: 'p1', name: 'قهوة تركي', type: 'drink' as const, price: 25, stock_quantity: 100 },
    { id: 'p2', name: 'شاي', type: 'drink' as const, price: 15, stock_quantity: 200 },
    { id: 'p3', name: 'عصير برتقال', type: 'drink' as const, price: 30, stock_quantity: 50 },
    { id: 'p4', name: 'نسكافيه', type: 'drink' as const, price: 20, stock_quantity: 80 },
    { id: 'p5', name: 'ساندويتش جبنة', type: 'food' as const, price: 35, stock_quantity: 30 },
    { id: 'p6', name: 'كرواسون', type: 'food' as const, price: 25, stock_quantity: 40 },
    { id: 'p7', name: 'بيتزا صغيرة', type: 'food' as const, price: 45, stock_quantity: 20 },
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
    firstHourCost: number; // تكلفة الساعة الأولى لكل فرد
    remainingHourCost: number; // تكلفة الساعات المتبقية لكل فرد
    startTime: string;
    members: SessionMember[];
    tableHistory: TableHistoryEntry[];
    hallTableIds?: string[]; // IDs of tables used in this hall session
}

const initialActiveSessions: ActiveSession[] = [
    {
        id: 'session-1', type: 'table', tableId: '2', tableName: 'طاولة ٢', firstHourCost: 25, remainingHourCost: 15,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        members: [
            { id: 'm1', name: 'أحمد محمد', phone: '01012345678', joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), leftAt: null, orders: [{ productId: 'p1', name: 'قهوة تركي', quantity: 2, price: 25 }] },
            { id: 'm2', name: 'سارة أحمد', phone: '01123456789', joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), leftAt: null, orders: [{ productId: 'p3', name: 'عصير برتقال', quantity: 1, price: 30 }] },
        ],
        tableHistory: [{ tableId: '2', tableName: 'طاولة ٢', pricePerHour: 25, startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }]
    },
    {
        id: 'session-2', type: 'hall', hallName: 'قاعة VIP', tableId: 'h2', tableName: 'غرفة VIP ١ + غرفة VIP ٢', firstHourCost: 350, remainingHourCost: 250,
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        members: [
            { id: 'm3', name: 'محمد علي', phone: '01234567890', joinedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), leftAt: null, orders: [{ productId: 'p4', name: 'ساندويتش', quantity: 2, price: 40 }] },
            { id: 'm4', name: 'عمر حسن', phone: '01098765432', joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), leftAt: null, orders: [] },
        ],
        tableHistory: [{ tableId: 'h2', tableName: 'قاعة VIP', pricePerHour: 350, startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString() }]
    },
];

// بيانات تجريبية للأعضاء لغرض البحث
const mockAllMembers = [
    { id: 'm1', full_name: 'أحمد محمد', phone: '01012345678' },
    { id: 'm2', full_name: 'سارة أحمد', phone: '01123456789' },
    { id: 'm3', full_name: 'محمد علي', phone: '01234567890' },
    { id: 'm4', full_name: 'عمر حسن', phone: '01098765432' },
    { id: 'm5', full_name: 'ياسمين خالد', phone: '01156789012' },
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
const formatArabicTime = (dateString: string) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
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

// أكواد الخصم التجريبية
const mockPromocodes = [
    { code: 'WELCOME10', discount: 10, active: true },
    { code: 'MEMBER20', discount: 20, active: true },
    { code: 'VIP30', discount: 30, active: true },
    { code: 'EXPIRED', discount: 15, active: false },
];

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

// حساب فاتورة العضو مع الأسعار المتدرجة
const getMemberBill = (member: SessionMember, firstHourCost: number, remainingHourCost: number) => {
    const duration = calculateDuration(member.joinedAt, member.leftAt || undefined);
    const hours = duration / 60;

    // ساعة أولى + ساعات متبقية
    let timeCost = 0;
    if (hours <= 1) {
        // أقل من ساعة: تحسب ساعة كاملة بسعر الساعة الأولى
        timeCost = firstHourCost;
    } else {
        // ساعة أولى + باقي الساعات
        const remainingHours = Math.ceil(hours - 1);
        timeCost = firstHourCost + (remainingHours * remainingHourCost);
    }

    const ordersCost = member.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
    return { duration, timeCost, ordersCost, total: timeCost + ordersCost };
};

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
    // نوافذ منبثقة
    const [endSessionModal, setEndSessionModal] = useState<ActiveSession | null>(null);
    const [endMemberModal, setEndMemberModal] = useState<{ session: ActiveSession; member: SessionMember } | null>(null);
    const [addMemberModal, setAddMemberModal] = useState<ActiveSession | null>(null);
    const [addOrderModal, setAddOrderModal] = useState<{ session: ActiveSession; member: SessionMember } | null>(null);
    const [switchTableModal, setSwitchTableModal] = useState<ActiveSession | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [paymentDetails, setPaymentDetails] = useState({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' });
    const [cairoomWalletBalance, setCairoomWalletBalance] = useState<number | null>(null);
    const [freezeTime, setFreezeTime] = useState<string | null>(null); // وقت تجميد المؤقت عند فتح نافذة إنهاء الجلسة
    const [promocode, setPromocode] = useState(''); // كود الخصم
    const [appliedDiscount, setAppliedDiscount] = useState<number>(0); // نسبة الخصم المطبقة
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');
    const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions);

    // حالة المخزون وإيرادات الطلبات
    const [inventoryProducts, setInventoryProducts] = useState(initialInventoryProducts);
    const [ordersRevenue, setOrdersRevenue] = useState(0);

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

    // بحث الأعضاء
    const [memberSearch, setMemberSearch] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [showAddNew, setShowAddNew] = useState(false);

    const stats = useMemo(() => getStatsByPeriod(timePeriod), [timePeriod]);

    // الطاولات المتاحة فعلياً (تستثني الطاولات المشغولة في جلسات القاعات)
    const availableTables = mockTables.filter(t => {
        if (t.status !== 'available') return false;
        const isBusyInHall = activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id));
        return !isBusyInHall;
    });

    const hallTables = selectedHall ? mockTables.filter(t => t.hallId === selectedHall && t.status === 'available' && !activeSessions.some(s => s.type === 'hall' && s.hallTableIds?.includes(t.id))) : [];
    const allAvailableTables = mockTables.filter(t => t.status === 'available');

    const filteredMembers = mockAllMembers.filter(m =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch)
    );

    // إنهاء الجلسة
    const handleEndSession = () => {
        if (!endSessionModal) return;
        if (paymentMethod === 'visa' && !paymentDetails.cardHolder) return toast.error('يرجى إدخال اسم صاحب الكارت');
        if (paymentMethod === 'wallet' && (!paymentDetails.walletNumber || !paymentDetails.walletOwner)) return toast.error('يرجى إدخال بيانات المحفظة');
        if (paymentMethod === 'cairoom' && !paymentDetails.cairoomUser) return toast.error('يرجى اختيار العضو صاحب المحفظة');
        if (paymentMethod === 'cairoom' && cairoomWalletBalance !== null && getSessionTotal(endSessionModal).total > cairoomWalletBalance) return toast.error('الرصيد غير كافي');

        setActiveSessions(activeSessions.filter(s => s.id !== endSessionModal.id));
        toast.success(`تم إنهاء الجلسة والدفع عن طريق ${getPaymentLabel(paymentMethod)}`);
        closeEndSessionModal();
    };

    // فتح نافذة إنهاء الجلسة مع تجميد المؤقت
    const openEndSessionModal = (session: ActiveSession) => {
        setFreezeTime(new Date().toISOString());
        setEndSessionModal(session);
        setPromocode('');
        setAppliedDiscount(0);
    };

    // إغلاق نافذة إنهاء الجلسة وإلغاء التجميد
    const closeEndSessionModal = () => {
        setEndSessionModal(null);
        setFreezeTime(null);
        setPaymentMethod('cash');
        setPaymentDetails({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' });
        setCairoomWalletBalance(null);
        setPromocode('');
        setAppliedDiscount(0);
    };

    // تطبيق كود الخصم
    const handleApplyPromocode = () => {
        const promo = mockPromocodes.find(p => p.code.toUpperCase() === promocode.toUpperCase() && p.active);
        if (promo) {
            setAppliedDiscount(promo.discount);
            toast.success(`تم تطبيق خصم ${promo.discount}%`);
        } else {
            toast.error('كود الخصم غير صحيح أو منتهي');
            setAppliedDiscount(0);
        }
    };

    // إنهاء جلسة لعضو
    const handleEndMemberSession = () => {
        if (!endMemberModal) return;
        const { session, member } = endMemberModal;

        if (paymentMethod === 'visa' && !paymentDetails.cardHolder) return toast.error('يرجى إدخال اسم صاحب الكارت');
        if (paymentMethod === 'wallet' && (!paymentDetails.walletNumber || !paymentDetails.walletOwner)) return toast.error('يرجى إدخال بيانات المحفظة');
        if (paymentMethod === 'cairoom' && !paymentDetails.cairoomUser) return toast.error('يرجى اختيار العضو صاحب المحفظة');
        if (paymentMethod === 'cairoom' && cairoomWalletBalance !== null && getMemberBill(member, session.firstHourCost, session.remainingHourCost).total > cairoomWalletBalance) return toast.error('الرصيد غير كافي');

        const bill = getMemberBill(member, session.firstHourCost, session.remainingHourCost);

        setActiveSessions(activeSessions.map(s => {
            if (s.id !== session.id) return s;
            return {
                ...s,
                members: s.members.map(m => m.id === member.id ? {
                    ...m,
                    leftAt: new Date().toISOString(),
                    billDetails: bill
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
        setCairoomWalletBalance(Math.floor(Math.random() * 500) + 100);
    };

    const isMemberInActiveSession = (memberId: string, excludeSessionId?: string) => {
        return activeSessions.some(session =>
            session.id !== excludeSessionId &&
            session.members.some(m => m.id === memberId && !m.leftAt)
        );
    };

    const getMemberActiveSessionName = (memberId: string, excludeSessionId?: string) => {
        const session = activeSessions.find(s =>
            s.id !== excludeSessionId &&
            s.members.some(m => m.id === memberId && !m.leftAt)
        );
        return session ? (session.hallName || session.tableName) : null;
    };

    const handleAddMemberToSession = (member: typeof mockAllMembers[0]) => {
        if (!addMemberModal) return;
        if (addMemberModal.members.find(m => m.id === member.id && !m.leftAt)) {
            setMemberSearch('');
            return;
        }
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

    const handleAddNewMember = () => {
        if (!addMemberModal || !newMemberName.trim() || !newMemberPhone.trim()) return;
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
                pricePerHour: newTable.first_hour_cost,
                startTime: now,
            });
            return {
                ...s,
                tableId: newTableId,
                tableName: newTable.name,
                firstHourCost: newTable.first_hour_cost,
                remainingHourCost: newTable.remaining_hour_cost,
                tableHistory: updatedHistory,
            };
        }));

        toast.success(`تم النقل إلى ${newTable.name}`);
        setSwitchTableModal(null);
    };

    const handleUpdateMemberOrder = (memberId: string, productId: string, delta: number) => {
        if (!addOrderModal) return;
        const product = inventoryProducts.find(p => p.id === productId);
        if (!product) return;

        // تحقق من توفر الكمية عند الإضافة
        if (delta > 0 && product.stock_quantity < delta) {
            toast.error(`الكمية غير كافية من ${product.name} (المتوفر: ${product.stock_quantity})`);
            return;
        }

        // تحديث المخزون
        setInventoryProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, stock_quantity: p.stock_quantity - delta } : p
        ));

        // تتبع الإيرادات
        if (delta > 0) {
            setOrdersRevenue(prev => prev + (product.price * delta));
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

        setAddOrderModal(prev => {
            if (!prev) return null;
            const updatedSession = activeSessions.find(s => s.id === prev.session.id);
            const updatedMember = updatedSession?.members.find(m => m.id === prev.member.id);
            return updatedMember ? { ...prev, member: updatedMember } : prev;
        });
    };

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

    const handleAddNewMemberToSession = () => {
        if (!newMemberName.trim() || !newMemberPhone.trim()) return;
        if (mockAllMembers.some(m => m.phone === newMemberPhone)) {
            toast.error('رقم الهاتف موجود بالفعل لمستخدم آخر');
            return;
        }

        const newId = `new-${Date.now()}`;
        setSessionMembers([...sessionMembers, { id: newId, name: newMemberName, orders: [] }]);
        toast.success(`تم إضافة ${newMemberName}`);
        setNewMemberName('');
        setNewMemberPhone('');
        setNewMemberGender('male');
        setShowAddMember(false);
    };

    const handleRemoveSessionMember = (memberId: string) => {
        setSessionMembers(sessionMembers.filter(m => m.id !== memberId));
    };

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

    const toggleHallTable = (tableId: string) => {
        setSelectedHallTables(prev => prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]);
    };

    const handleStartSession = () => {
        if (sessionType === 'table' && (!selectedTable || sessionMembers.length === 0)) return;
        if (sessionType === 'hall' && (!selectedHall || selectedHallTables.length === 0 || sessionMembers.length === 0)) return;

        const table = mockTables.find(t => t.id === selectedTable);
        const hall = mockHalls.find(h => h.id === selectedHall);
        const tableNames = selectedHallTables.map(id => mockTables.find(t => t.id === id)?.name).join(' + ');
        const now = new Date().toISOString();
        const firstHourCost = sessionType === 'table' ? (table?.first_hour_cost || 25) : (hall?.first_hour_cost || 200);
        const remainingHourCost = sessionType === 'table' ? (table?.remaining_hour_cost || 15) : (hall?.remaining_hour_cost || 150);

        const newSession: ActiveSession = {
            id: `session-${Date.now()}`,
            type: sessionType,
            hallName: sessionType === 'hall' ? hall?.name : undefined,
            tableId: sessionType === 'table' ? selectedTable : selectedHall,
            tableName: sessionType === 'table' ? (table?.name || '') : tableNames,
            firstHourCost,
            remainingHourCost,
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
                pricePerHour: firstHourCost,
                startTime: now,
            }],
            hallTableIds: sessionType === 'hall' ? selectedHallTables : undefined,
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
        setHallTableMode('hall');
        setSelectedHallTables([]);
        setSessionMembers([]);
        setMemberSearch('');
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

            {/* الجلسات النشطة */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Table2 className="h-5 w-5 text-[#F18A21]" />
                    <h2 className="text-xl font-bold">الجلسات النشطة</h2>
                    <Badge className="bg-[#F18A21]/20 text-[#F18A21] border-[#F18A21]/20">{activeSessions.length}</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {activeSessions.map((session: ActiveSession) => (
                    <Card key={session.id} className="glass-card overflow-hidden group">
                        <CardHeader className="p-4 pb-2 border-b border-white/5 bg-white/5">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-bold truncate max-w-[150px]">{session.tableName}</CardTitle>
                                        <Badge variant="outline" className="text-[10px] px-1 h-4">{session.type === 'hall' ? 'قاعة' : 'طاولة'}</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{session.hallName}</p>
                                </div>
                                <div className="text-left">
                                    <SessionTimer startTime={session.startTime} className="text-sm font-mono font-bold text-[#F18A21]" />
                                    <p className="text-[10px] text-muted-foreground">{formatCurrency(session.firstHourCost)}/ساعة أولى</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {/* الأعضاء */}
                            <div className="space-y-2">
                                {session.members.map((member: SessionMember) => (
                                    <div key={member.id} className="flex items-center justify-between group/member">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className={cn("text-xs font-medium", member.leftAt && "text-muted-foreground line-through")}>{member.name}</span>
                                                {member.orders.length > 0 && (
                                                    <span className="text-[9px] text-muted-foreground line-clamp-1">
                                                        {member.orders.map((o: any) => `${o.name}×${o.quantity}`).join('، ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                                            {!member.leftAt && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-[#F18A21] hover:text-white" onClick={() => setAddOrderModal({ session, member })}>
                                                        <ShoppingBag className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-red-500 hover:text-white" onClick={() => setEndMemberModal({ session, member })}>
                                                        <UserMinus className="h-3 w-3" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* الإجمالي */}
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[10px] text-muted-foreground">الإجمالي التقريبي</span>
                                <span className="text-sm font-bold gradient-text">{formatCurrency(getSessionTotal(session).total)}</span>
                            </div>
                        </CardContent>
                        <div className="p-2 border-t border-white/5 bg-white/5 flex gap-1">
                            <Button size="sm" variant="ghost" className="flex-1 text-[10px] h-8 glass-button" onClick={() => setAddMemberModal(session)}>
                                <UserPlus className="h-3 w-3 ml-1" />إضافة
                            </Button>
                            <Button size="sm" variant="ghost" className="flex-1 text-[10px] h-8 glass-button" onClick={() => setSwitchTableModal(session)}>
                                <ArrowLeftRight className="h-3 w-3 ml-1" />تبديل
                            </Button>
                            <Button size="sm" className="flex-2 text-[10px] h-8 gradient-button" onClick={() => openEndSessionModal(session)}>
                                <Square className="h-3 w-3 ml-1" />إنهاء
                            </Button>
                        </div>
                    </Card>
                ))}
                {activeSessions.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground glass-card">لا توجد جلسات نشطة</div>
                )}
            </div>

            {/* نافذة إنهاء الجلسة */}
            <Dialog open={!!endSessionModal} onOpenChange={(open) => { if (!open) closeEndSessionModal(); }}>
                <DialogContent className="glass-modal sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text text-xl">إنهاء الجلسة</DialogTitle>
                        <DialogDescription>{endSessionModal?.tableName}</DialogDescription>
                    </DialogHeader>
                    {endSessionModal && (() => {
                        const totals = getSessionTotal(endSessionModal);
                        const finalTotal = appliedDiscount > 0 ? totals.total * (1 - appliedDiscount / 100) : totals.total;
                        const now = freezeTime || new Date().toISOString();
                        return (
                            <div className="space-y-4 py-4">
                                {/* معلومات الجلسة الأساسية */}
                                <div className="glass-card p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">التاريخ:</span>
                                        <span className="font-medium">{formatArabicDate(endSessionModal.startTime)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">الوقت:</span>
                                        <span className="font-medium">{formatArabicTime(endSessionModal.startTime)} - {formatArabicTime(now)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-muted-foreground">الطاولات:</span>
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {endSessionModal.tableHistory.map((th, i) => <Badge key={i} variant="outline" className="text-xs">{th.tableName}</Badge>)}
                                        </div>
                                    </div>
                                </div>

                                {/* بطاقات الأعضاء */}
                                <div className="space-y-2">
                                    <Label className="text-sm">الأعضاء</Label>
                                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ direction: 'rtl' }}>
                                        {endSessionModal.members.filter(m => !m.leftAt).map(member => {
                                            const bill = getMemberBill(member, endSessionModal.firstHourCost, endSessionModal.remainingHourCost);
                                            return (
                                                <div key={member.id} className="glass-card p-3 min-w-[200px] flex-shrink-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="text-right">
                                                            <p className="font-bold text-sm">{member.name}</p>
                                                            <p className="text-xs text-muted-foreground">{member.phone || 'بدون رقم'}</p>
                                                            {member.orders.length > 0 && (
                                                                <div className="mt-2 text-xs text-muted-foreground">
                                                                    {member.orders.map((o, i) => (
                                                                        <div key={i}>{o.name} × {o.quantity}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-left text-xs">
                                                            <p className="text-muted-foreground">{formatArabicTime(member.joinedAt)} - {formatArabicTime(now)}</p>
                                                            <p className="text-muted-foreground mt-1">طلبات: {formatCurrency(bill.ordersCost)}</p>
                                                            <p className="text-muted-foreground">وقت: {formatCurrency(bill.timeCost)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* إجماليات الجلسة */}
                                <div className="glass-card p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>إجمالي الطلبات</span>
                                        <span>{formatCurrency(totals.ordersCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>إجمالي الوقت</span>
                                        <span>{formatCurrency(totals.timeCost)}</span>
                                    </div>
                                    {appliedDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-400">
                                            <span>خصم ({appliedDiscount}%)</span>
                                            <span>- {formatCurrency(totals.total - finalTotal)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                                        <span>الإجمالي الكلي</span>
                                        <span className="gradient-text text-lg">{formatCurrency(finalTotal)}</span>
                                    </div>
                                </div>

                                {/* كود الخصم */}
                                <div className="flex gap-2">
                                    <Input
                                        className="glass-input flex-1"
                                        placeholder="كود الخصم"
                                        value={promocode}
                                        onChange={(e) => setPromocode(e.target.value)}
                                    />
                                    <Button variant="ghost" className="glass-button" onClick={handleApplyPromocode}>تطبيق</Button>
                                </div>

                                {/* طريقة الدفع */}
                                <div className="space-y-3">
                                    <Label>طريقة الدفع</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[{ id: 'cash', label: 'كاش', icon: Banknote }, { id: 'visa', label: 'كارت', icon: CreditCard },
                                        { id: 'wallet', label: 'محفظة موبيل', icon: Smartphone }, { id: 'cairoom', label: 'محفظة CAIROOM', icon: Wallet }].map(method => (
                                            <Button key={method.id} variant="ghost" className={cn('glass-button h-12 justify-start', paymentMethod === method.id && 'bg-[#F18A21]/20 border-[#F18A21]')}
                                                onClick={() => {
                                                    setPaymentMethod(method.id);
                                                    setCairoomWalletBalance(null);
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

                                    {paymentMethod === 'visa' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <Label>اسم صاحب الكارت</Label>
                                            <Input className="glass-input" placeholder="الاسم المكتوب على الكارت" value={paymentDetails.cardHolder}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolder: e.target.value })} />
                                        </div>
                                    )}

                                    {paymentMethod === 'wallet' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label>اسم صاحب المحفظة</Label>
                                                    <Input className="glass-input" placeholder="الاسم" value={paymentDetails.walletOwner}
                                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, walletOwner: e.target.value })} />
                                                </div>
                                                <div>
                                                    <Label>رقم المحفظة</Label>
                                                    <Input className="glass-input" placeholder="01xxxxxxxxx" value={paymentDetails.walletNumber}
                                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, walletNumber: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'cairoom' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <Label>العضو الذي سيدفع</Label>
                                            <Select value={paymentDetails.cairoomUser} onValueChange={(val) => { setPaymentDetails({ ...paymentDetails, cairoomUser: val }); handleCheckCairoomBalance(val); }}>
                                                <SelectTrigger className="glass-input"><SelectValue placeholder="اختر العضو" /></SelectTrigger>
                                                <SelectContent className="glass-modal">
                                                    {endSessionModal.members.filter(m => !m.leftAt).map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {cairoomWalletBalance !== null && (
                                                <div className={cn("p-2 rounded text-sm flex justify-between items-center",
                                                    cairoomWalletBalance >= finalTotal ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                                                    <span>الرصيد: {formatCurrency(cairoomWalletBalance)}</span>
                                                    {cairoomWalletBalance < finalTotal && <span>رصيد غير كافي</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={closeEndSessionModal}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleEndSession}>إنهاء وحفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إنهاء جلسة عضو */}
            <Dialog open={!!endMemberModal} onOpenChange={() => setEndMemberModal(null)}>
                <DialogContent className="glass-modal sm:max-w-sm">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">إنهاء جلسة العضو</DialogTitle></DialogHeader>
                    {endMemberModal && (() => {
                        const bill = getMemberBill(endMemberModal.member, endMemberModal.session.firstHourCost, endMemberModal.session.remainingHourCost);
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
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant={paymentMethod === 'cash' ? 'default' : 'ghost'} className={cn(paymentMethod === 'cash' ? 'gradient-button' : 'glass-button')} onClick={() => setPaymentMethod('cash')}>كاش</Button>
                                    <Button size="sm" variant={paymentMethod === 'visa' ? 'default' : 'ghost'} className={cn(paymentMethod === 'visa' ? 'gradient-button' : 'glass-button')} onClick={() => setPaymentMethod('visa')}>كارت</Button>
                                    <Button size="sm" variant={paymentMethod === 'wallet' ? 'default' : 'ghost'} className={cn(paymentMethod === 'wallet' ? 'gradient-button' : 'glass-button')} onClick={() => setPaymentMethod('wallet')}>محفظة</Button>
                                    <Button size="sm" variant={paymentMethod === 'cairoom' ? 'default' : 'ghost'} className={cn(paymentMethod === 'cairoom' ? 'gradient-button' : 'glass-button')} onClick={() => {
                                        setPaymentMethod('cairoom');
                                        setPaymentDetails({ ...paymentDetails, cairoomUser: endMemberModal.member.id });
                                        handleCheckCairoomBalance(endMemberModal.member.id);
                                    }}>Cairoom</Button>
                                </div>
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
                                {inventoryProducts.map(product => {
                                    const currentMember = activeSessions.find((s: ActiveSession) => s.id === addOrderModal.session.id)?.members.find((m: SessionMember) => m.id === addOrderModal.member.id);
                                    const order = currentMember?.orders.find((o: any) => o.productId === product.id);
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
                                            (activeSessions.find((s: ActiveSession) => s.id === addOrderModal.session.id)?.members.find((m: SessionMember) => m.id === addOrderModal.member.id)?.orders || [])
                                                .reduce((sum: number, o: any) => sum + (o.price * o.quantity), 0)
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
                                    <p className="text-xs text-muted-foreground">{formatCurrency(table.first_hour_cost)}/ساعة أولى</p>
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
                                            <p className="text-xs text-muted-foreground">{formatCurrency(t.first_hour_cost)}/ساعة أولى</p>
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
                                            <p className="text-xs text-muted-foreground">{h.capacity_min}-{h.capacity_max} • {formatCurrency(h.first_hour_cost)}/ساعة أولى</p>
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
                                            {inventoryProducts.map(p => {
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
        </div>
    );
}
