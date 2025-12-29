/* =================================================================
   CAIROOM - Marketing Page (Affiliates & Notifications)
   صفحة التسويق - الإحالة والإشعارات
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { formatCurrency, formatArabicDate, cn } from '@/lib/utils';
import { Users, Bell, Check, X, Send, Wallet, Mail, Smartphone, MessageSquare } from 'lucide-react';

// Mock withdrawal requests
const mockWithdrawals = [
    { id: '1', user: 'أحمد محمد', amount: 100, status: 'pending' as const, date: '2024-12-29' },
    { id: '2', user: 'سارة أحمد', amount: 75, status: 'approved' as const, date: '2024-12-28' },
    { id: '3', user: 'محمد علي', amount: 50, status: 'rejected' as const, date: '2024-12-27' },
];

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState('affiliates');
    const [withdrawals, setWithdrawals] = useState(mockWithdrawals);
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [notificationTarget, setNotificationTarget] = useState<'all' | 'specific'>('all');
    const [notificationChannel, setNotificationChannel] = useState<'push' | 'email' | 'sms'>('push');

    const handleApprove = (id: string) => {
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' as const } : w));
        toast.success('تم الموافقة على طلب السحب');
    };

    const handleReject = (id: string) => {
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' as const } : w));
        toast.success('تم رفض طلب السحب');
    };

    const handleSendNotification = () => {
        toast.success('تم إرسال الإشعار بنجاح');
        setNotificationModalOpen(false);
    };

    const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
    const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold gradient-text">التسويق</h1><p className="text-muted-foreground mt-1">إدارة الإحالات والإشعارات</p></div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <TabsList className="glass-card">
                        <TabsTrigger value="affiliates" className="gap-2"><Users className="h-4 w-4" />طلبات السحب ({pendingCount})</TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />الإشعارات</TabsTrigger>
                    </TabsList>
                    <div className="flex-1" />
                    {activeTab === 'affiliates' && pendingCount > 0 && (
                        <Badge className="status-pending">إجمالي معلق: {formatCurrency(totalPending)}</Badge>
                    )}
                </div>

                <TabsContent value="affiliates" className="space-y-4">
                    {withdrawals.map(withdrawal => (
                        <Card key={withdrawal.id} className={cn('glass-card p-4', withdrawal.status === 'pending' && 'border-yellow-500/30')}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-[#F18A21]/20"><Wallet className="h-5 w-5 text-[#F18A21]" /></div>
                                    <div>
                                        <h3 className="font-medium">{withdrawal.user}</h3>
                                        <p className="text-sm text-muted-foreground">{formatArabicDate(withdrawal.date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold">{formatCurrency(withdrawal.amount)}</span>
                                    <Badge className={cn('border', withdrawal.status === 'pending' ? 'status-pending' : withdrawal.status === 'approved' ? 'status-available' : 'status-busy')}>
                                        {withdrawal.status === 'pending' ? 'معلق' : withdrawal.status === 'approved' ? 'تم' : 'مرفوض'}
                                    </Badge>
                                    {withdrawal.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="gradient-button" onClick={() => handleApprove(withdrawal.id)}><Check className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="ghost" className="glass-button text-red-400" onClick={() => handleReject(withdrawal.id)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                    {withdrawals.length === 0 && (
                        <Card className="glass-card p-12 text-center"><Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">مفيش طلبات سحب</p></Card>
                    )}
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card className="glass-card">
                        <CardHeader><CardTitle>إرسال إشعار جديد</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>الهدف</Label>
                                <RadioGroup value={notificationTarget} onValueChange={(v) => setNotificationTarget(v as typeof notificationTarget)} className="flex gap-4">
                                    <div className="flex items-center gap-2"><RadioGroupItem value="all" id="all" /><Label htmlFor="all">جميع المستخدمين</Label></div>
                                    <div className="flex items-center gap-2"><RadioGroupItem value="specific" id="specific" /><Label htmlFor="specific">مستخدم محدد</Label></div>
                                </RadioGroup>
                            </div>
                            {notificationTarget === 'specific' && (
                                <div className="space-y-2"><Label>رقم الهاتف أو الإيميل</Label><Input placeholder="01XXXXXXXXX" className="glass-input" /></div>
                            )}
                            <div className="space-y-2">
                                <Label>القناة</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{ value: 'push', icon: Bell, label: 'إشعار' }, { value: 'email', icon: Mail, label: 'إيميل' }, { value: 'sms', icon: Smartphone, label: 'SMS' }].map(channel => (
                                        <Button key={channel.value} variant="ghost" className={cn('glass-button flex-col h-auto py-4', notificationChannel === channel.value && 'bg-[#F18A21]/20 border-[#F18A21]')} onClick={() => setNotificationChannel(channel.value as typeof notificationChannel)}>
                                            <channel.icon className="h-5 w-5 mb-1" />{channel.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2"><Label>العنوان</Label><Input placeholder="عنوان الإشعار" className="glass-input" /></div>
                            <div className="space-y-2"><Label>المحتوى</Label><Textarea placeholder="محتوى الرسالة..." className="glass-input" rows={3} /></div>
                            <Button className="w-full gradient-button" onClick={handleSendNotification}><Send className="h-4 w-4 ml-2" />إرسال الإشعار</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
