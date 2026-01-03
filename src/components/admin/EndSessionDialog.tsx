
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, cn } from '@/lib/utils';
import { TicketPercent, CreditCard, Wallet, Banknote, User } from 'lucide-react';
import { usePromocodes } from '@/contexts/PromocodeContext';
import { calculateSessionTotal } from '@/lib/promocode-utils';
import { toast } from 'sonner';

// Define standardized types for props to ensure compatibility
export interface SessionMember {
    id: string;
    name: string;
    joinedAt: string;
    leftAt: string | null;
    orders: { productId: string; quantity: number; price: number }[];
}

export interface StandardActiveSession {
    id: string;
    tableName: string;
    hallName?: string;
    startTime: string;
    members: SessionMember[];
    // Cost calculation factors
    pricePerHour?: number; // Simple model
    firstHourCost?: number; // Tiered model
    remainingHourCost?: number; // Tiered model

    // History for complex calculation (optional, handled by parent mostly)
    tableHistory?: any[];
}

interface EndSessionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    session: StandardActiveSession | null;
    initialScope?: 'session' | 'member';
    initialMemberId?: string;

    // Callbacks
    onConfirmEndSession: (paymentMethod: string, paymentDetails: any, discountAmount: number, promoCode: string | undefined, finalTotal: number) => Promise<void>;
    onConfirmEndMember: (memberId: string, paymentMethod: string, paymentDetails: any, discountAmount: number, promoCode: string | undefined, finalTotal: number) => Promise<void>;

    // Calculation Helpers (Passed from parent to maintain consistency with page logic)
    calculateSessionCost: (session: StandardActiveSession) => { timeCost: number, ordersCost: number, total: number, duration: number }; // In minutes
    calculateMemberCost: (session: StandardActiveSession, member: SessionMember) => { timeCost: number, ordersCost: number, total: number, duration: number }; // In minutes
}

