/* =================================================================
   CAIROOM - Add/Edit Table Modal
   نافذة إضافة/تعديل الطاولة
   ================================================================= */

'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table } from '@/types/database';
import { ImagePlus } from 'lucide-react';

interface TableModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table?: Table | null; // null = إضافة جديدة، موجود = تعديل
    onSave: (data: {
        name: string;
        capacity_min: number;
        capacity_max: number;
        price_per_hour_per_person: number;
        image_url?: string;
    }) => void;
}

export function TableModal({
    open,
    onOpenChange,
    table,
    onSave,
}: TableModalProps) {
    const [name, setName] = useState('');
    const [capacityMin, setCapacityMin] = useState(1);
    const [capacityMax, setCapacityMax] = useState(4);
    const [pricePerHour, setPricePerHour] = useState(25);
    const [imageUrl, setImageUrl] = useState('');

    const isEditing = !!table;

    // تحميل البيانات عند التعديل
    useEffect(() => {
        if (table) {
            setName(table.name);
            setCapacityMin(table.capacity_min);
            setCapacityMax(table.capacity_max);
            setPricePerHour(table.price_per_hour_per_person);
            setImageUrl(table.image_url || '');
        } else {
            // إعادة التعيين للإضافة الجديدة
            setName('');
            setCapacityMin(1);
            setCapacityMax(4);
            setPricePerHour(25);
            setImageUrl('');
        }
    }, [table, open]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        if (capacityMin < 1 || capacityMax < capacityMin) return;
        if (pricePerHour < 0) return;

        onSave({
            name: name.trim(),
            capacity_min: capacityMin,
            capacity_max: capacityMax,
            price_per_hour_per_person: pricePerHour,
            image_url: imageUrl.trim() || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-modal sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="gradient-text text-xl">
                        {isEditing ? 'تعديل الطاولة' : 'إضافة طاولة جديدة'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'عدّل بيانات الطاولة' : 'أدخل بيانات الطاولة الجديدة'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* اسم الطاولة */}
                    <div className="space-y-2">
                        <Label>اسم الطاولة *</Label>
                        <Input
                            placeholder="مثال: طاولة ١، غرفة الاجتماعات"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="glass-input"
                        />
                    </div>

                    {/* السعة */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>الحد الأدنى للسعة</Label>
                            <Input
                                type="number"
                                min={1}
                                value={capacityMin}
                                onChange={(e) => setCapacityMin(parseInt(e.target.value) || 1)}
                                className="glass-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الحد الأقصى للسعة</Label>
                            <Input
                                type="number"
                                min={capacityMin}
                                value={capacityMax}
                                onChange={(e) => setCapacityMax(parseInt(e.target.value) || 1)}
                                className="glass-input"
                            />
                        </div>
                    </div>

                    {/* السعر */}
                    <div className="space-y-2">
                        <Label>السعر/ساعة/فرد (ج.م) *</Label>
                        <Input
                            type="number"
                            min={0}
                            step={5}
                            value={pricePerHour}
                            onChange={(e) => setPricePerHour(parseFloat(e.target.value) || 0)}
                            className="glass-input"
                        />
                    </div>

                    {/* صورة الطاولة */}
                    <div className="space-y-2">
                        <Label>رابط صورة الطاولة (اختياري)</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="glass-input flex-1"
                                dir="ltr"
                            />
                            <Button variant="ghost" size="icon" className="glass-button">
                                <ImagePlus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" className="glass-button" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                    <Button
                        className="gradient-button"
                        onClick={handleSubmit}
                        disabled={!name.trim() || capacityMin < 1 || capacityMax < capacityMin || pricePerHour < 0}
                    >
                        {isEditing ? 'حفظ التعديلات' : 'إضافة الطاولة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
