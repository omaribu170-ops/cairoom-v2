/* =================================================================
   CAIROOM - Promocodes Management
   إدارة أكواد الخصم والعروض
   ================================================================= */

'use client';

import { useState } from 'react';
import { usePromocodes, Promocode, PromocodeType } from '@/contexts/PromocodeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TicketPercent, Search, Filter, Plus, Calendar as CalendarIcon, Trash2, Edit } from 'lucide-react';
import { formatArabicDate, cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- Type Labels ---
const typeLabels: Record<PromocodeType, string> = {
    percentage: 'نسبة مئوية',
    fixed: 'مبلغ ثابت',
    recurring_offer: 'عرض متكرر (ساعات)',
    item_discount: 'خصم على منتج'
};

const statusColors: Record<string, string> = {
    active: 'status-available',
    inactive: 'status-busy',
    expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const statusLabels: Record<string, string> = {
    active: 'نشط',
    inactive: 'غير نشط',
    expired: 'منتهي'
};

import { useInventory } from '@/contexts/InventoryContext';

// ... (imports remain)

export default function PromocodesPage() {
    const { promocodes, addPromocode, deletePromocode } = usePromocodes();
    const { products } = useInventory(); // Fetch products

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState<{
        name: string;
        code: string;
        description: string;
        type: PromocodeType;
        validUntil: Date | undefined;
        // Dynamic Configs
        percentageValue: string;
        fixedValue: string;
        appliesTo: string[]; // 'time', 'orders'
        recurringPay: string;
        recurringFree: string;
        // Item Config
        targetItemId: string;
        itemDiscountType: 'free' | 'percentage' | 'amount';
        itemDiscountValue: string;
    }>({
        name: '', code: '', description: '', type: 'percentage', validUntil: undefined,
        percentageValue: '', fixedValue: '', appliesTo: ['time'], recurringPay: '1', recurringFree: '1',
        targetItemId: '', itemDiscountType: 'free', itemDiscountValue: '0'
    });

    const filteredPromocodes = promocodes.filter(p => {
        const matchesSearch = p.name.includes(searchQuery) || p.code.includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleAdd = () => {
        if (!newItem.name || !newItem.code || !newItem.validUntil) {
            toast.error('يرجى ملء جميع الحقول الأساسية');
            return;
        }

        const basePromo = {
            name: newItem.name,
            code: newItem.code,
            description: newItem.description,
            type: newItem.type,
            status: 'active' as const,
            validFrom: new Date().toISOString(),
            validUntil: newItem.validUntil.toISOString(),
            createdBy: 'Admin', // Mock user
        };

        let finalPromo: any = { ...basePromo };

        if (newItem.type === 'percentage') {
            finalPromo.percentageConfig = {
                value: Number(newItem.percentageValue),
                appliesTo: newItem.appliesTo
            };
        } else if (newItem.type === 'fixed') {
            finalPromo.fixedConfig = {
                value: Number(newItem.fixedValue),
                appliesTo: newItem.appliesTo
            };
        } else if (newItem.type === 'recurring_offer') {
            finalPromo.recurringConfig = {
                payHours: Number(newItem.recurringPay),
                freeHours: Number(newItem.recurringFree)
            };
        } else if (newItem.type === 'item_discount') {
            if (!newItem.targetItemId) {
                toast.error('يرجى اختيار المنتج');
                return;
            }
            finalPromo.itemConfig = {
                targetItems: [{
                    itemId: newItem.targetItemId,
                    type: newItem.itemDiscountType,
                    value: Number(newItem.itemDiscountValue)
                }]
            };
        }

        addPromocode(finalPromo);
        setIsAddModalOpen(false);
        toast.success('تم إنشاء كود الخصم بنجاح');
        setNewItem({
            name: '', code: '', description: '', type: 'percentage', validUntil: undefined,
            percentageValue: '', fixedValue: '', appliesTo: ['time'], recurringPay: '1', recurringFree: '1',
            targetItemId: '', itemDiscountType: 'free', itemDiscountValue: '0'
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold gradient-text">إدارة العروض والخصومات</h1>
                    <p className="text-muted-foreground mt-1">تحديد أكواد الخصم والعروض الخاصة</p>
                </div>
                <Button className="gradient-button" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" /> إضافة كود جديد
                </Button>
            </div>

            {/* Filter Bar */}
            <Card className="glass-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث عن كود أو اسم..."
                            className="glass-input pr-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] glass-input">
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent className="glass-modal">
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                            <SelectItem value="expired">منتهي</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {/* Promocodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPromocodes.map(promo => (
                    <Card key={promo.id} className="glass-card group hover:border-primary/50 transition-colors relative overflow-hidden">
                        <div className={cn("absolute right-0 top-0 w-1 h-full",
                            promo.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'
                        )} />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2 border-primary/30 text-primary">{typeLabels[promo.type]}</Badge>
                                    <CardTitle className="text-xl">{promo.name}</CardTitle>
                                    <div className="font-mono text-lg text-muted-foreground mt-1 tracking-wider">{promo.code}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deletePromocode(promo.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-white/60 mb-4 h-10 line-clamp-2">{promo.description}</p>

                            {/* Type Specific Details */}
                            <div className="bg-white/5 rounded-lg p-3 mb-4 text-sm space-y-1">
                                {promo.type === 'percentage' && (
                                    <div className="flex justify-between">
                                        <span>القيمة:</span>
                                        <span className="font-bold text-emerald-400">{promo.percentageConfig?.value}%</span>
                                    </div>
                                )}
                                {newItem.type === 'recurring_offer' && (
                                    <div className="flex justify-between">
                                        <span>العرض:</span>
                                        <span className="font-bold text-blue-400">ادفع {promo.recurringConfig?.payHours} واحصل على {promo.recurringConfig?.freeHours} مجاناً</span>
                                    </div>
                                )}
                                {promo.type === 'fixed' && (
                                    <div className="flex justify-between">
                                        <span>القيمة:</span>
                                        <span className="font-bold text-emerald-400">{promo.fixedConfig?.value} ج.م</span>
                                    </div>
                                )}
                                {promo.type === 'item_discount' && promo.itemConfig?.targetItems[0] && (
                                    <div className="flex justify-between">
                                        <span>خصم منتج:</span>
                                        <span className="font-bold text-orange-400">
                                            {promo.itemConfig.targetItems[0].type === 'free' ? 'مجاني' : `${promo.itemConfig.targetItems[0].value} ${promo.itemConfig.targetItems[0].type === 'percentage' ? '%' : 'ج.م'}`}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-white/10 mt-2">
                                    <span>ينتهي في:</span>
                                    <span>{formatArabicDate(promo.validUntil)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="glass-modal max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>إضافة كود خصم جديد</DialogTitle>
                        <DialogDescription>قم بتكوين تفاصيل العرض او الخصم</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم العرض</Label>
                            <Input
                                placeholder="مثال: خصم الصيف"
                                className="glass-input"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الكود (بالإنجليزي)</Label>
                            <Input
                                placeholder="SUMMER2024"
                                className="glass-input font-mono uppercase"
                                value={newItem.code}
                                onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>الوصف</Label>
                            <Input
                                placeholder="وصف قصير للعرض..."
                                className="glass-input"
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>نوع العرض</Label>
                            <Select value={newItem.type} onValueChange={(v) => setNewItem({ ...newItem, type: v as PromocodeType })}>
                                <SelectTrigger className="glass-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-modal">
                                    {Object.entries(typeLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>تاريخ الانتهاء</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-right font-normal glass-input hover:bg-white/5">
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {newItem.validUntil ? formatArabicDate(newItem.validUntil.toISOString()) : <span>اختر تاريخ</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 glass-modal" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={newItem.validUntil}
                                        onSelect={(date) => setNewItem({ ...newItem, validUntil: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Dynamic Fields based on Type */}
                        <div className="col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                            <h4 className="text-sm font-semibold mb-3 text-primary">إعدادات العرض</h4>

                            {newItem.type === 'percentage' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>نسبة الخصم (%)</Label>
                                        <Input type="number" placeholder="10" className="glass-input"
                                            value={newItem.percentageValue} onChange={e => setNewItem({ ...newItem, percentageValue: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>يطبق على</Label>
                                        <div className="flex gap-2 text-sm mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={newItem.appliesTo.includes('time')}
                                                    onChange={e => e.target.checked
                                                        ? setNewItem({ ...newItem, appliesTo: [...newItem.appliesTo, 'time'] })
                                                        : setNewItem({ ...newItem, appliesTo: newItem.appliesTo.filter(t => t !== 'time') })}
                                                    className="accent-primary" />
                                                الوقت
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={newItem.appliesTo.includes('orders')}
                                                    onChange={e => e.target.checked
                                                        ? setNewItem({ ...newItem, appliesTo: [...newItem.appliesTo, 'orders'] })
                                                        : setNewItem({ ...newItem, appliesTo: newItem.appliesTo.filter(t => t !== 'orders') })}
                                                    className="accent-primary" />
                                                الطلبات
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {newItem.type === 'fixed' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>قيمة الخصم (ج.م)</Label>
                                        <Input type="number" placeholder="50" className="glass-input"
                                            value={newItem.fixedValue} onChange={e => setNewItem({ ...newItem, fixedValue: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>يطبق على</Label>
                                        <div className="flex gap-2 text-sm mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={newItem.appliesTo.includes('time')}
                                                    onChange={e => e.target.checked
                                                        ? setNewItem({ ...newItem, appliesTo: [...newItem.appliesTo, 'time'] })
                                                        : setNewItem({ ...newItem, appliesTo: newItem.appliesTo.filter(t => t !== 'time') })}
                                                    className="accent-primary" />
                                                الوقت
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={newItem.appliesTo.includes('orders')}
                                                    onChange={e => e.target.checked
                                                        ? setNewItem({ ...newItem, appliesTo: [...newItem.appliesTo, 'orders'] })
                                                        : setNewItem({ ...newItem, appliesTo: newItem.appliesTo.filter(t => t !== 'orders') })}
                                                    className="accent-primary" />
                                                الطلبات
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {newItem.type === 'recurring_offer' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>عدد الساعات المدفوعة</Label>
                                        <Input type="number" placeholder="1" className="glass-input"
                                            value={newItem.recurringPay} onChange={e => setNewItem({ ...newItem, recurringPay: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>عدد الساعات المجانية</Label>
                                        <Input type="number" placeholder="2" className="glass-input"
                                            value={newItem.recurringFree} onChange={e => setNewItem({ ...newItem, recurringFree: e.target.value })} />
                                    </div>
                                    <p className="col-span-2 text-xs text-muted-foreground">مثال: لكل ساعة يدفعها العميل، يحصل على ساعتين مجاناً.</p>
                                </div>
                            )}

                            {newItem.type === 'item_discount' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label>اختر المنتج</Label>
                                        <Select value={newItem.targetItemId} onValueChange={(v) => setNewItem({ ...newItem, targetItemId: v })}>
                                            <SelectTrigger className="glass-input">
                                                <SelectValue placeholder="اختر من المخزون" />
                                            </SelectTrigger>
                                            <SelectContent className="glass-modal max-h-48">
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>نوع الخصم</Label>
                                        <Select value={newItem.itemDiscountType} onValueChange={(v: any) => setNewItem({ ...newItem, itemDiscountType: v })}>
                                            <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                                            <SelectContent className="glass-modal">
                                                <SelectItem value="free">مجاني (Free)</SelectItem>
                                                <SelectItem value="percentage">نسبة (%)</SelectItem>
                                                <SelectItem value="amount">مبلغ ثابت (ج.م)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {newItem.itemDiscountType !== 'free' && (
                                        <div className="space-y-2">
                                            <Label>القيمة</Label>
                                            <Input type="number" className="glass-input"
                                                value={newItem.itemDiscountValue} onChange={e => setNewItem({ ...newItem, itemDiscountValue: e.target.value })} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleAdd} className="gradient-button">حفظ العرض</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