export function EndSessionDialog({
    isOpen,
    onClose,
    session,
    initialScope = 'session',
    initialMemberId = '',
    onConfirmEndSession,
    onConfirmEndMember,
    calculateSessionCost,
    calculateMemberCost
}: EndSessionDialogProps) {
    const { getPromocodeByCode } = usePromocodes();

    // State
    const [scope, setScope] = useState<'session' | 'member'>('session');
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');

    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [appliedPromocode, setAppliedPromocode] = useState<any>(null);

    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [paymentDetails, setPaymentDetails] = useState({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' });
    const [cairoomWalletBalance, setCairoomWalletBalance] = useState<number | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);

    // Reset state when session opens
    useEffect(() => {
        if (isOpen && session) {
            setScope(initialScope);
            setSelectedMemberId(initialMemberId);
            setPromoCodeInput('');
            setAppliedPromocode(null);
            setPaymentMethod('cash');
            setPaymentDetails({ cardHolder: '', walletNumber: '', walletOwner: '', cairoomUser: '' });
            setCairoomWalletBalance(null);
        }
    }, [isOpen, session, initialScope, initialMemberId]);

    // Calculate Totals based on Scope
    const totals = useMemo(() => {
        if (!session) return { timeCost: 0, ordersCost: 0, total: 0, duration: 0, taxes: 0, service: 0 };

        let raw;
        if (scope === 'member' && selectedMemberId) {
            const member = session.members.find(m => m.id === selectedMemberId);
            if (member) {
                raw = calculateMemberCost(session, member);
            } else {
                raw = { timeCost: 0, ordersCost: 0, total: 0, duration: 0 };
            }
        } else {
            raw = calculateSessionCost(session);
        }

        return raw;
    }, [session, scope, selectedMemberId, calculateSessionCost, calculateMemberCost]);

    // Apply Promocode
    const { finalTotal, discountAmount, note: discountNote } = useMemo(() => {
        return calculateSessionTotal(
            totals.timeCost || 0,
            totals.ordersCost || 0,
            (totals.duration || 0) / 60,
            appliedPromocode
        );
    }, [totals, appliedPromocode]);

    // Handlers
    const handleApplyPromocode = () => {
        if (!promoCodeInput.trim()) {
            setAppliedPromocode(null);
            return;
        }
        const promo = getPromocodeByCode(promoCodeInput);
        if (promo) {
            if (promo.status !== 'active') {
                toast.error('هذا الكود غير نشط أو منتهي الصلاحية');
                setAppliedPromocode(null);
            } else {
                setAppliedPromocode(promo);
                toast.success('تم تطبيق الخصم بنجاح');
            }
        } else {
            toast.error('الكود غير صحيح');
            setAppliedPromocode(null);
        }
    };

    const handleConfirm = async () => {
        if (!session) return;
        setIsProcessing(true);
        try {
            if (scope === 'session') {
                await onConfirmEndSession(
                    paymentMethod,
                    paymentDetails,
                    discountAmount,
                    appliedPromocode?.code,
                    finalTotal
                );
            } else {
                if (!selectedMemberId) {
                    toast.error('يرجى اختيار العضو');
                    return;
                }
                await onConfirmEndMember(
                    selectedMemberId,
                    paymentMethod,
                    paymentDetails,
                    discountAmount,
                    appliedPromocode?.code,
                    finalTotal
                );
            }
            // onClose(); // usually handled by parent success
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCheckCairoomBalance = () => {
        setCairoomWalletBalance(Math.floor(Math.random() * 500) + 100); // Mock
    };

    const activeMembers = session?.members.filter(m => !m.leftAt) || [];

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>إنهاء الجلسة / الدفع</DialogTitle>
                    <DialogDescription>
                        {session?.hallName || session?.tableName} - بدأ {session?.startTime ? new Date(session.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 1. Scope Selection */}
                    <div className="flex flex-col space-y-3 p-3 bg-muted/20 rounded-lg border">
                        <Label className="text-base font-semibold">نطاق الدفع (مين اللي هيحاسب؟)</Label>
                        <RadioGroup value={scope} onValueChange={(v: 'session' | 'member') => setScope(v)} className="flex gap-6">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="session" id="scope-session" />
                                <Label htmlFor="scope-session" className="cursor-pointer">الجلسة بالكامل (كل الأعضاء)</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="member" id="scope-member" />
                                <Label htmlFor="scope-member" className="cursor-pointer">عضو محدد</Label>
                            </div>
                        </RadioGroup>

                        {/* Member Selector */}
                        {scope === 'member' && (
                            <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر العضو..." />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        {activeMembers.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Right Column: Calculations */}
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Banknote className="w-4 h-4" />
                                تفاصيل الحساب
                            </h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">الوقت ({Math.floor((totals.duration || 0) / 60)} س : {(totals.duration || 0) % 60} د):</span>
                                    <span>{formatCurrency(Math.round(totals.timeCost || 0))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">الطلبات:</span>
                                    <span>{formatCurrency(totals.ordersCost || 0)}</span>
                                </div>

                                {/* Discount Display */}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>خصم ({appliedPromocode?.code}):</span>
                                        <span>- {formatCurrency(discountAmount)}</span>
                                    </div>
                                )}

                                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                                    <span>الإجمالي النهائي:</span>
                                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                                </div>

                                {/* Promocode Input */}
                                <div className="pt-4 border-t mt-2">
                                    <Label className="text-xs mb-1.5 block">كود خصم</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="أدخل الكود..."
                                            value={promoCodeInput}
                                            onChange={(e) => setPromoCodeInput(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <Button size="sm" variant="outline" onClick={handleApplyPromocode} disabled={!promoCodeInput}>
                                            <TicketPercent className="w-4 h-4 ml-1" />
                                            تطبيق
                                        </Button>
                                    </div>
                                    {discountNote && <p className="text-xs text-green-600 mt-1">{discountNote}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Left Column: Payment Method */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">طريقة الدفع</Label>
                            <Tabs value={paymentMethod} onValueChange={setPaymentMethod} dir="rtl" className="w-full">
                                <TabsList className="grid grid-cols-4 w-full h-auto p-1">
                                    <TabsTrigger value="cash" className="flex flex-col gap-1 py-3 text-xs">
                                        <Banknote className="w-4 h-4" />
                                        <span>كاش</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="visa" className="flex flex-col gap-1 py-3 text-xs">
                                        <CreditCard className="w-4 h-4" />
                                        <span>فيزا</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="wallet" className="flex flex-col gap-1 py-3 text-xs">
                                        <Wallet className="w-4 h-4" />
                                        <span>م. إلكترونية</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="cairoom" className="flex flex-col gap-1 py-3 text-xs">
                                        <User className="w-4 h-4" />
                                        <span>م. CAIROOM</span>
                                    </TabsTrigger>
                                </TabsList>

                                <div className="mt-4 space-y-3">
                                    {paymentMethod === 'visa' && (
                                        <div className="space-y-2 animate-in fade-in zoom-in-95">
                                            <Label>اسم صاحب الكارت</Label>
                                            <Input
                                                placeholder="الاسم الموجود على البطاقة"
                                                value={paymentDetails.cardHolder}
                                                onChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolder: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    {paymentMethod === 'wallet' && (
                                        <div className="space-y-3 animate-in fade-in zoom-in-95">
                                            <div className="space-y-1">
                                                <Label>رقم المحفظة</Label>
                                                <Input
                                                    placeholder="01xxxxxxxxx"
                                                    value={paymentDetails.walletNumber}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, walletNumber: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>اسم صاحب المحفظة</Label>
                                                <Input
                                                    placeholder="الاسم المسجل"
                                                    value={paymentDetails.walletOwner}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, walletOwner: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'cairoom' && (
                                        <div className="space-y-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in zoom-in-95">
                                            <div className="space-y-1">
                                                <Label>اختر عضو من الجلسة</Label>
                                                <Select onValueChange={(val) => {
                                                    setPaymentDetails({ ...paymentDetails, cairoomUser: val });
                                                    handleCheckCairoomBalance();
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="اختر العضو..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activeMembers.map(m => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {cairoomWalletBalance !== null && (
                                                <div className="flex justify-between items-center text-sm font-medium pt-2">
                                                    <span>الرصيد الحالي:</span>
                                                    <span className={cairoomWalletBalance >= finalTotal ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(cairoomWalletBalance)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>إلغاء</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isProcessing || (scope === 'member' && !selectedMemberId)}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                    >
                        {isProcessing ? 'جاري التنفيذ...' : `تأكيد الدفع (${formatCurrency(finalTotal)})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
