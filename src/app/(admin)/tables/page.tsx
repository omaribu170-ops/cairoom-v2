/* =================================================================
   CAIROOM - Tables & Halls Management Page
   صفحة إدارة الطاولات والقاعات
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, Plus, Users, Eye, Edit, Trash2, ImageIcon, AlertTriangle, Building2, Table2, Clock } from 'lucide-react';

// أنواع البيانات
interface HallData {
    id: string;
    name: string;
    capacity_min: number;
    capacity_max: number;
    price_per_hour: number;
    image_url: string | null;
}

interface TableData {
    id: string;
    name: string;
    hallId: string | null;
    capacity_min: number;
    capacity_max: number;
    price_per_hour_per_person: number;
    image_url: string | null;
    status: 'available' | 'busy' | 'maintenance';
}

interface HallSession {
    id: string;
    hallId: string;
    hallName: string;
    tables: string[];
    members: { name: string }[];
    date: string;
    startTime: string;
    endTime: string;
    totalCost: number;
}

// بيانات تجريبية للقاعات
const initialHalls: HallData[] = [
    { id: 'h1', name: 'القاعة الرئيسية', capacity_min: 10, capacity_max: 50, price_per_hour: 200, image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' },
    { id: 'h2', name: 'قاعة VIP', capacity_min: 6, capacity_max: 20, price_per_hour: 350, image_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400' },
    { id: 'h3', name: 'الحديقة', capacity_min: 20, capacity_max: 100, price_per_hour: 150, image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400' },
];

// بيانات تجريبية للطاولات
const initialTables: TableData[] = [
    { id: '1', name: 'طاولة ١', hallId: 'h1', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', status: 'available' },
    { id: '2', name: 'طاولة ٢', hallId: 'h1', capacity_min: 2, capacity_max: 6, price_per_hour_per_person: 25, image_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400', status: 'busy' },
    { id: '3', name: 'طاولة ٣', hallId: 'h1', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 20, image_url: null, status: 'available' },
    { id: '4', name: 'غرفة VIP ١', hallId: 'h2', capacity_min: 6, capacity_max: 12, price_per_hour_per_person: 50, image_url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400', status: 'available' },
    { id: '5', name: 'غرفة VIP ٢', hallId: 'h2', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 50, image_url: null, status: 'available' },
    { id: '6', name: 'طاولة الحديقة', hallId: 'h3', capacity_min: 4, capacity_max: 10, price_per_hour_per_person: 30, image_url: null, status: 'available' },
    { id: '7', name: 'طاولة مستقلة', hallId: null, capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 20, image_url: null, status: 'maintenance' },
];

// بيانات تجريبية لسجل جلسات القاعات
const mockHallSessions: HallSession[] = [
    { id: 'hs-001', hallId: 'h2', hallName: 'قاعة VIP', tables: ['غرفة VIP ١', 'غرفة VIP ٢'], members: [{ name: 'أحمد' }, { name: 'سارة' }, { name: 'محمد' }], date: '2024-12-28', startTime: '14:00', endTime: '18:00', totalCost: 1400 },
    { id: 'hs-002', hallId: 'h1', hallName: 'القاعة الرئيسية', tables: ['طاولة ١', 'طاولة ٢', 'طاولة ٣'], members: [{ name: 'علي' }, { name: 'فاطمة' }], date: '2024-12-27', startTime: '10:00', endTime: '14:00', totalCost: 800 },
];

const statusLabels = { available: 'متاحة', busy: 'مشغولة', maintenance: 'صيانة' };
const statusStyles = { available: 'status-available', busy: 'status-busy', maintenance: 'status-pending' };

export default function TablesPage() {
    const [activeTab, setActiveTab] = useState('tables');
    const [tables, setTables] = useState<TableData[]>(initialTables);
    const [halls, setHalls] = useState<HallData[]>(initialHalls);
    const [hallSessions] = useState<HallSession[]>(mockHallSessions);

    // بحث
    const [tableSearch, setTableSearch] = useState('');
    const [hallSearch, setHallSearch] = useState('');

    // نوافذ الطاولات
    const [tableViewModal, setTableViewModal] = useState<TableData | null>(null);
    const [tableEditModal, setTableEditModal] = useState<TableData | null>(null);
    const [tableDeleteModal, setTableDeleteModal] = useState<TableData | null>(null);
    const [tableAddModal, setTableAddModal] = useState(false);

    // نوافذ القاعات
    const [hallViewModal, setHallViewModal] = useState<HallData | null>(null);
    const [hallEditModal, setHallEditModal] = useState<HallData | null>(null);
    const [hallDeleteModal, setHallDeleteModal] = useState<HallData | null>(null);
    const [hallAddModal, setHallAddModal] = useState(false);
    const [hallSessionModal, setHallSessionModal] = useState<HallSession | null>(null);

    // نماذج البيانات
    const [tableForm, setTableForm] = useState<Omit<TableData, 'id' | 'status'>>({
        name: '', hallId: null, capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: null
    });
    const [hallForm, setHallForm] = useState<Omit<HallData, 'id'>>({
        name: '', capacity_min: 10, capacity_max: 50, price_per_hour: 200, image_url: null
    });

    // فلترة
    const filteredTables = tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));
    const filteredHalls = halls.filter(h => h.name.toLowerCase().includes(hallSearch.toLowerCase()));

    // دوال الطاولات
    const handleOpenTableEdit = (table: TableData) => {
        setTableForm({ name: table.name, hallId: table.hallId, capacity_min: table.capacity_min, capacity_max: table.capacity_max, price_per_hour_per_person: table.price_per_hour_per_person, image_url: table.image_url });
        setTableEditModal(table);
    };

    const handleSaveTableEdit = () => {
        if (!tableEditModal || !tableForm.name.trim()) return;
        setTables(tables.map(t => t.id === tableEditModal.id ? { ...t, ...tableForm } : t));
        toast.success('تم حفظ التعديلات');
        setTableEditModal(null);
    };

    const handleAddTable = () => {
        if (!tableForm.name.trim()) return;
        const newTable: TableData = { id: `table-${Date.now()}`, ...tableForm, status: 'available' };
        setTables([...tables, newTable]);
        toast.success('تم إضافة الطاولة');
        setTableAddModal(false);
        setTableForm({ name: '', hallId: null, capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: null });
    };

    const handleDeleteTable = () => {
        if (!tableDeleteModal) return;
        setTables(tables.filter(t => t.id !== tableDeleteModal.id));
        toast.success('تم حذف الطاولة');
        setTableDeleteModal(null);
    };

    // دوال القاعات
    const handleOpenHallEdit = (hall: HallData) => {
        setHallForm({ name: hall.name, capacity_min: hall.capacity_min, capacity_max: hall.capacity_max, price_per_hour: hall.price_per_hour, image_url: hall.image_url });
        setHallEditModal(hall);
    };

    const handleSaveHallEdit = () => {
        if (!hallEditModal || !hallForm.name.trim()) return;
        setHalls(halls.map(h => h.id === hallEditModal.id ? { ...h, ...hallForm } : h));
        toast.success('تم حفظ التعديلات');
        setHallEditModal(null);
    };

    const handleAddHall = () => {
        if (!hallForm.name.trim()) return;
        const newHall: HallData = { id: `hall-${Date.now()}`, ...hallForm };
        setHalls([...halls, newHall]);
        toast.success('تم إضافة القاعة');
        setHallAddModal(false);
        setHallForm({ name: '', capacity_min: 10, capacity_max: 50, price_per_hour: 200, image_url: null });
    };

    const handleDeleteHall = () => {
        if (!hallDeleteModal) return;
        setHalls(halls.filter(h => h.id !== hallDeleteModal.id));
        toast.success('تم حذف القاعة');
        setHallDeleteModal(null);
    };

    const getHallName = (hallId: string | null) => {
        if (!hallId) return null;
        return halls.find(h => h.id === hallId)?.name;
    };

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div>
                <h1 className="text-2xl font-bold gradient-text">الطاولات والقاعات</h1>
                <p className="text-muted-foreground mt-1">إدارة الطاولات والقاعات</p>
            </div>

            {/* التبويبات */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass-card">
                    <TabsTrigger value="tables" className="gap-2"><Table2 className="h-4 w-4" />الطاولات ({tables.length})</TabsTrigger>
                    <TabsTrigger value="halls" className="gap-2"><Building2 className="h-4 w-4" />القاعات ({halls.length})</TabsTrigger>
                </TabsList>

                {/* تبويب الطاولات */}
                <TabsContent value="tables" className="space-y-4 mt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="بحث عن طاولة..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="glass-input pr-10" />
                        </div>
                        <Button className="gradient-button" onClick={() => { setTableForm({ name: '', hallId: null, capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: null }); setTableAddModal(true); }}>
                            <Plus className="h-4 w-4 ml-2" />إضافة طاولة
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTables.map((table) => {
                            const hallName = getHallName(table.hallId);
                            return (
                                <Card key={table.id} className="glass-card-hover overflow-hidden">
                                    <div className="h-32 bg-white/5 relative overflow-hidden">
                                        {table.image_url ? (
                                            <img src={table.image_url} alt={table.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-10 w-10 text-white/20" /></div>
                                        )}
                                        <Badge className={cn('absolute top-2 left-2', statusStyles[table.status])}>{statusLabels[table.status]}</Badge>
                                        {hallName && <Badge variant="outline" className="absolute top-2 right-2 bg-black/50">{hallName}</Badge>}
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold">{table.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Users className="h-3 w-3" />{table.capacity_min}-{table.capacity_max}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <span className="font-bold gradient-text">{formatCurrency(table.price_per_hour_per_person)}</span>
                                                <p className="text-[10px] text-muted-foreground">/س/فرد</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="flex-1 glass-button text-xs" onClick={() => setTableViewModal(table)}><Eye className="h-3 w-3 ml-1" />عرض</Button>
                                            <Button size="sm" variant="ghost" className="flex-1 glass-button text-xs" onClick={() => handleOpenTableEdit(table)}><Edit className="h-3 w-3 ml-1" />تعديل</Button>
                                            <Button size="sm" variant="ghost" className="glass-button text-red-400" onClick={() => setTableDeleteModal(table)}><Trash2 className="h-3 w-3" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* تبويب القاعات */}
                <TabsContent value="halls" className="space-y-6 mt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="بحث عن قاعة..." value={hallSearch} onChange={(e) => setHallSearch(e.target.value)} className="glass-input pr-10" />
                        </div>
                        <Button className="gradient-button" onClick={() => { setHallForm({ name: '', capacity_min: 10, capacity_max: 50, price_per_hour: 200, image_url: null }); setHallAddModal(true); }}>
                            <Plus className="h-4 w-4 ml-2" />إضافة قاعة
                        </Button>
                    </div>

                    {/* بطاقات القاعات */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredHalls.map((hall) => (
                            <Card key={hall.id} className="glass-card-hover overflow-hidden">
                                <div className="h-32 bg-white/5 relative overflow-hidden">
                                    {hall.image_url ? (
                                        <img src={hall.image_url} alt={hall.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Building2 className="h-10 w-10 text-white/20" /></div>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold">{hall.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <Users className="h-3 w-3" />{hall.capacity_min}-{hall.capacity_max}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className="font-bold gradient-text">{formatCurrency(hall.price_per_hour)}</span>
                                            <p className="text-[10px] text-muted-foreground">/ساعة</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" className="flex-1 glass-button text-xs" onClick={() => setHallViewModal(hall)}><Eye className="h-3 w-3 ml-1" />عرض</Button>
                                        <Button size="sm" variant="ghost" className="flex-1 glass-button text-xs" onClick={() => handleOpenHallEdit(hall)}><Edit className="h-3 w-3 ml-1" />تعديل</Button>
                                        <Button size="sm" variant="ghost" className="glass-button text-red-400" onClick={() => setHallDeleteModal(hall)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* سجل جلسات القاعات */}
                    <Card className="glass-card">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-[#F18A21]" />سجل جلسات القاعات</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-white/5">
                                        <TableHead className="text-right">رقم الجلسة</TableHead>
                                        <TableHead className="text-right">القاعة</TableHead>
                                        <TableHead className="text-right">الطاولات</TableHead>
                                        <TableHead className="text-right">الأعضاء</TableHead>
                                        <TableHead className="text-right">التاريخ</TableHead>
                                        <TableHead className="text-right">الإجمالي</TableHead>
                                        <TableHead className="text-right w-[80px]">عرض</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hallSessions.map((session) => (
                                        <TableRow key={session.id} className="border-white/5 hover:bg-white/5">
                                            <TableCell className="font-mono text-xs">{session.id}</TableCell>
                                            <TableCell>{session.hallName}</TableCell>
                                            <TableCell className="text-xs">{session.tables.join(', ')}</TableCell>
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
                                            <TableCell className="font-bold">{formatCurrency(session.totalCost)}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" className="glass-button" onClick={() => setHallSessionModal(session)}><Eye className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* نوافذ الطاولات */}
            {/* نافذة عرض الطاولة */}
            <Dialog open={!!tableViewModal} onOpenChange={() => setTableViewModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">{tableViewModal?.name}</DialogTitle></DialogHeader>
                    {tableViewModal && (
                        <div className="space-y-4 py-4">
                            {tableViewModal.image_url && <div className="h-40 rounded-xl overflow-hidden"><img src={tableViewModal.image_url} alt={tableViewModal.name} className="w-full h-full object-cover" /></div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card p-3"><p className="text-xs text-muted-foreground">السعة</p><p className="font-bold">{tableViewModal.capacity_min}-{tableViewModal.capacity_max}</p></div>
                                <div className="glass-card p-3"><p className="text-xs text-muted-foreground">السعر</p><p className="font-bold">{formatCurrency(tableViewModal.price_per_hour_per_person)}/س/فرد</p></div>
                            </div>
                            {getHallName(tableViewModal.hallId) && <div className="glass-card p-3"><p className="text-xs text-muted-foreground">القاعة</p><p className="font-bold">{getHallName(tableViewModal.hallId)}</p></div>}
                            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">الحالة</p><Badge className={cn('mt-1', statusStyles[tableViewModal.status])}>{statusLabels[tableViewModal.status]}</Badge></div>
                        </div>
                    )}
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setTableViewModal(null)}>إغلاق</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تعديل الطاولة */}
            <Dialog open={!!tableEditModal} onOpenChange={() => setTableEditModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">تعديل الطاولة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم الطاولة *</Label><Input value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} className="glass-input" /></div>
                        <div className="space-y-2">
                            <Label>القاعة (اختياري)</Label>
                            <Select value={tableForm.hallId || 'none'} onValueChange={(v) => setTableForm({ ...tableForm, hallId: v === 'none' ? null : v })}>
                                <SelectTrigger className="glass-input"><SelectValue placeholder="اختر قاعة" /></SelectTrigger>
                                <SelectContent className="glass-modal">
                                    <SelectItem value="none">بدون قاعة</SelectItem>
                                    {halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>الحد الأدنى</Label><Input type="number" value={tableForm.capacity_min} onChange={(e) => setTableForm({ ...tableForm, capacity_min: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                            <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={tableForm.capacity_max} onChange={(e) => setTableForm({ ...tableForm, capacity_max: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>السعر/ساعة/فرد</Label><Input type="number" value={tableForm.price_per_hour_per_person} onChange={(e) => setTableForm({ ...tableForm, price_per_hour_per_person: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <div className="space-y-2"><Label>رابط الصورة</Label><Input value={tableForm.image_url || ''} onChange={(e) => setTableForm({ ...tableForm, image_url: e.target.value || null })} className="glass-input" /></div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setTableEditModal(null)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleSaveTableEdit}>حفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إضافة طاولة */}
            <Dialog open={tableAddModal} onOpenChange={setTableAddModal}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">إضافة طاولة جديدة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم الطاولة *</Label><Input value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} className="glass-input" placeholder="طاولة ٨" /></div>
                        <div className="space-y-2">
                            <Label>القاعة (اختياري)</Label>
                            <Select value={tableForm.hallId || 'none'} onValueChange={(v) => setTableForm({ ...tableForm, hallId: v === 'none' ? null : v })}>
                                <SelectTrigger className="glass-input"><SelectValue placeholder="اختر قاعة" /></SelectTrigger>
                                <SelectContent className="glass-modal">
                                    <SelectItem value="none">بدون قاعة</SelectItem>
                                    {halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>الحد الأدنى</Label><Input type="number" value={tableForm.capacity_min} onChange={(e) => setTableForm({ ...tableForm, capacity_min: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                            <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={tableForm.capacity_max} onChange={(e) => setTableForm({ ...tableForm, capacity_max: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>السعر/ساعة/فرد</Label><Input type="number" value={tableForm.price_per_hour_per_person} onChange={(e) => setTableForm({ ...tableForm, price_per_hour_per_person: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <div className="space-y-2"><Label>رابط الصورة (اختياري)</Label><Input value={tableForm.image_url || ''} onChange={(e) => setTableForm({ ...tableForm, image_url: e.target.value || null })} className="glass-input" /></div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setTableAddModal(false)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleAddTable} disabled={!tableForm.name.trim()}>إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة حذف الطاولة */}
            <Dialog open={!!tableDeleteModal} onOpenChange={() => setTableDeleteModal(null)}>
                <DialogContent className="glass-modal sm:max-w-sm">
                    <DialogHeader>
                        <div className="flex justify-center mb-4"><div className="p-4 rounded-full bg-red-500/20"><AlertTriangle className="h-8 w-8 text-red-400" /></div></div>
                        <DialogTitle className="text-center">هل أنت متأكد؟</DialogTitle>
                        <DialogDescription className="text-center">سيتم حذف "{tableDeleteModal?.name}" نهائياً</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button variant="ghost" className="glass-button" onClick={() => setTableDeleteModal(null)}>إلغاء</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleDeleteTable}>نعم، احذف</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نوافذ القاعات */}
            {/* نافذة عرض القاعة */}
            <Dialog open={!!hallViewModal} onOpenChange={() => setHallViewModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">{hallViewModal?.name}</DialogTitle></DialogHeader>
                    {hallViewModal && (
                        <div className="space-y-4 py-4">
                            {hallViewModal.image_url && <div className="h-40 rounded-xl overflow-hidden"><img src={hallViewModal.image_url} alt={hallViewModal.name} className="w-full h-full object-cover" /></div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card p-3"><p className="text-xs text-muted-foreground">السعة</p><p className="font-bold">{hallViewModal.capacity_min}-{hallViewModal.capacity_max}</p></div>
                                <div className="glass-card p-3"><p className="text-xs text-muted-foreground">السعر</p><p className="font-bold">{formatCurrency(hallViewModal.price_per_hour)}/ساعة</p></div>
                            </div>
                        </div>
                    )}
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setHallViewModal(null)}>إغلاق</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تعديل القاعة */}
            <Dialog open={!!hallEditModal} onOpenChange={() => setHallEditModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">تعديل القاعة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم القاعة *</Label><Input value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} className="glass-input" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>الحد الأدنى</Label><Input type="number" value={hallForm.capacity_min} onChange={(e) => setHallForm({ ...hallForm, capacity_min: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                            <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={hallForm.capacity_max} onChange={(e) => setHallForm({ ...hallForm, capacity_max: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>السعر/ساعة</Label><Input type="number" value={hallForm.price_per_hour} onChange={(e) => setHallForm({ ...hallForm, price_per_hour: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <div className="space-y-2"><Label>رابط الصورة</Label><Input value={hallForm.image_url || ''} onChange={(e) => setHallForm({ ...hallForm, image_url: e.target.value || null })} className="glass-input" /></div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setHallEditModal(null)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleSaveHallEdit}>حفظ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة إضافة قاعة */}
            <Dialog open={hallAddModal} onOpenChange={setHallAddModal}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">إضافة قاعة جديدة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم القاعة *</Label><Input value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} className="glass-input" placeholder="قاعة الاحتفالات" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>الحد الأدنى</Label><Input type="number" value={hallForm.capacity_min} onChange={(e) => setHallForm({ ...hallForm, capacity_min: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                            <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={hallForm.capacity_max} onChange={(e) => setHallForm({ ...hallForm, capacity_max: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>السعر/ساعة</Label><Input type="number" value={hallForm.price_per_hour} onChange={(e) => setHallForm({ ...hallForm, price_per_hour: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <div className="space-y-2"><Label>رابط الصورة (اختياري)</Label><Input value={hallForm.image_url || ''} onChange={(e) => setHallForm({ ...hallForm, image_url: e.target.value || null })} className="glass-input" /></div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setHallAddModal(false)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleAddHall} disabled={!hallForm.name.trim()}>إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة حذف القاعة */}
            <Dialog open={!!hallDeleteModal} onOpenChange={() => setHallDeleteModal(null)}>
                <DialogContent className="glass-modal sm:max-w-sm">
                    <DialogHeader>
                        <div className="flex justify-center mb-4"><div className="p-4 rounded-full bg-red-500/20"><AlertTriangle className="h-8 w-8 text-red-400" /></div></div>
                        <DialogTitle className="text-center">هل أنت متأكد؟</DialogTitle>
                        <DialogDescription className="text-center">سيتم حذف "{hallDeleteModal?.name}" نهائياً</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button variant="ghost" className="glass-button" onClick={() => setHallDeleteModal(null)}>إلغاء</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleDeleteHall}>نعم، احذف</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تفاصيل جلسة القاعة */}
            <Dialog open={!!hallSessionModal} onOpenChange={() => setHallSessionModal(null)}>
                <DialogContent className="glass-modal sm:max-w-lg">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">تفاصيل جلسة القاعة</DialogTitle></DialogHeader>
                    {hallSessionModal && (
                        <div className="space-y-4 py-4">
                            <div className="glass-card p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">رقم الجلسة</span><span className="font-mono">{hallSessionModal.id}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">القاعة</span><span className="font-bold">{hallSessionModal.hallName}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">التاريخ</span><span>{hallSessionModal.date}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">الوقت</span><span>{hallSessionModal.startTime} - {hallSessionModal.endTime}</span></div>
                            </div>
                            <div className="glass-card p-4">
                                <p className="text-sm font-medium mb-2">الطاولات المستخدمة</p>
                                <div className="flex flex-wrap gap-2">
                                    {hallSessionModal.tables.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
                                </div>
                            </div>
                            <div className="glass-card p-4">
                                <p className="text-sm font-medium mb-2">الأعضاء</p>
                                <div className="flex flex-wrap gap-2">
                                    {hallSessionModal.members.map((m, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6"><AvatarFallback className="bg-gradient-to-br from-[#E63E32] to-[#F8C033] text-white text-xs">{m.name.charAt(0)}</AvatarFallback></Avatar>
                                            <span className="text-sm">{m.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="glass-card p-4 flex justify-between items-center">
                                <span className="font-medium">الإجمالي</span>
                                <span className="text-xl font-bold gradient-text">{formatCurrency(hallSessionModal.totalCost)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter><Button variant="ghost" className="glass-button" onClick={() => setHallSessionModal(null)}>إغلاق</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
