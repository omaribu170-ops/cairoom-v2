/* =================================================================
   CAIROOM - Operations Page (Cleaning & Requests)
   صفحة العمليات - النظافة والطلبات
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCurrency, formatArabicDate, cn } from '@/lib/utils';
import { ClipboardCheck, Package, Check, X, Clock, AlertTriangle, Plus, Calendar as CalendarIcon, Filter, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Cleaning time slots
const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const areas = ['bathroom', 'hall', 'kitchen', 'entrance', 'tables'] as const;
const areaLabels: Record<string, string> = { bathroom: 'الحمام', hall: 'الصالة', kitchen: 'المطبخ', entrance: 'المدخل', tables: 'الطاولات' };

// Mock cleaning data
const mockCleaning: Record<string, Record<string, 'checked' | 'missed' | 'pending'>> = {
    '10:00': { bathroom: 'checked', hall: 'checked', kitchen: 'checked', entrance: 'checked', tables: 'checked' },
    '11:00': { bathroom: 'checked', hall: 'missed', kitchen: 'checked', entrance: 'checked', tables: 'checked' },
    '12:00': { bathroom: 'pending', hall: 'pending', kitchen: 'pending', entrance: 'pending', tables: 'pending' },
};

// Mock staff requests
// Mock staff requests
const mockRequests = [
    { id: '1', requester: 'محمد أحمد', items: 'مناديل + منظف زجاج', estimated_cost: 150, status: 'pending' as const, date: new Date().toISOString() }, // اليوم
    { id: '2', requester: 'علي حسن', items: 'قهوة + شاي', estimated_cost: 200, status: 'fulfilled' as const, date: new Date(Date.now() - 86400000).toISOString() }, // أمس
    { id: '3', requester: 'محمد أحمد', items: 'أكياس قمامة', estimated_cost: 50, status: 'rejected' as const, date: new Date(Date.now() - 172800000).toISOString() }, // أول أمس
    { id: '4', requester: 'سارة محمود', items: 'صابون سائل', estimated_cost: 80, status: 'fulfilled' as const, date: new Date(Date.now() - 604800000).toISOString() }, // الأسبوع الماضي
];

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'semiannual' | 'annual';

const filterLabels: Record<TimeFilter, string> = {
    daily: 'اليوم', weekly: 'هذا الأسبوع', monthly: 'هذا الشهر', semiannual: 'نصف سنة', annual: 'هذه السنة'
};

// Mock Employees
const mockEmployees = [
    { id: '1', name: 'أحمد محمد' },
    { id: '2', name: 'علي حسن' },
    { id: '3', name: 'سارة محمود' },
];

export default function OperationsPage() {
    const [activeTab, setActiveTab] = useState('cleaning');

    // Cleaning State
    const [cleaningStartTime, setCleaningStartTime] = useState('10:00');
    const [cleaningEndTime, setCleaningEndTime] = useState('22:00');
    const [assignedEmployee, setAssignedEmployee] = useState<string>('1');

    // Using simple mock structure for demo, in real app this would be fetched based on date
    const [cleaningData, setCleaningData] = useState<Record<string, {
        checks: Record<string, Record<string, 'checked' | 'missed' | 'pending'>>,
        startTime: string,
        endTime: string,
        employeeId: string
    }>>({
        [new Date().toLocaleDateString('en-CA')]: {
            checks: mockCleaning,
            startTime: '10:00',
            endTime: '22:00',
            employeeId: '1'
        },
        [new Date(Date.now() - 86400000).toLocaleDateString('en-CA')]: {
            checks: mockCleaning,
            startTime: '09:00',
            endTime: '21:00',
            employeeId: '2'
        }
    });

    const [requests, setRequests] = useState(mockRequests);
    const [requestModalOpen, setRequestModalOpen] = useState(false);

    // Report Modal State
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedReportDate, setSelectedReportDate] = useState<string | null>(null);

    // Filters
    const [cleaningFilter, setCleaningFilter] = useState<TimeFilter>('daily');
    const [cleaningDate, setCleaningDate] = useState<Date | undefined>(new Date());

    const [requestFilterTime, setRequestFilterTime] = useState<TimeFilter>('daily');
    const [requestFilterEmployee, setRequestFilterEmployee] = useState<string>('all');
    const [requestDate, setRequestDate] = useState<Date | undefined>(undefined);
    const [requestFilterStatus, setRequestFilterStatus] = useState<'all' | 'pending' | 'fulfilled' | 'rejected'>('all');

    // Generate dynamic time slots based on start/end time
    const generateTimeSlots = (start: string, end: string) => {
        const slots = [];
        const [startH] = start.split(':').map(Number);
        const [endH] = end.split(':').map(Number);

        let currentH = startH;
        // Simple loop for hours, handling day rollover if needed (assuming same day for now)
        // If end < start, assumed next day, loop until endH + 24
        const limit = endH < startH ? endH + 24 : endH;

        for (let h = startH; h <= limit; h++) {
            const hour = h % 24;
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    };

    const currentSlots = generateTimeSlots(cleaningStartTime, cleaningEndTime);
    const todayKey = new Date().toLocaleDateString('en-CA');

    // Real-time check logic
    const isSlotEditable = (slotTime: string) => {
        const now = new Date();
        const [slotH] = slotTime.split(':').map(Number);
        const currentH = now.getHours();

        // If slot is in future (next hour or later), disable
        if (slotH > currentH) return false;

        // If slot is past (current hour is greater than slot hour), and it wasn't checked, it's missed
        // But for "editing", we allow checking current hour.
        // The requirement: "if in specific hour no check it cannot be checked if the time pass"
        if (currentH > slotH) return false;

        return true;
    };

    const getSlotStatus = (dateKey: string, slot: string, area: string) => {
        const dayData = cleaningData[dateKey];
        if (dayData?.checks?.[slot]?.[area]) return dayData.checks[slot][area];

        // If no data, check if it's past
        if (dateKey === todayKey) {
            const now = new Date();
            const [slotH] = slot.split(':').map(Number);
            const currentH = now.getHours();
            if (currentH > slotH) return 'missed';
        } else if (new Date(dateKey) < new Date(todayKey)) {
            return 'missed';
        }

        return 'pending';
    };

    const handleCheckCleaning = (slot: string, area: string) => {
        setCleaningData(prev => ({
            ...prev,
            [todayKey]: {
                startTime: cleaningStartTime,
                endTime: cleaningEndTime,
                employeeId: assignedEmployee,
                checks: {
                    ...prev[todayKey]?.checks,
                    [slot]: { ...prev[todayKey]?.checks?.[slot], [area]: 'checked' }
                }
            }
        }));
        toast.success('تم تسجيل النظافة');
    };

    const handleViewReport = (dateKey: string) => {
        setSelectedReportDate(dateKey);
        setReportModalOpen(true);
    };

    const handleApproveRequest = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'fulfilled' as const } : r));
        toast.success('تم الموافقة على الطلب');
    };

    const handleRejectRequest = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));
        toast.success('تم رفض الطلب');
    };

    // Filtering Logic for Requests
    const filteredRequests = requests.filter(r => {
        const date = new Date(r.date);
        const now = new Date();
        let passTime = false;

        if (requestDate) {
            passTime = date.toDateString() === requestDate.toDateString();
        } else {
            switch (requestFilterTime) {
                case 'daily': passTime = date.toDateString() === now.toDateString(); break;
                case 'weekly': {
                    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
                    passTime = date >= weekAgo; break;
                }
                case 'monthly': {
                    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
                    passTime = date >= monthAgo; break;
                }
                case 'semiannual': {
                    const sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(now.getMonth() - 6);
                    passTime = date >= sixMonthsAgo; break;
                }
                case 'annual': {
                    const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);
                    passTime = date >= yearAgo; break;
                }
            }
        }

        const passStatus = requestFilterStatus === 'all' || r.status === requestFilterStatus;
        // Mocking employee ID mapping for demo. In real app, requester would be an object or we'd have ID.
        // Assuming '1' is Ahmed, '2' is Ali for mock purposes
        const requesterId = r.requester.includes('أحمد') ? '1' : r.requester.includes('علي') ? '2' : '3';
        const passEmployee = requestFilterEmployee === 'all' || requesterId === requestFilterEmployee;

        return passTime && passStatus && passEmployee;
    });

    const stats = {
        checked: Object.values(cleaningData[todayKey]?.checks || {}).flatMap(s => Object.values(s)).filter(s => s === 'checked').length,
        missed: 0,
        pending: 0,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold gradient-text">العمليات</h1><p className="text-muted-foreground mt-1">إدارة النظافة وطلبات الموظفين</p></div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <TabsList className="glass-card">
                        <TabsTrigger value="cleaning" className="gap-2"><ClipboardCheck className="h-4 w-4" />النظافة</TabsTrigger>
                        <TabsTrigger value="requests" className="gap-2"><Package className="h-4 w-4" />الطلبات ({stats.pendingRequests})</TabsTrigger>
                    </TabsList>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <Badge className="status-available">{stats.checked} تم</Badge>
                        <Badge className="status-busy">{stats.missed} فات</Badge>
                        <Badge className="status-pending">{stats.pending} منتظر</Badge>
                    </div>
                </div>

                <TabsContent value="cleaning">
                    <Card className="glass-card overflow-x-auto">
                        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label>بداية:</Label>
                                    <Input
                                        type="time"
                                        value={cleaningStartTime}
                                        onChange={(e) => setCleaningStartTime(e.target.value)}
                                        className="glass-input w-28 h-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label>نهاية:</Label>
                                    <Input
                                        type="time"
                                        value={cleaningEndTime}
                                        onChange={(e) => setCleaningEndTime(e.target.value)}
                                        className="glass-input w-28 h-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label>الموظف:</Label>
                                    <select
                                        value={assignedEmployee}
                                        onChange={(e) => setAssignedEmployee(e.target.value)}
                                        className="glass-input w-36 h-9 px-2 text-sm rounded-md"
                                    >
                                        {mockEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                <AlertTriangle className="h-3 w-3" />
                                يتم إغلاق الخانات تلقائياً
                            </div>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-3 text-right">الوقت</th>
                                    {areas.map(area => <th key={area} className="p-3 text-center">{areaLabels[area]}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {currentSlots.map(slot => (
                                    <tr key={slot} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 font-mono font-medium">{slot}</td>
                                        {areas.map(area => {
                                            const status = getSlotStatus(todayKey, slot, area);
                                            const editable = isSlotEditable(slot);
                                            return (
                                                <td key={area} className="p-3 text-center">
                                                    {status === 'checked' && <Badge className="status-available"><Check className="h-3 w-3 mr-1" />تم</Badge>}
                                                    {status === 'missed' && <Badge className="status-busy"><X className="h-3 w-3 mr-1" />فات</Badge>}
                                                    {status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="glass-button"
                                                            onClick={() => handleCheckCleaning(slot, area)}
                                                            disabled={!editable}
                                                        >
                                                            {editable ? <><Clock className="h-3 w-3 mr-1" />شيك</> : '-'}
                                                        </Button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* سجل النظافة */}
                    <div className="mt-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-muted-foreground" />سجل النظافة</h3>
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
                                {/* Date Picker */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-[240px] justify-start text-left font-normal glass-button">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {cleaningDate ? formatArabicDate(cleaningDate.toISOString()) : "اختر تاريخ"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 glass-modal" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={cleaningDate}
                                            onSelect={setCleaningDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="w-[1px] h-6 bg-white/10 mx-1" />

                                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => { setCleaningFilter(f); setCleaningDate(undefined); }}
                                        className={cn("px-3 py-1.5 rounded-md transition-colors text-xs", cleaningFilter === f && !cleaningDate ? "bg-primary text-primary-foreground" : "hover:bg-white/5")}
                                    >
                                        {filterLabels[f]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Card className="glass-card text-center text-muted-foreground overflow-hidden">
                            {/* Show list of history items instead of placeholder */}
                            <table className="w-full text-sm">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="p-3 text-right">التاريخ</th>
                                        <th className="p-3 text-right">الموظف</th>
                                        <th className="p-3 text-right">عدد المهام المنجزة</th>
                                        <th className="p-3 text-center w-[80px]">عرض</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(cleaningData)
                                        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                                        .filter(dateKey => {
                                            if (cleaningDate) return dateKey === cleaningDate.toLocaleDateString('en-CA');
                                            // TODO: impl other filters
                                            return true;
                                        })
                                        .map(dateKey => {
                                            const dayData = cleaningData[dateKey];
                                            const completedCount = Object.values(dayData.checks || {}).flatMap(s => Object.values(s)).filter(s => s === 'checked').length;
                                            const empName = mockEmployees.find(e => e.id === dayData.employeeId)?.name || 'غير محدد';
                                            return (
                                                <tr key={dateKey} className="border-t border-white/5 hover:bg-white/5">
                                                    <td className="p-3">{formatArabicDate(dateKey)}</td>
                                                    <td className="p-3">{empName}</td>
                                                    <td className="p-3">{completedCount} مهمة</td>
                                                    <td className="p-3 text-center">
                                                        <Button size="sm" variant="ghost" className="glass-button h-8 w-8 p-0" onClick={() => handleViewReport(dateKey)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="requests" className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <div className="w-full md:w-48">
                                <Label className="text-xs mb-1.5 block">الفترة</Label>
                                <div className="flex gap-2">
                                    <select
                                        value={requestDate ? 'custom' : requestFilterTime}
                                        onChange={(e) => {
                                            if (e.target.value !== 'custom') {
                                                setRequestFilterTime(e.target.value as TimeFilter);
                                                setRequestDate(undefined);
                                            }
                                        }}
                                        className="w-full h-9 glass-input rounded-md px-3 text-sm"
                                    >
                                        {Object.entries(filterLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                        <option value="custom">تاريخ محدد...</option>
                                    </select>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" className={cn("h-9 w-9 glass-button", requestDate && "border-primary text-primary")}>
                                                <CalendarIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 glass-modal" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={requestDate}
                                                onSelect={(date) => { setRequestDate(date); }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="w-full md:w-48">
                                <Label className="text-xs mb-1.5 block">مقدم الطلب</Label>
                                <select
                                    value={requestFilterEmployee}
                                    onChange={(e) => setRequestFilterEmployee(e.target.value)}
                                    className="w-full h-9 glass-input rounded-md px-3 text-sm"
                                >
                                    <option value="all">الكل</option>
                                    {mockEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div className="w-full md:w-48">
                                <Label className="text-xs mb-1.5 block">الحالة</Label>
                                <select
                                    value={requestFilterStatus}
                                    onChange={(e) => setRequestFilterStatus(e.target.value as any)}
                                    className="w-full h-9 glass-input rounded-md px-3 text-sm"
                                >
                                    <option value="all">الكل</option>
                                    <option value="pending">منتظر</option>
                                    <option value="fulfilled">مقبول</option>
                                    <option value="rejected">مرفوض</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button className="gradient-button" onClick={() => setRequestModalOpen(true)}><Plus className="h-4 w-4 ml-2" />طلب جديد</Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredRequests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">لا توجد طلبات في هذه الفترة</div>
                        ) : (
                            filteredRequests.map(request => (
                                <Card key={request.id} className={cn('glass-card p-4 transition-all', request.status === 'pending' && 'border-yellow-500/30 shadow-[0_0_15px_-5px_var(--tw-shadow-color)] shadow-yellow-500/20')}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium">{request.items}</h3>
                                                <Badge className={cn('border', request.status === 'pending' ? 'status-pending' : request.status === 'fulfilled' ? 'status-available' : 'status-busy')}>
                                                    {request.status === 'pending' ? 'منتظر' : request.status === 'fulfilled' ? 'تم' : 'مرفوض'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{request.requester} • {formatArabicDate(request.date)} • {formatCurrency(request.estimated_cost)}</p>
                                        </div>
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button size="sm" className="gradient-button" onClick={() => handleApproveRequest(request.id)}><Check className="h-4 w-4" /></Button>
                                                <Button size="sm" variant="ghost" className="glass-button text-red-400" onClick={() => handleRejectRequest(request.id)}><X className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text">طلب جديد</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>المطلوب</Label><Textarea placeholder="مناديل، منظفات..." className="glass-input" /></div>
                        <div className="space-y-2"><Label>التكلفة المتوقعة</Label><Input type="number" placeholder="0" className="glass-input" /></div>
                    </div>
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setRequestModalOpen(false)}>إلغاء</Button><Button className="gradient-button">إرسال الطلب</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Report Modal */}
            <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent className="glass-modal max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="gradient-text">
                            تقرير نظافة - {selectedReportDate ? formatArabicDate(selectedReportDate) : ''}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedReportDate && cleaningData[selectedReportDate] && (
                        <div className="space-y-6">
                            {/* Metadata */}
                            <div className="grid grid-cols-3 gap-4 p-4 glass-card bg-white/5">
                                <div>
                                    <Label className="text-muted-foreground text-xs">الموظف المسؤول</Label>
                                    <p className="font-medium mt-1">
                                        {mockEmployees.find(e => e.id === cleaningData[selectedReportDate].employeeId)?.name || 'غير محدد'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs">بداية الشيفت</Label>
                                    <p className="font-medium mt-1">{cleaningData[selectedReportDate].startTime}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs">نهاية الشيفت</Label>
                                    <p className="font-medium mt-1">{cleaningData[selectedReportDate].endTime}</p>
                                </div>
                            </div>

                            {/* Report Table */}
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="p-3 text-right">الوقت</th>
                                            {areas.map(area => <th key={area} className="p-3 text-center">{areaLabels[area]}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {generateTimeSlots(
                                            cleaningData[selectedReportDate].startTime,
                                            cleaningData[selectedReportDate].endTime
                                        ).map(slot => (
                                            <tr key={slot} className="border-t border-white/5">
                                                <td className="p-3 font-mono">{slot}</td>
                                                {areas.map(area => {
                                                    const status = cleaningData[selectedReportDate!].checks[slot]?.[area] || 'pending';
                                                    // Calculate if missed based on date comparison
                                                    // If past date, pending = missed
                                                    let displayStatus = status;
                                                    if (status === 'pending' && new Date(selectedReportDate!) < new Date(todayKey)) {
                                                        displayStatus = 'missed';
                                                    }

                                                    return (
                                                        <td key={area} className="p-3 text-center">
                                                            {displayStatus === 'checked' && <Badge className="status-available"><Check className="h-3 w-3 mr-1" />تم</Badge>}
                                                            {displayStatus === 'missed' && <Badge className="status-busy"><X className="h-3 w-3 mr-1" />فات</Badge>}
                                                            {displayStatus === 'pending' && <span className="text-muted-foreground">-</span>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
