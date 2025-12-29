/* =================================================================
   CAIROOM - Tables Management Page
   صفحة إدارة الطاولات فقط (بدون الجلسات)
   ================================================================= */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, Plus, Users, Eye, Edit, Trash2, ImageIcon, AlertTriangle } from 'lucide-react';

// نوع الطاولة
interface TableData {
    id: string;
    name: string;
    capacity_min: number;
    capacity_max: number;
    price_per_hour_per_person: number;
    image_url: string | null;
    status: 'available' | 'busy' | 'maintenance';
}

// بيانات تجريبية للطاولات
const initialTables: TableData[] = [
    { id: '1', name: 'طاولة ١', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', status: 'available' },
    { id: '2', name: 'طاولة ٢', capacity_min: 2, capacity_max: 6, price_per_hour_per_person: 25, image_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400', status: 'busy' },
    { id: '3', name: 'طاولة ٣', capacity_min: 4, capacity_max: 8, price_per_hour_per_person: 20, image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400', status: 'available' },
    { id: '4', name: 'غرفة الاجتماعات', capacity_min: 6, capacity_max: 12, price_per_hour_per_person: 30, image_url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=400', status: 'available' },
    { id: '5', name: 'ركن القهوة', capacity_min: 1, capacity_max: 4, price_per_hour_per_person: 15, image_url: null, status: 'maintenance' },
    { id: '6', name: 'طاولة ٤', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: 'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=400', status: 'available' },
];

const statusLabels = { available: 'متاحة', busy: 'مشغولة', maintenance: 'صيانة' };
const statusStyles = { available: 'status-available', busy: 'status-busy', maintenance: 'status-pending' };

export default function TablesPage() {
    const [tables, setTables] = useState<TableData[]>(initialTables);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewModal, setViewModal] = useState<TableData | null>(null);
    const [editModal, setEditModal] = useState<TableData | null>(null);
    const [deleteModal, setDeleteModal] = useState<TableData | null>(null);
    const [addModal, setAddModal] = useState(false);

    // نموذج الطاولة الجديدة/المعدلة
    const [formData, setFormData] = useState<Omit<TableData, 'id' | 'status'>>({
        name: '', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: null
    });

    const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // فتح نافذة التعديل
    const handleOpenEdit = (table: TableData) => {
        setFormData({
            name: table.name,
            capacity_min: table.capacity_min,
            capacity_max: table.capacity_max,
            price_per_hour_per_person: table.price_per_hour_per_person,
            image_url: table.image_url,
        });
        setEditModal(table);
    };

    // حفظ التعديلات
    const handleSaveEdit = () => {
        if (!editModal || !formData.name.trim()) return;
        setTables(tables.map(t => t.id === editModal.id ? { ...t, ...formData } : t));
        toast.success('تم حفظ التعديلات');
        setEditModal(null);
    };

    // إضافة طاولة جديدة
    const handleAddTable = () => {
        if (!formData.name.trim()) return;
        const newTable: TableData = {
            id: `table-${Date.now()}`,
            ...formData,
            status: 'available',
        };
        setTables([...tables, newTable]);
        toast.success('تم إضافة الطاولة');
        setAddModal(false);
        setFormData({ name: '', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: null });
    };

    // حذف الطاولة
    const handleDelete = () => {
        if (!deleteModal) return;
        setTables(tables.filter(t => t.id !== deleteModal.id));
        toast.success('تم حذف الطاولة');
        setDeleteModal(null);
    };

    // فتح نافذة الإضافة
    const handleOpenAdd = () => {
        setFormData({ name: '', capacity_min: 2, capacity_max: 4, price_per_hour_per_person: 25, image_url: null });
        setAddModal(true);
    };

    return (
        <div className="space-y-6">
            {/* العنوان */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">إدارة الطاولات</h1>
                    <p className="text-muted-foreground mt-1">عرض وتعديل وحذف الطاولات</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-input pr-10" />
                    </div>
                    <Button className="gradient-button" onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4 ml-2" />إضافة طاولة
                    </Button>
                </div>
            </div>

            {/* بطاقات الطاولات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTables.map((table) => (
                    <Card key={table.id} className="glass-card-hover overflow-hidden">
                        {/* صورة الطاولة */}
                        <div className="h-40 bg-white/5 relative overflow-hidden">
                            {table.image_url ? (
                                <img src={table.image_url} alt={table.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-12 w-12 text-white/20" />
                                </div>
                            )}
                            <Badge className={cn('absolute top-3 left-3', statusStyles[table.status])}>{statusLabels[table.status]}</Badge>
                        </div>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-bold">{table.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Users className="h-4 w-4" />
                                        <span>{table.capacity_min}-{table.capacity_max} أشخاص</span>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <span className="text-lg font-bold gradient-text">{formatCurrency(table.price_per_hour_per_person)}</span>
                                    <p className="text-xs text-muted-foreground">/ساعة/فرد</p>
                                </div>
                            </div>
                            {/* أزرار الإجراءات */}
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="flex-1 glass-button" onClick={() => setViewModal(table)}>
                                    <Eye className="h-4 w-4 ml-1" />عرض
                                </Button>
                                <Button size="sm" variant="ghost" className="flex-1 glass-button" onClick={() => handleOpenEdit(table)}>
                                    <Edit className="h-4 w-4 ml-1" />تعديل
                                </Button>
                                <Button size="sm" variant="ghost" className="glass-button text-red-400" onClick={() => setDeleteModal(table)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredTables.length === 0 && (
                <Card className="glass-card p-12 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد طاولات</p>
                </Card>
            )}

            {/* نافذة العرض */}
            <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">{viewModal?.name}</DialogTitle></DialogHeader>
                    {viewModal && (
                        <div className="space-y-4 py-4">
                            {viewModal.image_url && (
                                <div className="h-48 rounded-xl overflow-hidden">
                                    <img src={viewModal.image_url} alt={viewModal.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card p-3"><p className="text-xs text-muted-foreground">السعة</p><p className="font-bold">{viewModal.capacity_min}-{viewModal.capacity_max} أشخاص</p></div>
                                <div className="glass-card p-3"><p className="text-xs text-muted-foreground">السعر</p><p className="font-bold">{formatCurrency(viewModal.price_per_hour_per_person)}/ساعة/فرد</p></div>
                            </div>
                            <div className="glass-card p-3"><p className="text-xs text-muted-foreground">الحالة</p><Badge className={cn('mt-1', statusStyles[viewModal.status])}>{statusLabels[viewModal.status]}</Badge></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" className="glass-button" onClick={() => setViewModal(null)}>إغلاق</Button>
                        <Button className="gradient-button" onClick={() => { setViewModal(null); if (viewModal) handleOpenEdit(viewModal); }}>
                            <Edit className="h-4 w-4 ml-1" />تعديل
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة التعديل */}
            <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">تعديل الطاولة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم الطاولة *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="glass-input" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>الحد الأدنى</Label><Input type="number" value={formData.capacity_min} onChange={(e) => setFormData({ ...formData, capacity_min: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                            <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={formData.capacity_max} onChange={(e) => setFormData({ ...formData, capacity_max: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>السعر/ساعة/فرد (ج.م)</Label><Input type="number" value={formData.price_per_hour_per_person} onChange={(e) => setFormData({ ...formData, price_per_hour_per_person: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <div className="space-y-2"><Label>رابط الصورة</Label><Input value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value || null })} className="glass-input" placeholder="https://..." /></div>
                        {formData.image_url && (
                            <div className="h-32 rounded-xl overflow-hidden bg-white/5">
                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setEditModal(null)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleSaveEdit}>حفظ التعديلات</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة الإضافة */}
            <Dialog open={addModal} onOpenChange={setAddModal}>
                <DialogContent className="glass-modal sm:max-w-md">
                    <DialogHeader><DialogTitle className="gradient-text text-xl">إضافة طاولة جديدة</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>اسم الطاولة *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="glass-input" placeholder="طاولة ٥" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>الحد الأدنى</Label><Input type="number" value={formData.capacity_min} onChange={(e) => setFormData({ ...formData, capacity_min: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                            <div className="space-y-2"><Label>الحد الأقصى</Label><Input type="number" value={formData.capacity_max} onChange={(e) => setFormData({ ...formData, capacity_max: parseInt(e.target.value) || 1 })} className="glass-input" /></div>
                        </div>
                        <div className="space-y-2"><Label>السعر/ساعة/فرد (ج.م)</Label><Input type="number" value={formData.price_per_hour_per_person} onChange={(e) => setFormData({ ...formData, price_per_hour_per_person: parseInt(e.target.value) || 0 })} className="glass-input" /></div>
                        <div className="space-y-2"><Label>رابط الصورة (اختياري)</Label><Input value={formData.image_url || ''} onChange={(e) => setFormData({ ...formData, image_url: e.target.value || null })} className="glass-input" placeholder="https://..." /></div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="glass-button" onClick={() => setAddModal(false)}>إلغاء</Button>
                        <Button className="gradient-button" onClick={handleAddTable} disabled={!formData.name.trim()}>إضافة الطاولة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* نافذة تأكيد الحذف */}
            <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
                <DialogContent className="glass-modal sm:max-w-sm">
                    <DialogHeader>
                        <div className="flex justify-center mb-4"><div className="p-4 rounded-full bg-red-500/20"><AlertTriangle className="h-8 w-8 text-red-400" /></div></div>
                        <DialogTitle className="text-center">هل أنت متأكد؟</DialogTitle>
                        <DialogDescription className="text-center">سيتم حذف "{deleteModal?.name}" نهائياً ولا يمكن التراجع عن هذا الإجراء.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button variant="ghost" className="glass-button" onClick={() => setDeleteModal(null)}>إلغاء</Button>
                        <Button className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>نعم، احذف</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
