/* =================================================================
   CAIROOM - Start Session Modal
   نافذة بدء جلسة جديدة
   ================================================================= */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Table } from '@/types/database';
import { Plus, Minus, User, Phone, X } from 'lucide-react';

interface StartSessionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: Table | null;
    onConfirm: (data: { guestCount: number; attendees: Array<{ name: string; phone?: string }>; notes?: string }) => void;
}

export function StartSessionModal({
    open,
    onOpenChange,
    table,
    onConfirm,
}: StartSessionModalProps) {
    const [guestCount, setGuestCount] = useState(1);
    const [attendees, setAttendees] = useState<Array<{ name: string; phone?: string }>>([{ name: '', phone: '' }]);
    const [notes, setNotes] = useState('');

    const handleAddAttendee = () => {
        if (attendees.length < guestCount) {
            setAttendees([...attendees, { name: '', phone: '' }]);
        }
    };

    const handleRemoveAttendee = (index: number) => {
        if (attendees.length > 1) {
            setAttendees(attendees.filter((_, i) => i !== index));
        }
    };

    const handleAttendeeChange = (index: number, field: 'name' | 'phone', value: string) => {
        const updated = [...attendees];
        updated[index] = { ...updated[index], [field]: value };
        setAttendees(updated);
    };

    const handleSubmit = () => {
        const validAttendees = attendees.filter(a => a.name.trim());
        onConfirm({
            guestCount,
            attendees: validAttendees.length > 0 ? validAttendees : [{ name: 'ضيف' }],
            notes: notes.trim() || undefined,
        });
        // Reset form
        setGuestCount(1);
        setAttendees([{ name: '', phone: '' }]);
        setNotes('');
    };

    if (!table) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-modal sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="gradient-text text-xl">بدء جلسة جديدة</DialogTitle>
                    <DialogDescription>
                        {table.name} • السعر: {table.price_per_hour_per_person} ج.م/ساعة/فرد
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* عدد الضيوف */}
                    <div className="space-y-2">
                        <Label>عدد الضيوف</Label>
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="glass-button"
                                onClick={() => setGuestCount(Math.max(table.capacity_min, guestCount - 1))}
                                disabled={guestCount <= table.capacity_min}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-3xl font-bold w-16 text-center">{guestCount}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="glass-button"
                                onClick={() => setGuestCount(Math.min(table.capacity_max, guestCount + 1))}
                                disabled={guestCount >= table.capacity_max}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                (الحد: {table.capacity_min}-{table.capacity_max})
                            </span>
                        </div>
                    </div>

                    {/* بيانات الحاضرين */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>بيانات الحاضرين (اختياري)</Label>
                            {attendees.length < guestCount && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#F18A21]"
                                    onClick={handleAddAttendee}
                                >
                                    <Plus className="h-4 w-4 ml-1" />
                                    إضافة
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {attendees.map((attendee, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1 flex gap-2">
                                        <div className="relative flex-1">
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="الاسم"
                                                value={attendee.name}
                                                onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                                                className="glass-input pr-10"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="الهاتف (اختياري)"
                                                value={attendee.phone}
                                                onChange={(e) => handleAttendeeChange(index, 'phone', e.target.value)}
                                                className="glass-input pr-10"
                                            />
                                        </div>
                                    </div>
                                    {attendees.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-red-400 hover:text-red-300"
                                            onClick={() => handleRemoveAttendee(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ملاحظات */}
                    <div className="space-y-2">
                        <Label>ملاحظات (اختياري)</Label>
                        <Textarea
                            placeholder="أي ملاحظات على الجلسة..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="glass-input resize-none"
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" className="glass-button" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                    <Button className="gradient-button" onClick={handleSubmit}>
                        بدء الجلسة
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
