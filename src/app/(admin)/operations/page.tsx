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
import { ClipboardCheck, Package, Check, X, Clock, AlertTriangle, Plus } from 'lucide-react';

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
const mockRequests = [
    { id: '1', requester: 'محمد أحمد', items: 'مناديل + منظف زجاج', estimated_cost: 150, status: 'pending' as const, date: '2024-12-29' },
    { id: '2', requester: 'علي حسن', items: 'قهوة + شاي', estimated_cost: 200, status: 'fulfilled' as const, date: '2024-12-28' },
    { id: '3', requester: 'محمد أحمد', items: 'أكياس قمامة', estimated_cost: 50, status: 'rejected' as const, date: '2024-12-27' },
];

export default function OperationsPage() {
    const [activeTab, setActiveTab] = useState('cleaning');
    const [cleaning, setCleaning] = useState(mockCleaning);
    const [requests, setRequests] = useState(mockRequests);
    const [requestModalOpen, setRequestModalOpen] = useState(false);

    const handleCheckCleaning = (slot: string, area: string) => {
        setCleaning(prev => ({
            ...prev,
            [slot]: { ...prev[slot], [area]: 'checked' }
        }));
        toast.success('تم تسجيل النظافة');
    };

    const handleApproveRequest = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'fulfilled' as const } : r));
        toast.success('تم الموافقة على الطلب');
    };

    const handleRejectRequest = (id: string) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));
        toast.success('تم رفض الطلب');
    };

    const stats = {
        checked: Object.values(cleaning).flatMap(s => Object.values(s)).filter(s => s === 'checked').length,
        missed: Object.values(cleaning).flatMap(s => Object.values(s)).filter(s => s === 'missed').length,
        pending: Object.values(cleaning).flatMap(s => Object.values(s)).filter(s => s === 'pending').length,
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
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-3 text-right">الوقت</th>
                                    {areas.map(area => <th key={area} className="p-3 text-center">{areaLabels[area]}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(slot => (
                                    <tr key={slot} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 font-mono font-medium">{slot}</td>
                                        {areas.map(area => {
                                            const status = cleaning[slot]?.[area] || 'pending';
                                            return (
                                                <td key={area} className="p-3 text-center">
                                                    {status === 'checked' && <Badge className="status-available"><Check className="h-3 w-3 mr-1" />تم</Badge>}
                                                    {status === 'missed' && <Badge className="status-busy"><X className="h-3 w-3 mr-1" />فات</Badge>}
                                                    {status === 'pending' && (
                                                        <Button size="sm" variant="ghost" className="glass-button" onClick={() => handleCheckCleaning(slot, area)}>
                                                            <Clock className="h-3 w-3 mr-1" />شيك
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
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <div className="flex justify-end">
                        <Button className="gradient-button" onClick={() => setRequestModalOpen(true)}><Plus className="h-4 w-4 ml-2" />طلب جديد</Button>
                    </div>
                    {requests.map(request => (
                        <Card key={request.id} className={cn('glass-card p-4', request.status === 'pending' && 'border-yellow-500/30')}>
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
                    ))}
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
        </div>
    );
}
